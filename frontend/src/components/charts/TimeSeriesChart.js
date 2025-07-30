import React, { useContext, useState, useCallback, useRef, useEffect } from 'react';
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
  config = {},
  layout = {},
  transparent = false // NEW: if true, no container, just Plot
}) => {
  // Access dark mode state from context
  const { darkMode } = useContext(ThemeContext);
  
  // State for comparison mode
  const [comparisonPoints, setComparisonPoints] = useState([]);
  const [comparisonActive, setComparisonActive] = useState(false);
  const [comparisonOverlay, setComparisonOverlay] = useState(null);
  
  // Handle selection for comparison
  const handleSelection = useCallback((eventData) => {
    if (!eventData || !eventData.range) return;
    
    // Get the selected range
    const { x0, x1 } = eventData.range;
    
    // Find the closest data points to the selection
    const points = [];
    data.forEach((series, seriesIndex) => {
      const startIndex = series.x.findIndex(date => new Date(date) >= new Date(x0));
      const endIndex = series.x.findIndex(date => new Date(date) >= new Date(x1));
      
      if (startIndex !== -1 && endIndex !== -1) {
        points.push({
          seriesIndex,
          startPoint: {
            x: series.x[startIndex],
            y: series.y[startIndex],
            index: startIndex
          },
          endPoint: {
            x: series.x[endIndex],
            y: series.y[endIndex],
            index: endIndex
          }
        });
      }
    });
    
    if (points.length > 0) {
      setComparisonPoints(points);
      setComparisonActive(true);
      
      // Calculate changes and create overlay
      const overlayData = points.map(point => {
        const { seriesIndex, startPoint, endPoint } = point;
        const seriesName = data[seriesIndex].name || `Series ${seriesIndex + 1}`;
        const valueChange = endPoint.y - startPoint.y;
        const percentChange = (valueChange / startPoint.y) * 100;
        const isPositive = valueChange >= 0;
        
        return {
          seriesName,
          startDate: startPoint.x,
          endDate: endPoint.x,
          startValue: startPoint.y,
          endValue: endPoint.y,
          valueChange,
          percentChange,
          isPositive,
          color: isPositive ? '#4caf50' : '#f44336' // Green for positive, red for negative
        };
      });
      
      setComparisonOverlay(overlayData);
    }
  }, [data]);

  const chartContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    function updateWidth() {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.offsetWidth);
      }
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Define colors based on theme
  const textColor = darkMode ? '#e0e0e0' : '#5a6169';
  const gridColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const paperBgColor = layout.paper_bgcolor || (darkMode ? '#111' : '#fff');
  const plotBgColor = layout.plot_bgcolor || (darkMode ? '#111' : '#fff');

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
    // Enhanced hover template with more prominent value display
    hovertemplate: 
      '<b>%{fullData.name}</b><br>' +
      '%{x}<br>' +
      '<b style="font-size: 14px; color: ' + (series.color || colors[index % colors.length]) + '">%{y:.2f}</b><br>' +
      '<extra></extra>',
    // Store original data for comparison calculations
    customdata: series.y.map((val, i) => ({
      originalValue: val,
      date: series.x[i]
    }))
  }));

  // Configure x-axis based on data type
  let xAxisConfig = {
    title: xAxisTitle,
    showgrid: false,
    zeroline: false,
    showline: false,
    type: 'date',
    tickfont: {
      family: 'Work Sans, sans-serif',
      size: 11,
      color: textColor
    }
  };

  if (data.length > 0 && data[0].x && data[0].x.length > 1) {
    const xVals = data[0].x;
    const allYears = xVals.every(x => String(x).length === 10 && /^\d{4}-01-01$/.test(String(x)));
    
    if (allYears) {
      // For yearly data, calculate number of ticks based on container width
      const years = xVals.map(x => x.slice(0, 4));
      const uniqueYears = Array.from(new Set(years));
      
      // Calculate number of ticks based on container width
      // Assume each tick needs ~100px, with some padding
      const maxTicks = Math.max(2, Math.floor(containerWidth / 120));
      const step = Math.max(1, Math.ceil(uniqueYears.length / maxTicks));
      
      // Generate ticks at regular intervals
      const tickIndices = [];
      for (let i = 0; i < uniqueYears.length; i += step) {
        tickIndices.push(i);
      }
      // Always include the last year
      if (!tickIndices.includes(uniqueYears.length - 1)) {
        tickIndices.push(uniqueYears.length - 1);
      }
      
      // Create tick arrays
      const tickVals = tickIndices.map(i => `${uniqueYears[i]}-01-01`);
      const tickText = tickIndices.map(i => uniqueYears[i]);
      
      // Override x-axis config for yearly data
      xAxisConfig = {
        ...xAxisConfig,
        tickmode: 'array',
        tickvals: tickVals,
        ticktext: tickText,
        tickformat: '%Y',
        tickangle: 0,
        nticks: undefined,
        dtick: undefined
      };
    } else {
      // For non-yearly data, use minimal Plotly config
      xAxisConfig = {
        ...xAxisConfig,
        tickformat: '%b %Y',
        nticks: Math.max(3, Math.floor(containerWidth / 120))
      };
    }
  }

  // Base layout with x-axis config
  const baseLayout = {
    title: {
      text: title,
      font: {
        family: 'Work Sans, sans-serif',
        size: 16,
        color: textColor
      }
    },
    paper_bgcolor: paperBgColor,
    plot_bgcolor: plotBgColor,
    width: containerWidth,
    height,
    margin: { t: 40, r: 10, b: 40, l: 50 },
    xaxis: xAxisConfig,
    yaxis: {
      title: yAxisTitle,
      showgrid: false,
      zeroline: false,
      tickfont: {
        family: 'Work Sans, sans-serif',
        size: 11,
        color: textColor
      }
    },
    dragmode: 'select',
    selectdirection: 'h',
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
    },
    ...layout
  };

  // Default config options
  const defaultConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      'lasso2d',
      'toggleSpikelines',
      'hoverClosestCartesian',
      'hoverCompareCartesian'
    ],
    toImageButtonOptions: {
      format: 'png',
      filename: `${title.replace(/\s+/g, '_').toLowerCase() || 'chart'}_${new Date().toISOString().split('T')[0]}`
    }
  };
  
  // Reset comparison mode
  const handleResetComparison = useCallback(() => {
    setComparisonPoints([]);
    setComparisonActive(false);
    setComparisonOverlay(null);
  }, []);

  // Merge default config with provided config
  const mergedConfig = { ...defaultConfig, ...config };

  if (transparent) {
    return (
      <div ref={chartContainerRef} style={{ width: '100%' }}>
        <Plot
          data={plotData}
          layout={baseLayout}
          config={mergedConfig}
          className={styles.plotlyChart}
          onSelected={handleSelection}
          onDeselect={handleResetComparison}
        />
      </div>
    );
  }
  return (
    data.length > 0 ? (
        <div ref={chartContainerRef} style={{ width: '100%' }}>
          <Plot
            data={plotData}
            layout={baseLayout}
            config={mergedConfig}
            className={styles.plotlyChart}
            onSelected={handleSelection}
            onDeselect={handleResetComparison}
          />
          {/* Comparison Overlay */}
          {comparisonActive && comparisonOverlay && (
            <div className={styles.comparisonOverlay}>
              <div className={styles.comparisonHeader}>
                <h4>Comparison Analysis</h4>
                <button 
                  className={styles.closeButton}
                  onClick={handleResetComparison}
                  aria-label="Close comparison"
                >
                  ×
                </button>
              </div>
              <div className={styles.comparisonContent}>
                {comparisonOverlay.map((item, index) => (
                  <div key={index} className={styles.comparisonItem}>
                    <div className={styles.comparisonTitle}>{item.seriesName}</div>
                    <div className={styles.comparisonDates}>
                      {item.startDate} → {item.endDate}
                    </div>
                    <div className={styles.comparisonValues}>
                      <span>
                        {item.startValue.toFixed(2)} → {item.endValue.toFixed(2)}
                      </span>
                    </div>
                    <div 
                      className={`${styles.comparisonChange} ${item.isPositive ? styles.positive : styles.negative}`}
                    >
                      <span className={styles.valueChange}>
                        {item.isPositive ? '+' : ''}{item.valueChange.toFixed(2)}
                      </span>
                      <span className={styles.percentChange}>
                        ({item.isPositive ? '+' : ''}{item.percentChange.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.comparisonFooter}>
                <div className={styles.comparisonTip}>
                  <span className={styles.tipIcon}>💡</span>
                  <span>Click and drag horizontally to select a different time range, or click the X to exit comparison mode.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noData}>
          <p>No data available for this chart</p>
        </div>
    )
  );
};

export default TimeSeriesChart;