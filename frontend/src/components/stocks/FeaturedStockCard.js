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
    <div style={{ position: 'relative', zIndex: 1000, backgroundColor: 'var(--secondary-bg)' }}>
      <div
        ref={cardRef}
        className={styles.featuredCard}
        data-theme={theme}
        style={{ border: 'none', position: 'relative', zIndex: 2, backgroundColor: 'var(--secondary-bg)' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.featuredCardHorizontalFlipped} style={{ alignItems: 'stretch', height: '100%', position: 'relative' }}>
          {/* Chart absolutely positioned on the right, fills card height */}
          <div className={styles.featuredCardChartRight} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, height: '100%', width: '60%', zIndex: 1, minWidth: 0, overflow: 'visible', display: 'flex', alignItems: 'stretch', pointerEvents: 'none', background: 'transparent' }}>
            {validHistory ? (
              <div style={{ position: 'relative', width: '120%', height: '100%', marginLeft: '-10%', paddingBottom: 24, boxSizing: 'border-box', background: 'transparent' }}>
                <TimeSeriesChart
                  data={chartData}
                  showLegend={false}
                  height={cardHeight - 24}
                  title=""
                  xAxisTitle=""
                  yAxisTitle=""
                  config={{ staticPlot: true, displayModeBar: false }}
                  layout={{ 
                    ...chartLayout, 
                    hovermode: false, 
                    height: cardHeight - 24,
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent'
                  }}
                  transparent={true}
                />
                <div className={styles.featuredChartMask} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: cardHeight - 24, zIndex: 1 }} />
                {/* View Details button moved here from info section */}
                <a href={`/stocks/${symbol}`} className={stockStyles.mainPageViewMore} style={{ position: 'absolute', right: 24, bottom: 24, zIndex: 10, pointerEvents: 'auto' }}>
                  View Details
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </a>
              </div>
            ) : (
              <div className={styles.noChartData}>No chart data</div>
            )}
          </div>
          {/* Info section, z-index: 4 for text, but background is lower */}
          <div className={styles.featuredCardLeftInfo} style={{ flex: '0 0 60%', maxWidth: '60%', minWidth: 0, display: 'flex', flexDirection: 'column', zIndex: 4, position: 'relative', paddingRight: 24 }}>
            {/* Use a pseudo-element for the background in CSS for .featuredCardLeftInfo, z-index: 1 */}
            <div style={{ flex: '0 0 auto', position: 'relative', zIndex: 4 }}>
              <div className={styles.featuredHeaderRowFlexSmall} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                  <span className={styles.featuredNameSmall}>{name}</span>
                  {sector && (
                    <div className={stockStyles.featuredIndustryTag}>{sector}</div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 80 }}>
                  <span className={styles.featuredPriceTiny} style={{ color: priceColor }}>
                    {typeof price === 'number' ? `$${price.toFixed(2)}` : (isNaN(parseFloat(price)) ? 'N/A' : `$${parseFloat(price).toFixed(2)}`)}
                  </span>
                  {typeof percentChange === 'number' && !isNaN(percentChange) ? (
                    <span style={{ color: priceColor, fontSize: '1.05rem', fontWeight: 600 }}>
                      {percentChange > 0 ? '+' : percentChange < 0 ? '' : ''}{percentChange.toFixed(2)}%
                    </span>
                  ) : null}
                </div>
              </div>
              <div className={styles.featuredMetricsGridSmall}>
                <div><span>Market Cap:</span> <span>{formatMarketCap(metrics.marketCap)}</span></div>
                <div><span>P/E:</span> <span>{fmt2(metrics.pe)}</span></div>
                <div><span>Volume:</span> <span>{formatVolume(metrics.volume)}</span></div>
                <div><span>52W High:</span> <span>{fmt2(metrics['52WeekHigh'])}</span></div>
                <div><span>52W Low:</span> <span>{fmt2(metrics['52WeekLow'])}</span></div>
                <div><span>Beta:</span> <span>{fmt2(metrics.beta)}</span></div>
              </div>
            </div>
            {description && (
              <div
                className={styles.featuredDescriptionEllipsis}
                title={truncateText(description, 260)}
                ref={descOuterRef}
              >
                <div
                  className={
                    styles.featuredDescriptionInner +
                    (descScrollClass ? ' ' + styles[descScrollClass] : '')
                  }
                  ref={descInnerRef}
                >
                {description}
                </div>
              </div>
            )}
            {/* View Details button now moved to chart area */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedStockCard; 