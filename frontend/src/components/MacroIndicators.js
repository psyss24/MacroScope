import React, { useState, useEffect } from 'react';
import styles from './MacroIndicators.module.css';
import apiService from '../services/api';
import LoadingSpinner from './common/LoadingSpinner';

const MacroIndicators = () => {
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchMacroData = async () => {
      try {
        // Fetch only dashboard-specific macro data
        const data = await apiService.getMacroData(null, true, { signal });
        setMacroData(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
        setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMacroData();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) return <LoadingSpinner isLoading={true} message="Loading macro data..." />;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!macroData) return <div className={styles.error}>No macro data available</div>;

  const { indicators, timestamp } = macroData;

  return (
    <div className={styles.macroIndicators}>
      <div className={styles.header}>
        <h2>Macro Indicators</h2>
        <span className={styles.timestamp}>
          Last updated: {new Date(timestamp).toLocaleString()}
        </span>
      </div>

      <div className={styles.indicatorsGrid}>
        {indicators && Object.entries(indicators).map(([name, data]) => (
          <div key={name} className={styles.indicatorCard}>
            <div className={styles.indicatorLabel}>{name}</div>
            <div className={styles.indicatorValue}>
              {data.value?.toFixed(2) || 'N/A'}
              <span className={styles.unit}>{data.unit || ''}</span>
            </div>
            <div className={`${styles.indicatorChange} ${
              data.trend === 'up' ? styles.positive : 
              data.trend === 'down' ? styles.negative : 
              styles.neutral
            }`}>
              {data.trend === 'up' ? '+' : data.trend === 'down' ? '-' : ''}
              {data.change?.toFixed(2) || '0.00'}
              {data.unit || ''}
            </div>
            <div className={styles.lastUpdated}>
              {data.lastUpdate ? 
                new Date(data.lastUpdate).toLocaleDateString() : 
                'N/A'
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MacroIndicators;
