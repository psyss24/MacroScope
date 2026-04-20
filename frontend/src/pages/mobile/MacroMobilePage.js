import React, { useCallback, useEffect, useMemo, useState } from 'react';
import apiService from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { MobilePageShell, MobileSection } from '../../components/mobile';
import MobileRegionTabs from '../../components/mobile/macro/MobileRegionTabs';
import MobileMetricTabs from '../../components/mobile/macro/MobileMetricTabs';
import MobileMacroChartPanel from '../../components/mobile/macro/MobileMacroChartPanel';
import MobileMacroSummaryCards from '../../components/mobile/macro/MobileMacroSummaryCards';
import styles from './MacroMobilePage.module.css';

const MACRO_REGIONS = [
  { key: 'United States', label: 'US' },
  { key: 'Germany', label: 'Germany' },
  { key: 'France', label: 'France' },
  { key: 'United Kingdom', label: 'UK' },
  { key: 'Japan', label: 'Japan' },
  { key: 'China', label: 'China' },
];

const MACRO_CHART_OPTIONS = [
  { key: 'Inflation', label: 'CPI', unit: '%' },
  { key: 'Unemployment', label: 'Unemployment', unit: '%' },
  { key: 'GDP Growth', label: 'GDP Growth', unit: '%' },
  { key: 'Interest Rate', label: 'Interest Rate', unit: '%' },
  { key: 'Government Debt', label: 'Gov Debt / GDP', unit: '%' },
];

const INDICATOR_TO_DATA_KEY = {
  Inflation: 'inflation',
  Unemployment: 'unemployment',
  'GDP Growth': 'gdp_growth',
  'Interest Rate': 'interest_rate',
  'Government Debt': 'government_debt',
};

const parsePeriodToDate = (period) => {
  if (!period) return null;
  const value = String(period).trim();

  if (/^\d{4}$/.test(value)) {
    return new Date(Number(value), 0, 1);
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number);
    if (month >= 1 && month <= 12) return new Date(year, month - 1, 1);
  }

  if (/^\d{4}-Q[1-4]$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const quarter = Number(value.slice(6));
    return new Date(year, (quarter - 1) * 3, 1);
  }

  return null;
};

const normalizeSeries = (series) => {
  if (!series || typeof series !== 'object') return [];

  return Object.entries(series)
    .map(([period, value]) => ({
      period: String(period),
      value: typeof value === 'number' ? value : Number(value),
      dateObj: parsePeriodToDate(period),
    }))
    .filter((item) => Number.isFinite(item.value) && item.dateObj)
    .sort((a, b) => a.dateObj - b.dateObj)
    .map((item) => ({
      period: item.period,
      value: item.value,
      x: item.dateObj.toISOString().split('T')[0],
    }));
};

const getDataKey = (metricKey) => INDICATOR_TO_DATA_KEY[metricKey] || metricKey.toLowerCase();

export default function MacroMobilePage() {
  const [macroData, setMacroData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('United States');
  const [selectedMetric, setSelectedMetric] = useState('Inflation');

  const fetchRegionData = useCallback(async (regionKey, signal) => {
    try {
      setError(null);
      const data = await apiService.getMacroData(regionKey, false, { signal });
      const countryData = data?.countries?.[regionKey];

      if (countryData) {
        setMacroData((prev) => ({ ...prev, [regionKey]: countryData }));
      } else {
        setError('No macroeconomic data available for this region.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(`Failed to load macroeconomic data: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchRegionData('United States', controller.signal);
    return () => controller.abort();
  }, [fetchRegionData]);

  useEffect(() => {
    if (!macroData[selectedRegion]) {
      const controller = new AbortController();
      fetchRegionData(selectedRegion, controller.signal);
      return () => controller.abort();
    }
    return undefined;
  }, [selectedRegion, macroData, fetchRegionData]);

  const regionData = macroData[selectedRegion] || null;

  const chartSeries = useMemo(() => {
    const dataKey = getDataKey(selectedMetric);
    const entries = normalizeSeries(regionData?.[dataKey]);
    if (!entries.length) return [];

    const metric = MACRO_CHART_OPTIONS.find((item) => item.key === selectedMetric);
    return [
      {
        x: entries.map((entry) => entry.x),
        y: entries.map((entry) => entry.value),
        name: metric?.label || selectedMetric,
        color: '#4a90e2',
      },
    ];
  }, [regionData, selectedMetric]);

  const summaryItems = useMemo(() => {
    return MACRO_CHART_OPTIONS.map((option) => {
      const dataKey = getDataKey(option.key);
      const entries = normalizeSeries(regionData?.[dataKey]);
      const latestPoint = entries[entries.length - 1] || null;
      const meta = regionData?.indicator_meta?.[dataKey] || {};
      const latestValue = latestPoint?.value ?? meta.latestValue ?? null;
      const latestPeriod = latestPoint?.period ?? meta.latestPeriod ?? null;

      const valueText =
        typeof latestValue === 'number'
          ? `${latestValue.toFixed(2)}${option.unit ? ` ${option.unit}` : ''}`
          : 'N/A';

      return {
        key: option.key,
        label: option.label,
        valueText,
        asOfText: latestPeriod ? `as of ${latestPeriod}` : '',
      };
    });
  }, [regionData]);

  const selectedMetricMeta = regionData?.indicator_meta?.[getDataKey(selectedMetric)] || {};
  const chartTitle = `${selectedRegion} - ${MACRO_CHART_OPTIONS.find((m) => m.key === selectedMetric)?.label || selectedMetric}${
    selectedMetricMeta.frequency ? ` (${selectedMetricMeta.frequency})` : ''
  }`;

  if (loading) {
    return <LoadingSpinner isLoading={true} message="Loading mobile macro view..." />;
  }

  return (
    <MobilePageShell
      title="Macroeconomic Indicators"
      subtitle="Mobile-first macro view with compact charts and cards"
    >
      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.stickyGroup}>
        <MobileRegionTabs
          regions={MACRO_REGIONS}
          activeRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
        />
        <MobileMetricTabs
          metrics={MACRO_CHART_OPTIONS}
          activeMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        />
      </div>

      <MobileSection>
        <MobileMacroChartPanel title={chartTitle} series={chartSeries} />
      </MobileSection>

      <MobileSection title="Snapshot">
        <MobileMacroSummaryCards items={summaryItems} />
      </MobileSection>
    </MobilePageShell>
  );
}
