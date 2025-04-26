import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { supabase } from '../utils/main';
import { useAuth } from '../contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const HealthMetricsVisualizer = ({ initialTimeRange = '1M' }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('bloodPressure');
  const [timeRange, setTimeRange] = useState(initialTimeRange);

  const metricOptions = [
    { value: 'bloodPressure', label: 'Blood Pressure' },
    { value: 'bloodSugar', label: 'Blood Sugar' },
    { value: 'cholesterol', label: 'Cholesterol' },
    { value: 'heartRate', label: 'Heart Rate' },
    { value: 'temperature', label: 'Temperature' },
    { value: 'weight', label: 'Weight' },
    { value: 'oxygenSaturation', label: 'Oxygen Saturation' }
  ];

  useEffect(() => {
    fetchMetrics();
  }, [timeRange, selectedMetric]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const timeRangeMap = {
        '1W': '7 days',
        '1M': '30 days',
        '3M': '90 days',
        '6M': '180 days',
        '1Y': '365 days'
      };

      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', new Date(Date.now() - (parseInt(timeRangeMap[timeRange]) * 24 * 60 * 60 * 1000)).toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    const dates = metrics.map(m => new Date(m.recorded_at).toLocaleDateString());
    const values = metrics.map(m => {
      const metricValue = m.metrics[selectedMetric];
      if (selectedMetric === 'bloodPressure') {
        const [systolic] = metricValue.split('/');
        return parseInt(systolic);
      }
      return parseFloat(metricValue);
    });

    return {
      labels: dates,
      datasets: [
        {
          label: metricOptions.find(m => m.value === selectedMetric).label,
          data: values,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${metricOptions.find(m => m.value === selectedMetric).label} Trend`
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between mb-3">
          <select
            className="form-select w-auto"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            {metricOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="form-select w-auto"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="1W">1 Week</option>
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : metrics.length > 0 ? (
          <Line data={prepareChartData()} options={chartOptions} />
        ) : (
          <div className="text-center">No data available for the selected period</div>
        )}
      </div>
    </div>
  );
};

export default HealthMetricsVisualizer; 