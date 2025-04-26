import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Card, Container, Row, Col } from 'react-bootstrap';
import { supabase } from '../utils/supabaseClient';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

const styles = {
  actionButton: {
    display: 'inline-block',
    opacity: 1,
    visibility: 'visible'
  }
};

const HealthOverview = () => {
  const [healthData, setHealthData] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newReport, setNewReport] = useState({ 
    disease_id: '', 
    since: '', 
    file: null 
  });
  const [preview, setPreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [notificationTimeout, setNotificationTimeout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userDiseases, setUserDiseases] = useState([]);
  const [extractedParameters, setExtractedParameters] = useState({});

  // Add these state variables for confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  const navigate = useNavigate();

  // Define showNotification with useCallback
  const showNotification = useCallback((message, type = 'info', duration = 5000) => {
    // Clear any existing timeout
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
      setNotificationTimeout(null);
    }

    setNotification({ message, type });
    
    // Set timeout to clear notification
    const timeout = setTimeout(() => {
      setNotification(null);
      setNotificationTimeout(null);
    }, duration);
    
    setNotificationTimeout(timeout);
  }, [notificationTimeout]);

  const fetchUserDiseases = useCallback(async (uid) => {
    const { data, error } = await supabase
      .from('user_diseases')
      .select('*')
      .eq('user_id', uid);
    if (!error) setUserDiseases(data);
  }, []);

  const fetchHealthData = useCallback(async (uid) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('healthrecords')
        .select(`
          *,
          user_diseases(disease_name)
        `)
        .eq('user_id', uid);
        
      if (error) {
        console.error('Error fetching health data:', error);
        showNotification(`Error loading health data: ${error.message}`, 'danger');
        return;
      }
      
      setHealthData(data);
    } catch (err) {
      console.error('Exception fetching health data:', err);
      showNotification(`Error: ${err.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return;
      if (user) {
        setUserId(user.id);
        fetchHealthData(user.id);
        fetchUserDiseases(user.id);
      }
      setLoading(false);
    };

    fetchUser();
  }, [fetchHealthData, fetchUserDiseases]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setNewReport({ ...newReport, file });
    setLoading(true);
    
    try {
      // Show preview for image files
      if (file.type.startsWith('image/')) {
        // Warn user that image analysis is temporarily disabled
        showNotification('Image processing is temporarily unavailable. Please use PDF files for now.', 'warning');
        setLoading(false);
        return;
      } else {
        setPreview(null);
      }
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // First, check if backend is responding with debug endpoint
      try {
        const debugResponse = await fetch('https://digihealth-backend.onrender.com/api/check-env');
        if (!debugResponse.ok) {
          console.warn('Backend environment check failed', await debugResponse.text());
        } else {
          const debugData = await debugResponse.json();
          console.log('Backend environment status:', debugData);
          
          // Check if the OpenAI API key is missing
          if (debugData.environment && debugData.environment.OPENAI_API_KEY === 'not set') {
            showNotification('The AI service is currently unavailable. File upload will proceed without AI analysis.', 'warning', 10000);
            
            // Set default empty analysis structure
            setExtractedParameters({
              parameters: {},
              aiAnalysis: {
                conditions: [],
                medications: [],
                recommendations: "AI analysis unavailable. Please review the document manually.",
                summary: "This document was uploaded but could not be analyzed by AI due to service unavailability."
              }
            });
            
            // End processing here but allow normal upload flow to continue
            setLoading(false);
            return;
          }
        }
      } catch (debugError) {
        console.error('Error checking backend environment:', debugError);
        // Continue processing, as this is just a pre-check
      }
      
      // Send to backend for processing
      console.log('Sending file to backend:', file.name, file.type, file.size);
      const response = await fetch('https://digihealth-backend.onrender.com/api/process-file', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = 'Error processing file';
        let errorData;
        
        try {
          errorData = await response.json();
          console.error('Backend error response:', errorData);
          errorMessage = errorData.error || errorMessage;
          
          // Special handling for API key issues
          if (errorData.details && (
              errorData.details.includes('API key') || 
              errorData.details.includes('authentication') ||
              errorData.details.includes('401'))
          ) {
            showNotification('The AI service is temporarily unavailable. Your file will be uploaded but not analyzed.', 'warning', 10000);
            
            // Set default empty analysis structure
            setExtractedParameters({
              parameters: {},
              aiAnalysis: {
                conditions: [],
                medications: [],
                recommendations: "AI analysis unavailable. Please review the document manually.",
                summary: "This document was uploaded but could not be analyzed by AI due to service unavailability."
              }
            });
            
            // End processing here but allow normal upload flow to continue
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Failed to parse error response', e);
        }
        
        throw new Error(errorMessage);
      }
      
      let result;
      try {
        result = await response.json();
      console.log('Backend response:', result);

        // Log the structure of the response for debugging
        console.log('Response structure details:', {
          hasParameters: Boolean(result.parameters),
          parametersType: typeof result.parameters,
          parametersKeys: result.parameters ? Object.keys(result.parameters) : [],
          parametersValues: result.parameters ? Object.values(result.parameters).map(v => typeof v) : [],
          hasAiAnalysis: Boolean(result.aiAnalysis),
          aiAnalysisType: typeof result.aiAnalysis,
          aiAnalysisKeys: result.aiAnalysis ? Object.keys(result.aiAnalysis) : [],
          conditionsType: result.aiAnalysis?.conditions ? typeof result.aiAnalysis.conditions : 'undefined',
          isConditionsArray: result.aiAnalysis?.conditions ? Array.isArray(result.aiAnalysis.conditions) : false,
          medicationsType: result.aiAnalysis?.medications ? typeof result.aiAnalysis.medications : 'undefined',
          isMedicationsArray: result.aiAnalysis?.medications ? Array.isArray(result.aiAnalysis.medications) : false
        });
        
        // Ensure all parameter values are strings to avoid React rendering issues
        if (result && result.parameters) {
          Object.keys(result.parameters).forEach(key => {
            const value = result.parameters[key];
            if (value === null || value === undefined) {
              result.parameters[key] = 'N/A';
            } else if (typeof value === 'object') {
              result.parameters[key] = JSON.stringify(value);
            } else {
              result.parameters[key] = String(value);
            }
          });
        }
        
        // Ensure aiAnalysis and its properties exist and are correctly formatted
        if (result && result.aiAnalysis) {
          // Ensure conditions is an array of strings
          if (!Array.isArray(result.aiAnalysis.conditions)) {
            console.warn('Conditions is not an array, converting:', result.aiAnalysis.conditions);
            
            if (typeof result.aiAnalysis.conditions === 'string') {
              // If it's a string, try to parse as JSON
              try {
                result.aiAnalysis.conditions = JSON.parse(result.aiAnalysis.conditions);
              } catch {
                // If parsing fails, make it a single-item array
                result.aiAnalysis.conditions = [result.aiAnalysis.conditions];
              }
            } else if (!result.aiAnalysis.conditions) {
              // If it doesn't exist or is null/undefined
              result.aiAnalysis.conditions = [];
            } else if (typeof result.aiAnalysis.conditions === 'object') {
              // If it's a non-array object, convert to array of strings
              result.aiAnalysis.conditions = Object.values(result.aiAnalysis.conditions).map(String);
            } else {
              // Fallback to empty array
              result.aiAnalysis.conditions = [];
            }
          }
          
          // Ensure medications is an array of strings
          if (!Array.isArray(result.aiAnalysis.medications)) {
            console.warn('Medications is not an array, converting:', result.aiAnalysis.medications);
            
            if (typeof result.aiAnalysis.medications === 'string') {
              try {
                result.aiAnalysis.medications = JSON.parse(result.aiAnalysis.medications);
              } catch {
                result.aiAnalysis.medications = [result.aiAnalysis.medications];
              }
            } else if (!result.aiAnalysis.medications) {
              result.aiAnalysis.medications = [];
            } else if (typeof result.aiAnalysis.medications === 'object') {
              result.aiAnalysis.medications = Object.values(result.aiAnalysis.medications).map(String);
            } else {
              result.aiAnalysis.medications = [];
            }
          }
          
          // Ensure all elements in arrays are strings
          result.aiAnalysis.conditions = result.aiAnalysis.conditions
            .filter(item => item !== null && item !== undefined)
            .map(item => String(item));
            
          result.aiAnalysis.medications = result.aiAnalysis.medications
            .filter(item => item !== null && item !== undefined)
            .map(item => String(item));
            
          // Ensure summary and recommendations are strings
          result.aiAnalysis.summary = String(result.aiAnalysis.summary || '');
          result.aiAnalysis.recommendations = String(result.aiAnalysis.recommendations || '');
        } else if (result) {
          // Create default aiAnalysis if missing
        result.aiAnalysis = {
          conditions: [],
          medications: [],
            recommendations: '',
            summary: ''
          };
        }
      } catch (jsonError) {
        console.error('Failed to parse response JSON:', jsonError);
        throw new Error('Failed to parse server response. The file may be too large or in an unsupported format.');
      }

      // Add validation for the response structure
      if (!result || (Object.keys(result).length === 0)) {
        console.error('Empty response structure:', result);
        throw new Error('Server returned an empty response');
      }
      
      if (!result.parameters && !result.aiAnalysis) {
        console.error('Invalid response structure:', result);
        throw new Error('Server returned an invalid response structure');
      }

      setExtractedParameters(result);
      
      // Determine what message to show
      let message;
      if (result.parameters && Object.keys(result.parameters).length > 0) {
        message = 'File processed successfully. Review the extracted information below.';
      } else if (result.aiAnalysis && (
        (result.aiAnalysis.summary && result.aiAnalysis.summary.length > 0) || 
        (result.aiAnalysis.conditions && result.aiAnalysis.conditions.length > 0) ||
        (result.aiAnalysis.medications && result.aiAnalysis.medications.length > 0) ||
        (result.aiAnalysis.recommendations && result.aiAnalysis.recommendations.length > 0)
      )) {
        message = 'No specific parameters were extracted, but AI analysis is available.';
      } else {
        message = 'File processed, but limited information could be extracted. You can still upload it.';
      }
      
      // Show success notification
      showNotification(message, 'success');
      
      console.log('Backend response structure details:', {
        hasParameters: Boolean(result.parameters) && Object.keys(result.parameters).length > 0,
        parametersCount: result.parameters ? Object.keys(result.parameters).length : 0,
        hasAiAnalysis: Boolean(result.aiAnalysis),
        summaryLength: result.aiAnalysis?.summary?.length || 0,
        conditionsLength: result.aiAnalysis?.conditions?.length || 0,
        medicationsLength: result.aiAnalysis?.medications?.length || 0,
        recommendationsLength: result.aiAnalysis?.recommendations?.length || 0
      });

    } catch (error) {
      console.error('Error processing file:', error);
      
      // Handle specific error cases
      if (error.message.includes('API key') || error.message.includes('OpenAI')) {
        showNotification('AI service is unavailable. Your file will be uploaded without analysis.', 'warning');
        
        // Set default empty analysis structure for upload to continue
        setExtractedParameters({
          parameters: {},
          aiAnalysis: {
            conditions: [],
            medications: [],
            recommendations: "AI analysis unavailable. Please review the document manually.",
            summary: "This document was uploaded but could not be analyzed by AI due to service unavailability."
          }
        });
      } else {
        showNotification(`Error processing file: ${error.message}`, 'danger');
        setExtractedParameters({});
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      if (!newReport.file) {
        throw new Error('Please select a file to upload');
      }
      
      if (!newReport.disease_id) {
        throw new Error('Please select a disease');
      }
      
      if (!newReport.since) {
        throw new Error('Please select a date');
      }
      
      // Upload file to Supabase Storage
      const fileExt = newReport.file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('health-reports')
        .upload(fileName, newReport.file);
  
      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }
  
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('health-reports')
        .getPublicUrl(fileName);
  
      // Insert report into healthrecords
      const reportData = {
          user_id: userId,
          disease_id: newReport.disease_id,
          since: newReport.since,
          document_url: publicUrl,
          created_at: new Date().toISOString(),
        ai_summary: extractedParameters?.aiAnalysis?.summary ? 
          String(extractedParameters.aiAnalysis.summary).substring(0, 255) : 
          'No summary available'
      };
      
      const { data: insertedReport, error: reportError } = await supabase
        .from('healthrecords')
        .insert([reportData])
        .select()
        .single();
  
      if (reportError) {
        console.error('Error inserting report data:', reportError);
        throw new Error(`Error saving report: ${reportError.message}`);
      }
  
      // Save extracted parameters if any
      if (extractedParameters?.parameters && Object.keys(extractedParameters.parameters).length > 0) {
        const parameterData = Object.entries(extractedParameters.parameters).map(([key, value]) => ({
          user_id: userId,
          record_id: insertedReport.id,
          parameter_name: key,
          parameter_value: typeof value === 'object' ? 
            JSON.stringify(value).substring(0, 255) : 
            String(value || "N/A").substring(0, 255),
          created_at: new Date().toISOString()
        }));
        
        const { error: paramError } = await supabase
          .from('health_parameters')
          .insert(parameterData);
      
        if (paramError) {
          console.error('Error saving parameters:', paramError);
          // Continue with other operations even if parameter saving fails
        }
      }
  
      // Save conditions if any
      if (extractedParameters?.aiAnalysis?.conditions?.length > 0) {
        const conditionData = extractedParameters.aiAnalysis.conditions
          .filter(condition => condition && condition.trim())
          .map(condition => ({
            record_id: insertedReport.id,
            condition_name: String(condition).substring(0, 255),
            user_id: userId,
            created_at: new Date().toISOString()
          }));
        
        const { error: condError } = await supabase
          .from('report_conditions')
          .insert(conditionData);
      
        if (condError) {
          console.error('Error saving conditions:', condError);
          // Continue with other operations even if conditions saving fails
        }
      }
      
      // Save medications if any
      if (extractedParameters?.aiAnalysis?.medications?.length > 0) {
        const medicationData = extractedParameters.aiAnalysis.medications
          .filter(medication => medication && medication.trim())
          .map(medication => ({
            record_id: insertedReport.id,
            medication_name: String(medication).substring(0, 255),
            user_id: userId,
            created_at: new Date().toISOString()
          }));
        
        const { error: medError } = await supabase
          .from('report_medications')
          .insert(medicationData);
      
        if (medError) {
          console.error('Error saving medications:', medError);
          // Continue with other operations even if medications saving fails
        }
      }
      
      // Save recommendations if any
      if (extractedParameters?.aiAnalysis?.recommendations) {
        const { error: recError } = await supabase
          .from('report_recommendations')
          .insert([{
            record_id: insertedReport.id,
            recommendation_text: String(extractedParameters.aiAnalysis.recommendations).substring(0, 255),
            user_id: userId,
            created_at: new Date().toISOString()
          }]);
      
        if (recError) {
          console.error('Error saving recommendations:', recError);
          // Continue with other operations even if recommendations saving fails
        }
      }
  
      // Refresh data
      await fetchHealthData(userId);
      
      // Reset form
      setShowModal(false);
      setNewReport({ disease_id: '', since: '', file: null });
      setPreview(null);
      setExtractedParameters({});
      
      showNotification('Report uploaded successfully!', 'success');
      
    } catch (error) {
      console.error('Error uploading report:', error);
      showNotification(`Error uploading report: ${error.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Add these functions to your component
  const handleDeleteReport = (reportId) => {
    setReportToDelete(reportId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      // First, get the report details using the ID
      const { data: report, error: fetchError } = await supabase
        .from('healthrecords')
        .select('document_url')
        .eq('id', reportToDelete)
        .single();
      
      if (fetchError) {
        console.error('Error fetching report:', fetchError);
        throw new Error(`Error fetching report: ${fetchError.message}`);
      }
      
      if (!report || !report.document_url) {
        throw new Error('Report or document URL not found');
      }

      // Delete the file from storage first
          const pathMatch = report.document_url.match(/health-reports\/([^\/]+)\/([^\/]+)$/);
          if (pathMatch && pathMatch.length >= 3) {
            const userFolder = pathMatch[1];
        const fileName = pathMatch[2];
        const storagePath = `${userFolder}/${fileName}`;
          
          const { error: storageError } = await supabase.storage
            .from('health-reports')
            .remove([storagePath]);
          
          if (storageError) {
            console.error('Error deleting file:', storageError);
          throw new Error(`Error deleting file: ${storageError.message}`);
        }
      }

      // Then delete the record from the database
      const { error: deleteError } = await supabase
        .from('healthrecords')
        .delete()
        .eq('id', reportToDelete);
      
      if (deleteError) {
        console.error('Error deleting record:', deleteError);
        throw new Error(`Error deleting record: ${deleteError.message}`);
      }

      // Update UI
      setHealthData(prevData => prevData.filter(report => report.id !== reportToDelete));
      showNotification('Report deleted successfully', 'success');
    } catch (error) {
      console.error('Error in delete process:', error);
      showNotification(`Error deleting report: ${error.message}`, 'danger');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setReportToDelete(null);
    }
  };

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }
    };
  }, [notificationTimeout]);

  // Add a test function to validate rendering with sample data
  const testBackendResponse = async () => {
    try {
      showNotification('Testing with sample data...', 'info');
      setLoading(true);
      
      const response = await fetch('https://digihealth-backend.onrender.com/api/test-response');
      if (!response.ok) {
        throw new Error('Error fetching test data');
      }
      
      const result = await response.json();
      console.log('Test response received:', result);
      
      // Set the extracted parameters with the test data
      setExtractedParameters(result);
      
      showNotification('Test data loaded successfully! You can view it in the modal.', 'success');
      
      // Open the modal to display the test data
      setNewReport({
        disease_id: userDiseases.length > 0 ? userDiseases[0].id : '',
        since: new Date().toISOString().split('T')[0],
        file: null
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error testing backend response:', error);
      showNotification(`Error: ${error.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      {loading && <Spinner />}
      {notification && (
        <div 
          className={`alert alert-${notification.type} position-fixed d-flex justify-content-between align-items-center`} 
          style={{
            top: '20px', 
            right: '20px', 
            zIndex: 1050,
            minWidth: '300px',
            maxWidth: '500px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}
          role="alert"
        >
          <span>{notification.message}</span>
          <button 
            type="button" 
            className="btn-close ms-3" 
            onClick={() => setNotification(null)}
            aria-label="Close"
          ></button>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary">Health Reports</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>+ Upload Report</Button>
      </div>
      
      <Row className="g-4">
        {healthData.map((report) => (
          <Col md={4} sm={6} key={report.id}>
            <Card className="shadow-sm border-0 hover-card h-100">
              <Card.Body className="p-4 d-flex flex-column">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon-circle bg-primary text-white me-3">
                    <i className="fas fa-file-medical"></i>
                  </div>
                  <div>
                    <Card.Title className="mb-1">{report.user_diseases?.disease_name}</Card.Title>
                    <Card.Text className="text-muted mb-0">Since: {new Date(report.since).toLocaleDateString()}</Card.Text>
                  </div>
                </div>
                <div className="mt-auto pt-3 d-flex justify-content-end gap-2">
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => handleDeleteReport(report.id)}
                    className="d-flex align-items-center"
                  >
                    <i className="fas fa-trash me-1"></i> Delete
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => window.open(report.document_url, '_blank')}
                    className="d-flex align-items-center"
                  >
                    <i className="fas fa-eye me-1"></i> View
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="h4 fw-bold text-dark">Upload New Health Report</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold d-flex align-items-center text-dark fs-6">
                <i className="fas fa-disease me-2 text-primary"></i>
                Select Health Condition
              </Form.Label>
              <div className="d-flex gap-2">
              <Form.Select 
                value={newReport.disease_id}
                  onChange={(e) => {
                    if (e.target.value === 'add_new') {
                      setShowModal(false);
                      navigate('/profile');
                    } else {
                      setNewReport({ ...newReport, disease_id: e.target.value });
                    }
                  }}
                required
                  className="form-select"
              >
                  <option value="">Choose a health condition</option>
                {userDiseases.map((disease) => (
                  <option key={disease.id} value={disease.id}>
                    {disease.disease_name}
                  </option>
                ))}
                  <option value="add_new" className="text-primary">
                    + Add New Condition
                  </option>
              </Form.Select>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => {
                    setShowModal(false);
                    navigate('/profile');
                  }}
                  className="d-flex align-items-center"
                >
                  <i className="fas fa-plus me-1"></i> Add New
                </Button>
              </div>
              <Form.Text className="text-muted small">
                Select an existing condition or add a new one to your profile
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold d-flex align-items-center text-dark fs-6">
                <i className="fas fa-calendar-alt me-2 text-primary"></i>
                Report Date
              </Form.Label>
              <Form.Control 
                type="date" 
                value={newReport.since}
                onChange={(e) => setNewReport({ ...newReport, since: e.target.value })}
                required
                className="form-control"
              />
              <Form.Text className="text-muted small">
                When was this report created?
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold d-flex align-items-center text-dark fs-6">
                <i className="fas fa-file-upload me-2 text-primary"></i>
                Upload Report
              </Form.Label>
              <div className="border rounded p-3 text-center bg-light">
              <Form.Control 
                type="file" 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                onChange={handleFileChange}
                required
                  className="form-control"
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload" 
                  className="btn btn-outline-primary w-100 d-flex flex-column align-items-center justify-content-center"
                  style={{ minHeight: '120px', cursor: 'pointer' }}
                >
                  <i className="fas fa-cloud-upload-alt fa-2x mb-2 text-primary"></i>
                  <span className="h6 mb-1 text-dark">Click to upload or drag and drop</span>
                  <small className="text-muted">Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG</small>
                </label>
              </div>
              <Form.Text className="text-muted small">
                Upload your medical report or test results. Our AI will analyze the content automatically.
              </Form.Text>
            </Form.Group>

            {preview && (
              <div className="mb-3">
                <Form.Label className="fw-bold d-flex align-items-center text-dark fs-6">
                  <i className="fas fa-image me-2 text-primary"></i>
                  Preview
                </Form.Label>
                <img src={preview} alt="Preview" className="img-fluid rounded shadow-sm" />
              </div>
            )}

            {extractedParameters?.aiAnalysis ? (
              <div className="mb-3">
                <h5 className="fw-bold mb-2 d-flex align-items-center text-dark fs-6">
                  <i className="fas fa-robot me-2 text-primary"></i>
                  AI Analysis
                </h5>
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    {extractedParameters.aiAnalysis.summary ? (
                      <>
                        <h6 className="fw-bold mb-2 d-flex align-items-center text-dark fs-6">
                          <i className="fas fa-file-alt me-2 text-primary"></i>
                          Summary
                        </h6>
                        <p className="mb-3 text-dark">{String(extractedParameters.aiAnalysis.summary)}</p>
                      </>
                    ) : (
                      <p className="text-muted">No summary available for this document.</p>
                    )}
                    
                    {extractedParameters.aiAnalysis.conditions && 
                      extractedParameters.aiAnalysis.conditions.length > 0 && (
                      <>
                        <h6 className="fw-bold mb-2 d-flex align-items-center text-dark fs-6">
                          <i className="fas fa-clipboard-list me-2 text-primary"></i>
                          Conditions Identified
                        </h6>
                        <ul className="list-group list-group-flush mb-3">
                          {extractedParameters.aiAnalysis.conditions.map((condition, index) => (
                            <li key={index} className="list-group-item text-dark">
                              <i className="fas fa-check-circle text-success me-2"></i>
                              {String(condition)}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    
                    {extractedParameters.aiAnalysis.medications && 
                      extractedParameters.aiAnalysis.medications.length > 0 && (
                      <>
                        <h6 className="fw-bold mb-2 d-flex align-items-center text-dark fs-6">
                          <i className="fas fa-pills me-2 text-primary"></i>
                          Medications
                        </h6>
                        <ul className="list-group list-group-flush mb-3">
                          {extractedParameters.aiAnalysis.medications.map((medication, index) => (
                            <li key={index} className="list-group-item text-dark">
                              <i className="fas fa-pills text-info me-2"></i>
                              {String(medication)}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    
                    {extractedParameters.aiAnalysis.recommendations && (
                      <>
                        <h6 className="fw-bold mb-2 d-flex align-items-center text-dark fs-6">
                          <i className="fas fa-lightbulb me-2 text-primary"></i>
                          Recommendations
                        </h6>
                        <p className="text-dark">{String(extractedParameters.aiAnalysis.recommendations)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="d-flex justify-content-end mt-3">
              <Button 
                type="submit" 
                variant="primary" 
                size="sm"
                disabled={loading}
                className="px-3 d-flex align-items-center"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload me-2"></i>
                    Upload Report
                  </>
                )}
            </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="h4 fw-bold text-dark">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <div className="text-center mb-4">
            <i className="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
            <h5 className="fw-bold text-dark mb-3">Are you sure you want to delete this report?</h5>
            <p className="text-dark">This action cannot be undone.</p>
          </div>
          <div className="d-flex justify-content-center gap-3">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowDeleteModal(false)}
              size="sm"
              className="px-3"
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDelete}
              size="sm"
              className="px-3 bg-danger text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <div className="mt-5 pt-5 border-top">
        <h5>Troubleshooting</h5>
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={testBackendResponse}
          className="mt-2"
        >
          Test Rendering
        </Button>
        <small className="d-block text-muted mt-2">
          Use this button to test rendering with sample data if you encounter issues.
        </small>
      </div>
    </Container>
  );
};

export default HealthOverview;
