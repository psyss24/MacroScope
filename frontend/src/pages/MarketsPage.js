import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import styles from './Pages.module.css';
import UnifiedCard from '../components/common/UnifiedCard';
import CardSlider from '../components/common/CardSlider';
import DashboardChart from '../components/charts/DashboardChart';
import ProgressBar from '../components/common/ProgressBar';

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

// Helper for transparent chart backgrounds
const transparentChartLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)'
};

// Helper for price color (copied from CommoditiesPage)
const getPriceClass = (changePercent) => {
  if (typeof changePercent !== 'number') return 'valueNeutral';
  if (changePercent > 0) return 'valuePositive';
  if (changePercent < 0) return 'valueNegative';
  return 'valueNeutral';
};

const MarketsPage = () => {
  const [chartHovered, setChartHovered] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEtfChart, setSelectedEtfChart] = useState('tech'); // Default to Tech & Innovation
  const [selectedMarketChart, setSelectedMarketChart] = useState('us'); // Default to US Market Performance

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Update the API call to fetch indices and etfs with dashboard=true
        const data = await apiService.getMarketData('indices,etfs', true);
        setMarketData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError('Failed to load market data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className={styles.loading}>Loading market data...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!marketData) return <div className={styles.error}>No market data available</div>;

  // Group indices by region
  const US_INDICES = ['S&P 500', 'NASDAQ', 'Dow Jones', 'Russell 2000'];
  const EU_INDICES = ['FTSE 100', 'DAX', 'CAC 40'];
  const ASIA_INDICES = ['Nikkei 225', 'Hang Seng', 'ASX 200'];

  const getIndexCard = (name, data) => (
    <UnifiedCard
      key={name}
      title={name}
      tag={data.symbol}
      metrics={[
        { label: 'Price', value: data.price != null ? `$${data.price?.toLocaleString()}` : 'N/A', valueClass: getPriceClass(data.changePercent) },
        { label: 'Change', value: data.changePercent != null ? `${data.changePercent >= 0 ? '+' : ''}${data.changePercent?.toFixed(2)}%` : 'N/A', valueClass: getPriceClass(data.changePercent) }
      ]}
    />
  );

  // Get 6 months of daily dates
  const today = new Date();
  const start = new Date(today);
  start.setMonth(today.getMonth() - 6);
  const xSeries = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    xSeries.push(d.toISOString().split('T')[0]);
  }

  // Build rawData for DashboardChart, aligning all series to xSeries
  const indices = ['NASDAQ', 'S&P 500', 'Dow Jones'];
  const rawData = indices.map(key => {
    const hist = marketData.indices[key]?.history || [];
    // Map date to close for fast lookup
    const dateToClose = {};
    hist.forEach(d => { dateToClose[d.date] = d.close; });
    return {
      x: xSeries,
      y: xSeries.map(date => dateToClose[date] != null ? dateToClose[date] : null),
      name: key,
      type: 'scatter',
      mode: 'lines',
      line: {
        color:
          key === 'NASDAQ' ? '#1976d2' :
          key === 'S&P 500' ? '#43a047' :
          key === 'Dow Jones' ? '#fbc02d' : undefined,
        width: 3
      },
      hoverinfo: 'x+y+name',
    };
  });

  // Print ETF history data for debugging
  if (marketData && marketData.etfs) {
    ['Nasdaq ETF (QQQ)', 'Semiconductor ETF (SMH)', 'ARK Innovation ETF (ARKK)', 'Robotics & AI ETF (BOTZ)'].forEach(key => {
      const hist = marketData.etfs[key]?.history;
      console.log(`ETF ${key} history:`, hist);
    });
  }

  // Chart layout
  const chartLayout = {
    height: 450,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: { title: 'Date' },
    yaxis: { title: 'Value', type: 'linear' },
    showlegend: true,
    margin: { l: 50, r: 30, t: 50, b: 50 },
    shapes: [
      {
        type: 'line',
        xref: 'paper',
        yref: 'y',
        x0: 0, x1: 1, y0: 100, y1: 100,
        line: { color: 'rgba(60,64,67,0.38)', width: 2, dash: 'dash' },
      }
    ]
  };

  return (
    <div className={styles.page}>
      <ProgressBar isLoading={loading} />
      <header className={styles.pageHeader}>
        <h1>Markets</h1>
        <p className={styles.pageDescription}>
          Real-time market data, indices, currencies, and sector performance
        </p>
      </header>

      {/* Remove test chart */}

      {/* Chart at the top */}
      <section className={styles.section}>
        <h2>Market Charts</h2>
        {/* Market Chart Toggle Buttons and Single Chart */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 18, justifyContent: 'flex-start' }}>
          {[
            { key: 'us', label: 'US Market Performance' },
            { key: 'global', label: 'Global Regions Performance' }
          ].map(btn => (
            <div
              key={btn.key}
              className="buttonCard"
              style={{ position: 'relative', cursor: 'pointer', display: 'inline-flex' }}
              onClick={() => setSelectedMarketChart(btn.key)}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedMarketChart(btn.key); }}
            >
              <UnifiedCard
                title={<span style={{ fontSize: '0.97rem', fontWeight: 500, letterSpacing: '-0.01em', color: '#fff' }}>{btn.label}</span>}
                className={"buttonCard"}
              />
            </div>
          ))}
        </div>
        <div className={styles.dashboardChartCard} style={{ position: 'relative' }}>
          <DashboardChart
            title={selectedMarketChart === 'us' ? 'US Market Performance' : 'Global Regions Performance'}
            smartBaselineLabel={true}
            showPricesOnHover={true}
            enableModeToggle={true}
            rawData={
              selectedMarketChart === 'us'
                ? rawData
                : ['S&P 500 ETF (SPY)', 'iShares MSCI Emerging Markets ETF (EEM)', 'SPDR Euro Stoxx 50 ETF (FEZ)', 'iShares MSCI Japan ETF (EWJ)'].map((key, i) => {
                    const hist = marketData.etfs && marketData.etfs[key]?.history || [];
                    const dateToClose = {};
                    hist.forEach(d => { dateToClose[d.date] = d.close; });
                    const colors = ['#1976d2', '#43a047', '#ffb74d', '#ba68c8'];
                    const names = ['SPY (US)', 'EEM (Emerging Markets)', 'FEZ (Eurozone)', 'EWJ (Japan)'];
                    return {
                      x: xSeries,
                      y: xSeries.map(date => dateToClose[date] != null ? dateToClose[date] : null),
                      name: names[i],
                      type: 'scatter',
                      mode: 'lines',
                      line: { color: colors[i], width: 3 },
                      hoverinfo: 'x+y+name',
                    };
                  })
            }
            charts={[{
              layout: {
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
                  automargin: true,
                  tickfont: { style: 'normal', size: 14 },
                  tickangle: 0,
                  range: [xSeries[0], xSeries[xSeries.length - 1]],
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
                  title: '',
                },
                showlegend: false,
                legend: undefined,
                title: undefined
              },
              config: { displayModeBar: false }
            }]}
            xSeries={xSeries}
          />
        </div>
      </section>

      {/* Thematic ETF charts section */}
      <section className={styles.section}>
        <h2>Thematic ETF charts</h2>
        <div className={styles.dashboardChartCard} style={{ position: 'relative' }}>
          {/* Card-style toggle buttons using UnifiedCard */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 18, justifyContent: 'flex-start' }}>
            {[
              { key: 'tech', label: 'Tech & Innovation' },
              { key: 'defensive', label: 'Defensive vs Speculative' },
              { key: 'global', label: 'Global Markets' },
              { key: 'biotech', label: 'Biotech & Healthcare' }
            ].map(btn => (
              <div
                key={btn.key}
                className="buttonCard"
                style={{ position: 'relative', cursor: 'pointer', display: 'inline-flex' }}
                onClick={() => setSelectedEtfChart(btn.key)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedEtfChart(btn.key); }}
              >
                <UnifiedCard
                  title={<span style={{ fontSize: '0.97rem', fontWeight: 500, letterSpacing: '-0.01em', color: '#fff' }}>{btn.label}</span>}
                  className={"buttonCard"}
                />
              </div>
            ))}
          </div>
          {/* Chart switching logic remains unchanged */}
          <DashboardChart
            title={
              selectedEtfChart === 'tech' ? 'Tech & Innovation'
              : selectedEtfChart === 'defensive' ? 'Defensive vs Speculative'
              : selectedEtfChart === 'global' ? 'Global Markets'
              : 'Biotech & Healthcare'
            }
            smartBaselineLabel={true}
            showPricesOnHover={true}
            enableModeToggle={true}
            rawData={
              selectedEtfChart === 'tech'
                ? ['Nasdaq ETF (QQQ)', 'Semiconductor ETF (SMH)', 'ARK Innovation ETF (ARKK)', 'Robotics & AI ETF (BOTZ)'].map((key, i) => {
                    const hist = marketData.etfs && marketData.etfs[key]?.history || [];
                    const dateToClose = {};
                    hist.forEach(d => { dateToClose[d.date] = d.close; });
                    const colors = ['#1976d2', '#ba68c8', '#43a047', '#ffb74d'];
                    return {
                      x: xSeries,
                      y: xSeries.map(date => dateToClose[date] != null ? dateToClose[date] : null),
                      name: key,
                      type: 'scatter',
                      mode: 'lines',
                      line: { color: colors[i], width: 3 },
                      hoverinfo: 'x+y+name',
                    };
                  })
                : selectedEtfChart === 'defensive'
                ? ['Consumer Staples ETF (XLP)', 'Health Care ETF (XLV)', 'ARK Innovation ETF (ARKK)', 'Russell 2000 ETF (IWM)'].map((key, i) => {
                    const hist = marketData.etfs && marketData.etfs[key]?.history || [];
                    const dateToClose = {};
                    hist.forEach(d => { dateToClose[d.date] = d.close; });
                    const colors = ['#1976d2', '#43a047', '#ba68c8', '#ffb74d'];
                    return {
                      x: xSeries,
                      y: xSeries.map(date => dateToClose[date] != null ? dateToClose[date] : null),
                      name: key,
                      type: 'scatter',
                      mode: 'lines',
                      line: { color: colors[i], width: 3 },
                      hoverinfo: 'x+y+name',
                    };
                  })
                : selectedEtfChart === 'global'
                ? ['S&P 500 ETF (SPY)', 'iShares MSCI Emerging Markets ETF (EEM)', 'iShares MSCI Japan ETF (EWJ)', 'iShares China Large-Cap ETF (FXI)'].map((key, i) => {
                    const hist = marketData.etfs && marketData.etfs[key]?.history || [];
                    const dateToClose = {};
                    hist.forEach(d => { dateToClose[d.date] = d.close; });
                    const colors = ['#1976d2', '#43a047', '#ba68c8', '#ffb74d'];
                    return {
                      x: xSeries,
                      y: xSeries.map(date => dateToClose[date] != null ? dateToClose[date] : null),
                      name: key,
                      type: 'scatter',
                      mode: 'lines',
                      line: { color: colors[i], width: 3 },
                      hoverinfo: 'x+y+name',
                    };
                  })
                : ['iShares Nasdaq Biotechnology ETF (IBB)', 'SPDR S&P Biotech ETF (XBI)', 'Health Care ETF (XLV)', 'Invesco Dynamic Biotechnology & Genome ETF (PBE)'].map((key, i) => {
                    const hist = marketData.etfs && marketData.etfs[key]?.history || [];
                    const dateToClose = {};
                    hist.forEach(d => { dateToClose[d.date] = d.close; });
                    const colors = ['#1976d2', '#43a047', '#ba68c8', '#ffb74d'];
                    return {
                      x: xSeries,
                      y: xSeries.map(date => dateToClose[date] != null ? dateToClose[date] : null),
                      name: key,
                      type: 'scatter',
                      mode: 'lines',
                      line: { color: colors[i], width: 3 },
                      hoverinfo: 'x+y+name',
                    };
                  })
            }
            charts={[{
              layout: {
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
                  automargin: true,
                  tickfont: { style: 'normal', size: 14 },
                  tickangle: 0,
                  range: [xSeries[0], xSeries[xSeries.length - 1]],
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
                  title: '',
                },
                showlegend: false,
                legend: undefined,
                title: undefined
              },
              config: { displayModeBar: false }
            }]}
            xSeries={xSeries}
          />
          {selectedEtfChart === 'tech' && (!marketData.etfs || !marketData.etfs['Nasdaq ETF (QQQ)'] || !marketData.etfs['Semiconductor ETF (SMH)'] || !marketData.etfs['ARK Innovation ETF (ARKK)'] || !marketData.etfs['Robotics & AI ETF (BOTZ)']) && (
            <div style={{ color: 'var(--muted-text)', textAlign: 'center', marginTop: 24 }}>
              Some ETF data is missing. Chart will update when data is available.
            </div>
          )}
          {selectedEtfChart === 'defensive' && (!marketData.etfs || !marketData.etfs['Consumer Staples ETF (XLP)'] || !marketData.etfs['Health Care ETF (XLV)'] || !marketData.etfs['ARK Innovation ETF (ARKK)'] || !marketData.etfs['Russell 2000 ETF (IWM)']) && (
            <div style={{ color: 'var(--muted-text)', textAlign: 'center', marginTop: 24 }}>
              Some ETF data is missing. Chart will update when data is available.
            </div>
          )}
         {selectedEtfChart === 'global' && (!marketData.etfs || !marketData.etfs['S&P 500 ETF (SPY)'] || !marketData.etfs['iShares MSCI Emerging Markets ETF (EEM)'] || !marketData.etfs['iShares MSCI Japan ETF (EWJ)'] || !marketData.etfs['iShares China Large-Cap ETF (FXI)']) && (
            <div style={{ color: 'var(--muted-text)', textAlign: 'center', marginTop: 24 }}>
              Some ETF data is missing. Chart will update when data is available.
            </div>
          )}
         {selectedEtfChart === 'biotech' && (!marketData.etfs || !marketData.etfs['iShares Nasdaq Biotechnology ETF (IBB)'] || !marketData.etfs['SPDR S&P Biotech ETF (XBI)'] || !marketData.etfs['Health Care ETF (XLV)'] || !marketData.etfs['Invesco Dynamic Biotechnology & Genome ETF (PBE)']) && (
            <div style={{ color: 'var(--muted-text)', textAlign: 'center', marginTop: 24 }}>
              Some ETF data is missing. Chart will update when data is available.
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2>US Indices</h2>
        <CardSlider>
          {US_INDICES.filter(name => marketData.indices[name]).map(name => getIndexCard(name, marketData.indices[name]))}
        </CardSlider>
      </section>
      <section className={styles.section}>
        <h2>European Indices</h2>
        <CardSlider>
          {EU_INDICES.filter(name => marketData.indices[name]).map(name => getIndexCard(name, marketData.indices[name]))}
        </CardSlider>
      </section>
      <section className={styles.section}>
        <h2>Asian Indices</h2>
        <CardSlider>
          {ASIA_INDICES.filter(name => marketData.indices[name]).map(name => getIndexCard(name, marketData.indices[name]))}
        </CardSlider>
      </section>
      <div style={{ textAlign: 'right', color: 'var(--muted-text)', fontSize: '0.95rem', marginTop: 32 }}>
        Last updated: {new Date(marketData.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default MarketsPage;