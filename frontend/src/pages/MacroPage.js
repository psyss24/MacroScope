import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../services/api';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import BarChart from '../components/charts/BarChart';
import styles from './Pages.module.css';
import UnifiedCard from '../components/common/UnifiedCard';
import DashboardChart from '../components/charts/DashboardChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ChartCarousel from '../components/charts/ChartCarousel';

// Helper function to generate dates for charts
const generateDates = (days) => {
  const dates = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

// Mapping for indicator -> metric/series
const INDICATOR_METRIC = {
  'Inflation Rate': 'CPIAUCSL (Consumer Price Index, All Urban Consumers)',
  'Unemployment Rate': 'UNRATE (Unemployment Rate)',
  'Federal Funds Rate': 'FEDFUNDS (Effective Federal Funds Rate)',
  'GDP Growth': 'GDP (Gross Domestic Product)',
  '10Y Treasury Yield': 'DGS10 (10-Year Treasury Constant Maturity Rate)',
  '2Y Treasury Yield': 'DGS2 (2-Year Treasury Constant Maturity Rate)',
  '30Y Treasury Yield': 'DGS30 (30-Year Treasury Constant Maturity Rate)',
  '5Y Treasury Yield': 'DGS5 (5-Year Treasury Constant Maturity Rate)',
  'Consumer Confidence': 'UMCSENT (University of Michigan: Consumer Sentiment Index)',
  // Add more as needed
};

// Mapping for indicator -> period
const INDICATOR_PERIOD = {
  'Inflation Rate': 'YoY Change',
  'Unemployment Rate': 'Monthly Change',
  'Federal Funds Rate': 'Latest Change',
  'GDP Growth': 'Quarterly Change',
  // Add more as needed
};

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

const MacroPage = () => {
  const [macroData, setMacroData] = useState({}); // regionKey -> data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('United States');
  const [selectedMacroChart, setSelectedMacroChart] = useState('Inflation');

  // Helper to fetch macro data for a region
  const fetchRegionData = async (regionKey, signal) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Add a small delay to ensure loading state is visible
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`Frontend: Fetching macro data for region '${regionKey}'`);
      
      const data = await apiService.getMacroData(regionKey, false, { signal });
      console.log(`Frontend: Received data structure:`, data);
      console.log(`Frontend: Data keys:`, Object.keys(data));
      if (data.countries) {
        console.log(`Frontend: Countries keys:`, Object.keys(data.countries));
        if (data.countries[regionKey]) {
          console.log(`Frontend: ${regionKey} data:`, data.countries[regionKey]);
          Object.keys(data.countries[regionKey]).forEach(indicator => {
            console.log(`Frontend: ${regionKey} - ${indicator} series:`, data.countries[regionKey][indicator]);
          });
        } else {
          console.warn(`Frontend: No data for regionKey '${regionKey}' in countries.`);
        }
      } else {
        console.warn('Frontend: No countries key in macro data response.');
      }
      
      if (data.countries && data.countries[regionKey]) {
        console.log(`Frontend: Found data for region '${regionKey}'`);
        console.log(`Frontend: Region data keys:`, Object.keys(data.countries[regionKey]));
        setMacroData(prev => ({ ...prev, [regionKey]: data.countries[regionKey] }));
        setError(null);
        
        // Add a small delay before hiding loading to ensure progress bar is visible
        setTimeout(() => setLoading(false), 200);
      } else if (data.error) {
        console.error(`Frontend: Backend error: ${data.error}`);
        setError(`Backend error: ${data.error}`);
        setLoading(false);
      } else {
        console.error(`Frontend: No data found for region '${regionKey}'`);
        console.log(`Frontend: Available countries:`, data.countries ? Object.keys(data.countries) : 'None');
        setError('No macroeconomic data available for this region');
        setLoading(false);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(`Frontend: Fetch error:`, err);
        setError(`Failed to load macroeconomic data: ${err.message}`);
      }
      setLoading(false);
    }
  };

  // Fetch default region (US) on mount
  useEffect(() => {
    const controller = new AbortController();
    fetchRegionData('United States', controller.signal);
    return () => controller.abort();
  }, []);

  // Fetch new region when selected
  useEffect(() => {
    if (!macroData[selectedRegion]) {
      const controller = new AbortController();
      fetchRegionData(selectedRegion, controller.signal);
      return () => controller.abort();
    }
  }, [selectedRegion, macroData]);

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    const regionData = macroData[selectedRegion] || {};
    let indicatorKey = selectedMacroChart.toLowerCase();
    if (indicatorKey === 'gdp growth') indicatorKey = 'gdp_growth';
    if (indicatorKey === 'unemployment') indicatorKey = 'unemployment';
    if (indicatorKey === 'inflation') indicatorKey = 'inflation';
    let entries;
    if (indicatorKey === 'interest_rate') {
      const irData = regionData['interest_rate'];
      console.log('[DEBUG] chartData: regionData["interest_rate"]', irData);
      if (!irData) {
        console.log('[DEBUG] chartData: No interest_rate data found');
        return [];
      }
      entries = Object.entries(irData)
        .map(([year, value]) => ({ year: String(year), value }))
        .filter(d =>
          typeof d.value === 'number' &&
          isFinite(d.value) &&
          Number(d.year) >= 2000
        )
        .sort((a, b) => a.year.localeCompare(b.year));
      console.log('[DEBUG] chartData: filtered entries length', entries.length);
      console.log('[DEBUG] chartData: filtered years and values', entries.map(d => [d.year, d.value]));
    } else {
      if (!regionData[indicatorKey]) return [];
      entries = Object.entries(regionData[indicatorKey])
        .map(([year, value]) => ({ year: String(year), value }))
        .sort((a, b) => a.year.localeCompare(b.year));
    }
    let xVals = entries.map(d => d.year);
    if (indicatorKey !== 'interest_rate') {
      const allYears = xVals.every(x => x.length === 4 && /^\d{4}$/.test(x));
      if (allYears) {
        xVals = xVals.map(y => `${y}-01-01`);
      }
    }
    const selectedOption = MACRO_CHART_OPTIONS.find(opt => opt.key === selectedMacroChart);
    return [{
      x: xVals,
      y: entries.map(d => d.value),
      name: selectedOption?.label || selectedMacroChart,
      unit: selectedOption?.unit || '',
      type: 'scatter',
      mode: 'lines',
      line: { color: '#1976d2', width: 3 },
    }];
  }, [macroData, selectedRegion, selectedMacroChart]);

  if (loading) return <LoadingSpinner isLoading={true} message="Loading macroeconomic data..." />;

  const regionData = macroData[selectedRegion] || {};
  // Extra logging for debugging interest rate data
  console.log('MacroPage: regionData for', selectedRegion, regionData);
  if (regionData['interest_rate']) {
    console.log('MacroPage: interest_rate data for', selectedRegion, regionData['interest_rate']);
  } else {
    console.log('MacroPage: No interest_rate data for', selectedRegion);
  }

  // Helper function to get current year's value for an indicator
  const getCurrentYearValue = (indicatorKey) => {
    const currentYear = new Date().getFullYear();
    // Special handling for Interest Rate
    if (indicatorKey === 'Interest Rate') {
      const history = regionData['Interest Rate']?.history;
      if (!Array.isArray(history)) return null;
      // Find the latest value for the current year
      const entry = history
        .filter(d => d.date && d.date.startsWith(currentYear.toString()) && typeof d.value === 'number' && isFinite(d.value) && d.value >= -10 && d.value <= 30)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      return entry ? entry.value : null;
    }
    // Map the indicator key to the actual data key
    let dataKey = indicatorKey;
    if (indicatorKey === 'GDP Growth') dataKey = 'gdp_growth';
    if (indicatorKey === 'Inflation') dataKey = 'inflation';
    if (indicatorKey === 'Unemployment') dataKey = 'unemployment';
    if (indicatorKey === 'Government Debt') dataKey = 'government_debt';
    const indicatorData = regionData[dataKey];
    if (!indicatorData) return null;
    // Check if there's projected data (future years)
    const years = Object.keys(indicatorData).map(Number).sort((a, b) => a - b);
    const hasProjectedData = years.some(year => year > currentYear);
    if (hasProjectedData) {
      // If there's projected data, use current year's value
      const currentYearValue = indicatorData[currentYear.toString()];
      return currentYearValue || null;
    } else {
      // If no projected data, use the most recent value
      const mostRecentYear = Math.max(...years);
      const mostRecentValue = indicatorData[mostRecentYear.toString()];
      return mostRecentValue || null;
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Macroeconomic Indicators</h1>
        <p className={styles.pageDescription}>
          Key economic indicators, inflation rates, interest rates, and GDP growth
        </p>
      </header>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {MACRO_REGIONS.map(region => (
          <UnifiedCard
            key={region.key}
            className={selectedRegion === region.key ? `selectedCard buttonCard` : `buttonCard`}
            onClick={() => {
              console.log(`Frontend: Region button clicked: ${region.key}`);
              setSelectedRegion(region.key);
            }}
            style={{ cursor: 'pointer', minWidth: 90, textAlign: 'center', fontWeight: 600 }}
          >
            {region.label}
          </UnifiedCard>
        ))}
      </div>
      {/* Removed metric button cards */}
      <div className={styles.dashboardChartCard} style={{ position: 'relative' }}>
        <ChartCarousel
          metrics={MACRO_CHART_OPTIONS}
          region={selectedRegion}
          regionData={regionData}
          getChartData={(metricKey) => {
            let indicatorKey = metricKey.toLowerCase();
            if (indicatorKey === 'gdp growth') indicatorKey = 'gdp_growth';
            if (indicatorKey === 'unemployment') indicatorKey = 'unemployment';
            if (indicatorKey === 'inflation') indicatorKey = 'inflation';
            if (indicatorKey === 'interest rate') indicatorKey = 'interest_rate';
            if (indicatorKey === 'government debt') indicatorKey = 'government_debt';
            let entries;
            if (indicatorKey === 'interest_rate') {
              console.log('[DEBUG] getChartData: metricKey', metricKey, 'indicatorKey', indicatorKey);
              console.log('[DEBUG] getChartData: regionData', regionData);
              const irData = regionData['interest_rate'];
              console.log('[DEBUG] getChartData: regionData["interest_rate"]', irData);
              if (!irData) {
                console.log('[DEBUG] getChartData: No interest_rate data found');
                return [];
              }
              entries = Object.entries(irData)
                .map(([year, value]) => ({ year: String(year), value }))
                .filter(d =>
                  typeof d.value === 'number' &&
                  isFinite(d.value) &&
                  Number(d.year) >= 2000
                )
                .sort((a, b) => a.year.localeCompare(b.year));
              console.log('[DEBUG] getChartData: filtered entries length', entries.length);
              console.log('[DEBUG] getChartData: filtered years and values', entries.map(d => [d.year, d.value]));
            } else {
              if (!regionData[indicatorKey]) return [];
              entries = Object.entries(regionData[indicatorKey])
                .map(([year, value]) => ({ year: String(year), value }))
                .sort((a, b) => a.year.localeCompare(b.year));
            }
            let xVals = entries.map(d => d.year);
            if (indicatorKey !== 'interest_rate') {
              const allYears = xVals.every(x => x.length === 4 && /^\d{4}$/.test(x));
              if (allYears) {
                xVals = xVals.map(y => `${y}-01-01`);
              }
            }
            const selectedOption = MACRO_CHART_OPTIONS.find(opt => opt.key === metricKey);
            return [{
              x: xVals,
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
            return `${selectedOption?.label || metricKey} – ${selectedRegion}`;
          }}
          smartBaselineLabel={true}
          showPricesOnHover={true}
          enableModeToggle={true}
        />
      </div>
      {/* Indicator cards for the selected region */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 32 }}>
        {MACRO_CHART_OPTIONS.map(opt => {
          const currentYearValue = getCurrentYearValue(opt.key);
          const selectedOption = MACRO_CHART_OPTIONS.find(option => option.key === opt.key);
          
          // Format the value to 2 decimal places
          const formattedValue = currentYearValue != null && typeof currentYearValue === 'number' 
            ? currentYearValue.toFixed(2) 
            : currentYearValue;
          
          return (
            <UnifiedCard key={opt.key} className="buttonCard" style={{ minWidth: 180, maxWidth: 220 }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{opt.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-color)' }}>
                {formattedValue != null ? formattedValue : 'N/A'}
                {selectedOption?.unit ? ` ${selectedOption.unit}` : ''}
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--muted-text)', marginTop: 2 }}>
                {currentYearValue != null ? `as of ${new Date().getFullYear()}` : ''}
              </div>
            </UnifiedCard>
          );
        })}
      </div>
    </div>
  );
};

export default MacroPage;