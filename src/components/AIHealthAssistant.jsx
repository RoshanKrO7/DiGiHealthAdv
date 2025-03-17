import React, { useState } from 'react';
import { getHealthInsights, analyzeMedicalReport, getHealthRecommendations } from '../utils/aiHelpers';
import { supabase } from '../utils/main';
import { useAuth } from '../contexts/AuthContext';
import { FaRobot, FaSpinner, FaFileUpload } from 'react-icons/fa';

const AIHealthAssistant = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleGetInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user's medical history
      const { data: profile } = await supabase
        .from('profiles')
        .select('medical_conditions, allergies, current_medications')
        .eq('id', user.id)
        .single();

      const insights = await getHealthInsights(symptoms, JSON.stringify(profile));
      setResult(insights);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileAnalysis = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      // Read the file content
      const text = await file.text();
      const analysis = await analyzeMedicalReport(text);
      setResult(analysis);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user profile and health metrics
      const [{ data: profile }, { data: metrics }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('health_metrics')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false })
          .limit(10)
      ]);

      const recommendations = await getHealthRecommendations(profile, metrics);
      setResult(recommendations);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-body">
          <h3 className="card-title">
            <FaRobot className="me-2" />
            AI Health Assistant
          </h3>

          <div className="mb-4">
            <h5>Get Health Insights</h5>
            <textarea
              className="form-control mb-2"
              placeholder="Describe your symptoms..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={handleGetInsights}
              disabled={loading || !symptoms}
            >
              {loading ? <FaSpinner className="spinner" /> : 'Get Insights'}
            </button>
          </div>

          <div className="mb-4">
            <h5>Analyze Medical Report</h5>
            <input
              type="file"
              className="form-control mb-2"
              onChange={handleFileAnalysis}
              accept=".txt,.pdf"
            />
          </div>

          <div className="mb-4">
            <h5>Get Personalized Recommendations</h5>
            <button
              className="btn btn-primary"
              onClick={handleGetRecommendations}
              disabled={loading}
            >
              {loading ? <FaSpinner className="spinner" /> : 'Get Recommendations'}
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4">
              <h5>Results:</h5>
              <div className="card">
                <div className="card-body">
                  <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                    {result}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIHealthAssistant; 