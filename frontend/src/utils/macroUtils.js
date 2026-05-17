export const parsePeriodToDate = (period) => {
  if (!period) return null;
  const value = String(period).trim();

  if (/^\d{4}$/.test(value)) {
    return new Date(Number(value), 0, 1);
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number);
    if (month >= 1 && month <= 12) return new Date(year, month - 1, 1);
  }

  if (/^\d{4}-Q[1-4]$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const quarter = Number(value.slice(6));
    return new Date(year, (quarter - 1) * 3, 1);
  }

  return null;
};

export const normalizeSeries = (series) => {
  if (!series || typeof series !== 'object') return [];

  return Object.entries(series)
    .map(([period, value]) => ({
      period: String(period),
      value: typeof value === 'number' ? value : Number(value),
      dateObj: parsePeriodToDate(period),
    }))
    .filter((item) => Number.isFinite(item.value) && item.dateObj)
    .sort((a, b) => a.dateObj - b.dateObj)
    .map((item) => ({
      period: item.period,
      value: item.value,
      x: item.dateObj.toISOString().split('T')[0],
    }));
};
