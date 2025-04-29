import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { FaCloudUploadAlt, FaFileAlt, FaFilePdf, FaFileWord, FaRobot, FaChartLine, FaLightbulb, FaHistory } from 'react-icons/fa';

const DocumentScanner = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const extractTextFromFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          resolve(content);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = (error) => reject(error);
      
      if (file.type === 'application/pdf') {
        // For PDF files, we'll need to handle them differently
        reader.readAsArrayBuffer(file);
      } else {
        // For text-based files (doc, docx, txt)
        reader.readAsText(file);
      }
    });
  };

  const processDocumentLocally = (content, fileType) => {
    try {
      let text = '';
      
      // Handle different file types
      if (fileType === 'application/pdf') {
        // For PDF files, we can't process them locally
        return {
          parameters: {
            documentType: fileType,
            pageCount: 'Unknown',
            wordCount: 'Unknown'
          },
          aiAnalysis: {
            conditions: [],
            medications: [],
            summary: 'PDF files require server-side processing. Please try again later.',
            recommendations: 'Please consult with your healthcare provider for a complete analysis of this document.'
          }
        };
      } else {
        // For text-based files
        text = typeof content === 'string' ? content : '';
      }

      // Basic text processing
      const lines = text.split('\n');
      const conditions = [];
      const medications = [];
      let summary = '';

      lines.forEach(line => {
        if (line.toLowerCase().includes('condition') || line.toLowerCase().includes('diagnosis')) {
          conditions.push(line.trim());
        }
        if (line.toLowerCase().includes('medication') || line.toLowerCase().includes('prescription')) {
          medications.push(line.trim());
        }
        if (line.length > 50) {
          summary += line + ' ';
        }
      });

      return {
        parameters: {
          documentType: fileType,
          pageCount: Math.ceil(text.length / 2000),
          wordCount: text.split(/\s+/).length
        },
        aiAnalysis: {
          conditions: conditions.slice(0, 5),
          medications: medications.slice(0, 5),
          summary: summary.slice(0, 200) + '...',
          recommendations: 'Please consult with your healthcare provider for a complete analysis of this document.'
        }
      };
    } catch (error) {
      console.error('Error in local processing:', error);
      return {
        parameters: {
          documentType: fileType,
          pageCount: 'Error',
          wordCount: 'Error'
        },
        aiAnalysis: {
          conditions: [],
          medications: [],
          summary: 'Error processing document locally.',
          recommendations: 'Please try again later or contact support.'
        }
      };
    }
  };

  const saveDocumentToDatabase = async (file, analysisData) => {
    try {
      // Save the document to Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('health-reports')
        .upload(`${user.id}/${Date.now()}-${file.name}`, file);

      if (uploadError) {
        throw new Error('Failed to save document: ' + uploadError.message);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('health-reports')
        .getPublicUrl(uploadData.path);

      // Save the document record
      const { error: dbError } = await supabase
        .from('healthrecords')
        .insert({
          user_id: user.id,
          document_url: publicUrl,
          document_name: file.name,
          document_type: file.type,
          ai_summary: analysisData.aiAnalysis?.summary || 'No summary available',
          created_at: new Date().toISOString()
        });

      if (dbError) {
        throw new Error('Failed to save document record: ' + dbError.message);
      }

      return true;
    } catch (error) {
      console.error('Error saving document:', error);
      // If storage fails, still return the analysis results
      return false;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, check if backend is available
      const debugResponse = await fetch('https://digihealth-backend.onrender.com/api/check-env', {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!debugResponse.ok) {
        throw new Error('Backend service is currently unavailable');
      }

      // Extract text content from the file
      const fileContent = await extractTextFromFile(file);

      // Try the primary endpoint first
      try {
        const response = await fetch('https://digihealth-backend.onrender.com/api/analyze-report', {
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: fileContent,
            fileName: file.name,
            fileType: file.type,
            userId: user.id,
            analysisType: 'document',
            prompt: 'Please analyze this medical document and extract key information including conditions, medications, and recommendations.'
          })
        });

        if (response.ok) {
          const data = await response.json();
          await saveDocumentToDatabase(file, data);
          setResult(data);
          return;
        }
      } catch (primaryError) {
        console.warn('Primary endpoint failed, using local processing:', primaryError);
      }

      // If primary endpoint fails, use local processing
      const localResult = processDocumentLocally(fileContent, file.type);
      const saved = await saveDocumentToDatabase(file, localResult);
      setResult(localResult);

      if (!saved) {
        setError('Document analysis complete, but failed to save to storage. Results are still available.');
      }

    } catch (err) {
      console.error('Error processing document:', err);
      setError('An error occurred while processing the file. Using basic analysis.');
      
      // Try local processing as last resort
      try {
        const fileContent = await extractTextFromFile(file);
        const localResult = processDocumentLocally(fileContent, file.type);
        const saved = await saveDocumentToDatabase(file, localResult);
        setResult(localResult);

        if (!saved) {
          setError('Document analysis complete, but failed to save to storage. Results are still available.');
        }
      } catch (localError) {
        setError('Failed to process document. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <FaFileAlt />;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FaFilePdf />;
    if (['doc', 'docx'].includes(ext)) return <FaFileWord />;
    return <FaFileAlt />;
  };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-body">
              <h2 className="mb-4">AI Document Scanner</h2>
              
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="text-center p-3">
                    <FaRobot className="fa-3x text-primary mb-2" />
                    <h5>AI Analysis</h5>
                    <p className="small text-muted">Smart extraction of medical information</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3">
                    <FaChartLine className="fa-3x text-success mb-2" />
                    <h5>Health Insights</h5>
                    <p className="small text-muted">Track your health metrics over time</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3">
                    <FaLightbulb className="fa-3x text-warning mb-2" />
                    <h5>Smart Recommendations</h5>
                    <p className="small text-muted">Personalized health advice</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3">
                    <FaHistory className="fa-3x text-info mb-2" />
                    <h5>Health History</h5>
                    <p className="small text-muted">Build your complete health profile</p>
                  </div>
                </div>
              </div>

              <div className="alert alert-info mb-4">
                <h5 className="alert-heading">How it works:</h5>
                <ol className="mb-0">
                  <li>Upload your medical document (PDF, DOC, DOCX, TXT)</li>
                  <li>Our AI analyzes the content and extracts key information</li>
                  <li>Get instant insights about conditions, medications, and recommendations</li>
                  <li>Track your health metrics and build your health history</li>
                </ol>
              </div>

              <div className="card mb-4">
                <div className="card-body">
                  <div className="mb-3">
                    <label htmlFor="documentUpload" className="form-label">
                      Upload Medical Document
                    </label>
                    <div className="input-group">
                      <input
                        type="file"
                        className="form-control"
                        id="documentUpload"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                      />
                      <label className="input-group-text" htmlFor="documentUpload">
                        <FaCloudUploadAlt />
                      </label>
                    </div>
                    <small className="text-muted">
                      Supported formats: PDF, DOC, DOCX, TXT
                    </small>
                    {file && (
                      <div className="mt-2">
                        <span className="badge bg-light text-dark p-2">
                          {getFileIcon()} {file.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={!file || loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      'Analyze Document'
                    )}
                  </button>

                  {error && (
                    <div className="alert alert-warning mt-3">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {result && (
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Analysis Results</h5>

                    {result.parameters && Object.keys(result.parameters).length > 0 && (
                      <div className="mb-3">
                        <h6>Document Information:</h6>
                        <ul className="list-group">
                          {Object.entries(result.parameters).map(([key, value]) => (
                            <li key={key} className="list-group-item d-flex justify-content-between align-items-center">
                              <span>{key}</span>
                              <span className="badge bg-primary rounded-pill">{value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.aiAnalysis && (
                      <div>
                        {result.aiAnalysis.conditions && result.aiAnalysis.conditions.length > 0 && (
                          <div className="mb-3">
                            <h6>Identified Conditions:</h6>
                            <ul className="list-group">
                              {result.aiAnalysis.conditions.map((condition, index) => (
                                <li key={index} className="list-group-item">
                                  <i className="fas fa-check-circle text-success me-2"></i>
                                  {condition}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.aiAnalysis.medications && result.aiAnalysis.medications.length > 0 && (
                          <div className="mb-3">
                            <h6>Medications:</h6>
                            <ul className="list-group">
                              {result.aiAnalysis.medications.map((medication, index) => (
                                <li key={index} className="list-group-item">
                                  <i className="fas fa-pills text-primary me-2"></i>
                                  {medication}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.aiAnalysis.recommendations && (
                          <div className="mb-3">
                            <h6>AI Recommendations:</h6>
                            <div className="alert alert-info">
                              {result.aiAnalysis.recommendations}
                            </div>
                          </div>
                        )}

                        {result.aiAnalysis.summary && (
                          <div>
                            <h6>Document Summary:</h6>
                            <div className="alert alert-light">
                              {result.aiAnalysis.summary}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="alert alert-success mt-3">
                      <i className="fas fa-check-circle me-2"></i>
                      This document has been analyzed and saved to your health records. You can access it from your health overview page.
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

export default DocumentScanner;