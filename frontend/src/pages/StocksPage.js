import React, { useState, useEffect } from 'react';
import StockSearch from '../components/stocks/StockSearch';
import apiService from '../services/api';
import styles from './Pages.module.css';
import stockStyles from '../components/stocks/Stocks.module.css';
import FeaturedStockCard from '../components/stocks/FeaturedStockCard';
import ProgressBar from '../components/common/ProgressBar';

/**
 * StocksPage component for displaying stock search and popular stocks
 */
// Utility function to determine featured symbols
function getFeaturedSymbols(popularStocks) {
  // Example: every 4th stock is featured (0, 4, 8, ...)
  // Update this logic if your layout changes!
  const featured = [];
  for (let i = 0; i < popularStocks.length; i += 4) {
    if (popularStocks[i]) featured.push(popularStocks[i].symbol);
  }
  return featured;
}

const StocksPage = () => {
  const [popularStocks, setPopularStocks] = useState([]);
  const [featuredStocks, setFeaturedStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchPopularStocks = async () => {
      try {
        setLoading(true);
        const data = await apiService.getStocksData({ signal });
        const stocksArr = Object.entries(data.topStocks || {}).map(([symbol, stock]) => ({
          symbol,
          ...stock
        }));
        setPopularStocks(stocksArr);
        setError(null);

        // Use the selector function to get all featured symbols
        const featuredSymbols = getFeaturedSymbols(stocksArr);

        // Fetch details for all featured stocks
        if (featuredSymbols.length > 0) {
          const detailsArr = await Promise.all(
            featuredSymbols.map(async (symbol) => {
              try {
                const details = await apiService.getTickerDetails(symbol);
                console.log(`[DetailFetch] symbol=${symbol}`, details);
                if (!details || !Array.isArray(details.history) || details.history.length < 2) {
                  console.warn(`No valid history for featured stock: ${symbol}`, details);
                }
                return details;
              } catch (err) {
                console.error(`Error fetching details for featured stock: ${symbol}`, err);
                return { symbol }; // fallback
              }
            })
          );
          setFeaturedStocks(detailsArr);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
        console.error('Error fetching popular stocks:', err);
        setError('Failed to load popular stocks. Please try again.');
        setPopularStocks([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPopularStocks();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className={styles.page}>
      <ProgressBar isLoading={loading} />
      <header className={styles.pageHeader}>
        <h1>Stocks</h1>
        <p className={styles.pageDescription}>
          Search for stocks, view detailed information, and track performance
        </p>
      </header>

      <section className={styles.section}>
        <h2>Search Stocks</h2>
        <StockSearch />
      </section>

      <section className={styles.section}>
        <h2>Popular Stocks</h2>
        {loading ? (
          <div className="loading">Loading popular stocks...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            {/* Alternating layout: featured card, then 3 small cards, repeat */}
            {(() => {
              const groups = [];
              const n = popularStocks.length;
              let i = 0;
              while (i < n) {
                // Featured card (with details if available)
                const featured = featuredStocks.find(f => f && f.symbol?.toUpperCase() === popularStocks[i].symbol?.toUpperCase()) || popularStocks[i];
                groups.push(
                  <div key={`featured-${popularStocks[i].symbol || i}`} style={{ marginBottom: 24 }}>
                    <FeaturedStockCard stock={featured} />
                  </div>
                );
                // 3 small cards
                const smalls = popularStocks.slice(i + 1, i + 4);
                if (smalls.length > 0) {
                  groups.push(
                    <div key={`smalls-${i}`} className={styles.cardGrid} style={{ marginBottom: 32 }}>
                      {smalls.map((stock) => (
                        <div key={stock.symbol} className={stockStyles.mainPageCard}>
                          <div className={stockStyles.cardHeader}>
                            <div className={stockStyles.cardTitle}>
                  <h3>{stock.symbol}</h3>
                              <p>{stock.name}</p>
                            </div>
                            {stock.sector && (
                              <div className={stockStyles.featuredIndustryTag}>{stock.sector}</div>
                            )}
                </div>
                          <div className={stockStyles.cardMetrics}>
                            <div className={stockStyles.metric}>
                              <div className={stockStyles.metricLabel}>Price</div>
                              <div className={stockStyles.metricValue}>
                                {(() => {
                                  const percent = stock.changePercent;
                                  let valueClass = stockStyles.valueNeutral;
                                  if (typeof percent === 'number') {
                                    if (percent > 0) valueClass = stockStyles.valuePositive;
                                    else if (percent < 0) valueClass = stockStyles.valueNegative;
                                  }
                                  return (
                                    <>
                                      <span className={`${stockStyles.value} ${valueClass}`}>${typeof stock.price === 'number' ? stock.price.toFixed(2) : 'N/A'}</span>
                                      <span className={`${stockStyles.change} ${percent >= 0 ? stockStyles.positive : stockStyles.negative}`}>{percent >= 0 ? '+' : ''}{percent.toFixed(2)}%</span>
                                    </>
                                  );
                                })()}
                    </div>
                  </div>
                            <div className={stockStyles.metric}>
                              <div className={stockStyles.metricLabel}>Market Cap</div>
                              <div className={stockStyles.metricValue}>{stock.marketCap}</div>
                    </div>
                            <div className={stockStyles.metric}>
                              <div className={stockStyles.metricLabel}>Volume</div>
                              <div className={stockStyles.metricValue}>{stock.volume}</div>
                    </div>
                            <div className={stockStyles.metric}>
                              <div className={stockStyles.metricLabel}>P/E Ratio</div>
                              <div className={stockStyles.metricValue}>{stock.pe}</div>
                    </div>
                  </div>
                          <div className={stockStyles.mainPageCardFooter}>
                            <a href={`/stocks/${stock.symbol}`} className={stockStyles.mainPageViewMore}>
                    View Details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
                  );
                }
                i += 4;
              }
              return groups;
            })()}
          </>
        )}
      </section>
    </div>
  );
};

export default StocksPage;