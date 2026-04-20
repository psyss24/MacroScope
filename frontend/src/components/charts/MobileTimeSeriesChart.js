import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import styles from './MobileTimeSeriesChart.module.css';

const HOLD_DELAY_MS = 220;
const PALETTE = ['#4a90e2', '#00b894', '#f5a623', '#e67e22', '#d63031'];

const toTimestamp = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '');
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatNumber = (value, digits = 2) => {
  if (!Number.isFinite(value)) return 'N/A';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const normaliseSeries = (values) => {
  const firstIndex = values.findIndex((value) => Number.isFinite(value));
  if (firstIndex === -1) return values.map(() => null);

  const baseline = values[firstIndex];
  const tinyBaseline = Math.abs(baseline) < 1e-9;
  const denominator = tinyBaseline ? 1 : Math.abs(baseline);

  return values.map((value, index) => {
    if (!Number.isFinite(value)) return null;
    if (index === firstIndex) return 100;
    if (tinyBaseline) return 100 + (value - baseline);
    return 100 + ((value - baseline) / denominator) * 100;
  });
};

export default function MobileTimeSeriesChart({
  data = [],
  yAxisTitle = '',
  showLegend = false,
  height = 250,
}) {
  const [mode, setMode] = useState('normalised');
  const [isTracking, setIsTracking] = useState(false);
  const [trackedIndex, setTrackedIndex] = useState(null);

  const holdTimeoutRef = useRef(null);
  const pendingTouchXRef = useRef(null);
  const overlayRef = useRef(null);

  const aligned = useMemo(() => {
    const xAxis = Array.from(
      new Set(
        data.flatMap((series) =>
          Array.isArray(series?.x)
            ? series.x.filter((value) => toTimestamp(value) != null)
            : []
        )
      )
    ).sort((a, b) => toTimestamp(a) - toTimestamp(b));

    const series = data.map((item, index) => {
      const xValues = Array.isArray(item?.x) ? item.x : [];
      const yValues = Array.isArray(item?.y) ? item.y : [];
      const byDate = new Map();

      xValues.forEach((xValue, valueIndex) => {
        const stamp = toTimestamp(xValue);
        const yValue = Number(yValues[valueIndex]);
        if (stamp != null && Number.isFinite(yValue)) {
          byDate.set(xValue, yValue);
        }
      });

      const rawY = xAxis.map((xValue) => (byDate.has(xValue) ? byDate.get(xValue) : null));
      const displayY = mode === 'normalised' ? normaliseSeries(rawY) : rawY;

      return {
        name: item?.name || `Series ${index + 1}`,
        color: item?.color || PALETTE[index % PALETTE.length],
        rawY,
        displayY,
      };
    });

    return { xAxis, series };
  }, [data, mode]);

  const yRange = useMemo(() => {
    const values = aligned.series
      .flatMap((series) => series.displayY)
      .filter((value) => Number.isFinite(value));

    if (!values.length) return undefined;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min;
    const padding = Math.max(spread * 0.08, 0.6);
    return [min - padding, max + padding];
  }, [aligned]);

  const updateTrackedIndex = useCallback(
    (clientX) => {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect || !aligned.xAxis.length) return;

      const clamped = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const ratio = rect.width ? clamped / rect.width : 0;
      const index = Math.round(ratio * (aligned.xAxis.length - 1));
      setTrackedIndex(Math.max(0, Math.min(aligned.xAxis.length - 1, index)));
    },
    [aligned.xAxis]
  );

  const clearHoldTimeout = useCallback(() => {
    if (holdTimeoutRef.current) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearHoldTimeout();
  }, [clearHoldTimeout]);

  const handleTouchStart = useCallback(
    (event) => {
      if (!aligned.xAxis.length) return;

      const touch = event.touches?.[0];
      if (!touch) return;

      pendingTouchXRef.current = touch.clientX;
      clearHoldTimeout();

      holdTimeoutRef.current = window.setTimeout(() => {
        setIsTracking(true);
        updateTrackedIndex(pendingTouchXRef.current);
      }, HOLD_DELAY_MS);
    },
    [aligned.xAxis.length, clearHoldTimeout, updateTrackedIndex]
  );

  const handleTouchMove = useCallback(
    (event) => {
      const touch = event.touches?.[0];
      if (!touch) return;

      pendingTouchXRef.current = touch.clientX;

      if (isTracking) {
        event.preventDefault();
        updateTrackedIndex(touch.clientX);
      }
    },
    [isTracking, updateTrackedIndex]
  );

  const handleTouchEnd = useCallback(() => {
    clearHoldTimeout();
    pendingTouchXRef.current = null;

    if (isTracking) {
      setIsTracking(false);
      setTrackedIndex(null);
    }
  }, [clearHoldTimeout, isTracking]);

  const trackedDate =
    isTracking && trackedIndex != null && aligned.xAxis[trackedIndex]
      ? aligned.xAxis[trackedIndex]
      : null;

  const trackerRows = useMemo(() => {
    if (!trackedDate || trackedIndex == null) return [];

    const rawSuffix = yAxisTitle.includes('%') ? '%' : '';

    return aligned.series.map((series) => {
      const displayValue = series.displayY[trackedIndex];
      const rawValue = series.rawY[trackedIndex];
      const hasDisplay = Number.isFinite(displayValue);
      const hasRaw = Number.isFinite(rawValue);

      let valueText = 'N/A';
      if (hasDisplay) {
        valueText = `${formatNumber(displayValue)}${mode === 'normalised' ? '' : rawSuffix}`;
      }

      let detailText = '';
      if (mode === 'normalised' && hasRaw) {
        detailText = `${formatNumber(rawValue)}${rawSuffix}`;
      }

      return {
        name: series.name,
        color: series.color,
        valueText,
        detailText,
      };
    });
  }, [aligned.series, mode, trackedDate, trackedIndex, yAxisTitle]);

  const traces = aligned.series.map((series) => ({
    x: aligned.xAxis,
    y: series.displayY,
    name: series.name,
    type: 'scatter',
    mode: 'lines',
    line: {
      color: series.color,
      width: 2.4,
      shape: 'spline',
      smoothing: 1,
    },
    connectgaps: false,
    hoverinfo: 'skip',
  }));

  const hasRenderableData = traces.some((trace) =>
    trace.y.some((value) => Number.isFinite(value))
  );

  if (!hasRenderableData) {
    return <div className={styles.empty}>No chart data available.</div>;
  }

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <div className={styles.modeToggle}>
          <button
            type="button"
            className={mode === 'normalised' ? styles.modeButtonActive : styles.modeButton}
            onClick={() => setMode('normalised')}
          >
            Normalised
          </button>
          <button
            type="button"
            className={mode === 'raw' ? styles.modeButtonActive : styles.modeButton}
            onClick={() => setMode('raw')}
          >
            Raw
          </button>
        </div>
        <span className={styles.hint}>Tap and hold to track</span>
      </div>

      <div className={styles.plotWrap} style={{ height }}>
        <Plot
          data={traces}
          layout={{
            autosize: true,
            height,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { t: 20, r: 8, b: 34, l: 36 },
            xaxis: {
              type: 'date',
              showgrid: false,
              zeroline: false,
              tickfont: { color: '#a7adb5', size: 10 },
              tickformat: '%b %d',
            },
            yaxis: {
              title: mode === 'normalised' ? 'Index (100)' : yAxisTitle,
              range: yRange,
              showgrid: false,
              zeroline: false,
              tickfont: { color: '#a7adb5', size: 10 },
            },
            showlegend: showLegend,
            legend: {
              orientation: 'h',
              y: -0.22,
              font: { color: '#c7cbd1', size: 10 },
            },
            shapes:
              trackedDate != null
                ? [
                    {
                      type: 'line',
                      xref: 'x',
                      yref: 'paper',
                      x0: trackedDate,
                      x1: trackedDate,
                      y0: 0,
                      y1: 1,
                      line: {
                        color: 'rgba(74, 144, 226, 0.8)',
                        width: 1.5,
                        dash: 'dot',
                      },
                    },
                  ]
                : [],
          }}
          config={{
            displayModeBar: false,
            displaylogo: false,
            responsive: true,
            staticPlot: true,
          }}
          useResizeHandler={true}
          className={styles.plot}
          style={{ width: '100%', height }}
        />

        <div
          ref={overlayRef}
          className={styles.touchOverlay}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        />

        {trackedDate ? (
          <div className={styles.trackerBox}>
            <p className={styles.trackerDate}>{formatDate(trackedDate)}</p>
            {trackerRows.map((row) => (
              <p key={row.name} className={styles.trackerRow}>
                <span className={styles.dot} style={{ background: row.color }} />
                <span className={styles.seriesName}>{row.name}</span>
                <span className={styles.seriesValue}>{row.valueText}</span>
                {row.detailText ? <span className={styles.seriesRaw}>({row.detailText})</span> : null}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
