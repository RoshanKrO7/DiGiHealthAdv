import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Spinner from '../../components/Spinner';

const ImageAnalysisAI = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setAnalysis(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      // Here you would implement the actual image analysis
      // For now, just a placeholder response
      const mockAnalysis = {
        condition: "Sample condition",
        confidence: 0.85,
        recommendations: [
          "Consult with a healthcare provider",
          "Consider additional tests",
          "Monitor for changes"
        ]
      };
      
      setAnalysis(mockAnalysis);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">AI Image Analysis</h2>
          
          <div className="card mb-4">
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="imageUpload" className="form-label">
                  Upload Medical Image
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>

              {preview && (
                <div className="text-center mb-3">
                  <img
                    src={preview}
                    alt="Preview"
                    className="img-fluid"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleAnalyze}
                disabled={!selectedFile || loading}
              >
                {loading ? <Spinner /> : 'Analyze Image'}
              </button>

              {error && (
                <div className="alert alert-danger mt-3">
                  {error}
                </div>
              )}

              {analysis && (
                <div className="mt-4">
                  <h4>Analysis Results</h4>
                  <div className="card">
                    <div className="card-body">
                      <p><strong>Detected Condition:</strong> {analysis.condition}</p>
                      <p><strong>Confidence:</strong> {(analysis.confidence * 100).toFixed(1)}%</p>
                      <h5>Recommendations:</h5>
                      <ul>
                        {analysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        This analysis is for informational purposes only and should not be considered as medical advice.
                        Please consult with a healthcare professional for proper diagnosis and treatment.
                      </div>
                    </div>
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

export default ImageAnalysisAI; 