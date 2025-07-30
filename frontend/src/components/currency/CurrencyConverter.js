import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import styles from './Currency.module.css';

/**
 * CurrencyConverter component for converting between currencies
 * using real-time exchange rates
 */
const CurrencyConverter = () => {
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [exchangeRates, setExchangeRates] = useState({});
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popularPairs, setPopularPairs] = useState([]);

  // Popular currency pairs
  const defaultPopularPairs = [
    { from: 'USD', to: 'EUR', name: 'US Dollar to Euro' },
    { from: 'USD', to: 'GBP', name: 'US Dollar to British Pound' },
    { from: 'USD', to: 'JPY', name: 'US Dollar to Japanese Yen' },
    { from: 'EUR', to: 'USD', name: 'Euro to US Dollar' },
    { from: 'GBP', to: 'USD', name: 'British Pound to US Dollar' },
    { from: 'BTC', to: 'USD', name: 'Bitcoin to US Dollar' }
  ];

  // Fetch exchange rates when component mounts
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setLoading(true);
        const data = await apiService.getMarketData('currencies');
        
        // Process the data to create exchange rates object
        const rates = {};
        
        // Add USD as base currency with rate 1
        rates['USD'] = 1;
        
        // Process currency data from API
        if (data && data.currencies) {
          Object.entries(data.currencies).forEach(([name, currencyData]) => {
            // Extract currency code from name (e.g., "EUR/USD" -> "EUR")
            const currencyCode = name.split('/')[0];
            
            // Get the rate from the price
            // For pairs like EUR/USD, the price is how many USD per 1 EUR
            if (name.includes('/USD')) {
              rates[currencyCode] = 1 / currencyData.price;
            } else if (name.includes('USD/')) {
              // For pairs like USD/JPY, the price is how many JPY per 1 USD
              const targetCurrency = name.split('/')[1];
              rates[targetCurrency] = currencyData.price;
            }
          });
        }
        
        // Add some common currencies if they're missing
        if (!rates['EUR']) rates['EUR'] = 0.85;
        if (!rates['GBP']) rates['GBP'] = 0.75;
        if (!rates['JPY']) rates['JPY'] = 110;
        if (!rates['CAD']) rates['CAD'] = 1.25;
        if (!rates['AUD']) rates['AUD'] = 1.35;
        if (!rates['CHF']) rates['CHF'] = 0.9;
        if (!rates['CNY']) rates['CNY'] = 6.5;
        if (!rates['BTC']) rates['BTC'] = 0.000025;
        
        setExchangeRates(rates);
        
        // Initialize popular pairs with real rates
        setPopularPairs(defaultPopularPairs.map(pair => ({
          ...pair,
          rate: convertCurrency(1, pair.from, pair.to, rates)
        })));
        
        setError(null);
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
        setError('Failed to load exchange rates. Using estimated rates instead.');
        
        // Use estimated rates as fallback
        const estimatedRates = {
          'USD': 1,
          'EUR': 0.85,
          'GBP': 0.75,
          'JPY': 110,
          'CAD': 1.25,
          'AUD': 1.35,
          'CHF': 0.9,
          'CNY': 6.5,
          'BTC': 0.000025
        };
        
        setExchangeRates(estimatedRates);
        
        // Initialize popular pairs with estimated rates
        setPopularPairs(defaultPopularPairs.map(pair => ({
          ...pair,
          rate: convertCurrency(1, pair.from, pair.to, estimatedRates)
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();
  }, []);

  // Convert currency using exchange rates
  const convertCurrency = (amount, from, to, rates = exchangeRates) => {
    if (!rates[from] || !rates[to]) return 0;
    
    // Convert to USD first (as base currency), then to target currency
    const amountInUSD = amount / rates[from];
    const amountInTargetCurrency = amountInUSD * rates[to];
    
    return amountInTargetCurrency;
  };

  // Handle conversion when inputs change
  useEffect(() => {
    if (Object.keys(exchangeRates).length > 0) {
      const result = convertCurrency(amount, fromCurrency, toCurrency);
      setConvertedAmount(result);
    }
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  // Handle amount input change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(value)) {
      setAmount(value === '' ? 0 : parseFloat(value));
    }
  };

  // Handle currency selection change
  const handleFromCurrencyChange = (e) => {
    setFromCurrency(e.target.value);
  };

  const handleToCurrencyChange = (e) => {
    setToCurrency(e.target.value);
  };

  // Swap currencies
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Select a popular pair
  const handleSelectPair = (from, to) => {
    setFromCurrency(from);
    setToCurrency(to);
  };

  // Format currency for display
  const formatCurrency = (amount, currency) => {
    if (currency === 'BTC') {
      return amount.toFixed(8);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className={styles.currencyConverter}>
      <div className={styles.converterCard}>
        <h3 className={styles.converterTitle}>Currency Converter</h3>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <div className={styles.converterForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="amount" className={styles.inputLabel}>Amount</label>
            <input
              id="amount"
              type="text"
              className={styles.amountInput}
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
            />
          </div>
          
          <div className={styles.currencySelectors}>
            <div className={styles.inputGroup}>
              <label htmlFor="fromCurrency" className={styles.inputLabel}>From</label>
              <select
                id="fromCurrency"
                className={styles.currencySelect}
                value={fromCurrency}
                onChange={handleFromCurrencyChange}
              >
                {Object.keys(exchangeRates).sort().map(currency => (
                  <option key={`from-${currency}`} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              className={styles.swapButton}
              onClick={handleSwapCurrencies}
              aria-label="Swap currencies"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </button>
            
            <div className={styles.inputGroup}>
              <label htmlFor="toCurrency" className={styles.inputLabel}>To</label>
              <select
                id="toCurrency"
                className={styles.currencySelect}
                value={toCurrency}
                onChange={handleToCurrencyChange}
              >
                {Object.keys(exchangeRates).sort().map(currency => (
                  <option key={`to-${currency}`} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.conversionResult}>
            {loading ? (
              <div className={styles.loading}>Loading exchange rates...</div>
            ) : (
              <>
                <div className={styles.conversionAmount}>
                  {formatCurrency(amount, fromCurrency)}
                </div>
                <div className={styles.conversionEquals}>=</div>
                <div className={styles.convertedAmount}>
                  {formatCurrency(convertedAmount, toCurrency)}
                </div>
                <div className={styles.conversionRate}>
                  1 {fromCurrency} = {convertCurrency(1, fromCurrency, toCurrency).toFixed(4)} {toCurrency}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.popularPairs}>
        <h4 className={styles.popularPairsTitle}>Popular Currency Pairs</h4>
        <div className={styles.pairsGrid}>
          {popularPairs.map((pair, index) => (
            <div 
              key={index} 
              className={styles.pairCard}
              onClick={() => handleSelectPair(pair.from, pair.to)}
            >
              <div className={styles.pairName}>{pair.name}</div>
              <div className={styles.pairRate}>
                1 {pair.from} = {pair.rate.toFixed(4)} {pair.to}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;