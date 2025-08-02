import React, { useContext, useRef, useLayoutEffect, useState, useEffect } from 'react';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import styles from './Stocks.module.css';
import pagesStyles from '../../pages/Pages.module.css';
import stockStyles from './Stocks.module.css';

function truncateText(text, maxLength = 180) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Helper for market cap abbreviation
function formatMarketCap(val) {
  if (typeof val === 'number') {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val}`;
  }
  if (typeof val === 'string') {
    const num = parseFloat(val.replace(/[^\d.]/g, ''));
    if (val.includes('T')) return `$${num.toFixed(2)}T`;
    if (val.includes('B')) return `$${num.toFixed(2)}B`;
    if (val.includes('M')) return `$${num.toFixed(2)}M`;
    if (!isNaN(num)) return formatMarketCap(num);
    return val;
  }
  return val;
}
// Helper for volume in millions
function formatVolume(val) {
  if (typeof val === 'number') {
    return `${(val / 1e6).toFixed(2)}M`;
  }
  if (typeof val === 'string') {
    const num = parseFloat(val.replace(/[^\d.]/g, ''));
    if (!isNaN(num)) return `${(num / 1e6).toFixed(2)}M`;
    return val;
  }
  return val;
}
// Helper for truncating to 2 decimals
function fmt2(val) {
  const num = typeof val === 'number' ? val : parseFloat(val);
  return !isNaN(num) ? num.toFixed(2) : val;
}

const FeaturedStockCard = ({ stock }) => {
  const cardRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(320);
  const descOuterRef = useRef(null);
  const descInnerRef = useRef(null);
  const [descScrollClass, setDescScrollClass] = useState('');
  const scrollUpTimeout = useRef(null);
  const scrollBackAnim = useRef(null);

  useLayoutEffect(() => {
    if (cardRef.current) {
      setCardHeight(cardRef.current.offsetHeight);
    }
  }, [stock?.description, stock?.history]);

  // Dynamically set --scroll-amount for description scroll
  useEffect(() => {
    const outer = descOuterRef.current;
    const inner = descInnerRef.current;
    if (outer && inner) {
      const scrollAmount = Math.max(inner.scrollHeight - outer.clientHeight, 0);
      outer.style.setProperty('--scroll-amount', `${scrollAmount}px`);
    }
  }, [stock?.description]);

  // Clean up timeouts and animation frame on unmount
  useEffect(() => {
    return () => {
      if (scrollUpTimeout.current) clearTimeout(scrollUpTimeout.current);
      if (scrollBackAnim.current) cancelAnimationFrame(scrollBackAnim.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (scrollUpTimeout.current) clearTimeout(scrollUpTimeout.current);
    if (scrollBackAnim.current) cancelAnimationFrame(scrollBackAnim.current);
    setDescScrollClass('scrollingDown');
    // Remove any inline transform so CSS animation can take over
    if (descInnerRef.current) descInnerRef.current.style.transform = '';
  };

  const handleMouseLeave = () => {
    setDescScrollClass(''); // Remove CSS animation class
    if (!descInnerRef.current) return;
    // Get current computed transform
    const computedStyle = window.getComputedStyle(descInnerRef.current);
    const matrix = computedStyle.transform;
    let currentY = 0;
    if (matrix && matrix !== 'none') {
      const match = matrix.match(/matrix\(([^)]+)\)/);
      if (match) {
        const values = match[1].split(',');
        currentY = parseFloat(values[5]);
      }
    }
    // Immediately set the computed transform as inline style
    descInnerRef.current.style.transform = `translateY(${currentY}px)`;
    // Force reflow to ensure the browser applies the inline style
    void descInnerRef.current.offsetWidth;
    // Animate back to 0 with fixed duration and ease-in-out
    const duration = 1500; // ms (1.5s)
    const start = performance.now();
    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    function animateScrollBack(now) {
      const elapsed = now - start;
      const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
      const eased = easeInOut(progress);
      const y = currentY * (1 - eased);
      descInnerRef.current.style.transform = `translateY(${y}px)`;
      if (progress < 1) {
        scrollBackAnim.current = requestAnimationFrame(animateScrollBack);
      } else {
        descInnerRef.current.style.transform = '';
      }
    }
    scrollBackAnim.current = requestAnimationFrame(animateScrollBack);
  };
  if (!stock) return null;
  // Improved debug log for diagnosis
  console.log(
    `[FeaturedStockCard] Render symbol=${stock.symbol}, historyType=${Array.isArray(stock.history) ? 'array' : typeof stock.history}, historyLen=${Array.isArray(stock.history) ? stock.history.length : 'N/A'}`,
    Array.isArray(stock.history) ? stock.history.slice(0, 3) : stock.history
  );
  const { symbol, name, price, metrics = {}, description, history = [], changePercent, sector } = stock;

  // Try to fix chart data if reversed (oldest to newest)
  // Coerce all close values to numbers
  let chartHistory = Array.isArray(history)
    ? history.map(d => ({ ...d, close: typeof d.close === 'number' ? d.close : parseFloat(d.close) }))
    : [];
  let validHistory = Array.isArray(chartHistory) && chartHistory.length > 1 && chartHistory.every(d => typeof d.close === 'number' && !isNaN(d.close));
  if (validHistory && chartHistory.length > 1 && new Date(chartHistory[0].date) > new Date(chartHistory[1].date)) {
    chartHistory = [...chartHistory].reverse();
  }
  validHistory = Array.isArray(chartHistory) && chartHistory.length > 1 && chartHistory.every(d => typeof d.close === 'number' && !isNaN(d.close));

  // Determine color for chart and price/change
  let chartColor, priceColor;
  if (changePercent > 0) {
    chartColor = '#4caf50';
    priceColor = '#4caf50';
  } else if (changePercent < 0) {
    chartColor = '#e53935';
    priceColor = '#e53935';
  } else {
    chartColor = '#fff';
    priceColor = chartColor;
  }

  // Robustly get percentage change (try top-level, then metrics, then fallback)
  let percentChange = changePercent;
  if (typeof percentChange !== 'number' || isNaN(percentChange)) {
    if (metrics && typeof metrics.changePercent === 'number') {
      percentChange = metrics.changePercent;
    } else if (typeof stock.changePercent === 'number') {
      percentChange = stock.changePercent;
    }
  }
  // Debug log to diagnose missing percentChange
  console.log('[FeaturedStockCard] percentChange debug', { symbol, percentChange, changePercent, metrics, stock });

  const chartData = validHistory
    ? [
        {
          x: chartHistory.map((d) => d.date),
          y: chartHistory.map((d) => d.close),
          name: symbol,
          color: chartColor,
          fill: 'tozeroy',
          line: { shape: 'spline', width: 3 },
        },
      ]
    : [];

  // Calculate y-axis range for full vertical scaling
  let yMin = null, yMax = null;
  if (validHistory) {
    const closes = chartHistory.map(d => d.close);
    yMin = Math.min(...closes);
    yMax = Math.max(...closes);
    const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
    let range = yMax - yMin;
    const minRange = mean * 0.10; // Minimum 10% of mean price
    if (range < minRange) {
      const mid = (yMax + yMin) / 2;
      yMin = mid - minRange / 2;
      yMax = mid + minRange / 2;
    } else {
      // Add a small margin to top and bottom
      const margin = range * 0.08;
      yMin -= margin;
      yMax += margin;
    }
  }

  // Minimal chart config: no axes, no grid, no legend
  const chartConfig = {
    displayModeBar: false,
  };
  const chartLayout = {
    margin: { l: 0, r: 0, t: 0, b: 0 },
    height: cardHeight,
    xaxis: { visible: false },
    yaxis: {
      visible: false,
      range: validHistory ? [yMin, yMax] : undefined,
      fixedrange: true,
    },
  };

  const theme = typeof document !== 'undefined' ? document.body.dataset.theme : 'dark';
  return (
    <div className={styles.featuredStockContainer}>
      <div
        ref={cardRef}
        className={styles.featuredStockCard}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header Section */}
        <div className={styles.cardHeader}>
          <div className={styles.stockInfo}>
            <div className={styles.stockTitle}>
              <h3 className={styles.stockName}>{name}</h3>
              <span className={styles.stockSymbol}>{symbol}</span>
            </div>
            {sector && (
              <span className={styles.sectorTag}>{sector}</span>
            )}
          </div>
          <div className={styles.priceInfo}>
            <div className={styles.price} style={{ color: priceColor }}>
              {typeof price === 'number' ? `$${price.toFixed(2)}` : 'N/A'}
            </div>
            {typeof percentChange === 'number' && !isNaN(percentChange) && (
              <div className={styles.priceChange} style={{ color: priceColor }}>
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* Chart Section */}
        <div className={styles.chartSection}>
          {validHistory ? (
            <div className={styles.chartContainer}>
              <TimeSeriesChart
                data={chartData}
                showLegend={false}
                height={200}
                title=""
                xAxisTitle=""
                yAxisTitle=""
                config={{ staticPlot: true, displayModeBar: false }}
                layout={{ 
                  ...chartLayout, 
                  hovermode: false, 
                  height: 200,
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent'
                }}
                transparent={true}
              />
            </div>
          ) : (
            <div className={styles.noChart}>
              <span>No chart data available</span>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className={styles.metricsGrid}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Market Cap</span>
            <span className={styles.metricValue}>{formatMarketCap(metrics.marketCap)}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>P/E Ratio</span>
            <span className={styles.metricValue}>{fmt2(metrics.pe)}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Volume</span>
            <span className={styles.metricValue}>{formatVolume(metrics.volume)}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>52W High</span>
            <span className={styles.metricValue}>{fmt2(metrics['52WeekHigh'])}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>52W Low</span>
            <span className={styles.metricValue}>{fmt2(metrics['52WeekLow'])}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Beta</span>
            <span className={styles.metricValue}>{fmt2(metrics.beta)}</span>
          </div>
        </div>

        {/* Description Section */}
        {description && (
          <div className={styles.descriptionSection}>
            <div className={styles.descriptionLabel}>About</div>
            <div
              className={styles.descriptionContainer}
              ref={descOuterRef}
            >
              <div
                className={`${styles.descriptionText} ${descScrollClass ? styles[descScrollClass] : ''}`}
                ref={descInnerRef}
              >
                {description}
              </div>
            </div>
          </div>
        )}

        {/* Footer with Action Button */}
        <div className={styles.cardFooter}>
          <a href={`/stocks/${symbol}`} className={styles.viewDetailsButton}>
            View Details
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default FeaturedStockCard; 