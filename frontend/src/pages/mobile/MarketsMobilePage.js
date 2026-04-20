import React, { useEffect, useMemo, useState } from 'react';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { MobilePageShell, MobileSection } from '../../components/mobile';
import {
  MobileMarketViewTabs,
  MobileMarketChartPanel,
  MobileMarketSnapshotCards,
} from '../../components/mobile/markets';
import styles from './MarketsMobilePage.module.css';

const MARKET_VIEWS = [
  { key: 'us', label: 'US Major Indices' },
  { key: 'global', label: 'Global ETFs' },
];

const US_SERIES_KEYS = [
  { source: 'indices', key: 'S&P 500', label: 'S&P 500', color: '#4a90e2' },
  { source: 'indices', key: 'NASDAQ', label: 'NASDAQ', color: '#00b894' },
  { source: 'indices', key: 'Dow Jones', label: 'Dow Jones', color: '#f5a623' },
];

const GLOBAL_SERIES_KEYS = [
  { source: 'etfs', key: 'S&P 500 ETF (SPY)', label: 'SPY', color: '#4a90e2' },
  { source: 'etfs', key: 'iShares MSCI Emerging Markets ETF (EEM)', label: 'EEM', color: '#00b894' },
  { source: 'etfs', key: 'iShares MSCI Japan ETF (EWJ)', label: 'EWJ', color: '#f5a623' },
];

const SNAPSHOT_KEYS = ['S&P 500', 'NASDAQ', 'Dow Jones', 'VIX'];

const toIsoDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

const formatNumber = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatChange = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export default function MarketsMobilePage() {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('us');

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getMarketData('indices,etfs', true, { signal: controller.signal });
        setMarketData(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(`Failed to load market data: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, []);

  const seriesConfig = selectedView === 'us' ? US_SERIES_KEYS : GLOBAL_SERIES_KEYS;

  const chartSeries = useMemo(() => {
    if (!marketData) return [];

    const datesSet = new Set();
    const histories = seriesConfig.map((conf) => {
      const source = marketData?.[conf.source]?.[conf.key]?.history || [];
      const history = Array.isArray(source) ? source : [];
      history.forEach((point) => {
        const iso = toIsoDate(point.date);
        if (iso) datesSet.add(iso);
      });
      return { conf, history };
    });

    const xAxis = Array.from(datesSet).sort();
    if (!xAxis.length) return [];

    return histories
      .map(({ conf, history }) => {
        const byDate = new Map();
        history.forEach((point) => {
          const iso = toIsoDate(point.date);
          const close = Number(point.close);
          if (iso && Number.isFinite(close)) {
            byDate.set(iso, close);
          }
        });

        const y = xAxis.map((date) => (byDate.has(date) ? byDate.get(date) : null));
        const validCount = y.filter((value) => value != null).length;
        if (validCount < 2) return null;

        return {
          x: xAxis,
          y,
          name: conf.label,
          color: conf.color,
        };
      })
      .filter(Boolean);
  }, [marketData, seriesConfig]);

  const snapshotCards = useMemo(() => {
    const indices = marketData?.indices || {};
    return SNAPSHOT_KEYS.map((key) => {
      const point = indices[key] || {};
      return {
        key,
        label: key,
        valueText: formatNumber(point.price),
        changeText: formatChange(point.changePercent),
        changePercent: point.changePercent,
      };
    });
  }, [marketData]);

  if (loading) {
    return <LoadingSpinner isLoading={true} message="Loading mobile markets view..." />;
  }

  return (
    <MobilePageShell
      title="Markets"
      subtitle="Mobile-first markets view with compact charts and snapshots"
    >
      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.stickyGroup}>
        <MobileMarketViewTabs
          views={MARKET_VIEWS}
          activeView={selectedView}
          onViewChange={setSelectedView}
        />
      </div>

      <MobileSection>
        <MobileMarketChartPanel
          title={selectedView === 'us' ? 'US Major Indices' : 'Global ETF Performance'}
          series={chartSeries}
        />
      </MobileSection>

      <MobileSection title="Market Snapshot">
        <MobileMarketSnapshotCards cards={snapshotCards} />
      </MobileSection>
    </MobilePageShell>
  );
}
