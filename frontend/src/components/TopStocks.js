import React, { useState, useEffect } from 'react';
import styles from './TopStocks.module.css';
import apiService from '../services/api';
import LoadingSpinner from './common/LoadingSpinner';

// Hardcoded list of popular stocks to display
const POPULAR_STOCKS = [
  'AAPL',  // Apple Inc.
  'MSFT',  // Microsoft Corp.
  'GOOGL', // Alphabet Inc.
  'AMZN',  // Amazon.com Inc.
  'TSLA',  // Tesla Inc.
  'META',  // Meta Platforms Inc.
  'NVDA',  // NVIDIA Corp.
  'NFLX'   // Netflix Inc.
];

const TopStocks = () => {
  const [stocksData, setStocksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchStocksData = async () => {
      try {
        // Fetch stocks data from the backend API
        const data = await apiService.getStocksData(POPULAR_STOCKS, { signal });
        setStocksData(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
        setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStocksData();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) return <LoadingSpinner isLoading={true} message="Loading stocks data..." />;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!stocksData) return null;

  const stocks = Object.entries(stocksData.topStocks).map(([symbol, data]) => ({
    symbol,
    ...data
  }));

  const sortedStocks = [...stocks].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle numeric values with suffixes (T, B, M)
    if (typeof aValue === 'string' && aValue.includes('$')) {
      aValue = parseFloat(aValue.replace(/[$,]/g, ''));
      bValue = parseFloat(bValue.replace(/[$,]/g, ''));
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatChange = (change, changePercent) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  const getChangeClass = (change) => {
    if (change > 0) return styles.positive;
    if (change < 0) return styles.negative;
    return styles.neutral;
  };

  return (
    <div className={styles.topStocks}>
      <div className={styles.header}>
        <h2 className={styles.title}>Top Stocks</h2>
        <div className={styles.controls}>
          <select 
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
          >
            <option value="marketCap">Market Cap</option>
            <option value="price">Price</option>
            <option value="changePercent">Change %</option>
            <option value="volume">Volume</option>
            <option value="pe">P/E Ratio</option>
          </select>
        </div>
      </div>

      <div className={styles.stocksGrid}>
        {sortedStocks.map((stock) => (
          <div key={stock.symbol} className={styles.stockCard}>
            <div className={styles.stockHeader}>
              <div className={styles.stockSymbol}>{stock.symbol}</div>
              <div className={styles.stockSector}>{stock.sector}</div>
            </div>
            
            <div className={styles.stockName}>{stock.name}</div>
            
            <div className={styles.stockPrice}>
              <span className={styles.price}>${stock.price.toFixed(2)}</span>
              <span className={`${styles.change} ${getChangeClass(stock.change)}`}>
                {formatChange(stock.change, stock.changePercent)}
              </span>
            </div>
            
            <div className={styles.stockMetrics}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Market Cap:</span>
                <span className={styles.metricValue}>{stock.marketCap}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Volume:</span>
                <span className={styles.metricValue}>{stock.volume}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>P/E Ratio:</span>
                <span className={styles.metricValue}>{stock.pe}</span>
              </div>
            </div>
            
            <div className={styles.stockFooter}>
              <button className={styles.viewDetails}>View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopStocks;
