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
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        // Use only the optimized dashboard endpoint
        const data = await apiService.getDashboardData({ signal });
        setDashboardData(data);

        // Set loading to false immediately since we have all the data we need
        setLoading(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
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
  if (!dashboardData) return <div className={styles.error}>No dashboard data available</div>;

  // Helper function to safely format change percentages
  const formatChangePercent = (changePercent) => {
    if (changePercent != null && typeof changePercent === 'number' && !isNaN(changePercent)) {
      return `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
    }
    return '0.00%';
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
          value: dashboardData?.markets?.['S&P 500']?.price?.toLocaleString() || 'N/A', 
          change: formatChangePercent(dashboardData?.markets?.['S&P 500']?.changePercent) || '0.00%' 
        },
        { 
          label: 'NASDAQ', 
          value: dashboardData?.markets?.NASDAQ?.price?.toLocaleString() || 'N/A', 
          change: formatChangePercent(dashboardData?.markets?.NASDAQ?.changePercent) || '0.00%' 
        },
        { 
          label: 'Dow Jones', 
          value: dashboardData?.markets?.['Dow Jones']?.price?.toLocaleString() || 'N/A', 
          change: formatChangePercent(dashboardData?.markets?.['Dow Jones']?.changePercent) || '0.00%' 
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
          value: dashboardData?.macro?.inflation?.value != null 
            ? `${dashboardData.macro.inflation.value.toFixed(2)}%`
            : 'N/A',
          change: dashboardData?.macro?.inflation?.value != null 
            ? `${dashboardData.macro.inflation.value > 0 ? '+' : ''}${dashboardData.macro.inflation.value.toFixed(2)}%`
            : '0.00%'
        },
        {
          label: 'US Unemployment Rate',
          value: dashboardData?.macro?.unemployment?.value != null 
            ? `${dashboardData.macro.unemployment.value.toFixed(2)}%`
            : 'N/A',
          change: dashboardData?.macro?.unemployment?.value != null 
            ? `${dashboardData.macro.unemployment.value > 0 ? '+' : ''}${dashboardData.macro.unemployment.value.toFixed(2)}%`
            : '0.00%'
        },
        {
          label: 'US Fed Funds Rate',
          value: dashboardData?.macro?.interest_rate?.value != null 
            ? `${dashboardData.macro.interest_rate.value.toFixed(2)}%`
            : 'N/A',
          change: dashboardData?.macro?.interest_rate?.value != null 
            ? `${dashboardData.macro.interest_rate.value > 0 ? '+' : ''}${dashboardData.macro.interest_rate.value.toFixed(2)}%`
            : '0.00%'
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
          value: dashboardData?.commodities?.Gold?.price != null 
            ? `$${dashboardData.commodities.Gold.price.toLocaleString()}`
            : 'N/A', 
          change: formatChangePercent(dashboardData?.commodities?.Gold?.changePercent) || '0.00%' 
        },
        { 
          label: 'Oil (WTI)', 
          value: dashboardData?.commodities?.['Crude Oil']?.price != null 
            ? `$${dashboardData.commodities['Crude Oil'].price.toFixed(2)}`
            : 'N/A', 
          change: formatChangePercent(dashboardData?.commodities?.['Crude Oil']?.changePercent) || '0.00%' 
        },
        { 
          label: 'Bitcoin', 
          value: dashboardData?.commodities?.Bitcoin?.price != null 
            ? `$${dashboardData.commodities.Bitcoin.price.toLocaleString()}`
            : 'N/A', 
          change: formatChangePercent(dashboardData?.commodities?.Bitcoin?.changePercent) || '0.00%' 
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
          value: dashboardData?.currencies?.['EUR/USD']?.price != null 
            ? dashboardData.currencies['EUR/USD'].price.toFixed(4)
            : 'N/A', 
          change: formatChangePercent(dashboardData?.currencies?.['EUR/USD']?.changePercent) || '0.00%' 
        },
        { 
          label: 'GBP/USD', 
          value: dashboardData?.currencies?.['GBP/USD']?.price != null 
            ? dashboardData.currencies['GBP/USD'].price.toFixed(4)
            : 'N/A',
          change: formatChangePercent(dashboardData?.currencies?.['GBP/USD']?.changePercent) || '0.00%' 
        },
        { 
          label: 'USD/JPY', 
          value: dashboardData?.currencies?.['USD/JPY']?.price != null 
            ? dashboardData.currencies['USD/JPY'].price.toFixed(2)
            : 'N/A',
          change: formatChangePercent(dashboardData?.currencies?.['USD/JPY']?.changePercent) || '0.00%' 
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
          value: dashboardData?.bonds?.US10Y?.yield != null 
            ? `${dashboardData.bonds.US10Y.yield}%`
            : 'N/A', 
          change: formatChangePercent(dashboardData?.bonds?.US10Y?.changePercent) || '0.00%' 
        },
        { 
          label: 'VIX', 
          value: dashboardData?.bonds?.VIX?.value != null 
            ? dashboardData.bonds.VIX.value.toString()
            : 'N/A', 
          change: formatChangePercent(dashboardData?.bonds?.VIX?.changePercent) || '0.00%' 
        },
        { 
          label: 'DXY', 
          value: dashboardData?.bonds?.DXY?.value != null 
            ? dashboardData.bonds.DXY.value.toString()
            : 'N/A', 
          change: formatChangePercent(dashboardData?.bonds?.DXY?.changePercent) || '0.00%' 
        }
      ]
    },
    {
      title: 'Stocks',
      description: 'Top stocks, sector performance, and equity analysis',
      color: 'stocks',
      link: '/stocks',
      metrics: STOCK_SYMBOLS.map(({ symbol, label }) => {
        const dashboardStock = dashboardData?.stocks?.[symbol];
        let price = dashboardStock?.price;
        if (typeof price === 'string') {
          const parsed = parseFloat(price);
          price = !isNaN(parsed) ? parsed : undefined;
        }
        const changePercent = dashboardStock?.changePercent;
        return {
          label: `${dashboardStock?.name || label} (${symbol})`,
          value: typeof price === 'number' && !isNaN(price) ? `$${price.toFixed(2)}` : 'N/A',
          change: formatChangePercent(changePercent) || '0.00%'
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
