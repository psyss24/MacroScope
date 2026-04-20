import React from 'react';
import MobileTimeSeriesChart from '../../charts/MobileTimeSeriesChart';
import styles from './MobileBondChartPanel.module.css';

export default function MobileBondChartPanel({ title, series = [] }) {
  const hasData = Array.isArray(series) && series.length > 0 && Array.isArray(series[0].y) && series[0].y.length > 0;

  return (
    <div className={styles.panel}>
      <p className={styles.title}>{title}</p>
      {hasData ? (
        <MobileTimeSeriesChart
          data={series}
          showLegend={false}
          yAxisTitle="Yield (%)"
          height={250}
        />
      ) : (
        <div className={styles.empty}>No bond chart data available for this region.</div>
      )}
    </div>
  );
}
