import React, { useState } from 'react';
import DashboardChart from './DashboardChart';
import styles from './Charts.module.css';

// Arrow button styles (inline for now, can move to CSS)
const arrowStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 2,
  background: '#181c24',
  color: 'var(--accent-color, #2196f3)',
  border: 'none',
  borderRadius: 8,
  width: 44,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  opacity: 0.92,
  fontSize: '1.6rem',
  boxShadow: 'none',
  outline: 'none',
};

/**
 * ChartCarousel - flicks through metrics for a region, showing one DashboardChart at a time
 * Props:
 * - metrics: array of { key, label, unit }
 * - region: string
 * - regionData: object (data for the region)
 * - getChartData: function(metricKey) => chartData[]
 * - getChartTitle: function(metricKey) => string
 * - ...other DashboardChart props
 */
const ChartCarousel = ({
  metrics = [],
  region,
  regionData,
  getChartData,
  getChartTitle,
  ...dashboardChartProps
}) => {
  const [selectedMetricIndex, setSelectedMetricIndex] = useState(0);
  const metricCount = metrics.length;
  const currentMetric = metrics[selectedMetricIndex];

  // Flick left/right
  const prevMetric = () => setSelectedMetricIndex(i => (i - 1 + metricCount) % metricCount);
  const nextMetric = () => setSelectedMetricIndex(i => (i + 1) % metricCount);

  // Get chart data for current metric
  const chartData = getChartData(currentMetric.key);
  const hasData = chartData && chartData.length > 0 && chartData[0].y && chartData[0].y.length > 0;

  // Chart title
  const chartTitle = getChartTitle(currentMetric.key);

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* Left Arrow */}
      {metricCount > 1 && (
        <button
          style={{ ...arrowStyle, left: 0 }}
          aria-label="Previous metric"
          onClick={prevMetric}
        >
          &#8592;
        </button>
      )}
      {/* Chart Card (centered, full width, unmodified) */}
      <div style={{ margin: '0 56px', flex: '1 1 auto', maxWidth: '100%' }}>
        <DashboardChart
          title={chartTitle}
          charts={hasData ? [{ data: chartData }] : []}
          rawData={chartData}
          {...dashboardChartProps}
        >
          {!hasData && (
            <div style={{ textAlign: 'center', color: 'var(--muted-text)', fontSize: '1.1rem', marginTop: 32 }}>
              No data available for this metric.
            </div>
          )}
        </DashboardChart>
      </div>
      {/* Right Arrow */}
      {metricCount > 1 && (
        <button
          style={{ ...arrowStyle, right: 0 }}
          aria-label="Next metric"
          onClick={nextMetric}
        >
          &#8594;
        </button>
      )}
    </div>
  );
};

export default ChartCarousel; 