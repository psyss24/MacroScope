import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import styles from './Pages.module.css';
import LoadingSpinner from '../components/common/LoadingSpinner';
import UnifiedCard from '../components/common/UnifiedCard';
import CardSlider from '../components/common/CardSlider';
import DashboardChart from '../components/charts/DashboardChart';

const BOND_SYMBOLS = [
  { symbol: 'US2Y', name: 'US 2Y Treasury' },
  { symbol: 'US5Y', name: 'US 5Y Treasury' },
  { symbol: 'US10Y', name: 'US 10Y Treasury' },
  { symbol: 'DE2Y', name: 'Germany 2Y Bund' },
  { symbol: 'DE5Y', name: 'Germany 5Y Bund' },
  { symbol: 'DE10Y', name: 'Germany 10Y Bund' },
  { symbol: 'GB2Y', name: 'UK 2Y Gilt' },
  { symbol: 'GB5Y', name: 'UK 5Y Gilt' },
  { symbol: 'GB10Y', name: 'UK 10Y Gilt' },
  { symbol: 'FR2Y', name: 'France 2Y OAT' },
  { symbol: 'FR5Y', name: 'France 5Y OAT' },
  { symbol: 'FR10Y', name: 'France 10Y OAT' },
];

// Define bond regions for button cards
const BOND_REGIONS = [
  { key: 'us', label: 'United States', symbols: ['US2Y', 'US5Y', 'US10Y'] },
  { key: 'germany', label: 'Germany', symbols: ['DE2Y', 'DE5Y', 'DE10Y'] },
  { key: 'uk', label: 'United Kingdom', symbols: ['GB2Y', 'GB5Y', 'GB10Y'] },
  { key: 'france', label: 'France', symbols: ['FR2Y', 'FR5Y', 'FR10Y'] },
];

const getPriceClass = (changePercent) => {
  if (typeof changePercent !== 'number') return 'valueNeutral';
  if (changePercent > 0) return 'valuePositive';
  if (changePercent < 0) return 'valueNegative';
  return 'valueNeutral';
};

const getSentimentColorClass = (sentiment) => {
  if (!sentiment) return '';
  switch (sentiment.toLowerCase()) {
    case 'extreme greed': return 'valueExtremeGreed';
    case 'greed': return 'valueGreed';
    case 'neutral': return 'valueNeutralSentiment';
    case 'fear': return 'valueFear';
    case 'extreme fear': return 'valueExtremeFear';
    default: return '';
  }
};

const BondsRiskPage = () => {
  const [marketData, setMarketData] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bondHistories, setBondHistories] = useState({});
  const [bondHistoryLoading, setBondHistoryLoading] = useState(true);
  const [selectedBondRegion, setSelectedBondRegion] = useState('us'); // Default to US

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [marketResponse, sentimentResponse] = await Promise.all([
          apiService.getMarketData('bonds', false, { signal }),
          apiService.getSentimentData({ signal })
        ]);
        setMarketData(marketResponse);
        setSentimentData(sentimentResponse);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
        console.error('Error fetching bonds and risk data:', err);
        setError('Failed to load bonds and risk data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => { controller.abort(); };
  }, []);

  // Fetch bond histories for US, Germany, UK (2Y, 5Y, 10Y)
  useEffect(() => {
    let isMounted = true;
    setBondHistoryLoading(true);
    const fetchBondHistories = async () => {
      try {
        console.log('Starting to fetch bond histories for symbols:', BOND_SYMBOLS.map(s => s.symbol));
        const results = await Promise.all(
          BOND_SYMBOLS.map(({ symbol }) =>
            fetch(`/api/bond_history/${symbol}`).then(res => {
              console.log(`Fetch result for ${symbol}:`, res.status, res.ok);
              return res.ok ? res.json() : Promise.reject(symbol);
            }).catch((err) => {
              console.error(`Fetch error for ${symbol}:`, err);
              return null;
            })
          )
        );
        console.log('All fetch results:', results.map((r, i) => ({ symbol: BOND_SYMBOLS[i].symbol, hasData: !!r, length: r?.length })));
        
        if (!isMounted) return;
        const histories = {};
        BOND_SYMBOLS.forEach(({ symbol, name }, i) => {
          const arr = results[i];
          if (Array.isArray(arr) && arr.length > 0) {
            // Transform array of {x, y} objects into {x: [...], y: [...], name: ...} format
            const xValues = arr.map(item => {
              // Convert date format from "Sep 30, 2024" to ISO format
              try {
                const date = new Date(item.x);
                // Check if date is valid
                if (isNaN(date.getTime())) {
                  console.warn(`Invalid date for ${symbol}: ${item.x}`);
                  return null;
                }
                return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
              } catch (e) {
                console.warn(`Could not parse date for ${symbol}: ${item.x}`, e);
                return null;
              }
            }).filter(date => date !== null); // Remove invalid dates
            
            const yValues = arr.map((item, index) => {
              // Only include yield if we have a valid date
              return xValues[index] !== null ? item.y : null;
            }).filter(yieldValue => yieldValue !== null); // Remove yields for invalid dates
            
            // Ensure x and y arrays have same length
            const minLength = Math.min(xValues.length, yValues.length);
            histories[symbol] = { 
              x: xValues.slice(0, minLength), 
              y: yValues.slice(0, minLength), 
              name 
            };
            console.log(`Processed ${symbol}: ${minLength} data points`);
          } else {
            console.log(`No data for ${symbol}`);
          }
        });
        setBondHistories(histories);
        setBondHistoryLoading(false);
        // Add console log after setting bondHistories
        console.log('Fetched bondHistories:', histories);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error in fetchBondHistories:', err);
        setBondHistoryLoading(false);
      }
    };
    fetchBondHistories();
    return () => { isMounted = false; };
  }, []);

  if (loading || bondHistoryLoading) return <LoadingSpinner isLoading={true} message={loading ? "Loading bonds and risk data..." : "Loading bond time series..."} />;

  // Get selected region data
  const selectedRegion = BOND_REGIONS.find(r => r.key === selectedBondRegion);
  const selectedBondData = selectedRegion ? selectedRegion.symbols.map(symbol => bondHistories[symbol]).filter(Boolean) : [];

  // Generate 6 months of dates for chart alignment
  const today = new Date();
  const start = new Date(today);
  start.setMonth(today.getMonth() - 6);
  const xSeries = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    xSeries.push(d.toISOString().split('T')[0]);
  }

  // Build chart data for selected region
  const buildChartData = (regionSymbols) => {
    return regionSymbols.map((symbol, i) => {
      const bondData = bondHistories[symbol];
      if (!bondData || !bondData.x || !bondData.y) return null;
      
      // Debug logging for UK 5Y specifically
      if (symbol === 'GB5Y') {
        console.log('UK 5Y Debug:', {
          totalDataPoints: bondData.x.length,
          dateRange: bondData.x.length > 0 ? `${bondData.x[0]} to ${bondData.x[bondData.x.length - 1]}` : 'none',
          sampleYields: bondData.y.slice(0, 5),
          latestYield: bondData.y[0],
          latestDate: bondData.x[0]
        });
      }
      
      // Map date to yield for fast lookup
      const dateToYield = {};
      bondData.x.forEach((date, index) => {
        dateToYield[date] = bondData.y[index];
      });
      
      const colors = ['#1976d2', '#43a047', '#ba68c8'];
      const names = ['2Y', '5Y', '10Y'];
      
      // Build y-values with proper gap handling
      const yValues = xSeries.map(date => {
        const yieldValue = dateToYield[date];
        // Return null for missing data points to create gaps in the line
        return yieldValue != null ? yieldValue : null;
      });
      
      // Check if we have enough data points to show the line
      const validDataPoints = yValues.filter(y => y != null).length;
      if (validDataPoints < 2) {
        console.warn(`Insufficient data for ${symbol}: only ${validDataPoints} valid points`);
        return null;
      }
      
      // Debug logging for UK 5Y chart data
      if (symbol === 'GB5Y') {
        console.log('UK 5Y Chart Data:', {
          xSeriesLength: xSeries.length,
          yValuesLength: yValues.length,
          validDataPoints,
          firstValidIndex: yValues.findIndex(y => y != null),
          lastValidIndex: yValues.lastIndexOf(yValues.find(y => y != null)),
          sampleYValues: yValues.filter(y => y != null).slice(0, 5)
        });
      }
      
      return {
        x: xSeries,
        y: yValues,
        name: `${selectedRegion.label} ${names[i]}`,
        type: 'scatter',
        mode: 'lines',
        line: { color: colors[i], width: 3 },
        hoverinfo: 'x+y+name',
        connectgaps: false, // Don't connect gaps to show data breaks clearly
      };
    }).filter(Boolean);
  };

  // Filter for only US, Germany, UK bonds
  const twoYearBonds = BOND_SYMBOLS.filter(b => b.symbol.endsWith('2Y')).map(b => bondHistories[b.symbol]).filter(Boolean);
  const fiveYearBonds = BOND_SYMBOLS.filter(b => b.symbol.endsWith('5Y')).map(b => bondHistories[b.symbol]).filter(Boolean);
  const tenYearBonds = BOND_SYMBOLS.filter(b => b.symbol.endsWith('10Y')).map(b => bondHistories[b.symbol]).filter(Boolean);
  
  // Only show bonds with at least 2 data points in the chart
  const chartBonds = Object.values(bondHistories).filter(b => 
    b && 
    Array.isArray(b.x) && 
    Array.isArray(b.y) && 
    b.x.length > 1 && 
    b.y.length > 1
  );

  // Add console logs before rendering the chart
  console.log('bondHistories before chart:', bondHistories);
  console.log('chartBonds to be passed to TimeSeriesChart:', chartBonds);
  console.log('Number of bondHistories:', Object.keys(bondHistories).length);
  console.log('Number of chartBonds after filtering:', chartBonds.length);
  
  // Debug each bond to see why it's being filtered out
  Object.entries(bondHistories).forEach(([symbol, bond]) => {
    console.log(`[BOND DEBUG] ${symbol}:`, {
      hasBond: !!bond,
      hasX: !!bond?.x,
      hasY: !!bond?.y,
      xIsArray: Array.isArray(bond?.x),
      yIsArray: Array.isArray(bond?.y),
      xLength: bond?.x?.length,
      yLength: bond?.y?.length,
      name: bond?.name
    });
  });
  
  chartBonds.forEach(bond => {
    if (bond && bond.x && bond.y) {
      console.log(`[BOND DEBUG] ${bond.name} first 5 x:`, bond.x.slice(0, 5));
      console.log(`[BOND DEBUG] ${bond.name} first 5 y:`, bond.y.slice(0, 5));
      console.log(`[BOND DEBUG] ${bond.name} x.length:`, bond.x.length, 'y.length:', bond.y.length);
    }
  });

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Bonds & Risk Metrics</h1>
        <p className={styles.pageDescription}>
          Treasury yields, bond market data, and risk indicators
        </p>
        <div className={styles.timestamp}>
          Last updated: {marketData?.timestamp ? new Date(marketData.timestamp).toLocaleString() : 'Loading...'}
        </div>
      </header>

      <section className={styles.section}>
        <h2>Risk Indicators</h2>
        <div className={styles.cardGrid}>
          {sentimentData?.indicators && Object.entries(sentimentData.indicators).map(([name, data]) => (
            <UnifiedCard
              key={name}
              title={name}
              metrics={[
                { label: 'Value', value: data.value != null ? data.value.toFixed(2) : 'N/A', valueClass: getPriceClass(data.changePercent) },
                { label: 'Change', value: data.changePercent != null ? `${data.changePercent >= 0 ? '+' : ''}${data.changePercent?.toFixed(2)}%` : 'N/A', valueClass: getPriceClass(data.changePercent) },
                { label: 'Sentiment', value: data.sentiment ? data.sentiment.toUpperCase() : 'N/A', valueClass: getSentimentColorClass(data.sentiment) }
              ]}
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Treasury Yield Trends</h2>
        {/* Region button cards */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 18, justifyContent: 'flex-start' }}>
          {BOND_REGIONS.map(region => (
            <div
              key={region.key}
              className="buttonCard"
              style={{ position: 'relative', cursor: 'pointer', display: 'inline-flex' }}
              onClick={() => setSelectedBondRegion(region.key)}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedBondRegion(region.key); }}
            >
              <UnifiedCard
                title={<span style={{ fontSize: '0.97rem', fontWeight: 500, letterSpacing: '-0.01em', color: '#fff' }}>{region.label}</span>}
                className={"buttonCard"}
              />
            </div>
          ))}
        </div>
        
        {/* Chart with region switching */}
        {bondHistoryLoading ? (
          <div className={styles.loading}>Loading bond time series...</div>
        ) : selectedBondData.length === 0 ? (
          <div className={styles.error}>
            No bond time series data available for {selectedRegion?.label}.
            <br />
            <small>Debug info: selectedBondData length: {selectedBondData.length}</small>
          </div>
        ) : (
          <DashboardChart
            title={`${selectedRegion?.label} Treasury Yields`}
            smartBaselineLabel={true}
            showPricesOnHover={true}
            enableModeToggle={true}
            rawData={buildChartData(selectedRegion.symbols)}
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
        )}
      </section>

      <section className={styles.section}>
        <h2>Government Bond Yields</h2>
        <h3 style={{ color: 'var(--muted-text)', marginBottom: 8 }}>2-Year Government Bonds</h3>
        <CardSlider>
          {twoYearBonds.length === 0 ? (
            <div style={{ color: 'var(--muted-text)', gridColumn: '1/-1', textAlign: 'center' }}>No 2-year bond data available.</div>
          ) : (
            twoYearBonds.map(bond => {
              let change = null;
              if (bond.y && bond.y.length > 1) {
                const prev = bond.y[1];
                const curr = bond.y[0];
                if (typeof prev === 'number' && typeof curr === 'number' && prev !== 0) {
                  change = ((curr - prev) / prev) * 100;
                }
              }
              return (
                <UnifiedCard
                  key={bond.name}
                  title={bond.name}
                  tag={bond.name}
                  metrics={[
                    { label: 'Latest Yield', value: bond.y && bond.y.length > 0 ? `${bond.y[0].toFixed(2)}%` : 'N/A', valueClass: 'valueNeutral' },
                    { label: 'Change (1d)', value: change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : 'N/A', valueClass: getPriceClass(change) },
                    { label: 'Date', value: bond.x && bond.x.length > 0 ? bond.x[0] : 'N/A', valueClass: 'valueNeutral' }
                  ]}
        />
              );
            })
          )}
        </CardSlider>
        <h3 style={{ color: 'var(--muted-text)', margin: '24px 0 8px 0' }}>5-Year Government Bonds</h3>
        <CardSlider>
          {fiveYearBonds.length === 0 ? (
            <div style={{ color: 'var(--muted-text)', gridColumn: '1/-1', textAlign: 'center' }}>No 5-year bond data available.</div>
          ) : (
            fiveYearBonds.map(bond => {
              let change = null;
              if (bond.y && bond.y.length > 1) {
                const prev = bond.y[1];
                const curr = bond.y[0];
                if (typeof prev === 'number' && typeof curr === 'number' && prev !== 0) {
                  change = ((curr - prev) / prev) * 100;
                }
              }
              return (
                <UnifiedCard
                  key={bond.name}
                  title={bond.name}
                  tag={bond.name}
                  metrics={[
                    { label: 'Latest Yield', value: bond.y && bond.y.length > 0 ? `${bond.y[0].toFixed(2)}%` : 'N/A', valueClass: 'valueNeutral' },
                    { label: 'Change (1d)', value: change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : 'N/A', valueClass: getPriceClass(change) },
                    { label: 'Date', value: bond.x && bond.x.length > 0 ? bond.x[0] : 'N/A', valueClass: 'valueNeutral' }
                  ]}
        />
              );
            })
          )}
        </CardSlider>
        <h3 style={{ color: 'var(--muted-text)', margin: '24px 0 8px 0' }}>10-Year Government Bonds</h3>
        <CardSlider>
          {tenYearBonds.length === 0 ? (
            <div style={{ color: 'var(--muted-text)', gridColumn: '1/-1', textAlign: 'center' }}>No 10-year bond data available.</div>
          ) : (
            tenYearBonds.map(bond => {
              let change = null;
              if (bond.y && bond.y.length > 1) {
                const prev = bond.y[1];
                const curr = bond.y[0];
                if (typeof prev === 'number' && typeof curr === 'number' && prev !== 0) {
                  change = ((curr - prev) / prev) * 100;
                }
              }
          return (
                <UnifiedCard
                  key={bond.name}
                  title={bond.name}
                  tag={bond.name}
                  metrics={[
                    { label: 'Latest Yield', value: bond.y && bond.y.length > 0 ? `${bond.y[0].toFixed(2)}%` : 'N/A', valueClass: 'valueNeutral' },
                    { label: 'Change (1d)', value: change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : 'N/A', valueClass: getPriceClass(change) },
                    { label: 'Date', value: bond.x && bond.x.length > 0 ? bond.x[0] : 'N/A', valueClass: 'valueNeutral' }
                  ]}
            />
          );
            })
          )}
        </CardSlider>
      </section>
      <div style={{ textAlign: 'right', color: 'var(--muted-text)', fontSize: '0.95rem', marginTop: 32 }}>
        Last updated: {new Date((marketData?.timestamp || sentimentData?.timestamp || Date.now())).toLocaleString()}
      </div>
    </div>
  );
};

export default BondsRiskPage;