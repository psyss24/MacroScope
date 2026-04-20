import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { MobilePageShell, MobileSection, MobileCard } from '../../components/mobile';
import styles from './HomeMobilePage.module.css';

const NAV_ITEMS = [
  { to: '/markets', title: 'Markets', subtitle: 'Indices and ETF trends' },
  { to: '/macro', title: 'Macro', subtitle: 'Inflation, jobs, rates' },
  { to: '/commodities', title: 'Commodities', subtitle: 'Metals, energy, crypto' },
  { to: '/bonds', title: 'Bonds & Risk', subtitle: 'Yield curves and risk' },
  { to: '/stocks', title: 'Stocks', subtitle: 'Search and deep dive' },
];

const formatSignedPercent = (value) => {
  if (!Number.isFinite(value)) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return 'N/A';
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatCurrency = (value) => {
  if (!Number.isFinite(value)) return 'N/A';
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function HomeMobilePage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getDashboardData({ signal: controller.signal });
        setDashboardData(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(`Failed to load dashboard snapshot: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, []);

  const topMetrics = useMemo(() => {
    const markets = dashboardData?.markets || {};
    const bonds = dashboardData?.bonds || {};

    return [
      {
        key: 'spx',
        label: 'S&P 500',
        value: formatNumber(markets['S&P 500']?.price),
        change: formatSignedPercent(markets['S&P 500']?.changePercent),
      },
      {
        key: 'nasdaq',
        label: 'NASDAQ',
        value: formatNumber(markets.NASDAQ?.price),
        change: formatSignedPercent(markets.NASDAQ?.changePercent),
      },
      {
        key: 'us10',
        label: 'US 10Y',
        value: Number.isFinite(bonds.US10Y?.yield) ? `${bonds.US10Y.yield.toFixed(2)}%` : 'N/A',
        change: formatSignedPercent(bonds.US10Y?.changePercent),
      },
      {
        key: 'vix',
        label: 'VIX',
        value: formatNumber(bonds.VIX?.value),
        change: formatSignedPercent(bonds.VIX?.changePercent),
      },
    ];
  }, [dashboardData]);

  const macroPulse = useMemo(() => {
    const macro = dashboardData?.macro || {};

    return [
      {
        key: 'inflation',
        label: 'US Inflation',
        value: Number.isFinite(macro.inflation?.value) ? `${macro.inflation.value.toFixed(2)}%` : 'N/A',
      },
      {
        key: 'unemployment',
        label: 'US Unemployment',
        value: Number.isFinite(macro.unemployment?.value) ? `${macro.unemployment.value.toFixed(2)}%` : 'N/A',
      },
      {
        key: 'interest_rate',
        label: 'Fed Funds',
        value: Number.isFinite(macro.interest_rate?.value) ? `${macro.interest_rate.value.toFixed(2)}%` : 'N/A',
      },
    ];
  }, [dashboardData]);

  const heroContext = useMemo(() => {
    const commodities = dashboardData?.commodities || {};
    return {
      gold: formatCurrency(commodities.Gold?.price),
      btc: formatCurrency(commodities.Bitcoin?.price),
    };
  }, [dashboardData]);

  if (loading) {
    return <LoadingSpinner isLoading={true} message="Loading mobile dashboard..." />;
  }

  return (
    <MobilePageShell
      title="MacroScope"
      subtitle="Mobile command center for global markets and macro signals"
    >
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.heroCard}>
        <p className={styles.heroKicker}>Live Snapshot</p>
        <h2 className={styles.heroTitle}>What moved today</h2>
        <div className={styles.heroMeta}>
          <span>Gold: {heroContext.gold}</span>
          <span>BTC: {heroContext.btc}</span>
        </div>

        <div className={styles.metricGrid}>
          {topMetrics.map((metric) => (
            <MobileCard key={metric.key} className={styles.metricCard}>
              <p className={styles.metricLabel}>{metric.label}</p>
              <p className={styles.metricValue}>{metric.value}</p>
              <p className={styles.metricChange}>{metric.change}</p>
            </MobileCard>
          ))}
        </div>
      </div>

      <MobileSection title="Explore">
        <div className={styles.navGrid}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} className={styles.navLink}>
              <MobileCard interactive={true} className={styles.navCard}>
                <p className={styles.navTitle}>{item.title}</p>
                <p className={styles.navSubtitle}>{item.subtitle}</p>
              </MobileCard>
            </Link>
          ))}
        </div>
      </MobileSection>

      <MobileSection title="Macro Pulse" description="Core US indicators in one glance">
        <div className={styles.pulseGrid}>
          {macroPulse.map((item) => (
            <MobileCard key={item.key} className={styles.pulseCard}>
              <p className={styles.pulseLabel}>{item.label}</p>
              <p className={styles.pulseValue}>{item.value}</p>
            </MobileCard>
          ))}
        </div>
      </MobileSection>

      <p className={styles.timestamp}>
        Updated {dashboardData?.timestamp ? new Date(dashboardData.timestamp).toLocaleTimeString() : 'recently'}
      </p>
    </MobilePageShell>
  );
}
