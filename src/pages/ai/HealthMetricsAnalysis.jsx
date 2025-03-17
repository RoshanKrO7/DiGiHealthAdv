import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/main';
import { openai, MODELS } from '../../utils/openai';
import Spinner from '../../components/Spinner';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const HealthMetricsAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [parameters, setParameters] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchHealthParameters();
  }, []);

  const fetchHealthParameters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Fetch all user parameters
      const { data, error } = await supabase
        .from('user_parameters')
        .select('*')
        .eq('user_id', user.id)
        .order('date_recorded', { ascending: false });

      if (error) throw error;
      setParameters(data || []);

      // If we have enough data, automatically analyze
      if (data && data.length > 3) {
        analyzeHealthData(data);
      }
    } catch (error) {
      console.error('Error fetching parameters:', error);
      setNotification({
        message: 'Error loading health parameters',
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeHealthData = async (data = parameters) => {
    if (!data.length) {
      setNotification({
        message: 'No health data available to analyze',
        type: 'warning'
      });
      return;
    }

    setAnalyzing(true);
    try {
      // Group parameters by name
      const parameterGroups = {};
      data.forEach(param => {
        if (!parameterGroups[param.parameter_name]) {
          parameterGroups[param.parameter_name] = [];
        }
        parameterGroups[param.parameter_name].push({
          value: parseFloat(param.value),
          date: param.date_recorded,
          unit: param.unit
        });
      });

      // Sort each group by date
      Object.keys(parameterGroups).forEach(key => {
        parameterGroups[key].sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        );
      });

      // Convert to a format suitable for OpenAI
      const dataForAnalysis = Object.keys(parameterGroups).map(key => {
        return {
          parameter: key,
          unit: parameterGroups[key][0].unit,
          values: parameterGroups[key].map(p => ({
            value: p.value,
            date: new Date(p.date).toISOString().split('T')[0]
          }))
        };
      });

      // Only analyze parameters with multiple readings
      const parametersWithTrend = dataForAnalysis.filter(p => p.values.length > 1);
      
      if (parametersWithTrend.length === 0) {
        setNotification({
          message: 'Need at least two readings of the same parameter to analyze trends',
          type: 'info'
        });
        setAnalyzing(false);
        return;
      }

      const response = await openai.chat.completions.create({
        model: MODELS.GPT4,
        messages: [
          {
            role: "system",
            content: "You are a healthcare analytics AI assistant. Analyze health parameters over time and provide insights about trends, potential concerns, and recommendations based on medical knowledge. Present your analysis in a structured format suitable for a health dashboard."
          },
          {
            role: "user",
            content: `Analyze these health parameters and provide insights: ${JSON.stringify(parametersWithTrend)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const analysisResult = JSON.parse(response.choices[0].message.content);
      setAnalysis(analysisResult);
      
      // Create chart data
      createCharts(parameterGroups);
    } catch (error) {
      console.error('Error analyzing health data:', error);
      setNotification({
        message: 'Error analyzing health data',
        type: 'danger'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const createCharts = (parameterGroups) => {
    const charts = {};
    
    Object.keys(parameterGroups).forEach(param => {
      if (parameterGroups[param].length > 1) {
        const data = {
          labels: parameterGroups[param].map(p => 
            new Date(p.date).toLocaleDateString()
          ),
          datasets: [
            {
              label: `${param} (${parameterGroups[param][0].unit || 'units'})`,
              data: parameterGroups[param].map(p => p.value),
              fill: false,
              backgroundColor: 'rgba(75,192,192,0.4)',
              borderColor: 'rgba(75,192,192,1)',
              tension: 0.1
            }
          ]
        };
        charts[param] = data;
      }
    });
    
    setChartData(charts);
  };

  if (loading) return <Spinner />;

  return (
    <div className="container py-4">
      {notification && (
        <div className={`alert alert-${notification.type} alert-dismissible fade show`}>
          {notification.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setNotification(null)}
          ></button>
        </div>
      )}

      <h1 className="mb-4">Health Metrics Analysis</h1>
      
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Your Health Parameters</h5>
              <p className="card-text">
                {parameters.length > 0 
                  ? `You have ${parameters.length} health parameters recorded.` 
                  : 'No health parameters recorded yet.'}
              </p>
              
              {!analyzing && parameters.length > 1 && (
                <button 
                  className="btn btn-primary"
                  onClick={() => analyzeHealthData()}
                  disabled={analyzing}
                >
                  {analyzing ? 'Analyzing...' : 'Analyze My Health Data'}
                </button>
              )}
              
              {analyzing && <Spinner />}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">AI Health Analysis</h5>
                
                {analysis.summary && (
                  <div className="mb-4">
                    <h6 className="text-primary">Summary</h6>
                    <p>{analysis.summary}</p>
                  </div>
                )}
                
                {analysis.trends && (
                  <div className="mb-4">
                    <h6 className="text-primary">Trends</h6>
                    <ul className="list-group">
                      {analysis.trends.map((trend, i) => (
                        <li key={i} className="list-group-item">
                          {trend}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.concerns && (
                  <div className="mb-4">
                    <h6 className="text-primary">Potential Concerns</h6>
                    <ul className="list-group">
                      {analysis.concerns.map((concern, i) => (
                        <li key={i} className="list-group-item list-group-item-warning">
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.recommendations && (
                  <div className="mb-4">
                    <h6 className="text-primary">Recommendations</h6>
                    <ul className="list-group">
                      {analysis.recommendations.map((rec, i) => (
                        <li key={i} className="list-group-item list-group-item-info">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <p className="text-muted mt-3">
                  <small>This analysis is generated by AI and should not replace professional medical advice.</small>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {chartData && Object.keys(chartData).length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Health Metrics Visualization</h5>
                
                {Object.keys(chartData).map(param => (
                  <div key={param} className="mb-4">
                    <h6>{param}</h6>
                    <div style={{ height: '300px' }}>
                      <Line
                        data={chartData[param]}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: false
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* No data message */}
      {parameters.length === 0 && (
        <div className="alert alert-info">
          <h5>No Health Parameters Recorded</h5>
          <p>To get started with health metrics analysis, please add some health parameters in your profile.</p>
          <a href="/profile" className="btn btn-primary">Go to Profile</a>
        </div>
      )}
    </div>
  );
};

export default HealthMetricsAnalysis;