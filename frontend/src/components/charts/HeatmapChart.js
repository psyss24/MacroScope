import React, { useContext } from 'react';
import Plot from 'react-plotly.js';
import { ThemeContext } from '../../context/ThemeContext';
import styles from './Charts.module.css';

/**
 * HeatmapChart component for displaying correlation matrices and heatmap data
 * 
 * @param {Object} props
 * @param {Array} props.data - 2D array of values for the heatmap
 * @param {Array} props.xLabels - Array of labels for the x-axis
 * @param {Array} props.yLabels - Array of labels for the y-axis
 * @param {string} props.title - Chart title
 * @param {string} props.colorScale - Color scale for the heatmap ('Viridis', 'RdBu', etc.)
 * @param {boolean} props.showScale - Whether to show the color scale
 * @param {number} props.height - Chart height in pixels
 * @param {Object} props.config - Additional Plotly config options
 */
const HeatmapChart = ({
  data = [],
  xLabels = [],
  yLabels = [],
  title = '',
  colorScale = 'RdBu',
  showScale = true,
  height = 500,
  config = {}
}) => {
  // Access dark mode state from context
  const { darkMode } = useContext(ThemeContext);

  // Define colors based on theme
  const textColor = '#e0e0e0';
  const paperBgColor = '#1e1e1e';
  const plotBgColor = '#121212';

  // Determine if we should use a reversed color scale for dark mode
  const effectiveColorScale = colorScale === 'RdBu' ? 'RdBu_r' : colorScale;

  // Prepare data for Plotly
  const plotData = [
    {
      z: data,
      x: xLabels,
      y: yLabels,
      type: 'heatmap',
      colorscale: effectiveColorScale,
      showscale: showScale,
      hoverinfo: 'x+y+z',
      colorbar: {
        title: {
          text: 'Correlation',
          font: {
            family: 'Work Sans, sans-serif',
            size: 12,
            color: textColor
          }
        },
        tickfont: {
          family: 'Work Sans, sans-serif',
          size: 11,
          color: textColor
        }
      }
    }
  ];

  // Define layout
  const layout = {
    title: {
      text: title,
      font: {
        family: 'Inter, sans-serif',
        size: 18,
        color: textColor
      }
    },
    autosize: true,
    height: height,
    margin: {
      l: 80,
      r: 30,
      t: 50,
      b: 80
    },
    paper_bgcolor: paperBgColor,
    plot_bgcolor: plotBgColor,
    font: {
      family: 'Work Sans, sans-serif',
      size: 12,
      color: textColor
    },
    xaxis: {
      tickangle: -45,
      tickfont: {
        family: 'Work Sans, sans-serif',
        size: 11,
        color: textColor
      }
    },
    yaxis: {
      tickfont: {
        family: 'Work Sans, sans-serif',
        size: 11,
        color: textColor
      }
    },
    hoverlabel: {
      bgcolor: '#333333',
      bordercolor: '#555555',
      font: {
        family: 'Work Sans, sans-serif',
        size: 12,
        color: '#ffffff'
      }
    },
    annotations: []
  };

  // Add annotations for correlation values if the data is not too large
  if (data.length > 0 && data.length <= 10 && data[0].length <= 10) {
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        const value = data[i][j];
        layout.annotations.push({
          x: xLabels[j],
          y: yLabels[i],
          text: value.toFixed(2),
          font: {
            family: 'Work Sans, sans-serif',
            size: 10,
            color: Math.abs(value) > 0.7 ? '#ffffff' : '#e0e0e0'
          },
          showarrow: false
        });
      }
    }
  }

  // Default config options
  const defaultConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      'lasso2d',
      'select2d',
      'toggleSpikelines',
      'hoverClosestCartesian',
      'hoverCompareCartesian'
    ],
    toImageButtonOptions: {
      format: 'png',
      filename: `${title.replace(/\s+/g, '_').toLowerCase() || 'heatmap'}_${new Date().toISOString().split('T')[0]}`
    }
  };

  // Merge default config with provided config
  const mergedConfig = { ...defaultConfig, ...config };

  return (
    <div className={styles.chartContainer}>
      {data.length > 0 ? (
        <Plot
          data={plotData}
          layout={layout}
          config={mergedConfig}
          className={styles.plotlyChart}
        />
      ) : (
        <div className={styles.noData}>
          <p>No data available for this chart</p>
        </div>
      )}
    </div>
  );
};

export default HeatmapChart;