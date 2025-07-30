import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import BarChart from '../components/charts/BarChart';
import styles from './Pages.module.css';
import UnifiedCard from '../components/common/UnifiedCard';
import CardSlider from '../components/common/CardSlider';
import ViewDetailsButton from '../components/common/ViewDetailsButton';
import DashboardChart from '../components/charts/DashboardChart';
import ProgressBar from '../components/common/ProgressBar';
import Plot from 'react-plotly.js';

const containerStyle = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '0 24px',
  width: '100%',
};
const sectionStyle = {
  margin: '48px 0',
};
const sectionHeaderStyle = {
  fontSize: '2rem',
  fontWeight: 700,
  color: 'var(--accent-color)',
  marginBottom: 32,
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
};
const cardGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '32px',
  justifyContent: 'center',
  alignItems: 'stretch',
};
const chartCardStyle = {
  background: '#111',
  borderRadius: 16,
  boxShadow: 'var(--shadow-sm)',
  padding: 32,
  margin: '0 auto',
  maxWidth: 900,
  marginBottom: 48,
};

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

// Helper for price color
const getPriceClass = (changePercent) => {
  if (typeof changePercent !== 'number') return 'valueNeutral';
  if (changePercent > 0) return 'valuePositive';
  if (changePercent < 0) return 'valueNegative';
  return 'valueNeutral';
};

// Define required commodities for each category
const ENERGY = [
  { name: 'Crude Oil (WTI)', key: 'Crude Oil' },
  { name: 'Crude Oil (Brent)', key: 'Brent Crude' },
  { name: 'Natural Gas', key: 'Natural Gas' },
];
const METALS = [
  { name: 'Gold', key: 'Gold' },
  { name: 'Silver', key: 'Silver' },
  { name: 'Copper', key: 'Copper' },
  { name: 'Platinum', key: 'Platinum' },
  { name: 'Aluminium', key: 'Aluminium' },
];
const AGRICULTURE = [
  { name: 'Wheat', key: 'Wheat' },
  { name: 'Corn', key: 'Corn' },
  { name: 'Soybeans', key: 'Soybeans' },
  { name: 'Coffee', key: 'Coffee' },
  { name: 'Cocoa', key: 'Cocoa' },
];

const CommoditiesPage = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Gold/silver history state
  // Remove goldHistory, silverHistory, historyLoading, historyError, and the fetchHistory useEffect
  // Use marketData.commodities['Gold'].history and marketData.commodities['Silver'].history directly

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await apiService.getMarketData('commodities,crypto', true);
        setMarketData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching commodities data:', err);
        setError('Failed to load commodities data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Remove goldHistory, silverHistory, historyLoading, historyError, and the fetchHistory useEffect
  // Use marketData.commodities['Gold'].history and marketData.commodities['Silver'].history directly

  const [goldSilverMode, setGoldSilverMode] = useState('normalised');
  if (loading) return <div className={styles.loading}>Loading commodities data...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!marketData || !marketData.commodities) return <div className={styles.error}>No commodities data available</div>;

  // Helper for metrics (remove 'Unit')
  const getMetrics = (data, type) => {
    const metrics = [];
    if (type === 'crypto') {
      metrics.push(
        { label: 'Market Cap', value: data.marketCap || 'N/A' },
        { label: 'Volume', value: data.volume || 'N/A' }
      );
    } else {
      metrics.push(
        { label: 'Volume', value: data.volume || 'N/A' }
      );
    }
    return metrics;
  };

  // Helper to get data or placeholder
  const getCommodityData = (key) => marketData.commodities?.[key] || { price: null, changePercent: null, symbol: key, unit: '', volume: '', marketCap: '' };

  // Gold/silver chart data: use real history if available, else fallback to simulated
  let goldDates = [], goldPrices = [], silverDates = [], silverPrices = [];
  const goldHist = marketData.commodities?.['Gold']?.history || [];
  const silverHist = marketData.commodities?.['Silver']?.history || [];
  
  // Debug log to see what data we're getting
  console.log('Market data:', marketData);
  console.log('Gold history:', goldHist);
  console.log('Silver history:', silverHist);
  
  if (goldHist.length > 0 && silverHist.length > 0) {
    goldDates = goldHist.map(d => d.date);
    goldPrices = goldHist.map(d => d.close);
    silverDates = silverHist.map(d => d.date);
    silverPrices = silverHist.map(d => d.close);
  }
  // Use the shorter of the two series for alignment
  const minLen = Math.min(goldDates.length, silverDates.length);
  if (minLen > 0) {
    goldDates = goldDates.slice(-minLen);
    goldPrices = goldPrices.slice(-minLen);
    silverDates = silverDates.slice(-minLen);
    silverPrices = silverPrices.slice(-minLen);
  }
  // Normalise gold and silver series to start at 100 (first value exactly 100)
  const norm = arr => arr.map((v, i) => i === 0 ? 100 : (v / arr[0]) * 100);
  const goldSeriesNorm = goldPrices.length > 0 ? norm(goldPrices) : [];
  const silverSeriesNorm = silverPrices.length > 0 ? norm(silverPrices) : [];
  // Use goldDates for x axis
  // Generate month ticks/labels as before
  const monthTicks = [];
  const monthLabels = [];
  let lastMonth = null;
  let lastTickDate = null;
  for (let i = 0; i < goldDates.length; i++) {
    const dateStr = goldDates[i];
    const date = new Date(dateStr);
    const month = date.getMonth();
    if (month !== lastMonth) {
      if (!lastTickDate || (date - lastTickDate) / (1000 * 60 * 60 * 24) >= 20) {
        monthTicks.push(dateStr);
        monthLabels.push(date.toLocaleString('default', { month: 'short' }));
        lastTickDate = date;
        lastMonth = month;
      } else {
        monthTicks[monthTicks.length - 1] = dateStr;
        monthLabels[monthLabels.length - 1] = date.toLocaleString('default', { month: 'short' });
        lastTickDate = date;
        lastMonth = month;
      }
    }
  }
  // Pad the x-axis range by 3 days on each side
  let paddedStart = goldDates[0], paddedEnd = goldDates[goldDates.length - 1];
  if (goldDates.length > 0) {
    const firstDate = new Date(goldDates[0]);
    const lastDate = new Date(goldDates[goldDates.length - 1]);
    paddedStart = new Date(firstDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    paddedEnd = new Date(lastDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
  // Chart layout as before
  const goldSilverChartLayout = {
    height: 360,
    margin: { l: 0, r: 0, t: 24, b: 64 },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      showgrid: false,
      zeroline: false,
      showline: false,
      linecolor: 'rgba(0,0,0,0)',
      showticklabels: false,
      ticks: '',
      ticklen: 0,
      tickcolor: 'rgba(0,0,0,0)',
      title: '',
      tickformat: '%b',
      tickvals: monthTicks,
      ticktext: monthLabels,
      tickfont: { style: 'normal', size: 14 },
      tickangle: 0,
      automargin: true,
      range: [paddedStart, paddedEnd],
    },
    yaxis: {
      showgrid: false,
      zeroline: false,
      showline: false,
      linecolor: 'rgba(0,0,0,0)',
      showticklabels: false,
      ticks: '',
      ticklen: 0,
      tickcolor: 'rgba(0,0,0,0)',
      range: (() => {
        const all = [...goldSeriesNorm, ...silverSeriesNorm];
        if (all.length === 0) return undefined;
        const min = Math.min(...all);
        const max = Math.max(...all);
        const range = max - min;
        const margin = Math.max(range * 0.08, (min + max) * 0.01);
        return [min - margin, max + margin];
      })(),
      title: ''
    },
    yaxis2: {
      showgrid: false,
      zeroline: false,
      showticklabels: false,
      overlaying: 'y',
      side: 'right',
      title: ''
    },
    showlegend: false,
    legend: undefined,
    title: undefined
  };

  // Debug log for chart data
  console.log('Gold chart data:', { goldDates, goldSeriesNorm, silverSeriesNorm });
  // Defensive check: if any array is empty, show error
  const hasGoldSilverData = goldDates.length > 0 && goldSeriesNorm.length > 0 && silverSeriesNorm.length > 0;

  // Compute y-axis range based on mode
  const getGoldSilverRange = (mode) => {
    let arr1 = mode === 'normalised' ? goldSeriesNorm : goldPrices;
    let arr2 = mode === 'normalised' ? silverSeriesNorm : silverPrices;
    const all = [...arr1, ...arr2];
    if (all.length === 0) return undefined;
    const min = Math.min(...all);
    const max = Math.max(...all);
    const range = max - min;
    const margin = Math.max(range * 0.08, (min + max) * 0.01);
    return [min - margin, max + margin];
  };

  // Patch the layout for the current mode
  const goldSilverChartLayoutPatched = {
    ...goldSilverChartLayout,
    yaxis: {
      ...goldSilverChartLayout.yaxis,
      range: getGoldSilverRange(goldSilverMode),
    },
  };

  return (
    <div style={containerStyle}>
      <ProgressBar isLoading={loading} />
      <header className={styles.pageHeader} style={{ paddingTop: 24, paddingBottom: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-color)', marginBottom: 12, letterSpacing: '-0.03em' }}>Commodities</h1>
        <p className={styles.pageDescription} style={{ fontSize: '1.15rem', color: 'var(--muted-text)', marginBottom: 16, maxWidth: 700 }}>
          Real-time prices for precious metals, energy, and agricultural commodities
        </p>
      </header>
      {/* Move Commodity Price Change Comparison to the top */}
      <section style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>Commodity Price Change Comparison</h2>
        <div className={styles.dashboardChartCard}>
          <BarChart 
            data={[
              {
                x: Object.keys(marketData.commodities || {}),
                y: Object.values(marketData.commodities || {}).map(item => item.changePercent || 0),
                name: 'Price Change (%)',
                useColorScale: true
              }
            ]}
            title="Daily Price Change by Commodity"
            xAxisTitle="Commodity"
            yAxisTitle="Change (%)"
            height={400}
          />
        </div>
      </section>
      {/* Metals Section */}
      <section style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>Metals</h2>
        {!hasGoldSilverData ? (
          <div className={styles.error}>No gold/silver history data available for chart.</div>
        ) : (
        <DashboardChart
          title="Gold vs Silver – Performance"
          smartBaselineLabel={true}
          showPricesOnHover={true}
          enableModeToggle={true}
          initialMode={goldSilverMode}
          setMode={setGoldSilverMode}
          rawData={[
              {
                x: goldDates,
              y: goldPrices,
                type: 'scatter',
                mode: 'lines',
                name: 'Gold',
                line: { color: '#ffd700', width: 3 },
                hoverinfo: 'x+y',
              },
              {
                x: goldDates,
              y: silverPrices,
                type: 'scatter',
                mode: 'lines',
                name: 'Silver',
                line: { color: '#b0c4de', width: 3 },
                hoverinfo: 'x+y',
              }
          ]}
          charts={[{
            layout: goldSilverChartLayoutPatched,
            config: { displayModeBar: false }
          }]}
          goldPrice={goldPrices.length > 0 ? goldPrices[goldPrices.length - 1] : marketData.commodities?.['Gold']?.price}
          silverPrice={silverPrices.length > 0 ? silverPrices[silverPrices.length - 1] : marketData.commodities?.['Silver']?.price}
          goldPriceSeries={goldPrices}
          silverPriceSeries={silverPrices}
          xSeries={goldDates}
        />
        )}
        <CardSlider>
          {METALS.map(({ name, key }) => {
            const data = getCommodityData(key);
            return (
              <UnifiedCard
                key={key}
                title={name}
                tag={data.symbol}
                metrics={[
                  { label: 'Price', value: data.price != null ? `$${data.price?.toLocaleString()}` : 'N/A', valueClass: getPriceClass(data.changePercent) },
                  { label: 'Change', value: data.changePercent != null ? `${data.changePercent >= 0 ? '+' : ''}${data.changePercent?.toFixed(2)}%` : 'N/A', valueClass: getPriceClass(data.changePercent) },
                  ...getMetrics(data)
                ]}
                actions={<ViewDetailsButton href={`/commodities/${data.symbol}`} />}
              />
            );
          })}
        </CardSlider>
      </section>
      <section style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>Energy</h2>
        <CardSlider>
          {ENERGY.map(({ name, key }) => {
            const data = getCommodityData(key);
            return (
              <UnifiedCard
                key={key}
                title={name}
                tag={data.symbol}
                metrics={[
                  { label: 'Price', value: data.price != null ? `$${data.price?.toLocaleString()}` : 'N/A', valueClass: getPriceClass(data.changePercent) },
                  { label: 'Change', value: data.changePercent != null ? `${data.changePercent >= 0 ? '+' : ''}${data.changePercent?.toFixed(2)}%` : 'N/A', valueClass: getPriceClass(data.changePercent) },
                  ...getMetrics(data)
                ]}
                actions={<ViewDetailsButton href={`/commodities/${data.symbol}`} />}
              />
            );
          })}
        </CardSlider>
      </section>
      <section style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>Agriculture</h2>
        <CardSlider>
          {AGRICULTURE.map(({ name, key }) => {
            const data = getCommodityData(key);
            return (
              <UnifiedCard
                key={key}
                title={name}
                tag={data.symbol}
                metrics={[
                  { label: 'Price', value: data.price != null ? `$${data.price?.toLocaleString()}` : 'N/A', valueClass: getPriceClass(data.changePercent) },
                  { label: 'Change', value: data.changePercent != null ? `${data.changePercent >= 0 ? '+' : ''}${data.changePercent?.toFixed(2)}%` : 'N/A', valueClass: getPriceClass(data.changePercent) },
                  ...getMetrics(data)
                ]}
                actions={<ViewDetailsButton href={`/commodities/${data.symbol}`} />}
              />
            );
          })}
        </CardSlider>
      </section>
      <div style={{ textAlign: 'right', color: 'var(--muted-text)', fontSize: '0.95rem', marginTop: 32 }}>
        Last updated: {new Date(marketData.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default CommoditiesPage;