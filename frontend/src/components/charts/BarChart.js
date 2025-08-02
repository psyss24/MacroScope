import React, { useContext, useState } from 'react';
import Plot from 'react-plotly.js';
import { ThemeContext } from '../../context/ThemeContext';
import styles from './Charts.module.css';

/**
 * BarChart component for displaying categorical data
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of data objects with x (categories), y (values), and name properties
 * @param {string} props.title - Chart title
 * @param {string} props.xAxisTitle - X-axis title
 * @param {string} props.yAxisTitle - Y-axis title
 * @param {boolean} props.showLegend - Whether to show the legend
 * @param {number} props.height - Chart height in pixels
 * @param {string} props.orientation - Bar orientation ('v' for vertical, 'h' for horizontal)
 * @param {Array} props.colors - Array of colors for the data series
 * @param {Object} props.config - Additional Plotly config options
 */
const BarChart = ({
  data = [],
  title = '',
  xAxisTitle = '',
  yAxisTitle = '',
  showLegend = true,
  height = 400,
  orientation = 'v',
  colors = ['#4caf50', '#ba68c8', '#64b5f6', '#ffb74d', '#f44336'],
  config = {},
  // Optionally pass in a map of commodity prices by name
  prices = {},
}) => {
  // Access dark mode state from context
  const { darkMode } = useContext(ThemeContext);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [cardHovered, setCardHovered] = useState(false);

  // Define colors based on theme
  const textColor = '#e0e0e0';
  const gridColor = 'rgba(255, 255, 255, 0.1)';
  const paperBgColor = '#1e1e1e';
  const plotBgColor = '#121212';

  // Prepare data for Plotly
  const plotData = data.map((series, index) => ({
    x: orientation === 'v' ? series.x : series.y,
    y: orientation === 'v' ? series.y : series.x,
    type: 'bar',
    orientation: orientation,
    name: series.name || `Series ${index + 1}`,
    marker: {
      // Always apply color scale to bars, only show colorbar on hover
      ...(data.length === 1 && series.useColorScale
        ? {
        color: series.y,
        colorscale: [
              [0, '#ef5350'],  // Negative (red)
    [0.5, '#ffca28'], // Neutral (yellow)
    [1, '#66bb6a']    // Positive (green)
        ],
        colorbar: {
          tickfont: {
            color: textColor
              },
              thickness: 3,
              orientation: 'v',
              x: 0,
              xpad: 2, // minimal gap between colorbar and y-axis
              xanchor: 'left',
              y: 0.5,
              len: 1,
              outlinewidth: 0,
              borderwidth: 0,
              showticklabels: false,
              title: '',
        }
      }
        : {
            color: series.color || colors[index % colors.length],
            line: {
              color: 'rgba(255, 255, 255, 0.1)',
              width: 1
            }
          }
      )
    },
    hoverinfo: 'none', // disable Plotly tooltip, we handle hover manually
    ...(data.length === 1 && series.useColorScale ? { hoverinfo: 'none' } : {}),
  }));

  // Define layout with no gridlines or border, and fully transparent background
  const layout = {
    autosize: true,
    height: height,
    margin: {
      l: 10,
      r: 30,
      t: 50,
      b: 50
    },
    paper_bgcolor: 'rgba(0,0,0,0)', // fully transparent
    plot_bgcolor: 'rgba(0,0,0,0)', // fully transparent
    font: {
      family: 'Work Sans, sans-serif',
      size: 12,
      color: textColor
    },
    xaxis: {
      title: xAxisTitle,
      showgrid: false, // Remove grid lines
      gridcolor: 'rgba(0,0,0,0)',
      gridwidth: 0,
      zeroline: false,
      tickfont: {
        family: 'Work Sans, sans-serif',
        size: 11,
        color: textColor
      }
    },
    yaxis: {
      title: yAxisTitle,
      showgrid: false, // Remove grid lines
      gridcolor: 'rgba(0,0,0,0)',
      gridwidth: 0,
      zeroline: false,
      tickfont: {
        family: 'Work Sans, sans-serif',
        size: 11,
        color: textColor
      }
    },
    showlegend: false, // Remove legend for color key
    legend: {
      orientation: 'h',
      y: -0.2,
      font: {
        family: 'Work Sans, sans-serif',
        size: 11,
        color: textColor
      }
    },
    hovermode: false,
    hoverlabel: {
      bgcolor: '#333333',
      bordercolor: '#555555',
      font: {
        family: 'Work Sans, sans-serif',
        size: 12,
        color: '#ffffff'
      }
    },
    bargap: 0.2,
    bargroupgap: 0.1
  };

  // Default config options
  const defaultConfig = {
    responsive: true,
    displayModeBar: false, // Hide Plotly's mode bar
    displaylogo: false,
    modeBarButtonsToRemove: [
      'lasso2d',
      'select2d',
      'toggleSpikelines',
      'hoverClosestCartesian',
      'hoverCompareCartesian',
      'autoScale2d',
      'zoom2d',
      'pan2d',
      'resetScale2d',
      'zoomIn2d',
      'zoomOut2d',
      'toImage',
      'sendDataToCloud',
      'editInChartStudio',
      'downloadPlotlyjs',
      'resetViews',
      'toggleHover',
      'toggleHoverClosest',
      'toggleHoverCompare',
      'toggleDrag',
      'resetViewMapbox',
      'zoomInGeo',
      'zoomOutGeo',
      'resetGeo',
      'hoverClosestGeo',
      'hoverClosestGl2d',
      'hoverClosestPie',
      'toggleSpikelines',
      'resetViewSankey',
      'toggleHoverSankey',
      'resetViewTernary',
      'toggleHoverTernary',
      'resetViewPolar',
      'toggleHoverPolar',
      'resetViewMapbox',
      'toggleHoverMapbox',
      'resetViewGl3d',
      'toggleHoverGl3d',
      'resetViewGeo',
      'toggleHoverGeo',
      'resetViewMapbox',
      'toggleHoverMapbox',
      'resetViewGl3d',
      'toggleHoverGl3d',
      'resetViewGeo',
      'toggleHoverGeo',
    ],
    toImageButtonOptions: {
      format: 'png',
      filename: `${title.replace(/\s+/g, '_').toLowerCase() || 'chart'}_${new Date().toISOString().split('T')[0]}`
    }
  };

  // Merge default config with provided config
  const mergedConfig = { ...defaultConfig, ...config };

  // Remove background, border, and border-radius from chartContainer
  return (
    <div
      className={styles.dashboardChartCard}
      onMouseEnter={() => { setCardHovered(true); }}
      onMouseLeave={() => { setCardHovered(false); setHoveredBar(null); }}
      style={{ position: 'relative' }}
    >
      <div style={{ minHeight: 56, height: 56, display: 'flex', alignItems: 'flex-end', marginBottom: 12, overflow: 'hidden' }}>
        {hoveredBar ? (
          <div style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column' }}>
            <span>{hoveredBar.label}</span>
            <span style={{ color: '#fff', fontWeight: 500, fontSize: '1.1rem' }}>
              Price Change: {hoveredBar.changePercent != null ? `${hoveredBar.changePercent > 0 ? '+' : ''}${hoveredBar.changePercent.toFixed(2)}%` : 'N/A'}
            </span>
            <span style={{ color: '#fff', fontWeight: 500, fontSize: '1.1rem' }}>
              Current Price: {hoveredBar.currentPrice != null ? `$${hoveredBar.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'N/A'}
            </span>
          </div>
        ) : (
          title && <h2 style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '2rem', margin: 0 }}>{title}</h2>
        )}
      </div>
      {data.length > 0 ? (
        <Plot
          data={plotData}
          layout={layout}
          config={mergedConfig}
          className={styles.plotlyChart}
          onHover={e => {
            if (e.points && e.points.length > 0) {
              const pt = e.points[0];
              const label = orientation === 'v' ? pt.x : pt.y;
              let changePercent = null;
              let currentPrice = null;
              if (data.length === 1 && data[0].changePercentArr && data[0].currentPriceArr) {
                const idx = (orientation === 'v' ? data[0].x : data[0].y).indexOf(label);
                if (idx !== -1) {
                  changePercent = data[0].changePercentArr[idx];
                  currentPrice = data[0].currentPriceArr[idx];
                }
              } else if (data.length === 1 && data[0].changePercent != null && data[0].currentPrice != null) {
                changePercent = data[0].changePercent;
                currentPrice = data[0].currentPrice;
              } else if (prices && prices[label]) {
                currentPrice = prices[label];
              }
              setHoveredBar({ label, changePercent, currentPrice });
            }
          }}
          onUnhover={() => setHoveredBar(null)}
        />
      ) : (
        <div className={styles.noData}>
          <p>No data available for this chart</p>
        </div>
      )}
    </div>
  );
};

export default BarChart;