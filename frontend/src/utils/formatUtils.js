export const getPriceClass = (changePercent) => {
  if (typeof changePercent !== 'number') return 'valueNeutral';
  if (changePercent > 0) return 'valuePositive';
  if (changePercent < 0) return 'valueNegative';
  return 'valueNeutral';
};

export const getSentimentColorClass = (sentiment) => {
  if (!sentiment) return '';
  switch (sentiment.toLowerCase()) {
    case 'extreme greed': return 'valueExtremeGreed';
    case 'greed': return 'valueGreed';
    case 'neutral': return 'valueNeutralSentiment';
    case 'fear': return 'valueFear';
    case 'extreme fear': return 'valueExtremeFear';
    default: return '';
  }
};

export function formatMarketCap(val) {
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

export function formatVolume(val) {
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

export function fmt2(val) {
  const num = typeof val === 'number' ? val : parseFloat(val);
  return !isNaN(num) ? num.toFixed(2) : val;
}
