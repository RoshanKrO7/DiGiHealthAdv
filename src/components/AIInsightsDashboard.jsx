import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/main';
import { useAuth } from '../contexts/AuthContext';
import {
  FaChartLine, FaBrain, FaHeartbeat, FaFileMedical,
  FaRobot, FaHistory, FaChartPie, FaChartBar
} from 'react-icons/fa';
import {
  Line, Bar, Pie, Radar
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const AIInsightsDashboard = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState({
    healthTrends: [],
    imageAnalyses: [],
    chatHistory: [],
    recommendations: []
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('all');

  useEffect(() => {
    fetchAIInsights();
  }, [user, selectedTimeRange, selectedMetric]);

  const fetchAIInsights = async () => {
    try {
      const [healthData, imageData, chatData, recommendationsData] = await Promise.all([
        supabase
          .from('health_metrics')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false }),
        supabase
          .from('medical_analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('analyzed_at', { ascending: false }),
        supabase
          .from('chat_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('ai_recommendations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      setInsights({
        healthTrends: healthData.data || [],
        imageAnalyses: imageData.data || [],
        chatHistory: chatData.data || [],
        recommendations: recommendationsData.data || []
      });
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
  };

  return (
    <div className="ai-insights-container">
      <h1 className="text-center mb-4">AI Health Insights Dashboard</h1>
      
      {/* Controls */}
      <div className="controls-section mb-4">
        <select 
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className="form-select me-2"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
        
        <select 
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="form-select"
        >
          <option value="all">All Metrics</option>
          <option value="vitals">Vital Signs</option>
          <option value="lab">Lab Results</option>
          <option value="lifestyle">Lifestyle</option>
        </select>
      </div>

      {/* Health Trends Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h3><FaChartLine /> Health Trends Analysis</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <Line
                data={{
                  labels: insights.healthTrends.map(d => new Date(d.recorded_at).toLocaleDateString()),
                  datasets: [{
                    label: 'Health Score',
                    data: insights.healthTrends.map(d => d.value),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Health Metrics Over Time'
                    }
                  }
                }}
              />
            </div>
            <div className="col-md-6">
              <Radar
                data={{
                  labels: ['Blood Pressure', 'Heart Rate', 'Blood Sugar', 'Sleep', 'Exercise', 'Diet'],
                  datasets: [{
                    label: 'Current Status',
                    data: [65, 75, 70, 80, 60, 85],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgb(75, 192, 192)',
                    pointBackgroundColor: 'rgb(75, 192, 192)'
                  }]
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Image Analysis History */}
      <div className="card mb-4">
        <div className="card-header">
          <h3><FaFileMedical /> Medical Image Analysis History</h3>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Image Type</th>
                  <th>Analysis Result</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {insights.imageAnalyses.map((analysis, index) => (
                  <tr key={index}>
                    <td>{new Date(analysis.analyzed_at).toLocaleDateString()}</td>
                    <td>{analysis.image_type}</td>
                    <td>{analysis.result}</td>
                    <td>{analysis.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="card mb-4">
        <div className="card-header">
          <h3><FaBrain /> AI Health Recommendations</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <Pie
                data={{
                  labels: ['Diet', 'Exercise', 'Sleep', 'Medication', 'Lifestyle'],
                  datasets: [{
                    data: [30, 25, 20, 15, 10],
                    backgroundColor: [
                      '#FF6384',
                      '#36A2EB',
                      '#FFCE56',
                      '#4BC0C0',
                      '#9966FF'
                    ]
                  }]
                }}
                options={{
                  plugins: {
                    title: {
                      display: true,
                      text: 'Recommendation Categories'
                    }
                  }
                }}
              />
            </div>
            <div className="col-md-6">
              <div className="recommendations-list">
                {insights.recommendations.slice(0, 5).map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <h5>{rec.category}</h5>
                    <p>{rec.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Analytics */}
      <div className="card">
        <div className="card-header">
          <h3><FaRobot /> Health Assistant Interactions</h3>
        </div>
        <div className="card-body">
          <Bar
            data={{
              labels: ['Diet Queries', 'Symptom Analysis', 'Medical Terms', 'First Aid', 'General Health'],
              datasets: [{
                label: 'Interaction Distribution',
                data: [45, 32, 28, 15, 30],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1
              }]
            }}
            options={{
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AIInsightsDashboard; 