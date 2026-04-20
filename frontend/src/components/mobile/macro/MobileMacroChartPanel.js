import React from 'react';
import TimeSeriesChart from '../../charts/TimeSeriesChart';
import styles from './MobileMacroChartPanel.module.css';

export default function MobileMacroChartPanel({ title, series = [], yAxisLabel = '%' }) {
  const hasSeries = Array.isArray(series) && series.length > 0 && Array.isArray(series[0].y) && series[0].y.length > 0;

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>{title}</p>
      {hasSeries ? (
        <TimeSeriesChart
          data={series}
          showLegend={false}
          yAxisTitle={yAxisLabel}
          height={250}
          config={{
            displayModeBar: false,
            scrollZoom: false,
            doubleClick: false,
          }}
          layout={{
            margin: { t: 20, r: 10, b: 32, l: 34 },
            hovermode: 'x unified',
            dragmode: false,
          }}
          transparent={true}
        />
      ) : (
        <div className={styles.empty}>No data available for this metric.</div>
      )}
    </div>
  );
}
