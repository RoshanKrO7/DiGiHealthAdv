import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Card, Container, Row, Col } from 'react-bootstrap';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';

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
  const [userDetails, setUserDetails] = useState({ first_name: '', last_name: '', email: '' });
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
  const [userParameters, setUserParameters] = useState([]);
  const [extractedParameters, setExtractedParameters] = useState({});

  // Add these state variables for confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return;
      if (user) {
        setUserId(user.id);
        fetchHealthData(user.id);
        fetchUserDetails(user.id);
        fetchUserDiseases(user.id);
        fetchUserParameters(user.id);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const fetchUserDiseases = async (uid) => {
    const { data, error } = await supabase
      .from('user_diseases')
      .select('*')
      .eq('user_id', uid);
    if (!error) setUserDiseases(data);
  };

  const fetchUserParameters = async (uid) => {
    const { data, error } = await supabase
      .from('user_parameters')
      .select('*')
      .eq('user_id', uid);
    if (!error) setUserParameters(data);
  };

  const fetchUserDetails = async (uid) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', uid)
      .single();
    if (!error) setUserDetails(data);
  };

  const fetchHealthData = async (uid) => {
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
  };

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
      
      console.log('Uploading file to Supabase storage:', fileName);
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
      
      console.log('File uploaded successfully, public URL:', publicUrl);
  
      // Insert report into healthrecords
      const reportData = {
        user_id: userId,
        disease_id: newReport.disease_id,
        since: newReport.since,
        document_url: publicUrl,
        created_at: new Date().toISOString(),
        ai_summary: extractedParameters?.aiAnalysis?.summary || null
      };
      
      console.log('Inserting report data:', reportData);
      const { data: insertedReport, error: reportError } = await supabase
        .from('healthrecords')
        .insert([reportData])
        .select()
        .single();
  
      if (reportError) {
        console.error('Error inserting report data:', reportError);
        throw new Error(`Error saving report: ${reportError.message}`);
      }
      
      console.log('Report inserted successfully:', insertedReport);
  
      // Only continue if we have a valid report ID
      if (!insertedReport || !insertedReport.id) {
        throw new Error('Failed to get report ID from database');
      }
      
      let hasErrors = false;
      let errorDetails = [];
  
      // Save extracted parameters if any
      if (extractedParameters?.parameters && Object.keys(extractedParameters.parameters).length > 0) {
        const parameterData = Object.entries(extractedParameters.parameters).map(([key, value]) => ({
          user_id: userId,
          record_id: insertedReport.id,
          parameter_name: key,
          parameter_value: typeof value === 'object' ? JSON.stringify(value) : String(value || "N/A"),
          created_at: new Date().toISOString()
        }));
        
        console.log('Saving parameters:', parameterData.length);
        const { error: paramError } = await supabase
          .from('health_parameters')
          .insert(parameterData);
      
        if (paramError) {
          console.error('Error saving parameters:', paramError);
          hasErrors = true;
          errorDetails.push(`Parameters: ${paramError.message}`);
        }
      } else {
        console.log('No parameters to save');
      }
  
      // Save conditions if any
      if (extractedParameters?.aiAnalysis?.conditions?.length > 0) {
        const conditionData = extractedParameters.aiAnalysis.conditions
          .filter(condition => condition && condition.trim()) // Filter out empty strings
          .map(condition => ({
            record_id: insertedReport.id,
            condition_name: condition.trim(),
            user_id: userId,
            created_at: new Date().toISOString()
          }));
        
        console.log('Saving conditions:', conditionData.length);
        const { error: condError } = await supabase
          .from('report_conditions')
          .insert(conditionData);
      
        if (condError) {
          console.error('Error saving conditions:', condError);
          hasErrors = true;
          errorDetails.push(`Conditions: ${condError.message}`);
        }
      } else {
        console.log('No conditions to save');
      }
      
      // Save medications if any
      if (extractedParameters?.aiAnalysis?.medications?.length > 0) {
        const medicationData = extractedParameters.aiAnalysis.medications
          .filter(medication => medication && medication.trim()) // Filter out empty strings
          .map(medication => ({
            record_id: insertedReport.id,
            medication_name: medication.trim(),
            user_id: userId, // Add user_id here as well for consistency
            created_at: new Date().toISOString()
          }));
        
        console.log('Saving medications:', medicationData.length);
        const { error: medError } = await supabase
          .from('report_medications')
          .insert(medicationData);
      
        if (medError) {
          console.error('Error saving medications:', medError);
          hasErrors = true;
          errorDetails.push(`Medications: ${medError.message}`);
        }
      } else {
        console.log('No medications to save');
      }
      
      // Save recommendations if any
      if (extractedParameters?.aiAnalysis?.recommendations) {
        console.log('Saving recommendations');
        const { error: recError } = await supabase
          .from('report_recommendations')
          .insert([{
            record_id: insertedReport.id,
            recommendation_text: extractedParameters.aiAnalysis.recommendations,
            user_id: userId, // Add user_id here as well for consistency
            created_at: new Date().toISOString()
          }]);
      
        if (recError) {
          console.error('Error saving recommendations:', recError);
          hasErrors = true;
          errorDetails.push(`Recommendations: ${recError.message}`);
        }
      } else {
        console.log('No recommendations to save');
      }
  
      // Refresh data
      await fetchHealthData(userId);
      
      // Reset form
      setShowModal(false);
      setNewReport({ disease_id: '', since: '', file: null });
      setPreview(null);
      setExtractedParameters({});
      
      // Show success notification with any partial errors
      if (hasErrors) {
        showNotification(`Report uploaded but some data couldn't be saved: ${errorDetails.join(', ')}`, 'warning');
      } else {
        showNotification('Report uploaded successfully!', 'success');
      }
      
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
      // First, get the report details to find related resources
      const { data: report, error: fetchError } = await supabase
        .from('healthrecords')
        .select('*')
        .eq('id', reportToDelete)
        .single();
      
      if (fetchError) {
        console.error('Error fetching report:', fetchError);
        throw new Error(`Error fetching report: ${fetchError.message}`);
      }
      
      console.log('Report to delete:', report);
      
      // Delete related data first (due to foreign key constraints)
      // Use explicit error logging for each deletion
      
      try {
        const { error: paramError } = await supabase
          .from('health_parameters')
          .delete()
          .eq('record_id', reportToDelete);
        
        if (paramError) console.error('Error deleting health parameters:', paramError);
      } catch (error) {
        console.error('Exception deleting health parameters:', error);
      }
      
      try {
        const { error: condError } = await supabase
          .from('report_conditions')
          .delete()
          .eq('record_id', reportToDelete);
        
        if (condError) console.error('Error deleting report conditions:', condError);
      } catch (error) {
        console.error('Exception deleting report conditions:', error);
      }
      
      try {
        const { error: medError } = await supabase
          .from('report_medications')
          .delete()
          .eq('record_id', reportToDelete);
        
        if (medError) console.error('Error deleting report medications:', medError);
      } catch (error) {
        console.error('Exception deleting report medications:', error);
      }
      
      try {
        const { error: recError } = await supabase
          .from('report_recommendations')
          .delete()
          .eq('record_id', reportToDelete);
        
        if (recError) console.error('Error deleting report recommendations:', recError);
      } catch (error) {
        console.error('Exception deleting report recommendations:', error);
      }
      
      try {
        const { error: aiError } = await supabase
          .from('report_ai_analysis')
          .delete()
          .eq('report_id', reportToDelete);
        
        if (aiError) console.error('Error deleting AI analysis:', aiError);
      } catch (error) {
        console.error('Exception deleting AI analysis:', error);
      }
      
      // Delete the storage file if it exists
      if (report.document_url) {
        try {
          // Extract the file path from the URL
          // URL format: https://[project-ref].supabase.co/storage/v1/object/public/health-reports/[userId]/[filename]
          const fileName = report.document_url.split('/').pop();
          
          // Different approach to get the user folder
          const pathMatch = report.document_url.match(/health-reports\/([^\/]+)\/([^\/]+)$/);
          let storagePath;
          
          if (pathMatch && pathMatch.length >= 3) {
            const userFolder = pathMatch[1];
            const fileNameFromUrl = pathMatch[2];
            storagePath = `${userFolder}/${fileNameFromUrl}`;
          } else {
            // Fallback approach
            storagePath = `${userId}/${fileName}`;
          }
          
          console.log('Attempting to delete file at path:', storagePath);
          
          const { error: storageError } = await supabase.storage
            .from('health-reports')
            .remove([storagePath]);
          
          if (storageError) {
            console.error('Error deleting file:', storageError);
          } else {
            console.log('File deleted successfully');
          }
        } catch (error) {
          console.error('Exception during file deletion:', error);
          // Continue with record deletion even if file deletion fails
        }
      }
      
      // Finally delete the report record
      const { error: deleteError } = await supabase
        .from('healthrecords')
        .delete()
        .eq('id', reportToDelete);
      
      if (deleteError) {
        console.error('Error deleting healthrecord:', deleteError);
        throw new Error(`Error deleting report: ${deleteError.message}`);
      }
      
      console.log('Report deleted successfully');
      
      // Manually remove from state for immediate UI update
      setHealthData(healthData.filter(report => report.id !== reportToDelete));
      
      // Refresh data from the database
      fetchHealthData(userId);
      
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

  // Add a function to handle notifications
  const showNotification = (message, type = 'info', duration = 5000) => {
    // Clear any existing timeout
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }
    
    // Set the notification
    setNotification({ message, type });
    
    // Set a timeout to clear the notification
    const timeout = setTimeout(() => {
      setNotification(null);
    }, duration);
    
    setNotificationTimeout(timeout);
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
      
      <Row>
        {healthData.map((report) => (
          <Col md={3} sm={6} key={report.id} className="mb-3">
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title>Disease: {report.user_diseases?.disease_name}</Card.Title>
                <Card.Text>Since: {report.since}</Card.Text>
                <div className="d-flex justify-content-between">
                  <Button 
                    variant="danger" 
                    size="md" 
                    className='m-2' 
                    style={styles.actionButton}
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    Delete
                  </Button>
                  <Button 
                    variant="info" 
                    size="md" 
                    className='m-2' 
                    style={styles.actionButton}
                    onClick={() => window.open(report.document_url, '_blank')}
                  >
                    View
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Upload New Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Select Disease</Form.Label>
              <Form.Select 
                value={newReport.disease_id}
                onChange={(e) => setNewReport({ ...newReport, disease_id: e.target.value })}
                required
              >
                <option value="">Select a disease</option>
                {userDiseases.map((disease) => (
                  <option key={disease.id} value={disease.id}>
                    {disease.disease_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Since</Form.Label>
              <Form.Control 
                type="date" 
                value={newReport.since}
                onChange={(e) => setNewReport({ ...newReport, since: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Upload File</Form.Label>
              <Form.Control 
                type="file" 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                onChange={handleFileChange}
                required
              />
            </Form.Group>
            {preview && <img src={preview} alt="Preview" className="img-fluid rounded mb-3" />}

            {/* Show message if file was processed but no data extracted */}
            {extractedParameters && 
              (!extractedParameters.parameters || Object.keys(extractedParameters.parameters).length === 0) &&
              (!extractedParameters.aiAnalysis || Object.keys(extractedParameters.aiAnalysis).length === 0) && (
              <div className="alert alert-info mt-3">
                <i className="bi bi-info-circle me-2"></i>
                No parameters or analysis could be extracted from this document. 
                You can still upload it for record-keeping.
              </div>
            )}
            
            {/* Display extracted parameters */}
            {extractedParameters.parameters && Object.keys(extractedParameters.parameters).length > 0 && (
              <div className="mb-3">
                <h5>Extracted Parameters:</h5>
                <ul className="list-group">
                  {Object.entries(extractedParameters.parameters).map(([name, value]) => (
                    <li key={name} className="list-group-item">
                      {name}: {typeof value === 'object' ? JSON.stringify(value) : String(value || 'N/A')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Display AI analysis */}
            {extractedParameters?.aiAnalysis ? (
              <div className="mb-3">
                <h5>AI Analysis</h5>
                <div className="card">
                  <div className="card-body">
                    {/* Check if summary exists */}
                    {extractedParameters.aiAnalysis.summary ? (
                      <>
                        <h6>Summary</h6>
                        <p>{String(extractedParameters.aiAnalysis.summary)}</p>
                      </>
                    ) : (
                      <p className="text-muted">No summary available for this document.</p>
                    )}
                    
                    {/* Display conditions */}
                    {extractedParameters.aiAnalysis.conditions && 
                      extractedParameters.aiAnalysis.conditions.length > 0 && (
                      <>
                        <h6 className="mt-3">Conditions Identified</h6>
                        <ul className="list-group">
                          {extractedParameters.aiAnalysis.conditions.map((condition, index) => (
                            <li key={index} className="list-group-item list-group-item-info">
                              {String(condition)}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    
                    {/* Display medications */}
                    {extractedParameters.aiAnalysis.medications && 
                      extractedParameters.aiAnalysis.medications.length > 0 && (
                      <>
                        <h6 className="mt-3">Medications</h6>
                        <ul className="list-group">
                          {extractedParameters.aiAnalysis.medications.map((medication, index) => (
                            <li key={index} className="list-group-item list-group-item-warning">
                              {String(medication)}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    
                    {/* Display recommendations */}
                    {extractedParameters.aiAnalysis.recommendations && (
                      <>
                        <h6 className="mt-3">Recommendations</h6>
                        <p>{String(extractedParameters.aiAnalysis.recommendations)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Report'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this report?</p>
          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="me-2">
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
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
