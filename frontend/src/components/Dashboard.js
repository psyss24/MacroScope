import React, { useEffect, useState } from 'react';
import OverviewCards from './OverviewCards';
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
