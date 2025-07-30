import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import styles from './Pages.module.css';
import UnifiedCard from '../components/common/UnifiedCard';
import CardSlider from '../components/common/CardSlider';
import CurrencyConverter from '../components/currency/CurrencyConverter';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * CurrencyPage component for displaying currency converter and exchange rates
 */
const CurrencyPage = () => {
  const [exchangeRates, setExchangeRates] = useState({});
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch exchange rates when component mounts
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchExchangeRates = async () => {
      try {
        setLoading(true);
        const data = await apiService.getMarketData('currencies', false, { signal });
        
        // Process the data to create exchange rates object
        const rates = {};
        const changes = {};
        
        // Add USD as base currency with rate 1
        rates['USD'] = 1;
        changes['USD'] = 0;
        
        // Process currency data from API
        if (data && data.currencies) {
          Object.entries(data.currencies).forEach(([name, currencyData]) => {
            // Extract currency code from name (e.g., "EUR/USD" -> "EUR")
            const currencyCode = name.split('/')[0];
            
            // Get the rate from the price
            // For pairs like EUR/USD, the price is how many USD per 1 EUR
            if (name.includes('/USD')) {
              rates[currencyCode] = 1 / currencyData.price;
              changes[currencyCode] = -currencyData.changePercent; // Invert change for inverse rate
            } else if (name.includes('USD/')) {
              // For pairs like USD/JPY, the price is how many JPY per 1 USD
              const targetCurrency = name.split('/')[1];
              rates[targetCurrency] = currencyData.price;
              changes[targetCurrency] = currencyData.changePercent;
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
        
        // Add changes for missing currencies
        if (!changes['EUR']) changes['EUR'] = 0;
        if (!changes['GBP']) changes['GBP'] = 0;
        if (!changes['JPY']) changes['JPY'] = 0;
        if (!changes['CAD']) changes['CAD'] = 0;
        if (!changes['AUD']) changes['AUD'] = 0;
        if (!changes['CHF']) changes['CHF'] = 0;
        if (!changes['CNY']) changes['CNY'] = 0;
        if (!changes['BTC']) changes['BTC'] = 0;
        
        setExchangeRates({ rates, changes });
        setError(null);
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
        setError('Failed to load exchange rates. Please try again later.');
        
        // Use estimated rates as fallback
        const estimatedRates = {
          rates: {
            'USD': 1,
            'EUR': 0.85,
            'GBP': 0.75,
            'JPY': 110,
            'CAD': 1.25,
            'AUD': 1.35,
            'CHF': 0.9,
            'CNY': 6.5,
            'BTC': 0.000025
          },
          changes: {
            'USD': 0,
            'EUR': 0,
            'GBP': 0,
            'JPY': 0,
            'CAD': 0,
            'AUD': 0,
            'CHF': 0,
            'CNY': 0,
            'BTC': 0
          }
        };
        
        setExchangeRates(estimatedRates);
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();

    return () => {
      controller.abort();
    };
  }, []);

  // Convert currency using exchange rates
  const convertCurrency = (amount, from, to) => {
    if (!exchangeRates.rates || !exchangeRates.rates[from] || !exchangeRates.rates[to]) return 0;
    
    // Convert to USD first (as base currency), then to target currency
    const amountInUSD = amount / exchangeRates.rates[from];
    const amountInTargetCurrency = amountInUSD * exchangeRates.rates[to];
    
    return amountInTargetCurrency;
  };

  // Get currency name
  const getCurrencyName = (code) => {
    const currencyNames = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'JPY': 'Japanese Yen',
      'CAD': 'Canadian Dollar',
      'AUD': 'Australian Dollar',
      'CHF': 'Swiss Franc',
      'CNY': 'Chinese Yuan',
      'BTC': 'Bitcoin'
    };
    
    return currencyNames[code] || code;
  };

  // Format rate for display
  const formatRate = (rate) => {
    return rate.toFixed(4);
  };

  if (loading) return <LoadingSpinner isLoading={loading} message="Loading currency data..." />;
  
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Currency Exchange</h1>
        <p className={styles.pageDescription}>
          Convert between currencies using real-time exchange rates
        </p>
      </header>

      <section className={styles.section}>
        <h2>Currency Converter</h2>
        <CurrencyConverter />
      </section>

      <section className={styles.section}>
        <h2>Exchange Rates</h2>
        <div className={styles.currencyRatesContainer}>
            <div className={styles.baseCurrencySelector}>
              <label htmlFor="baseCurrency">Base Currency:</label>
              <select
                id="baseCurrency"
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className={styles.baseCurrencySelect}
              >
                {Object.keys(exchangeRates.rates || {}).sort().map(currency => (
                  <option key={currency} value={currency}>
                    {currency} - {getCurrencyName(currency)}
                  </option>
                ))}
              </select>
            </div>
            
            <table className={styles.ratesTable}>
              <thead>
                <tr>
                  <th>Currency</th>
                  <th>Rate</th>
                  <th>Change (24h)</th>
                  <th>Value of 1 {baseCurrency}</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(exchangeRates.rates || {})
                  .filter(currency => currency !== baseCurrency)
                  .sort()
                  .map(currency => {
                    const rate = convertCurrency(1, baseCurrency, currency);
                    const change = exchangeRates.changes[currency];
                    const isPositive = change >= 0;
                    
                    return (
                      <tr key={currency}>
                        <td>
                          <div className={styles.currencyCode}>
                            {currency} - {getCurrencyName(currency)}
                          </div>
                        </td>
                        <td className={styles.rateValue}>
                          {formatRate(rate)}
                        </td>
                        <td className={`${styles.rateChange} ${isPositive ? styles.positive : styles.negative}`}>
                          {isPositive ? '+' : ''}{change.toFixed(2)}%
                        </td>
                        <td>
                          {formatRate(rate)} {currency}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
      </section>
      <div style={{ textAlign: 'right', color: 'var(--muted-text)', fontSize: '0.95rem', marginTop: 32 }}>
        Last updated: {exchangeRates?.timestamp ? new Date(exchangeRates.timestamp).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
};

export default CurrencyPage;