import React from 'react';
import TimeSeriesChart from '../../charts/TimeSeriesChart';
import styles from './MobileBondChartPanel.module.css';

export default function MobileBondChartPanel({ title, series = [] }) {
  const hasData = Array.isArray(series) && series.length > 0 && Array.isArray(series[0].y) && series[0].y.length > 0;

  return (
    <div className={styles.panel}>
      <p className={styles.title}>{title}</p>
      {hasData ? (
        <TimeSeriesChart
          data={series}
          showLegend={false}
          yAxisTitle="Yield (%)"
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
        <div className={styles.empty}>No bond chart data available for this region.</div>
      )}
    </div>
  );
}
