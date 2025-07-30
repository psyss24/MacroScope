import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import styles from './Charts.module.css';
import apiService from '../services/api';
import LoadingSpinner from './common/LoadingSpinner';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Charts = () => {
  const [activeChart, setActiveChart] = useState('market');
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        // Fetch only dashboard-specific market data
        const data = await apiService.getMarketData(null, true, { signal });
        setMarketData(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
        console.error('Error fetching chart data:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) return <LoadingSpinner isLoading={true} message="Loading charts..." />;
  if (!marketData) return <div className={styles.error}>No data available</div>;

  const marketChartData = {
    labels: marketData.indices && marketData.indices['S&P 500']?.history ? 
      marketData.indices['S&P 500'].history.map(d => d.date) : [],
    datasets: [
      {
        label: 'S&P 500',
        data: marketData.indices && marketData.indices['S&P 500']?.history ? 
          marketData.indices['S&P 500'].history.map(d => d.close) : [],
        borderColor: 'rgb(76, 175, 80)',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'NASDAQ',
        data: marketData.indices && marketData.indices['NASDAQ']?.history ? 
          marketData.indices['NASDAQ'].history.map(d => d.close) : [],
        borderColor: 'rgb(186, 104, 200)',
        backgroundColor: 'rgba(186, 104, 200, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const cryptoChartData = {
    labels: marketData.crypto ? Object.keys(marketData.crypto) : [],
    datasets: [
      {
        label: 'Price (USD)',
        data: marketData.crypto ? Object.values(marketData.crypto).map(crypto => crypto.price) : [],
        backgroundColor: [
          'rgba(255, 193, 7, 0.8)',
          'rgba(138, 43, 226, 0.8)',
          'rgba(255, 105, 180, 0.8)',
        ],
        borderColor: [
          'rgb(255, 193, 7)',
          'rgb(138, 43, 226)',
          'rgb(255, 105, 180)',
        ],
        borderWidth: 2,
      }
    ]
  };

  const commoditiesChartData = {
    labels: marketData.commodities ? Object.keys(marketData.commodities) : [],
    datasets: [
      {
        label: 'Price Change (%)',
        data: marketData.commodities ? Object.values(marketData.commodities).map(commodity => commodity.changePercent) : [],
        backgroundColor: function(context) {
          const value = context.parsed.y;
          return value > 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(220, 53, 69, 0.8)';
        },
        borderColor: function(context) {
          const value = context.parsed.y;
          return value > 0 ? 'rgb(76, 175, 80)' : 'rgb(220, 53, 69)';
        },
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#333'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#666'
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#666'
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false
      }
    }
  };

  const charts = {
    market: {
      title: 'Market Indices (30 Days)',
      component: <Line data={marketChartData} options={chartOptions} />,
      description: 'Major stock market indices performance over the last 30 days'
    },
    ...(marketData.crypto && {
    crypto: {
      title: 'Cryptocurrency Prices',
      component: <Bar data={cryptoChartData} options={barChartOptions} />,
      description: 'Current cryptocurrency prices in USD'
      }
    }),
    ...(marketData.commodities && {
    commodities: {
      title: 'Commodities Performance',
      component: <Bar data={commoditiesChartData} options={barChartOptions} />,
      description: 'Daily percentage change in major commodities'
    }
    })
  };

  return (
    <div className={styles.chartsContainer}>
      <div className={styles.chartsHeader}>
        <h2 className={styles.title}>Interactive Charts</h2>
        <div className={styles.chartTabs}>
          {Object.entries(charts).map(([key, chart]) => (
            <button
              key={key}
              className={`${styles.tab} ${activeChart === key ? styles.active : ''}`}
              onClick={() => setActiveChart(key)}
            >
              {chart.title}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartContent}>
        <div className={styles.chartWrapper}>
          <div className={styles.chartHeader}>
            <h3>{charts[activeChart].title}</h3>
            <p className={styles.chartDescription}>{charts[activeChart].description}</p>
          </div>
          <div className={styles.chart}>
            {charts[activeChart].component}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
