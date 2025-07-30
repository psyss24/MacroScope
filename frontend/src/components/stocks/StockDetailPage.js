import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../../services/api';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import styles from './Stocks.module.css';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * StockDetailPage component for displaying detailed information about a stock
 */
const StockDetailPage = () => {
  const { symbol } = useParams();
  const [stockData, setStockData] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [timeRange, setTimeRange] = useState('1M'); // Default to 1 month
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stock details when component mounts or symbol changes
  useEffect(() => {
    const fetchStockDetails = async () => {
      if (!symbol) return;

      setLoading(true);
      setError(null);

      try {
        const data = await apiService.getTickerDetails(symbol);
        setStockData(data);
        
        // Use real price history data if available, otherwise show no data
        if (data.priceHistory && data.priceHistory.length > 0) {
          setPriceHistory([{
            x: data.priceHistory.map(d => d.date),
            y: data.priceHistory.map(d => d.price),
            name: symbol
          }]);
        } else {
          setPriceHistory([]);
        }
      } catch (err) {
        console.error('Error fetching stock details:', err);
        setError('Failed to load stock details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStockDetails();
  }, [symbol]);

  // Update price history when time range changes
  useEffect(() => {
    if (stockData && stockData.priceHistory) {
      // Filter price history based on time range
      const filteredHistory = filterPriceHistoryByRange(stockData.priceHistory, timeRange);
      setPriceHistory([{
        x: filteredHistory.map(d => d.date),
        y: filteredHistory.map(d => d.price),
        name: symbol
      }]);
    }
  }, [timeRange, stockData, symbol]);

  // Filter price history by time range
  const filterPriceHistoryByRange = (history, range) => {
    if (!history || history.length === 0) return [];
    
    const today = new Date();
    let cutoffDate;
    
    switch (range) {
      case '1D':
        cutoffDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1W':
        cutoffDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        cutoffDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        cutoffDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        cutoffDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '5Y':
        cutoffDate = new Date(today.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return history.filter(item => new Date(item.date) >= cutoffDate);
  };

  // Format market cap
  const formatMarketCap = (marketCap) => {
    if (!marketCap || marketCap === 'N/A') return 'N/A';
    return marketCap;
  };

  // Format change with appropriate color
  const formatChange = (change, changePercent) => {
    if (change === undefined || changePercent === undefined) return null;
    
    const isPositive = change >= 0;
    const changeClass = isPositive ? styles.positive : styles.negative;
    const changeSymbol = isPositive ? '+' : '';

    return (
      <div className={`${styles.stockDetailChange} ${changeClass}`}>
        <span>{changeSymbol}${Math.abs(change).toFixed(2)}</span>
        <span>({changeSymbol}{Math.abs(changePercent).toFixed(2)}%)</span>
      </div>
    );
  };

  if (loading) return <LoadingSpinner isLoading={true} message="Loading stock details..." />;
  if (error) return <div className="error">{error}</div>;
  if (!stockData) return <div className="error">Stock not found</div>;

  return (
    <div className={styles.stockDetailPage}>
      <div className={styles.stockHeader}>
        <div className={styles.stockHeaderLeft}>
          <h1 className={styles.stockTitle}>{symbol}</h1>
          <h2 className={styles.stockCompanyName}>{stockData.name}</h2>
          <div className={styles.stockMetaInfo}>
            <div className={styles.stockMetaItem}>
              <span>Exchange:</span>
              <span>{stockData.exchange}</span>
            </div>
            <div className={styles.stockMetaItem}>
              <span>Sector:</span>
              <span>{stockData.sector || 'N/A'}</span>
            </div>
            <div className={styles.stockMetaItem}>
              <span>Industry:</span>
              <span>{stockData.industry || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className={styles.stockHeaderRight}>
          <div className={styles.stockDetailPrice}>${stockData.price.toLocaleString()}</div>
          {formatChange(stockData.change, stockData.changePercent)}
        </div>
      </div>

      <div className={styles.stockSection}>
        <h3 className={styles.stockSectionTitle}>Price History</h3>
        <div className={styles.stockTimeRanges}>
          {['1D', '1W', '1M', '3M', '1Y', '5Y'].map((range) => (
            <button
              key={range}
              className={`${styles.timeRangeButton} ${timeRange === range ? styles.active : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
        <div className={styles.stockChartContainer}>
          <TimeSeriesChart
            data={priceHistory}
            title={`${symbol} Price History (${timeRange})`}
            xAxisTitle="Date"
            yAxisTitle="Price (USD)"
            height={450}
          />
        </div>
      </div>

      <div className={styles.stockSection}>
        <h3 className={styles.stockSectionTitle}>Key Metrics</h3>
        <div className={styles.stockDetailsGrid}>
          <div className={styles.stockDetailCard}>
            <div className={styles.stockDetailCardTitle}>Market Cap</div>
            <div className={styles.stockDetailCardValue}>{formatMarketCap(stockData.marketCap)}</div>
          </div>
          <div className={styles.stockDetailCard}>
            <div className={styles.stockDetailCardTitle}>Volume</div>
            <div className={styles.stockDetailCardValue}>{stockData.volume || 'N/A'}</div>
          </div>
          <div className={styles.stockDetailCard}>
            <div className={styles.stockDetailCardTitle}>P/E Ratio</div>
            <div className={styles.stockDetailCardValue}>
              {(() => {
                const pe = Number(stockData.metrics?.pe);
                return isNaN(pe) ? 'N/A' : pe.toFixed(2);
              })()}
            </div>
          </div>
          <div className={styles.stockDetailCard}>
            <div className={styles.stockDetailCardTitle}>EPS</div>
            <div className={styles.stockDetailCardValue}>
              {(() => {
                const eps = Number(stockData.metrics?.eps);
                return isNaN(eps) ? 'N/A' : `$${eps.toFixed(2)}`;
              })()}
            </div>
          </div>
          <div className={styles.stockDetailCard}>
            <div className={styles.stockDetailCardTitle}>Dividend Yield</div>
            <div className={styles.stockDetailCardValue}>
              {(() => {
                const dy = Number(stockData.metrics?.dividendYield);
                return isNaN(dy) ? 'N/A' : `${dy.toFixed(2)}%`;
              })()}
            </div>
          </div>
          <div className={styles.stockDetailCard}>
            <div className={styles.stockDetailCardTitle}>52-Week High</div>
            <div className={styles.stockDetailCardValue}>
              {(() => {
                const high = Number(stockData.metrics?.['52WeekHigh']);
                return isNaN(high) ? 'N/A' : `$${high.toFixed(2)}`;
              })()}
            </div>
          </div>
          <div className={styles.stockDetailCard}>
            <div className={styles.stockDetailCardTitle}>52-Week Low</div>
            <div className={styles.stockDetailCardValue}>
              {(() => {
                const low = Number(stockData.metrics?.['52WeekLow']);
                return isNaN(low) ? 'N/A' : `$${low.toFixed(2)}`;
              })()}
            </div>
          </div>
          <div className={styles.stockDetailCard}>
            <div className={styles.stockDetailCardTitle}>Beta</div>
            <div className={styles.stockDetailCardValue}>
              {(() => {
                const beta = Number(stockData.metrics?.beta);
                return isNaN(beta) ? 'N/A' : beta.toFixed(2);
              })()}
            </div>
          </div>
        </div>
      </div>

      {stockData.description && (
        <div className={styles.stockSection}>
          <h3 className={styles.stockSectionTitle}>About {stockData.name}</h3>
          <div className={styles.stockDescription}>
            {stockData.description}
          </div>
          {stockData.website && (
            <a 
              href={stockData.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn"
            >
              Visit Website
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default StockDetailPage;