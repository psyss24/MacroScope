import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import styles from './Pages.module.css';
import UnifiedCard from '../components/common/UnifiedCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ChartCarousel from '../components/charts/ChartCarousel';
import useIsMobile from '../hooks/useIsMobile';
import MacroMobilePage from './mobile/MacroMobilePage';

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
  { key: 'Unemployment', label: 'Unemployment Rate', unit: '%' },
  { key: 'GDP Growth', label: 'GDP Growth', unit: '%' },
  { key: 'Interest Rate', label: 'Interest Rate', unit: '%' },
  { key: 'Government Debt', label: 'Government Debt (as % of GDP)', unit: '%' },
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

const getDataKey = (metricKey) => INDICATOR_TO_DATA_KEY[metricKey] || metricKey.toLowerCase();

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

const MacroPage = () => {
  const isMobile = useIsMobile();
  const mobileMacroEnabled = process.env.REACT_APP_ENABLE_MOBILE_MACRO !== 'false';
  const shouldRenderMobile = isMobile && mobileMacroEnabled;

  const [macroData, setMacroData] = useState({}); // regionKey -> data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('United States');

  // Helper to fetch macro data for a region
  const fetchRegionData = async (regionKey, signal) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      const data = await apiService.getMacroData(regionKey, false, { signal });

      if (data.countries && data.countries[regionKey]) {
        setMacroData(prev => ({ ...prev, [regionKey]: data.countries[regionKey] }));
        setError(null);
        setLoading(false);
      } else if (data.error) {
        setError(`Backend error: ${data.error}`);
        setLoading(false);
      } else {
        setError('No macroeconomic data available for this region');
        setLoading(false);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(`Failed to load macroeconomic data: ${err.message}`);
      }
      setLoading(false);
    }
  };

  // Fetch default region (US) on mount
  useEffect(() => {
    if (shouldRenderMobile) return undefined;

    const controller = new AbortController();
    fetchRegionData('United States', controller.signal);
    return () => controller.abort();
  }, [shouldRenderMobile]);

  // Fetch new region when selected
  useEffect(() => {
    if (shouldRenderMobile) return undefined;

    if (!macroData[selectedRegion]) {
      const controller = new AbortController();
      fetchRegionData(selectedRegion, controller.signal);
      return () => controller.abort();
    }
  }, [selectedRegion, macroData, shouldRenderMobile]);

  if (shouldRenderMobile) return <MacroMobilePage />;

  if (loading) return <LoadingSpinner isLoading={true} message="Loading macroeconomic data..." />;

  const regionData = macroData[selectedRegion] || {};

  const getLatestPoint = (metricKey) => {
    const dataKey = getDataKey(metricKey);
    const points = normalizeSeries(regionData[dataKey]);
    if (!points.length) return null;
    return points[points.length - 1];
  };

  const getIndicatorMeta = (metricKey) => {
    const dataKey = getDataKey(metricKey);
    const meta = regionData?.indicator_meta?.[dataKey];
    return meta && typeof meta === 'object' ? meta : null;
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Macroeconomic Indicators</h1>
        <p className={styles.pageDescription}>
          Higher-frequency macro data with source-aware recency across major economies
        </p>
      </header>
      {error && (
        <div style={{ marginBottom: 16, color: 'var(--risk-color)' }}>
          {error}
        </div>
      )}
      <div className={styles.regionTabs}>
        {MACRO_REGIONS.map(region => (
          <UnifiedCard
            key={region.key}
            className={`${styles.regionTab} ${selectedRegion === region.key ? styles.regionTabSelected : ''}`}
            onClick={() => setSelectedRegion(region.key)}
          >
            <span className={styles.regionTabLabel}>{region.label}</span>
          </UnifiedCard>
        ))}
      </div>
      <div className={styles.dashboardChartCard}>
        <ChartCarousel
          metrics={MACRO_CHART_OPTIONS}
          region={selectedRegion}
          regionData={regionData}
          getChartData={(metricKey) => {
            const dataKey = getDataKey(metricKey);
            const entries = normalizeSeries(regionData[dataKey]);
            if (!entries.length) return [];
            const selectedOption = MACRO_CHART_OPTIONS.find(opt => opt.key === metricKey);
            return [{
              x: entries.map(d => d.x),
              y: entries.map(d => d.value),
              name: selectedOption?.label || metricKey,
              unit: selectedOption?.unit || '',
              type: 'scatter',
              mode: 'lines',
              line: { color: '#1976d2', width: 3 },
            }];
          }}
          getChartTitle={(metricKey) => {
            const selectedOption = MACRO_CHART_OPTIONS.find(opt => opt.key === metricKey);
            const meta = getIndicatorMeta(metricKey);
            const frequency = meta?.frequency ? ` (${meta.frequency})` : '';
            return `${selectedOption?.label || metricKey} – ${selectedRegion}${frequency}`;
          }}
          smartBaselineLabel={true}
          showPricesOnHover={true}
          enableModeToggle={true}
        />
      </div>
      <div className={styles.macroSummaryGrid}>
        {MACRO_CHART_OPTIONS.map(opt => {
          const latestPoint = getLatestPoint(opt.key);
          const meta = getIndicatorMeta(opt.key);
          const selectedOption = MACRO_CHART_OPTIONS.find(option => option.key === opt.key);
          const latestValue = latestPoint?.value ?? meta?.latestValue ?? null;
          const latestPeriod = latestPoint?.period ?? meta?.latestPeriod ?? null;

          const formattedValue = latestValue != null && typeof latestValue === 'number'
            ? latestValue.toFixed(2)
            : latestValue;
          
          return (
            <UnifiedCard key={opt.key} className={styles.macroSummaryCard}>
              <div className={styles.summaryLabel}>{opt.label}</div>
              <div className={styles.summaryValue}>
                {formattedValue != null ? formattedValue : 'N/A'}
                {selectedOption?.unit ? ` ${selectedOption.unit}` : ''}
              </div>
              <div className={styles.summaryAsOf}>
                {latestPeriod ? `as of ${latestPeriod}` : ''}
              </div>
            </UnifiedCard>
          );
        })}
      </div>
    </div>
  );
};

export default MacroPage;