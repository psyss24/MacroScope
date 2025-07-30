import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import styles from './Pages.module.css';
import ProgressBar from '../components/common/ProgressBar';
import UnifiedCard from '../components/common/UnifiedCard';
import CardSlider from '../components/common/CardSlider';

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
                return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
              } catch (e) {
                console.warn(`Could not parse date: ${item.x}`);
                return item.x;
              }
            });
            const yValues = arr.map(item => item.y);
            histories[symbol] = { 
              x: xValues, 
              y: yValues, 
              name 
            };
            console.log(`Processed ${symbol}: ${xValues.length} data points`);
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

  if (loading) return <div className={styles.loading}>Loading bonds and risk data...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!marketData || !sentimentData) return <div className={styles.error}>No bonds and risk data available</div>;

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
      <ProgressBar isLoading={loading || bondHistoryLoading} />
      <header className={styles.pageHeader}>
        <h1>Bonds & Risk Metrics</h1>
        <p className={styles.pageDescription}>
          Treasury yields, bond market data, and risk indicators
        </p>
        <div className={styles.timestamp}>
          Last updated: {new Date(marketData.timestamp).toLocaleString()}
        </div>
      </header>

      <section className={styles.section}>
        <h2>Risk Indicators</h2>
        <div className={styles.cardGrid}>
          {sentimentData.indicators && Object.entries(sentimentData.indicators).map(([name, data]) => (
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
        {bondHistoryLoading ? (
          <div className={styles.loading}>Loading bond time series...</div>
        ) : chartBonds.length === 0 ? (
          <div className={styles.error}>
            No bond time series data available.
            <br />
            <small>Debug info: bondHistories keys: {Object.keys(bondHistories).join(', ')}</small>
            <br />
            <small>Debug info: chartBonds length: {chartBonds.length}</small>
          </div>
        ) : (
        <TimeSeriesChart 
            data={chartBonds}
            title="Treasury Yields - Historical"
          xAxisTitle="Date"
          yAxisTitle="Yield (%)"
          height={450}
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