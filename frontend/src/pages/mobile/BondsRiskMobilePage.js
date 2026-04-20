import React, { useEffect, useMemo, useState } from 'react';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { MobilePageShell, MobileSection } from '../../components/mobile';
import {
  MobileBondRegionTabs,
  MobileBondChartPanel,
  MobileBondSnapshotCards,
} from '../../components/mobile/bonds';
import styles from './BondsRiskMobilePage.module.css';

const REGION_CONFIG = [
  {
    key: 'us',
    label: 'US',
    chartTitle: 'US Treasury Curve',
    symbols: ['US2Y', 'US5Y', 'US10Y'],
    keys: ['US 2Y Treasury', 'US 5Y Treasury', 'US 10Y Treasury'],
  },
  {
    key: 'germany',
    label: 'Germany',
    chartTitle: 'Germany Bund Curve',
    symbols: ['DE2Y', 'DE5Y', 'DE10Y'],
    keys: ['Germany 2Y Bund', 'Germany 5Y Bund', 'Germany 10Y Bund'],
  },
  {
    key: 'uk',
    label: 'UK',
    chartTitle: 'UK Gilt Curve',
    symbols: ['GB2Y', 'GB5Y', 'GB10Y'],
    keys: ['UK 2Y Gilt', 'UK 5Y Gilt', 'UK 10Y Gilt'],
  },
  {
    key: 'france',
    label: 'France',
    chartTitle: 'France OAT Curve',
    symbols: ['FR2Y', 'FR5Y', 'FR10Y'],
    keys: ['France 2Y OAT', 'France 5Y OAT', 'France 10Y OAT'],
  },
];

const SERIES_COLORS = ['#4a90e2', '#00b894', '#f5a623'];

const formatYield = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
  return `${value.toFixed(2)}%`;
};

const formatChange = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export default function BondsRiskMobilePage() {
  const [selectedRegion, setSelectedRegion] = useState('us');
  const [marketData, setMarketData] = useState(null);
  const [bondHistories, setBondHistories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [marketResponse, ...histories] = await Promise.all([
          apiService.getMarketData('bonds', false, { signal: controller.signal }),
          ...REGION_CONFIG.flatMap((region) =>
            region.symbols.map((symbol) =>
              apiService.getBondHistory(symbol, { signal: controller.signal }).catch(() => [])
            )
          ),
        ]);

        if (!mounted) return;

        setMarketData(marketResponse);

        const allSymbols = REGION_CONFIG.flatMap((region) => region.symbols);
        const historyMap = {};
        allSymbols.forEach((symbol, idx) => {
          const points = Array.isArray(histories[idx]) ? histories[idx] : [];
          historyMap[symbol] = points;
        });

        setBondHistories(historyMap);
      } catch (err) {
        if (err.name !== 'AbortError' && mounted) {
          setError(`Failed to load bonds data: ${err.message}`);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const activeRegion = REGION_CONFIG.find((region) => region.key === selectedRegion) || REGION_CONFIG[0];

  const chartSeries = useMemo(() => {
    const xSet = new Set();
    const regionSeries = activeRegion.symbols.map((symbol, idx) => {
      const points = Array.isArray(bondHistories[symbol]) ? bondHistories[symbol] : [];
      points.forEach((point) => {
        if (point?.x) xSet.add(point.x);
      });
      return { symbol, idx, points };
    });

    const xAxis = Array.from(xSet).sort();
    if (!xAxis.length) return [];

    return regionSeries
      .map(({ symbol, idx, points }) => {
        const byDate = new Map();
        points.forEach((point) => {
          const y = Number(point?.y);
          if (point?.x && Number.isFinite(y)) {
            byDate.set(point.x, y);
          }
        });

        const y = xAxis.map((date) => (byDate.has(date) ? byDate.get(date) : null));
        const validCount = y.filter((value) => value != null).length;
        if (validCount < 2) return null;

        const tenorLabel = symbol.endsWith('2Y') ? '2Y' : symbol.endsWith('5Y') ? '5Y' : '10Y';

        return {
          x: xAxis,
          y,
          name: tenorLabel,
          color: SERIES_COLORS[idx % SERIES_COLORS.length],
        };
      })
      .filter(Boolean);
  }, [activeRegion, bondHistories]);

  const snapshotCards = useMemo(() => {
    const bondsMap = marketData?.bonds || {};
    return activeRegion.keys.map((name, idx) => {
      const bond = bondsMap[name] || {};
      return {
        key: name,
        label: idx === 0 ? '2Y' : idx === 1 ? '5Y' : '10Y',
        valueText: formatYield(bond.price),
        changeText: formatChange(bond.changePercent),
        changePercent: bond.changePercent,
      };
    });
  }, [activeRegion, marketData]);

  if (loading) {
    return <LoadingSpinner isLoading={true} message="Loading mobile bonds view..." />;
  }

  return (
    <MobilePageShell
      title="Bonds & Risk"
      subtitle="Mobile-first sovereign curve view"
    >
      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.stickyGroup}>
        <MobileBondRegionTabs
          regions={REGION_CONFIG}
          activeRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
        />
      </div>

      <MobileSection>
        <MobileBondChartPanel title={activeRegion.chartTitle} series={chartSeries} />
      </MobileSection>

      <MobileSection title="Latest Yields">
        <MobileBondSnapshotCards cards={snapshotCards} />
      </MobileSection>
    </MobilePageShell>
  );
}
