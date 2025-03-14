import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaChartLine, FaWeight, FaHeartbeat, FaTint, FaLungs, FaPlus, FaTimes } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../styles.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const HealthAnalyticsPage = () => {
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [timeRange, setTimeRange] = useState('6months');
  const [chartData, setChartData] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMetric, setNewMetric] = useState({
    weight: '',
    heart_rate: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    blood_sugar: '',
    oxygen_saturation: '',
    recorded_at: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchHealthData();
  }, []);

  useEffect(() => {
    if (healthData.length > 0) {
      prepareChartData();
    }
  }, [healthData, selectedMetric, timeRange]);

  const fetchHealthData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: true });
        
      if (error) throw error;
      setHealthData(data || []);
    } catch (error) {
      console.error('Error fetching health data:', error);
      setNotification({ message: 'Error fetching health data.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetric = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      // Filter out empty values
      const metricData = Object.fromEntries(
        Object.entries(newMetric).filter(([_, value]) => value !== '')
      );
      
      // Add user_id to the data
      metricData.user_id = user.id;
      
      const { error } = await supabase
        .from('health_metrics')
        .insert([metricData]);
        
      if (error) throw error;
      
      setNotification({ message: 'Health metrics added successfully!', type: 'success' });
      setShowAddForm(false);
      
      // Reset form
      setNewMetric({
        weight: '',
        heart_rate: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        blood_sugar: '',
        oxygen_saturation: '',
        recorded_at: new Date().toISOString().split('T')[0]
      });
      
      // Refresh data
      fetchHealthData();
    } catch (error) {
      console.error('Error adding health metrics:', error);
      setNotification({ message: 'Error adding health metrics.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMetric(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const prepareChartData = () => {
    // Filter data based on time range
    const now = new Date();
    let filteredData = [...healthData];
    
    if (timeRange === '1month') {
      const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filteredData = healthData.filter(item => new Date(item.recorded_at) >= oneMonthAgo);
    } else if (timeRange === '3months') {
      const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
      filteredData = healthData.filter(item => new Date(item.recorded_at) >= threeMonthsAgo);
    } else if (timeRange === '6months') {
      const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
      filteredData = healthData.filter(item => new Date(item.recorded_at) >= sixMonthsAgo);
    } else if (timeRange === '1year') {
      const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      filteredData = healthData.filter(item => new Date(item.recorded_at) >= oneYearAgo);
    }

    // Prepare data for the selected metric
    const labels = filteredData.map(item => {
      const date = new Date(item.recorded_at);
      return date.toLocaleDateString();
    });

    const data = filteredData.map(item => item[selectedMetric] || 0);

    // Set chart colors based on metric
    let borderColor = '#4bc0c0';
    let backgroundColor = 'rgba(75, 192, 192, 0.2)';
    
    switch (selectedMetric) {
      case 'weight':
        borderColor = '#4bc0c0';
        backgroundColor = 'rgba(75, 192, 192, 0.2)';
        break;
      case 'heart_rate':
        borderColor = '#ff6384';
        backgroundColor = 'rgba(255, 99, 132, 0.2)';
        break;
      case 'blood_pressure_systolic':
      case 'blood_pressure_diastolic':
        borderColor = '#ff9f40';
        backgroundColor = 'rgba(255, 159, 64, 0.2)';
        break;
      case 'blood_sugar':
        borderColor = '#9966ff';
        backgroundColor = 'rgba(153, 102, 255, 0.2)';
        break;
      case 'oxygen_saturation':
        borderColor = '#36a2eb';
        backgroundColor = 'rgba(54, 162, 235, 0.2)';
        break;
      default:
        break;
    }

    setChartData({
      labels,
      datasets: [
        {
          label: getMetricLabel(selectedMetric),
          data,
          borderColor,
          backgroundColor,
          tension: 0.1,
          fill: true,
        },
      ],
    });
  };

  const getMetricLabel = (metric) => {
    switch (metric) {
      case 'weight':
        return 'Weight (kg)';
      case 'heart_rate':
        return 'Heart Rate (bpm)';
      case 'blood_pressure_systolic':
        return 'Blood Pressure - Systolic (mmHg)';
      case 'blood_pressure_diastolic':
        return 'Blood Pressure - Diastolic (mmHg)';
      case 'blood_sugar':
        return 'Blood Sugar (mg/dL)';
      case 'oxygen_saturation':
        return 'Oxygen Saturation (%)';
      default:
        return metric;
    }
  };

  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'weight':
        return <FaWeight />;
      case 'heart_rate':
        return <FaHeartbeat />;
      case 'blood_pressure_systolic':
      case 'blood_pressure_diastolic':
        return <FaTint />;
      case 'blood_sugar':
        return <FaTint />;
      case 'oxygen_saturation':
        return <FaLungs />;
      default:
        return <FaChartLine />;
    }
  };

  const getLatestMetricValue = (metric) => {
    if (healthData.length === 0) return 'N/A';
    
    // Sort by date descending to get the latest
    const sortedData = [...healthData].sort((a, b) => 
      new Date(b.recorded_at) - new Date(a.recorded_at)
    );
    
    const latestValue = sortedData[0][metric];
    if (latestValue === undefined || latestValue === null) return 'N/A';
    
    // Format based on metric type
    switch (metric) {
      case 'weight':
        return `${latestValue} kg`;
      case 'heart_rate':
        return `${latestValue} bpm`;
      case 'blood_pressure_systolic':
        const diastolic = sortedData[0]['blood_pressure_diastolic'] || 'N/A';
        return `${latestValue}/${diastolic} mmHg`;
      case 'blood_pressure_diastolic':
        const systolic = sortedData[0]['blood_pressure_systolic'] || 'N/A';
        return `${systolic}/${latestValue} mmHg`;
      case 'blood_sugar':
        return `${latestValue} mg/dL`;
      case 'oxygen_saturation':
        return `${latestValue}%`;
      default:
        return latestValue;
    }
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Date', 'Weight (kg)', 'Heart Rate (bpm)', 'Blood Pressure (mmHg)', 'Blood Sugar (mg/dL)', 'Oxygen Saturation (%)'];
    const csvData = healthData.map(item => [
      new Date(item.recorded_at).toLocaleDateString(),
      item.weight || '',
      item.heart_rate || '',
      `${item.blood_pressure_systolic || ''}/${item.blood_pressure_diastolic || ''}`,
      item.blood_sugar || '',
      item.oxygen_saturation ? `${item.oxygen_saturation}%` : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `health_metrics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && healthData.length === 0) {
    return <Spinner />;
  }

  return (
    <div className="container mt-4">
      {notification && (
        <div className={`alert alert-${notification.type} text-center`}>
          {notification.message}
        </div>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <FaChartLine className="me-2" /> Health Analytics
        </h1>
        <div>
          <button 
            className="btn btn-primary me-2" 
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? <><FaTimes /> Cancel</> : <><FaPlus /> Add New Metrics</>}
          </button>
          {healthData.length > 0 && (
            <button 
              className="btn btn-success" 
              onClick={exportToCSV}
            >
              Export Data
            </button>
          )}
        </div>
      </div>
      
      {/* Add Health Metrics Form */}
      {showAddForm && (
        <div className="card shadow mb-4">
          <div className="card-header bg-primary text-white">
            <h3 className="mb-0">Add New Health Metrics</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddMetric}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="recorded_at" className="form-label">Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    id="recorded_at" 
                    name="recorded_at" 
                    value={newMetric.recorded_at} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="weight" className="form-label">Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="form-control" 
                    id="weight" 
                    name="weight" 
                    value={newMetric.weight} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 70.5" 
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="heart_rate" className="form-label">Heart Rate (bpm)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="heart_rate" 
                    name="heart_rate" 
                    value={newMetric.heart_rate} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 72" 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="oxygen_saturation" className="form-label">Oxygen Saturation (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="form-control" 
                    id="oxygen_saturation" 
                    name="oxygen_saturation" 
                    value={newMetric.oxygen_saturation} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 98" 
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="blood_pressure_systolic" className="form-label">Blood Pressure - Systolic (mmHg)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="blood_pressure_systolic" 
                    name="blood_pressure_systolic" 
                    value={newMetric.blood_pressure_systolic} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 120" 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="blood_pressure_diastolic" className="form-label">Blood Pressure - Diastolic (mmHg)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    id="blood_pressure_diastolic" 
                    name="blood_pressure_diastolic" 
                    value={newMetric.blood_pressure_diastolic} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 80" 
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="blood_sugar" className="form-label">Blood Sugar (mg/dL)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  id="blood_sugar" 
                  name="blood_sugar" 
                  value={newMetric.blood_sugar} 
                  onChange={handleInputChange} 
                  placeholder="e.g. 100" 
                />
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Metrics'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {healthData.length === 0 ? (
        <div className="alert alert-info text-center">
          No health data available. Please add health metrics to see analytics.
        </div>
      ) : (
        <>
          {/* Health Metrics Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <div className="card shadow h-100">
                <div className="card-body text-center">
                  <h5 className="card-title">
                    <FaWeight className="me-2" /> Weight
                  </h5>
                  <h2 className="card-text">{getLatestMetricValue('weight')}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card shadow h-100">
                <div className="card-body text-center">
                  <h5 className="card-title">
                    <FaHeartbeat className="me-2" /> Heart Rate
                  </h5>
                  <h2 className="card-text">{getLatestMetricValue('heart_rate')}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card shadow h-100">
                <div className="card-body text-center">
                  <h5 className="card-title">
                    <FaTint className="me-2" /> Blood Pressure
                  </h5>
                  <h2 className="card-text">{getLatestMetricValue('blood_pressure_systolic')}</h2>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chart Controls */}
          <div className="card shadow mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="metricSelect" className="form-label">Select Metric</label>
                  <select 
                    id="metricSelect" 
                    className="form-select" 
                    value={selectedMetric} 
                    onChange={(e) => setSelectedMetric(e.target.value)}
                  >
                    <option value="weight">Weight</option>
                    <option value="heart_rate">Heart Rate</option>
                    <option value="blood_pressure_systolic">Blood Pressure (Systolic)</option>
                    <option value="blood_pressure_diastolic">Blood Pressure (Diastolic)</option>
                    <option value="blood_sugar">Blood Sugar</option>
                    <option value="oxygen_saturation">Oxygen Saturation</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="timeRangeSelect" className="form-label">Time Range</label>
                  <select 
                    id="timeRangeSelect" 
                    className="form-select" 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <option value="1month">Last Month</option>
                    <option value="3months">Last 3 Months</option>
                    <option value="6months">Last 6 Months</option>
                    <option value="1year">Last Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="card shadow mb-4">
            <div className="card-header">
              <h3 className="mb-0">
                {getMetricIcon(selectedMetric)} {getMetricLabel(selectedMetric)} Trend
              </h3>
            </div>
            <div className="card-body">
              {chartData ? (
                <Line 
                  data={chartData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                      },
                    },
                  }} 
                />
              ) : (
                <p className="text-center">No data available for the selected metric and time range.</p>
              )}
            </div>
          </div>
          
          {/* Health Insights */}
          <div className="card shadow mb-4">
            <div className="card-header">
              <h3 className="mb-0">Health Insights</h3>
            </div>
            <div className="card-body">
              <p>
                This dashboard provides a visual representation of your health metrics over time.
                Track your progress and identify trends to better manage your health.
              </p>
              <p>
                For personalized health advice, please consult with your healthcare provider.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HealthAnalyticsPage; 