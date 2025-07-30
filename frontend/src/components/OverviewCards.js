import React, { useState, useEffect } from 'react';
import styles from './OverviewCards.module.css';
import apiService from '../services/api';
import { Link } from 'react-router-dom';

const STOCK_SYMBOLS = [
  { symbol: 'AAPL', label: 'Apple' },
  { symbol: 'MSFT', label: 'Microsoft' },
  { symbol: 'NVDA', label: 'NVIDIA' },
];

const OverviewCards = () => {
  const [marketData, setMarketData] = useState(null);
  const [macroData, setMacroData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [stocksData, setStocksData] = useState(null);
  const [realtimeStocks, setRealtimeStocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        // Fetch only dashboard-specific data
        const [marketData, macroData, overviewData, stocksData] = await Promise.all([
          apiService.getMarketData('indices,commodities,crypto,currencies', true, { signal }),
          apiService.getMacroData(null, true, { signal }),
          apiService.getOverviewData({ signal }),
          apiService.getStocksData({ signal })
        ]);

        setMarketData(marketData);
        setMacroData(macroData);
        setOverviewData(overviewData);
        setStocksData(stocksData);

        // Fetch real-time stock data for the main stocks
        const realtimeResults = await Promise.all(
          STOCK_SYMBOLS.map(async ({ symbol }) => {
            try {
              const details = await apiService.getTickerDetails(symbol, { signal });
              return { symbol, details };
            } catch (err) {
              // fallback to cached data if available
              return { symbol, details: stocksData?.topStocks?.[symbol] || null };
            }
          })
        );
        const realtimeMap = {};
        for (const { symbol, details } of realtimeResults) {
          if (details) realtimeMap[symbol] = details;
        }
        setRealtimeStocks(realtimeMap);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) return <div className={styles.loading}>Loading market data...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!marketData || !macroData || !overviewData) return null;

  // Helper function to safely access nested properties
  const safeAccess = (obj, path, defaultValue = 'N/A') => {
    try {
      const result = path.split('.').reduce((o, key) => o && o[key], obj);
      return result !== undefined ? result : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  // Helper function to format indicator values
  const formatIndicator = (data, indicator, unit = '%') => {
    // Check if data has the new structure (countries.United States.indicator)
    if (data?.countries?.['United States']?.[indicator]) {
      const indicatorData = data.countries['United States'][indicator];
      const value = `${safeAccess(indicatorData, 'value', 0)}${unit}`;
      const change = indicatorData.change || 0;
      const changeStr = `${change > 0 ? '+' : ''}${change}${unit}`;
      return { value, change: changeStr };
    }
    // Fallback to old structure (data.indicators[indicator])
    if (data?.indicators?.[indicator]) {
    const value = `${safeAccess(data.indicators[indicator], 'value', 0)}${unit}`;
    const change = data.indicators[indicator].change || 0;
    const changeStr = `${change > 0 ? '+' : ''}${change}${unit}`;
    return { value, change: changeStr };
    }
    return { value: `N/A`, change: `0.00${unit}` };
  };

  const cards = [
    {
      title: 'Markets',
      description: 'Real-time stock prices, ETF data, and index performance',
      color: 'markets',
      link: '/markets',
      metrics: [
        { 
          label: 'S&P 500', 
          value: safeAccess(marketData, 'indices.S&P 500.price', 0).toLocaleString(), 
          change: `${safeAccess(marketData, 'indices.S&P 500.change', 0) > 0 ? '+' : ''}${safeAccess(marketData, 'indices.S&P 500.changePercent', 0).toFixed(2)}%` 
        },
        { 
          label: 'NASDAQ', 
          value: safeAccess(marketData, 'indices.NASDAQ.price', 0).toLocaleString(), 
          change: `${safeAccess(marketData, 'indices.NASDAQ.change', 0) > 0 ? '+' : ''}${safeAccess(marketData, 'indices.NASDAQ.changePercent', 0).toFixed(2)}%` 
        },
        { 
          label: 'Dow Jones', 
          value: safeAccess(marketData, 'indices.Dow Jones.price', 0).toLocaleString(), 
          change: `${safeAccess(marketData, 'indices.Dow Jones.change', 0) > 0 ? '+' : ''}${safeAccess(marketData, 'indices.Dow Jones.changePercent', 0).toFixed(2)}%` 
        }
      ]
    },
    {
      title: 'Macro Indicators',
      description: 'Economic data, inflation rates, and employment statistics',
      color: 'macro',
      link: '/macro',
      metrics: [
        {
          label: 'US Inflation Rate (CPI, YoY)',
          ...formatIndicator(macroData, 'Inflation')
        },
        {
          label: 'US Unemployment Rate',
          ...formatIndicator(macroData, 'Unemployment')
        },
        {
          label: 'US Fed Funds Rate',
          ...formatIndicator(macroData, 'Interest Rate')
        }
      ]
    },
    {
      title: 'Commodities',
      description: 'Gold, oil, agriculture, and cryptocurrency prices',
      color: 'commodities',
      link: '/commodities',
      metrics: [
        { 
          label: 'Gold', 
          value: `$${safeAccess(marketData, 'commodities.Gold.price', 0).toLocaleString()}`, 
          change: `${safeAccess(marketData, 'commodities.Gold.change', 0) > 0 ? '+' : ''}${safeAccess(marketData, 'commodities.Gold.changePercent', 0).toFixed(2)}%` 
        },
        { 
          label: 'Oil (WTI)', 
          value: `$${safeAccess(marketData, 'commodities.Crude Oil.price', 0).toFixed(2)}`, 
          change: `${safeAccess(marketData, 'commodities.Crude Oil.change', 0) > 0 ? '+' : ''}${safeAccess(marketData, 'commodities.Crude Oil.changePercent', 0).toFixed(2)}%` 
        },
        { 
          label: 'Bitcoin', 
          value: `$${safeAccess(marketData, 'crypto.Bitcoin.price', 0).toLocaleString()}`, 
          change: `${safeAccess(marketData, 'crypto.Bitcoin.change', 0) > 0 ? '+' : ''}${safeAccess(marketData, 'crypto.Bitcoin.changePercent', 0).toFixed(2)}%` 
        }
      ]
    },
    {
      title: 'Currencies',
      description: 'Foreign exchange rates and currency pair analysis',
      color: 'currencies',
      link: '/currency',
      metrics: [
        { 
          label: 'EUR/USD', 
          value: safeAccess(marketData, 'currencies.EUR/USD.price', 0).toFixed(4), 
          change: `${safeAccess(marketData, 'currencies.EUR/USD.changePercent', 0) > 0 ? '+' : ''}${safeAccess(marketData, 'currencies.EUR/USD.changePercent', 0).toFixed(2)}%` 
        },
        { 
          label: 'GBP/USD', 
          value: safeAccess(marketData, 'currencies.GBP/USD.price', 0).toFixed(4),
          change: `${safeAccess(marketData, 'currencies.GBP/USD.changePercent', 0) > 0 ? '+' : ''}${safeAccess(marketData, 'currencies.GBP/USD.changePercent', 0).toFixed(2)}%` 
        },
        { 
          label: 'USD/JPY', 
          value: safeAccess(marketData, 'currencies.USD/JPY.price', 0).toFixed(2),
          change: `${safeAccess(marketData, 'currencies.USD/JPY.changePercent', 0) > 0 ? '+' : ''}${safeAccess(marketData, 'currencies.USD/JPY.changePercent', 0).toFixed(2)}%` 
        }
      ]
    },
    {
      title: 'Bonds & Risk',
      description: 'Treasury yields, bond market data, and risk indicators',
      color: 'bonds',
      link: '/bonds',
      metrics: [
        { 
          label: '10Y Treasury', 
          value: `${safeAccess(overviewData, 'stats.bondYield10Y', 'N/A')}%`, 
          change: '+0.05%' 
        },
        { 
          label: 'VIX', 
          value: safeAccess(overviewData, 'stats.vixLevel', 'N/A').toString(), 
          change: '+1.2%' 
        },
        { 
          label: 'DXY', 
          value: safeAccess(overviewData, 'stats.dollarIndex', 'N/A').toString(), 
          change: '+0.3%' 
        }
      ]
    },
    {
      title: 'Stocks',
      description: 'Top stocks, sector performance, and equity analysis',
      color: 'stocks',
      link: '/stocks',
      metrics: STOCK_SYMBOLS.map(({ symbol, label }) => {
        const stock = realtimeStocks[symbol] || stocksData?.topStocks?.[symbol] || {};
        let price = stock.price;
        if (typeof price === 'string') {
          const parsed = parseFloat(price);
          price = !isNaN(parsed) ? parsed : undefined;
        }
        return {
          label: `${stock.name || label} (${symbol})`,
          value: typeof price === 'number' && !isNaN(price) ? `$${price.toFixed(2)}` : 'N/A',
          change: typeof stock.changePercent === 'number'
            ? `${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`
            : '0.00%'
        };
      })
    }
  ];

  return (
    <div className={styles.overviewGrid}>
      {cards.map((card, index) => (
        <Link to={card.link || '#'} key={index} className={`${styles.card} ${styles[card.color]}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              {/* Removed card.icon */}
            </div>
            <div className={styles.cardTitle}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </div>
          
          <div className={styles.cardMetrics}>
            {card.metrics.map((metric, metricIndex) => (
              <div key={metricIndex} className={styles.metric}>
                <div className={styles.metricLabel}>
                  {metric.label}
                </div>
                <div className={styles.metricValue}>
                  <span className={styles.value}>{metric.value}</span>
                  <span className={`${styles.change} ${
                    metric.change.startsWith('+') ? styles.positive : 
                    metric.change.startsWith('-') ? styles.negative : styles.neutral
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.cardFooter}>
            <button className={styles.viewMore}>
              View Details
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default OverviewCards;
