import React, { useEffect, useMemo, useState } from 'react';
import { MobilePageShell, MobileSection } from '../../components/mobile';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import styles from './HomeMobilePage.module.css';

const STOCK_SYMBOLS = [
  { symbol: 'AAPL', label: 'Apple' },
  { symbol: 'MSFT', label: 'Microsoft' },
  { symbol: 'NVDA', label: 'NVIDIA' },
];

const formatChangePercent = (changePercent) => {
  if (changePercent != null && typeof changePercent === 'number' && !Number.isNaN(changePercent)) {
    return `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
  }
  return '0.00%';
};

export default function HomeMobilePage() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboard = async () => {
      try {
        const data = await apiService.getDashboardData({ signal: controller.signal });
        setDashboardData(data);
        setLastUpdate(new Date());
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch mobile dashboard data', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();

    const interval = setInterval(fetchDashboard, 120000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const cards = useMemo(() => {
    if (!dashboardData) return [];

    return [
      {
        title: 'Markets',
        description: 'Indices snapshot',
        link: '/markets',
        tone: 'markets',
        metrics: [
          {
            label: 'S&P 500',
            value: dashboardData?.markets?.['S&P 500']?.price?.toLocaleString() || 'N/A',
            change: formatChangePercent(dashboardData?.markets?.['S&P 500']?.changePercent),
          },
          {
            label: 'NASDAQ',
            value: dashboardData?.markets?.NASDAQ?.price?.toLocaleString() || 'N/A',
            change: formatChangePercent(dashboardData?.markets?.NASDAQ?.changePercent),
          },
          {
            label: 'Dow Jones',
            value: dashboardData?.markets?.['Dow Jones']?.price?.toLocaleString() || 'N/A',
            change: formatChangePercent(dashboardData?.markets?.['Dow Jones']?.changePercent),
          },
        ],
      },
      {
        title: 'Macro Indicators',
        description: 'US economy baseline',
        link: '/macro',
        tone: 'macro',
        metrics: [
          {
            label: 'US Inflation Rate (CPI, YoY)',
            value: dashboardData?.macro?.inflation?.value != null
              ? `${dashboardData.macro.inflation.value.toFixed(2)}%`
              : 'N/A',
            change: dashboardData?.macro?.inflation?.value != null
              ? `${dashboardData.macro.inflation.value > 0 ? '+' : ''}${dashboardData.macro.inflation.value.toFixed(2)}%`
              : '0.00%',
          },
          {
            label: 'US Unemployment Rate',
            value: dashboardData?.macro?.unemployment?.value != null
              ? `${dashboardData.macro.unemployment.value.toFixed(2)}%`
              : 'N/A',
            change: dashboardData?.macro?.unemployment?.value != null
              ? `${dashboardData.macro.unemployment.value > 0 ? '+' : ''}${dashboardData.macro.unemployment.value.toFixed(2)}%`
              : '0.00%',
          },
          {
            label: 'US Fed Funds Rate',
            value: dashboardData?.macro?.interest_rate?.value != null
              ? `${dashboardData.macro.interest_rate.value.toFixed(2)}%`
              : 'N/A',
            change: dashboardData?.macro?.interest_rate?.value != null
              ? `${dashboardData.macro.interest_rate.value > 0 ? '+' : ''}${dashboardData.macro.interest_rate.value.toFixed(2)}%`
              : '0.00%',
          },
        ],
      },
      {
        title: 'Commodities',
        description: 'Energy, metals, crypto',
        link: '/commodities',
        tone: 'commodities',
        metrics: [
          {
            label: 'Gold',
            value: dashboardData?.commodities?.Gold?.price != null
              ? `$${dashboardData.commodities.Gold.price.toLocaleString()}`
              : 'N/A',
            change: formatChangePercent(dashboardData?.commodities?.Gold?.changePercent),
          },
          {
            label: 'Oil (WTI)',
            value: dashboardData?.commodities?.['Crude Oil']?.price != null
              ? `$${dashboardData.commodities['Crude Oil'].price.toFixed(2)}`
              : 'N/A',
            change: formatChangePercent(dashboardData?.commodities?.['Crude Oil']?.changePercent),
          },
          {
            label: 'Bitcoin',
            value: dashboardData?.commodities?.Bitcoin?.price != null
              ? `$${dashboardData.commodities.Bitcoin.price.toLocaleString()}`
              : 'N/A',
            change: formatChangePercent(dashboardData?.commodities?.Bitcoin?.changePercent),
          },
        ],
      },
      {
        title: 'Bonds & Risk',
        description: 'Rates and volatility',
        link: '/bonds',
        tone: 'bonds',
        metrics: [
          {
            label: '10Y Treasury',
            value: dashboardData?.bonds?.US10Y?.yield != null
              ? `${dashboardData.bonds.US10Y.yield}%`
              : 'N/A',
            change: formatChangePercent(dashboardData?.bonds?.US10Y?.changePercent),
          },
          {
            label: 'VIX',
            value: dashboardData?.bonds?.VIX?.value != null
              ? dashboardData.bonds.VIX.value.toString()
              : 'N/A',
            change: formatChangePercent(dashboardData?.bonds?.VIX?.changePercent),
          },
          {
            label: 'DXY',
            value: dashboardData?.bonds?.DXY?.value != null
              ? dashboardData.bonds.DXY.value.toString()
              : 'N/A',
            change: formatChangePercent(dashboardData?.bonds?.DXY?.changePercent),
          },
        ],
      },
      {
        title: 'Stocks',
        description: 'Large-cap leaders',
        link: '/stocks',
        tone: 'stocks',
        metrics: STOCK_SYMBOLS.map(({ symbol, label }) => {
          const stock = dashboardData?.stocks?.[symbol];
          let price = stock?.price;
          if (typeof price === 'string') {
            const parsed = parseFloat(price);
            price = !Number.isNaN(parsed) ? parsed : undefined;
          }

          return {
            label: `${stock?.name || label} (${symbol})`,
            value: typeof price === 'number' && !Number.isNaN(price) ? `$${price.toFixed(2)}` : 'N/A',
            change: formatChangePercent(stock?.changePercent),
          };
        }),
      },
    ];
  }, [dashboardData]);

  return (
    <MobilePageShell
      title="MacroScope"
      subtitle="Live cross-market dashboard"
    >
      <MobileSection title="Overview" description="Same key metrics, redesigned for one-hand scanning">
        <div className={styles.cardsStack}>
          {loading && !cards.length ? (
            <div className={styles.stateCard}>Loading live dashboard...</div>
          ) : null}

          {!loading && !cards.length ? (
            <div className={styles.stateCard}>Unable to load dashboard data right now.</div>
          ) : null}

          {cards.map((card) => (
            <Link key={card.title} to={card.link} className={`${styles.compactCard} ${styles[card.tone]}`}>
              <div className={styles.compactCardHeader}>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
                <span className={styles.openPill}>Open</span>
              </div>

              <div className={styles.metricsList}>
                {card.metrics.map((metric) => {
                  const toneClass = metric.change.startsWith('+')
                    ? styles.positive
                    : metric.change.startsWith('-')
                      ? styles.negative
                      : styles.neutral;

                  return (
                    <div key={`${card.title}-${metric.label}`} className={styles.metricRow}>
                      <p className={styles.metricLabel}>{metric.label}</p>
                      <div className={styles.metricValues}>
                        <span className={styles.metricValue}>{metric.value}</span>
                        <span className={`${styles.metricDelta} ${toneClass}`}>{metric.change}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Link>
          ))}
        </div>
      </MobileSection>

      <p className={styles.timestamp}>
        Last updated: {lastUpdate.toLocaleTimeString()}
      </p>
    </MobilePageShell>
  );
}
