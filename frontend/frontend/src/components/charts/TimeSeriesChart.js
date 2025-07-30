import React, { useContext } from 'react';
import Plot from 'react-plotly.js';
import { ThemeContext } from '../../context/ThemeContext';
import styles from './Charts.module.css';

/**
 * TimeSeriesChart component for displaying time series data
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of data series objects with x, y, and name properties
 * @param {string} props.title - Chart title
 * @param {string} props.xAxisTitle - X-axis title
 * @param {string} props.yAxisTitle - Y-axis title
 * @param {boolean} props.showLegend - Whether to show the legend
 * @param {number} props.height - Chart height in pixels
 * @param {Array} props.colors - Array of colors for the data series
 * @param {Object} props.config - Additional Plotly config options
 */
const TimeSeriesChart = ({
  data = [],
  title = '',
  xAxisTitle = '',
  yAxisTitle = '',
  showLegend = true,
  height = 400,
  colors = ['#4caf50', '#ba68c8', '#64b5f6', '#ffb74d', '#f44336'],
  config = {}
}) => {
  // Access dark mode state from context
  const { darkMode } = useContext(ThemeContext);

  // Define colors based on theme
  const textColor = darkMode ? '#e0e0e0' : '#5a6169';
  const gridColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const paperBgColor = darkMode ? '#1e1e1e' : '#ffffff';
  const plotBgColor = darkMode ? '#121212' : '#f8f9fa';

  // Prepare data for Plotly
  const plotData = data.map((series, index) => ({
    x: series.x,
    y: series.y,
    type: 'scatter',
    mode: 'lines',
    name: series.name || `Series ${index + 1}`,
    line: {
      color: series.color || colors[index % colors.length],
      width: 2
    },
    hoverinfo: 'x+y+name'
  }));

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
      l: 50,
      r: 30,
      t: 50,
      b: 50
    },
    paper_bgcolor: paperBgColor,
    plot_bgcolor: plotBgColor,
    font: {
      family: 'Work Sans, sans-serif',
      size: 12,
      color: textColor
    },
    xaxis: {
      title: xAxisTitle,
      showgrid: true,
      gridcolor: gridColor,
      gridwidth: 1,
      zeroline: false,
      tickfont: {
        family: 'Work Sans, sans-serif',
        size: 11,
        color: textColor
      }
    },
    yaxis: {
      title: yAxisTitle,
      showgrid: true,
      gridcolor: gridColor,
      gridwidth: 1,
      zeroline: false,
      tickfont: {
        family: 'Work Sans, sans-serif',
        size: 11,
        color: textColor
      }
    },
    showlegend: showLegend,
    legend: {
      orientation: 'h',
      y: -0.2,
      font: {
        family: 'Work Sans, sans-serif',
        size: 11,
        color: textColor
      }
    },
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: darkMode ? '#333333' : '#ffffff',
      bordercolor: darkMode ? '#555555' : '#e8eaed',
      font: {
        family: 'Work Sans, sans-serif',
        size: 12,
        color: darkMode ? '#ffffff' : '#333333'
      }
    }
  };

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
      filename: `${title.replace(/\s+/g, '_').toLowerCase() || 'chart'}_${new Date().toISOString().split('T')[0]}`
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

export default TimeSeriesChart;