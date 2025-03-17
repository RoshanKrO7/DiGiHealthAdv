import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Spinner from '../../components/Spinner';

const SymptomCheckerAI = () => {
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('moderate');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Here you would implement the actual symptom analysis
      // For now, using mock response
      const mockAnalysis = {
        possibleConditions: [
          {
            condition: "Common Cold",
            probability: 0.8,
            description: "A viral infection causing runny nose, sore throat, and cough",
            recommendations: [
              "Rest and hydration",
              "Over-the-counter cold medications",
              "Monitor symptoms"
            ]
          },
          {
            condition: "Seasonal Allergies",
            probability: 0.6,
            description: "An allergic response to environmental triggers",
            recommendations: [
              "Antihistamines",
              "Avoid known triggers",
              "Consider consulting an allergist"
            ]
          }
        ],
        urgencyLevel: "Low",
        generalAdvice: "Based on the symptoms described, immediate medical attention is not required. However, if symptoms worsen or persist, please consult a healthcare provider.",
        whenToSeekHelp: [
          "Symptoms persist beyond 7 days",
          "Development of high fever",
          "Difficulty breathing",
          "Severe pain"
        ]
      };

      setAnalysis(mockAnalysis);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      setError('Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">AI Symptom Checker</h2>

          <div className="card mb-4">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="symptoms" className="form-label">
                    Describe your symptoms
                  </label>
                  <textarea
                    className="form-control"
                    id="symptoms"
                    rows="3"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Example: I have a headache, fever, and sore throat..."
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="duration" className="form-label">
                    How long have you had these symptoms?
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Example: 2 days"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="severity" className="form-label">
                    Severity of symptoms
                  </label>
                  <select
                    className="form-select"
                    id="severity"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !symptoms.trim()}
                >
                  {loading ? <Spinner /> : 'Analyze Symptoms'}
                </button>
              </form>

              {error && (
                <div className="alert alert-danger mt-3">
                  {error}
                </div>
              )}

              {analysis && (
                <div className="mt-4">
                  <h4>Analysis Results</h4>
                  
                  <div className="alert alert-info mb-3">
                    <strong>Urgency Level:</strong> {analysis.urgencyLevel}
                  </div>

                  <h5>Possible Conditions:</h5>
                  {analysis.possibleConditions.map((condition, index) => (
                    <div key={index} className="card mb-3">
                      <div className="card-body">
                        <h6 className="card-title">
                          {condition.condition}
                          <span className="badge bg-primary ms-2">
                            {(condition.probability * 100).toFixed(0)}% match
                          </span>
                        </h6>
                        <p className="card-text">{condition.description}</p>
                        <h6>Recommendations:</h6>
                        <ul>
                          {condition.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}

                  <div className="card mb-3">
                    <div className="card-body">
                      <h5>When to Seek Medical Help:</h5>
                      <ul>
                        {analysis.whenToSeekHelp.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    This is an AI-powered analysis and should not replace professional medical advice.
                    If you're concerned about your symptoms, please consult a healthcare provider.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomCheckerAI; 