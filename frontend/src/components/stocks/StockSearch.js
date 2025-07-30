import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import styles from './Stocks.module.css';

/**
 * StockSearch component for searching stocks
 * Provides autocomplete functionality and displays search results
 */
const StockSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Search for stocks when query changes
  useEffect(() => {
    let isActive = true;
    let pollTimeout = null;
    let startTime = Date.now();
    let accumulatedResults = [];
    let searchId = null;

    const mergeResults = (oldResults, newResults) => {
      const seen = new Set();
      const merged = [];
      [...oldResults, ...newResults].forEach((r) => {
        const key = r.symbol + (r.exchange || '');
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(r);
        }
      });
      return merged;
    };

    const pollStatefulSearch = async () => {
      if (!searchId) return;
      try {
        const data = await apiService.pollStockSearchResults(searchId);
        if (!isActive) return;
        accumulatedResults = mergeResults(accumulatedResults, data.results || []);
        setResults(accumulatedResults);
        if ((accumulatedResults.length < 3) && !data.complete && (Date.now() - startTime < 5000)) {
          pollTimeout = setTimeout(pollStatefulSearch, 100);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (!isActive) return;
        setError('Failed to search stocks. Please try again.');
        setResults([]);
        setLoading(false);
      }
    };

    const startStatefulSearch = async () => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      accumulatedResults = [];
      try {
        const data = await apiService.startStockSearch(query, 10);
        if (!isActive) return;
        searchId = data.search_id;
        pollStatefulSearch();
      } catch (err) {
        if (!isActive) return;
        setError('Failed to search stocks. Please try again.');
        setResults([]);
        setLoading(false);
      }
    };

    startStatefulSearch();
    return () => {
      isActive = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [query]);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        resultsRef.current && 
        !resultsRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format price with appropriate color based on change
  const formatPrice = (price, change) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return <span className={styles.price}>N/A</span>;
    }
    const isPositive = typeof change === 'number' ? change >= 0 : true;
    const changeClass = isPositive ? styles.positive : styles.negative;
    const changeSymbol = isPositive ? '+' : '';
    return (
      <div className={styles.priceContainer}>
        <span className={styles.price}>${price.toLocaleString()}</span>
        <span className={`${styles.change} ${changeClass}`}>
          {changeSymbol}{typeof change === 'number' ? change.toFixed(2) : '0.00'}%
        </span>
      </div>
    );
  };

  // Only show error if the API call itself fails
  // If results are empty but no error, show 'No stocks found' message
  const showErrorOrNoResults = () => {
    if (error) {
      return <div className={styles.errorResults}>{error}</div>;
    }
    if (results.length === 0) {
      return (
        <div className={styles.noResults}>
          {query.length >= 2 ? 'No stocks found. Try a different search.' : 'Type at least 2 characters to search.'}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.stockSearch}>
      <div className={styles.searchContainer} ref={searchRef}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search stocks by name or symbol..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            aria-label="Search stocks"
          />
          {query && (
            <button 
              className={styles.clearButton}
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          <div className={styles.searchIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </div>

        {showResults && (query || results.length > 0) && (
          <div className={styles.resultsContainer} ref={resultsRef}>
            {loading ? (
              <div className={styles.loadingResults}>Searching...</div>
            ) : showErrorOrNoResults()}
            {results.length > 0 && !error && (
              <ul className={styles.resultsList}>
                {results.map((stock) => (
                  <li key={stock.symbol} className={styles.resultItem}>
                    <Link 
                      to={`/stocks/${stock.symbol}`}
                      className={styles.resultLink}
                      onClick={() => setShowResults(false)}
                    >
                      <div className={styles.stockInfo}>
                        <div className={styles.stockSymbol}>{stock.symbol || 'N/A'}</div>
                        <div className={styles.stockName}>{stock.name || 'No name available'}</div>
                        <div className={styles.stockExchange}>{stock.exchange || 'N/A'}</div>
                      </div>
                      {formatPrice(stock.price, stock.changePercent)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockSearch;