import React, { useEffect, useState } from 'react';
import OverviewCards from './OverviewCards';
import MarketOverview from './MarketOverview';
import MacroIndicators from './MacroIndicators';
import TopStocks from './TopStocks';
import Charts from './Charts';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setRefreshKey(prev => prev + 1);
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.dashboard}>
      <div className="container">
        {/* Hero Section */}
        <section className={styles.heroCard}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              MacroScope
              <span className={styles.subtitle}>Financial Analysis Platform</span>
            </h1>
            <p className={styles.description}>
              Comprehensive market analysis with real-time data, macroeconomic indicators, 
              and interactive visualizations. Track everything from individual stocks to 
              global economic trends in one unified platform.
            </p>
          </div>
        </section>
        {/* Overview Cards */}
        <section className={styles.overviewSection}>
          <OverviewCards key={`overview-${refreshKey}`} />
        </section>
        {/* Last updated info at the bottom */}
        <div style={{ textAlign: 'right', color: 'var(--muted-text)', fontSize: '0.95rem', marginTop: 32 }}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
