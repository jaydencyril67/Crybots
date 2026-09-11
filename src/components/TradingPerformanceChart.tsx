import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TradingPerformanceChartProps {
  totalBuyOrders: number;
  totalSellOrders: number;
  buyOrderCount: number;
  sellOrderCount: number;
}

const TradingPerformanceChart: React.FC<TradingPerformanceChartProps> = ({
  totalBuyOrders,
  totalSellOrders,
  buyOrderCount,
  sellOrderCount
}) => {
  // Generate sample trading data based on actual order counts and amounts
  const generateChartData = () => {
    const days = 30; // Show last 30 days
    const labels = [];
    const buyData = [];
    const sellData = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      // Simulate daily trading activity based on total orders
      if (buyOrderCount > 0) {
        const dailyBuyChance = buyOrderCount / days;
        const dailyBuyAmount = totalBuyOrders / days;
        buyData.push(Math.random() < dailyBuyChance ? dailyBuyAmount * (0.5 + Math.random()) : 0);
      } else {
        buyData.push(0);
      }

      if (sellOrderCount > 0) {
        const dailySellChance = sellOrderCount / days;
        const dailySellAmount = totalSellOrders / days;
        sellData.push(Math.random() < dailySellChance ? dailySellAmount * (0.5 + Math.random()) : 0);
      } else {
        sellData.push(0);
      }
    }

    return { labels, buyData, sellData };
  };

  const { labels, buyData, sellData } = generateChartData();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Buy Orders',
        data: buyData,
        borderColor: '#10c98f',
        backgroundColor: 'rgba(16, 201, 143, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#10c98f',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
      },
      {
        label: 'Sell Orders',
        data: sellData,
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#e74c3c',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#666',
          font: {
            size: 11,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#10c98f',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y.toFixed(4);
            return `${label}: ${value} SPOT`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 10,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#666',
          font: {
            size: 10,
          },
          callback: function (value: any) {
            return value.toFixed(4);
          }
        },
      },
    },
    elements: {
      point: {
        backgroundColor: '#10c98f',
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div style={{ height: '200px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default TradingPerformanceChart;
