import React, { useState, useEffect } from 'react';
import styles from './MarketOverview.module.css';
import apiService from '../services/api';
import LoadingSpinner from './common/LoadingSpinner';

const MarketOverview = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchMarketData = async () => {
      try {
        // Fetch only dashboard-specific market data
        const data = await apiService.getMarketData(null, true, { signal });
        setMarketData(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
        setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) return <LoadingSpinner isLoading={true} message="Loading market data..." />;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!marketData) return <div className={styles.error}>No market data available</div>;

  const { indices, timestamp } = marketData;

  return (
    <div className={styles.marketOverview}>
      <div className={styles.header}>
        <h2>Market Overview</h2>
        <span className={styles.timestamp}>
          Last updated: {new Date(timestamp).toLocaleString()}
        </span>
      </div>
      
      <div className={styles.grid}>
        <div className={styles.section}>
          <h3>Major Indices</h3>
          <div className={styles.indicesGrid}>
            {Object.entries(indices || {}).map(([name, data]) => (
              <div key={name} className={styles.indexCard}>
                <div className={styles.symbol}>{name}</div>
                <div className={styles.price}>
                  ${data.price?.toLocaleString() || 'N/A'}
                </div>
                <div className={`${styles.change} ${
                  (data.changePercent || 0) >= 0 ? styles.positive : styles.negative
                }`}>
                  {data.changePercent >= 0 ? '+' : ''}
                  {data.changePercent?.toFixed(2) || 0}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3>Currencies</h3>
          <div className={styles.sectorGrid}>
            {marketData.currencies && Object.entries(marketData.currencies || {}).map(([name, data]) => (
              <div key={name} className={styles.sectorCard}>
                <div className={styles.sectorName}>{name}</div>
                <div className={styles.sectorSymbol}>{data.symbol}</div>
                <div className={`${styles.sectorChange} ${
                  (data.changePercent || 0) >= 0 ? styles.positive : styles.negative
                }`}>
                  {data.changePercent >= 0 ? '+' : ''}
                  {data.changePercent?.toFixed(2) || 0}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
