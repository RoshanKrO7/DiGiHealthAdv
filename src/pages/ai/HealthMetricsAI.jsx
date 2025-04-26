import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Spinner from '../../components/Spinner';

const HealthMetricsAI = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  // Use useCallback to memoize the function so it can be safely added to dependencies
  const fetchHealthMetrics = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Fetch user's health metrics
      // This is a placeholder - implement actual data fetching
      const mockMetrics = {
        weight: [
          { date: '2024-01-01', value: 70 },
          { date: '2024-02-01', value: 69 },
          { date: '2024-03-01', value: 68 }
        ],
        bloodPressure: [
          { date: '2024-01-01', systolic: 120, diastolic: 80 },
          { date: '2024-02-01', systolic: 118, diastolic: 78 },
          { date: '2024-03-01', systolic: 122, diastolic: 82 }
        ],
        heartRate: [
          { date: '2024-01-01', value: 72 },
          { date: '2024-02-01', value: 70 },
          { date: '2024-03-01', value: 71 }
        ]
      };

      setMetrics(mockMetrics);
      analyzeMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      setError('Failed to load health metrics');
    } finally {
      setLoading(false);
    }
  }, []);  // Empty dependency array since it doesn't depend on any props or state

  useEffect(() => {
    fetchHealthMetrics();
  }, [fetchHealthMetrics]);  // Added fetchHealthMetrics as a dependency

  const analyzeMetrics = (metrics) => {
    // This is where you would implement AI analysis of the metrics
    // For now, using mock analysis
    const mockAnalysis = {
      weight: {
        trend: 'decreasing',
        change: -2,
        recommendation: 'Your weight shows a healthy decreasing trend. Keep up the good work!'
      },
      bloodPressure: {
        trend: 'stable',
        recommendation: 'Your blood pressure remains within normal range. Continue monitoring regularly.'
      },
      heartRate: {
        trend: 'stable',
        recommendation: 'Your heart rate is consistent and within healthy range.'
      },
      overall: {
        status: 'Good',
        recommendations: [
          'Maintain current lifestyle habits',
          'Continue regular exercise',
          'Keep monitoring your metrics'
        ]
      }
    };

    setAnalysis(mockAnalysis);
  };

  if (loading) return <div className="text-center py-4"><Spinner /></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">AI Health Metrics Analysis</h2>

          {metrics && analysis && (
            <>
              <div className="card mb-4">
                <div className="card-body">
                  <h4>Overall Health Status: <span className="text-success">{analysis.overall.status}</span></h4>
                  <div className="mt-3">
                    <h5>Key Findings:</h5>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item">
                        <strong>Weight:</strong> {analysis.weight.recommendation}
                      </li>
                      <li className="list-group-item">
                        <strong>Blood Pressure:</strong> {analysis.bloodPressure.recommendation}
                      </li>
                      <li className="list-group-item">
                        <strong>Heart Rate:</strong> {analysis.heartRate.recommendation}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-body">
                  <h4>Recommendations</h4>
                  <ul className="list-group list-group-flush">
                    {analysis.overall.recommendations.map((rec, index) => (
                      <li key={index} className="list-group-item">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                This analysis is based on your recorded health metrics. For personalized medical advice,
                please consult with your healthcare provider.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthMetricsAI; 