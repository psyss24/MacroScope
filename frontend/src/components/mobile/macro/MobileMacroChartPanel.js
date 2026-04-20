import React from 'react';
import MobileTimeSeriesChart from '../../charts/MobileTimeSeriesChart';
import styles from './MobileMacroChartPanel.module.css';

export default function MobileMacroChartPanel({ title, series = [], yAxisLabel = '%' }) {
  const hasSeries = Array.isArray(series) && series.length > 0 && Array.isArray(series[0].y) && series[0].y.length > 0;

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>{title}</p>
      {hasSeries ? (
        <MobileTimeSeriesChart
          data={series}
          showLegend={false}
          yAxisTitle={yAxisLabel}
          height={250}
        />
      ) : (
        <div className={styles.empty}>No data available for this metric.</div>
      )}
    </div>
  );
}
