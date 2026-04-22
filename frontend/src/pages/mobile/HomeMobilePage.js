import React, { useEffect, useState } from 'react';
import { MobilePageShell, MobileSection } from '../../components/mobile';
import OverviewCards from '../../components/OverviewCards';
import styles from './HomeMobilePage.module.css';

export default function HomeMobilePage() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setRefreshKey((prev) => prev + 1);
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  return (
    <MobilePageShell
      title="MacroScope"
      subtitle="Financial Analysis Platform"
    >
      <div className={styles.heroCard}>
        <h2 className={styles.heroTitle}>MacroScope</h2>
        <p className={styles.heroSubtitle}>Financial Analysis Platform</p>
        <p className={styles.heroDescription}>
          Comprehensive market analysis with real time data, macroeconomic indicators,
          and interactive visualisations. Track everything from individual stocks to
          global economic trends in one platform.
        </p>
      </div>

      <MobileSection title="Overview">
        <div className={styles.overviewWrap}>
          <OverviewCards key={`mobile-overview-${refreshKey}`} />
        </div>
      </MobileSection>

      <p className={styles.timestamp}>
        Last updated: {lastUpdate.toLocaleTimeString()}
      </p>
    </MobilePageShell>
  );
}
