import React, { useContext, useState, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { ThemeContext } from '../../context/ThemeContext';
import styles from './Charts.module.css';

/**
 * DashboardChart - a large, clean, minimal card for multiple Plotly charts
 * Props:
 * - title: string (main title)
 * - description: string (optional)
 * - charts: array of { data, layout, config, type? } (each chart config)
 * - children: React node (optional, for custom content)
 */
const DashboardChart = (props) => {
  const {
    title,
    description,
    charts = [],
    children,
    smartBaselineLabel = false,
    showPricesOnHover = false,
    goldPrice,
    silverPrice,
    goldPriceSeries,
    silverPriceSeries,
    xSeries,
    enableModeToggle = false,
    rawData = null, // [{ x, y, name, color? }]
    initialMode = 'normalised',
  } = props;
  const { darkMode } = useContext(ThemeContext);
  const [showBaseline, setShowBaseline] = useState(false);
  const [hoveredX, setHoveredX] = useState(null);
  const [mode, setMode] = useState(initialMode);
  const plotAreaRef = useRef(null);
  const plotlyRef = useRef(null);

  // Helper to map mouse x to closest data x value
  function getClosestX(mouseX, plotRect, xArr) {
    if (!plotRect || !xArr || xArr.length === 0) return null;
    const relX = mouseX - plotRect.left;
    const plotWidth = plotRect.width;
    // Map relX to index in xArr
    const idx = Math.round((relX / plotWidth) * (xArr.length - 1));
    return xArr[Math.max(0, Math.min(xArr.length - 1, idx))];
  }

  // Helper to normalise a y array to start at 100, forward-filling missing/nulls after the first valid value
  function normaliseY(y) {
    if (!y || y.length === 0) return [];
    // Find the first non-null, finite value (including negative values)
    let firstIdx = y.findIndex(v => v != null && isFinite(v));
    if (firstIdx === -1) return y.map(() => null);
    const first = y[firstIdx];
    let lastValid = null;
    
    // For negative values, we need a different approach
    // Instead of simple division, we'll use a more robust normalization
    return y.map((v, i) => {
      if (i < firstIdx) return null;
      if (v == null || !isFinite(v)) {
        // Forward-fill after first valid value
        return lastValid;
      }
      if (i === firstIdx) {
        lastValid = 100;
        return 100;
      }
      
      // Calculate percentage change from the first value
      // This works for both positive and negative values
      const percentageChange = ((v - first) / Math.abs(first)) * 100;
      lastValid = 100 + percentageChange;
      return lastValid;
    });
  }

  // Helper to forward-fill missing/null values in y arrays (except at the start)
  function forwardFillY(y) {
    if (!y || y.length === 0) return [];
    let lastValid = null;
    return y.map((v, i) => {
      if (v == null || !isFinite(v)) {
        return lastValid;
      }
      lastValid = v;
      return v;
    });
  }

  // If enableModeToggle and rawData, build charts from mode
  let chartsToRender = charts;
  if (enableModeToggle && Array.isArray(rawData) && rawData.length > 0) {
    // Compute y-axis range for the current mode
    const yArrays = rawData.map(series => (mode === 'normalised' ? normaliseY(series.y) : forwardFillY(series.y)));
    const allY = yArrays.flat().filter(v => typeof v === 'number' && isFinite(v));
    let yRange = undefined;
    if (allY.length > 0) {
      const min = Math.min(...allY);
      const max = Math.max(...allY);
      const range = max - min;
      const margin = Math.max(range * 0.08, (min + max) * 0.01);
      yRange = [min - margin, max + margin];
    }
    chartsToRender = [
      {
        data: rawData.map(series => ({
          ...series,
          y: mode === 'normalised' ? normaliseY(series.y) : forwardFillY(series.y),
        })),
        layout: {
          ...charts[0]?.layout,
          yaxis: {
            ...charts[0]?.layout?.yaxis,
            range: yRange,
          },
        },
        config: charts[0]?.config || {},
      }
    ];
  }

  // Generalised toggle button (always rendered if enableModeToggle)
  const ModeToggleButton = enableModeToggle ? () => (
    <button
      onClick={() => setMode(mode === 'normalised' ? 'raw' : 'normalised')}
      style={{
        background: 'var(--accent-color)',
        color: '#e0e0e0',
        border: 'none',
        borderRadius: 6,
        padding: '3px 10px',
        fontWeight: 600,
        fontSize: '0.95rem',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(33,150,243,0.12)',
        transition: 'all 0.18s',
        outline: 'none',
        height: 36,
        alignItems: 'center',
        zIndex: 1,
        marginLeft: 12,
        opacity: showBaseline ? 1 : 0,
        pointerEvents: showBaseline ? 'auto' : 'none',
      }}
      aria-label="Toggle chart mode"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setMode(mode === 'normalised' ? 'raw' : 'normalised'); } }}
    >
      {mode === 'normalised' ? 'Normalised' : 'Raw'}
    </button>
  ) : null;

  // Generalised series value formatter (can be overridden by prop)
  const defaultSeriesValueFormatter = (series, yVal, rawVal) => {
    const unit = series.unit || '';
    const formatValue = (val) => {
      if (val == null) return 'N/A';
      return `${val.toFixed(2)}${unit}`;
    };
    
    if (rawVal != null && yVal !== rawVal) {
      return `${formatValue(yVal)} (${formatValue(rawVal)})`;
    } else if (yVal != null) {
      return formatValue(yVal);
    } else if (rawVal != null) {
      return formatValue(rawVal);
    }
    return 'N/A';
  };
  const seriesValueFormatter = props.seriesValueFormatter || defaultSeriesValueFormatter;

  // Generalised header hover info for all series
  function renderSeriesHeaderInfo() {
    if (!chartsToRender[0]?.data?.length) return null;
    // Use xSeries if provided, else use the x of the first series
    const xArr = xSeries || chartsToRender[0].data[0].x;
    const hoveredIdx = hoveredX && xArr ? xArr.findIndex(x => x === hoveredX) : -1;
    const items = chartsToRender[0].data.map((series, i) => {
      // Try to get color from series.line.color, fallback to accent
      const color = series.line?.color || 'var(--accent-color)';
      let yVal = null, rawVal = null;
      if (hoveredIdx !== -1) {
        yVal = series.y[hoveredIdx];
        if (enableModeToggle && rawData && rawData[i] && rawData[i].y) {
          if (mode === 'normalised') {
            // In normalised mode, show normalised value and raw value in parentheses
            rawVal = rawData[i].y[hoveredIdx];
          } else {
            // In raw mode, show the forward-filled value (the one actually plotted)
            rawVal = series.y[hoveredIdx];
          }
        }
      }
      // Fallback to latest
      if (yVal == null && series.y && series.y.length) yVal = series.y[series.y.length - 1];
      if (rawVal == null && enableModeToggle && rawData && rawData[i] && rawData[i].y && rawData[i].y.length) {
        if (mode === 'normalised') {
          rawVal = rawData[i].y[rawData[i].y.length - 1];
        } else {
          rawVal = series.y[series.y.length - 1];
        }
      }
      return (
        <span key={series.name || i} style={{ color, fontWeight: 700, display: 'block', marginBottom: 2, minWidth: 120 }}>
          {series.name ? `${series.name}: ` : ''}{seriesValueFormatter(series, yVal, rawVal)}
        </span>
      );
    });
    // If there are 4 or more items, arrange as rows of 2
    if (items.length >= 4) {
      const rows = [];
      for (let i = 0; i < items.length; i += 2) {
        rows.push(
          <div key={i} style={{ display: 'flex', flexDirection: 'row', gap: 24, alignItems: 'center' }}>
            {items.slice(i, i + 2)}
          </div>
        );
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rows}
        </div>
      );
    }
    // Default: vertical stack
    return items;
  }

  // Helper to generate deduplicated month or year ticks/labels for x axis
  function getMonthTicksAndLabels(xArr, containerWidth = 800) {
    if (!xArr || xArr.length === 0) return { monthTicks: [], monthLabels: [] };
    const firstDate = new Date(xArr[0]);
    const lastDate = new Date(xArr[xArr.length - 1]);
    const yearSpan = lastDate.getFullYear() - firstDate.getFullYear();
    if (yearSpan >= 2) {
      // Show years only, but reduce number of ticks based on width
      const yearTicks = [];
      const yearLabels = [];
      let lastYear = null;
      const years = xArr.map(dateStr => new Date(dateStr).getFullYear());
      const uniqueYears = Array.from(new Set(years));
      // Calculate max ticks based on width (e.g., 120px per tick)
      const maxTicks = Math.max(2, Math.floor(containerWidth / 120));
      const step = Math.max(1, Math.ceil(uniqueYears.length / maxTicks));
      for (let i = 0; i < uniqueYears.length; i += step) {
        // Find the first date in xArr for this year
        const idx = years.findIndex(y => y === uniqueYears[i]);
        if (idx !== -1) {
          yearTicks.push(xArr[idx]);
          yearLabels.push(uniqueYears[i].toString());
        }
      }
      // Always include the last year if not already included
      if (yearLabels[yearLabels.length - 1] !== uniqueYears[uniqueYears.length - 1].toString()) {
        const lastIdx = years.lastIndexOf(uniqueYears[uniqueYears.length - 1]);
        if (lastIdx !== -1) {
          yearTicks.push(xArr[lastIdx]);
          yearLabels.push(uniqueYears[uniqueYears.length - 1].toString());
        }
      }
      return { monthTicks: yearTicks, monthLabels: yearLabels };
    }
    // Default: months
    const monthTicks = [];
    const monthLabels = [];
    let lastMonth = null;
    let lastTickDate = null;
    for (let i = 0; i < xArr.length; i++) {
      const dateStr = xArr[i];
      if (!dateStr) continue;
      const date = new Date(dateStr);
      const month = date.getMonth();
      if (month !== lastMonth) {
        if (!lastTickDate || (date - lastTickDate) / (1000 * 60 * 60 * 24) >= 20) {
          monthTicks.push(dateStr);
          monthLabels.push(date.toLocaleString('default', { month: 'long' }));
          lastTickDate = date;
          lastMonth = month;
        } else {
          monthTicks[monthTicks.length - 1] = dateStr;
          monthLabels[monthLabels.length - 1] = date.toLocaleString('default', { month: 'long' });
          lastTickDate = date;
          lastMonth = month;
        }
      }
    }
    return { monthTicks, monthLabels };
  }

  // Theme-aware colors
  const textColor = '#e0e0e0';
  const transparent = 'rgba(0,0,0,0)';
  const axisColor = 'rgba(255,255,255,0.18)';
  const baselineColor = 'rgba(255,255,255,0.13)';
  const baselineLabelColor = 'rgba(255,255,255,0.38)';

  return (
    <div
      className={styles.dashboardChartCard}
      onMouseEnter={() => setShowBaseline(true)}
      onMouseLeave={() => setShowBaseline(false)}
      style={{ cursor: showBaseline ? 'pointer' : 'pointer' }}
    >
      {/* Reserve fixed height for header area to prevent card resize on hover */}
      <div style={{ minHeight: 56, height: 56, marginBottom: 12, overflow: 'visible', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        {(!showPricesOnHover || !showBaseline) && title && (
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', position: 'relative' }}>
          <h2 style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '2rem', margin: 0 }}>{title}</h2>
            {enableModeToggle && <ModeToggleButton />}
          </div>
        )}
        {showPricesOnHover && showBaseline && (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: '1.25rem', fontWeight: 700, flex: 1, minWidth: 0 }}>
              {renderSeriesHeaderInfo()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 80, flexShrink: 0 }}>
              {enableModeToggle && <ModeToggleButton />}
            {hoveredX && (
                <div style={{ fontSize: '1.1rem', color: 'var(--muted-text)', fontWeight: 500, marginTop: 2, textAlign: 'right' }}>
                {hoveredX}
              </div>
            )}
            </div>
          </div>
        )}
      </div>
      {description && <div style={{ color: 'var(--muted-text)', fontSize: '1.08rem', marginBottom: 24 }}>{description}</div>}
      {chartsToRender.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, width: '100%' }}>
          {chartsToRender.map((chart, i) => {
            // Determine if this is a dual-axis chart
            const isDualAxis = !!chart.layout?.yaxis2;
            // Only show baseline trace and label in normalised mode
            const showBaselineTrace = showBaseline && mode === 'normalised';
            let plotData = [];
            // Opacity reduction after vertical line should apply in all modes
            if (showBaseline && hoveredX && chart.data[0] && Array.isArray(chart.data[0].x)) {
              const xArr = xSeries || chart.data[0].x;
              const hoveredIdx = xArr ? xArr.findIndex(x => x === hoveredX) : -1;
              plotData = chart.data.flatMap((series, sIdx) => {
                if (hoveredIdx === -1) {
                  // No hover, show as normal
                  return [{ ...series }];
                }
                // Split x/y into before/after hoveredIdx
                const xBefore = series.x.slice(0, hoveredIdx + 1);
                const yBefore = series.y.slice(0, hoveredIdx + 1);
                const xAfter = series.x.slice(hoveredIdx);
                const yAfter = series.y.slice(hoveredIdx);
                // Main (before/at line)
                const traceBefore = {
                  ...series,
                  x: xBefore,
                  y: yBefore,
                  opacity: 1,
                  showlegend: series.showlegend,
                  name: series.name,
                  line: { ...series.line, color: series.line?.color || undefined }
                };
                // After line (reduced opacity, no legend)
                const traceAfter = {
                  ...series,
                  x: xAfter,
                  y: yAfter,
                  opacity: 0.18,
                  showlegend: false,
                  name: undefined,
                  line: { ...series.line, color: series.line?.color || undefined }
                };
                return [traceBefore, traceAfter];
              });
              // Add baseline trace if needed...
              if (showBaselineTrace && chart.data[0] && Array.isArray(chart.data[0].x)) {
                plotData.push({
                  x: chart.data[0].x,
                  y: chart.data[0].x.map(() => 100),
                  type: 'scatter',
                  mode: 'lines',
                  line: {
                    color: baselineColor,
                    width: 2,
                    dash: 'dash',
                  },
                  hoverinfo: 'skip',
                  showlegend: false,
                  yaxis: chart.data[0].yaxis || 'y1',
                });
              }
            } else {
              plotData = [...chart.data];
              // Add baseline trace if needed...
              if (showBaselineTrace && chart.data[0] && Array.isArray(chart.data[0].x)) {
                plotData.push({
                  x: chart.data[0].x,
                  y: chart.data[0].x.map(() => 100),
                  type: 'scatter',
                  mode: 'lines',
                  line: {
                    color: baselineColor,
                    width: 2,
                    dash: 'dash',
                  },
                  hoverinfo: 'skip',
                  showlegend: false,
                  yaxis: chart.data[0].yaxis || 'y1',
                });
              }
            }
            let shapes = [];
            let annotations = [];
            let baselineLabelX = null;
            let baselineLabelYAnchor = 'bottom';
            let baselineLabelAnnotation = null;
            if (showBaseline && chart.data[0] && Array.isArray(chart.data[0].x) && smartBaselineLabel) {
              // Place baseline label in the padding area to the right of the chart
              baselineLabelAnnotation = {
                xref: 'paper',
                x: 1.04, // just outside the plot area
                y: 100,
                xanchor: 'left',
                yanchor: 'bottom',
                text: 'Baseline (100)',
                showarrow: false,
                font: {
                  size: 13,
                  color: baselineLabelColor
                },
                align: 'left',
                bgcolor: 'rgba(0,0,0,0)',
                opacity: 1,
              };
            }
            // Add vertical hover line matching chart title color, thin, subtle, and finely dashed
            let verticalLineShape = null;
            if (showBaseline && hoveredX && chart.data[0].x.some(x => String(x) === String(hoveredX))) {
              // Get the accent color from the CSS variable, fallback to #2196f3 if not set
              let accentColor = '#2196f3';
              if (typeof window !== 'undefined' && window.getComputedStyle) {
                const cssAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
                if (cssAccent) accentColor = cssAccent;
              }
              verticalLineShape = {
                type: 'line',
                xref: 'x',
                yref: 'paper',
                x0: hoveredX,
                x1: hoveredX,
                y0: 0,
                y1: 1,
                line: {
                  color: accentColor,
                  width: 2,
                  dash: 'dot',
                  opacity: 0.32,
                }
              };
            }
            // Remove the glow overlay for a minimal look
            let verticalLineGlow = null;
            // Only add the baseline trace at y=100 when showBaseline is true
            if (showBaseline && chart.data[0] && Array.isArray(chart.data[0].x)) {
              // plotData = [
              //   ...chart.data,
              //   {
              //     x: chart.data[0].x,
              //     y: chart.data[0].x.map(() => 100),
              //     type: 'scatter',
              //     mode: 'lines',
              //     line: {
              //       color: baselineColor,
              //       width: 2,
              //       dash: 'dash',
              //     },
              //     hoverinfo: 'skip',
              //     showlegend: false,
              //     yaxis: chart.data[0].yaxis || 'y1',
              //   },
              //   transparentTrace
              // ];
              if (baselineLabelAnnotation) {
                annotations.push(baselineLabelAnnotation);
              }
            }
            // Compose layout: always use minimal, gold-style layout for all charts
            let xArr = xSeries || chart.data[0].x;
            const { monthTicks, monthLabels } = getMonthTicksAndLabels(xArr, plotAreaRef.current?.offsetWidth || 800);
            const layout = {
              ...chart.layout,
              autosize: true,
              font: { family: 'Inter, sans-serif', color: textColor },
              paper_bgcolor: transparent,
              plot_bgcolor: transparent,
              colorway: chart.layout?.colorway || ['#1976d2', '#4caf50', '#ba68c8', '#ffb74d', '#f44336'],
              margin: { l: 0, r: 0, t: 24, b: 64 }, // gold chart style
              showlegend: showBaseline,
              xaxis: {
                ...chart.layout?.xaxis,
                showgrid: false,
                zeroline: false,
                showline: false,
                linecolor: 'rgba(0,0,0,0)',
                showticklabels: showBaseline,
                ticks: '',
                ticklen: 0,
                tickcolor: 'rgba(0,0,0,0)',
                title: '',
                automargin: true,
                hovermode: 'x unified',
                tickvals: showBaseline ? monthTicks : [],
                ticktext: showBaseline ? monthLabels : [],
                tickfont: { style: 'normal', size: 14 },
                tickangle: 0,
              },
              yaxis: {
                ...chart.layout?.yaxis,
                showgrid: false,
                zeroline: false,
                showline: false,
                linecolor: 'rgba(0,0,0,0)',
                showticklabels: false,
                ticks: '',
                ticklen: 0,
                tickcolor: 'rgba(0,0,0,0)',
                title: '',
              },
              showlegend: chart.layout?.showlegend ?? false,
              legend: chart.layout?.legend,
              title: undefined,
              shapes: [
                ...(verticalLineShape ? [verticalLineShape] : []),
              ],
            };
            return (
              <div key={i} style={{ flex: 1, minWidth: 0, position: 'relative', width: '100%' }}>
                <Plot
                  ref={plotlyRef}
                  data={plotData.map(trace => ({
                    ...trace,
                    line: {
                      ...trace.line,
                      width: trace.line?.width || 4,
                      shape: 'spline',
                      smoothing: 1.2,
                    },
                    mode: 'lines',
                  }))}
                  layout={{
                    ...layout,
                    autosize: true,
                    width: undefined,
                    height: chart.layout?.height || 340,
                    margin: { l: 0, r: 0, t: 24, b: 64 },
                    xaxis: {
                      ...layout.xaxis,
                      automargin: false,
                    },
                    yaxis: {
                      ...layout.yaxis,
                    }
                  }}
                  config={{ 
                    displayModeBar: false, 
                    ...chart.config, 
                    staticPlot: false, 
                    scrollZoom: false, 
                    editable: false, 
                    displaylogo: false, 
                    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d', 'zoom2d', 'pan2d', 'resetScale2d', 'zoomIn2d', 'zoomOut2d', 'hoverClosestCartesian', 'hoverCompareCartesian'], 
                    toImageButtonOptions: {format: 'png', filename: 'chart', height: 500, width: 700, scale: 1}, 
                    doubleClick: false, 
                    responsive: true, 
                    displayModeBar: false, 
                    dragmode: false, 
                    hovermode: 'x', 
                    cursor: 'pointer' 
                  }}
                  style={{ width: '100%', height: chart.layout?.height || 340, cursor: 'pointer', zIndex: 2 }}
                  useResizeHandler={true}
                />
                {/* Overlay for precise hover detection */}
                <div
                  style={{ position: 'absolute', top: 24, left: 0, right: 0, bottom: 64, zIndex: 3, pointerEvents: 'all', background: 'transparent' }}
                  onMouseMove={e => {
                    if (!showBaseline || !showPricesOnHover) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const xArr = xSeries || chart.data[0].x;
                    // Find the first and last valid data indices
                    const firstValidIdx = xArr.findIndex(x => x != null);
                    const lastValidIdx = (() => { let idx = xArr.length - 1; while (idx >= 0 && xArr[idx] == null) idx--; return idx; })();
                    if (firstValidIdx === -1 || lastValidIdx === -1) {
                      setHoveredX(null);
                      return;
                    }
                    // Calculate pixel positions for first and last data points
                    const plotWidth = rect.width;
                    const firstXPixel = rect.left + (plotWidth * (firstValidIdx / (xArr.length - 1)));
                    const lastXPixel = rect.left + (plotWidth * (lastValidIdx / (xArr.length - 1)));
                    if (e.clientX < firstXPixel || e.clientX > lastXPixel) {
                      setHoveredX(null);
                      return;
                    }
                    // Find closest index
                    const relX = e.clientX - rect.left;
                    const idx = Math.round((relX / plotWidth) * (xArr.length - 1));
                    const closest = xArr[Math.max(firstValidIdx, Math.min(lastValidIdx, idx))];
                    setHoveredX(closest);
                  }}
                  onMouseLeave={() => setHoveredX(null)}
                />
              </div>
            );
          })}
        </div>
      ) : children ? (
        <div>{children}</div>
      ) : (
        <div className={styles.noData}>No chart data</div>
      )}
    </div>
  );
};

export default DashboardChart; 