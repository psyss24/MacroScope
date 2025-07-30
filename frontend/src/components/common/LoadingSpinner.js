import React from 'react';
import styles from './LoadingSpinner.module.css';

// Original LoadingSpinner component for other pages
const LoadingSpinner = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) return null;

  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingContent}>
        <div className={styles.chartContainer}>
          {/* Chart Grid Lines */}
          <div className={styles.chartGrid}>
            <div className={`${styles.chartGridLine} ${styles.horizontal}`}></div>
            <div className={`${styles.chartGridLine} ${styles.horizontal}`}></div>
            <div className={`${styles.chartGridLine} ${styles.horizontal}`}></div>
            <div className={`${styles.chartGridLine} ${styles.vertical}`}></div>
            <div className={`${styles.chartGridLine} ${styles.vertical}`}></div>
            <div className={`${styles.chartGridLine} ${styles.vertical}`}></div>
          </div>
          
          {/* Chart Line Animation */}
          <svg className={styles.chartLine} viewBox="0 0 120 80" preserveAspectRatio="none">
            <path 
              className={styles.chartPath}
              d="M 10 64 L 30 56 L 48 60 L 66 44 L 84 48 L 102 32"
              fill="none"
              stroke="#2196f3"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          {/* Chart Data Points */}
          <div className={styles.chartPoint}></div>
          <div className={styles.chartPoint}></div>
          <div className={styles.chartPoint}></div>
          <div className={styles.chartPoint}></div>
          <div className={styles.chartPoint}></div>
          <div className={styles.chartPoint}></div>
          
          {/* Chart Pulse Effect */}
          <div className={styles.chartPulse}></div>
        </div>
        <div className={styles.loadingText}>{message}</div>
      </div>
    </div>
  );
};

// Skeleton Card component that matches the actual dashboard cards 1:1
export const SkeletonCard = ({ className = '' }) => (
  <div className={`${styles.skeletonCard} ${className}`}>
    <div className={styles.skeletonHeader}>
      <div className={styles.skeletonIcon}></div>
      <div className={styles.skeletonTitle}>
        <div className={styles.skeletonTitleText}></div>
        <div className={styles.skeletonDescription}></div>
      </div>
    </div>
    <div className={styles.skeletonMetrics}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.skeletonMetric}>
          <div className={styles.skeletonMetricLabel}></div>
          <div className={styles.skeletonMetricValue}>
            <div className={styles.skeletonValue}></div>
            <div className={styles.skeletonChange}></div>
          </div>
        </div>
      ))}
    </div>
    <div className={styles.skeletonFooter}>
      <div className={styles.skeletonButton}></div>
    </div>
  </div>
);

// Skeleton for Market Overview component
export const SkeletonMarketOverview = () => (
  <div className={styles.skeletonMarketOverview}>
    <div className={styles.skeletonSectionHeader}>
      <div className={styles.skeletonSectionTitle}></div>
      <div className={styles.skeletonTimestamp}></div>
    </div>
    <div className={styles.skeletonGrid}>
      <div className={styles.skeletonSection}>
        <div className={styles.skeletonSubTitle}></div>
        <div className={styles.skeletonIndicesGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonIndexCard}>
              <div className={styles.skeletonSymbol}></div>
              <div className={styles.skeletonPrice}></div>
              <div className={styles.skeletonChange}></div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.skeletonSection}>
        <div className={styles.skeletonSubTitle}></div>
        <div className={styles.skeletonSectorGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonSectorCard}>
              <div className={styles.skeletonSectorName}></div>
              <div className={styles.skeletonSectorSymbol}></div>
              <div className={styles.skeletonSectorChange}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Skeleton for Macro Indicators component
export const SkeletonMacroIndicators = () => (
  <div className={styles.skeletonMacroIndicators}>
    <div className={styles.skeletonSectionHeader}>
      <div className={styles.skeletonSectionTitle}></div>
      <div className={styles.skeletonTimestamp}></div>
    </div>
    <div className={styles.skeletonIndicatorsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.skeletonIndicatorCard}>
          <div className={styles.skeletonIndicatorLabel}></div>
          <div className={styles.skeletonIndicatorValue}></div>
          <div className={styles.skeletonIndicatorChange}></div>
          <div className={styles.skeletonLastUpdated}></div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton for Top Stocks component
export const SkeletonTopStocks = () => (
  <div className={styles.skeletonTopStocks}>
    <div className={styles.skeletonSectionHeader}>
      <div className={styles.skeletonSectionTitle}></div>
      <div className={styles.skeletonControls}></div>
    </div>
    <div className={styles.skeletonStocksGrid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.skeletonStockCard}>
          <div className={styles.skeletonStockHeader}>
            <div className={styles.skeletonStockSymbol}></div>
            <div className={styles.skeletonStockSector}></div>
          </div>
          <div className={styles.skeletonStockName}></div>
          <div className={styles.skeletonStockPrice}>
            <div className={styles.skeletonPrice}></div>
            <div className={styles.skeletonChange}></div>
          </div>
          <div className={styles.skeletonStockMetrics}>
            {[1, 2, 3].map((j) => (
              <div key={j} className={styles.skeletonStockMetric}>
                <div className={styles.skeletonMetricLabel}></div>
                <div className={styles.skeletonMetricValue}></div>
              </div>
            ))}
          </div>
          <div className={styles.skeletonStockFooter}>
            <div className={styles.skeletonViewDetails}></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton for Charts component
export const SkeletonCharts = () => (
  <div className={styles.skeletonCharts}>
    <div className={styles.skeletonChartsHeader}>
      <div className={styles.skeletonChartsTitle}></div>
      <div className={styles.skeletonChartTabs}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonChartTab}></div>
        ))}
      </div>
    </div>
    <div className={styles.skeletonChartContent}>
      <div className={styles.skeletonChartWrapper}>
        <div className={styles.skeletonChartHeader}>
          <div className={styles.skeletonChartTitle}></div>
          <div className={styles.skeletonChartDescription}></div>
        </div>
        <div className={styles.skeletonChart}></div>
      </div>
    </div>
  </div>
);

export default LoadingSpinner; 