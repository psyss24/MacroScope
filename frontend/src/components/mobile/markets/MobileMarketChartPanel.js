import React from 'react';
import MobileTimeSeriesChart from '../../charts/MobileTimeSeriesChart';
import styles from './MobileMarketChartPanel.module.css';

export default function MobileMarketChartPanel({ title, series = [] }) {
  const hasData = Array.isArray(series) && series.length > 0 && Array.isArray(series[0].y) && series[0].y.length > 0;

  return (
    <div className={styles.panel}>
      <p className={styles.title}>{title}</p>
      {hasData ? (
        <MobileTimeSeriesChart
          data={series}
          showLegend={false}
          yAxisTitle="Index / ETF"
          height={250}
        />
      ) : (
        <div className={styles.empty}>No chart data available for this view.</div>
      )}
    </div>
  );
}
