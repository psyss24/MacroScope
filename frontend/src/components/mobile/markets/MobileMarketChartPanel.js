import React from 'react';
import TimeSeriesChart from '../../charts/TimeSeriesChart';
import styles from './MobileMarketChartPanel.module.css';

export default function MobileMarketChartPanel({ title, series = [] }) {
  const hasData = Array.isArray(series) && series.length > 0 && Array.isArray(series[0].y) && series[0].y.length > 0;

  return (
    <div className={styles.panel}>
      <p className={styles.title}>{title}</p>
      {hasData ? (
        <TimeSeriesChart
          data={series}
          showLegend={false}
          yAxisTitle="Index / ETF"
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
        <div className={styles.empty}>No chart data available for this view.</div>
      )}
    </div>
  );
}
