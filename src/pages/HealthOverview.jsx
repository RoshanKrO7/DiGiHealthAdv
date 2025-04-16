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
    const { data, error } = await supabase
      .from('healthrecords')
      .select(`
        *,
        user_diseases(disease_name)
      `)
      .eq('user_id', uid);
    if (!error) setHealthData(data);
    setLoading(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setNewReport({ ...newReport, file });
    setLoading(true);
    
    try {
      // Show preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Send to backend for processing
      const response = await fetch('https://digihealth-backend.onrender.com/api/process-file', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error processing file');
      }
      
      const result = await response.json();
      console.log('Backend response:', result);

      // Add fallback for empty AI analysis
      if (!result.aiAnalysis || 
          (!result.aiAnalysis.summary && 
           result.aiAnalysis.conditions.length === 0 && 
           result.aiAnalysis.medications.length === 0 && 
           !result.aiAnalysis.recommendations)) {
        
        // Create a basic fallback analysis based on file name and type
        result.aiAnalysis = {
          summary: `This appears to be a medical document of type ${file.type.split('/')[1]}. Review manually for detailed information.`,
          conditions: [],
          medications: [],
          recommendations: "Consider reviewing this document with a healthcare professional."
        };
      }

      setExtractedParameters(result);
      
      // Determine what message to show
      let message;
      if (result.parameters && Object.keys(result.parameters).length > 0) {
        message = 'File processed successfully. Review the extracted information below.';
      } else if (result.aiAnalysis && Object.keys(result.aiAnalysis).length > 0) {
        message = 'No specific parameters were extracted, but AI analysis is available.';
      } else {
        message = 'File processed, but no information could be extracted. You can still upload it.';
      }
      
      // Show success notification
      setNotification({
        message: message,
        type: 'success'
      });
      
      console.log('Backend response structure:', {
        hasParameters: Boolean(result.parameters) && Object.keys(result.parameters).length > 0,
        hasAiAnalysis: Boolean(result.aiAnalysis),
        summaryExists: Boolean(result.aiAnalysis?.summary),
        conditionsLength: result.aiAnalysis?.conditions?.length || 0,
        medicationsLength: result.aiAnalysis?.medications?.length || 0,
        hasRecommendations: Boolean(result.aiAnalysis?.recommendations)
      });

    } catch (error) {
      console.error('Error processing file:', error);
      setNotification({
        message: `Error processing file: ${error.message}`,
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      // Upload file to Supabase Storage
      const fileExt = newReport.file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('health-reports')
        .upload(fileName, newReport.file);
  
      if (uploadError) throw uploadError;
  
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('health-reports')
        .getPublicUrl(fileName);
  
      // Insert report into healthrecords
      const { data: reportData, error: reportError } = await supabase
        .from('healthrecords')
        .insert([{
          user_id: userId,
          disease_id: newReport.disease_id,
          since: newReport.since,
          document_url: publicUrl,
          created_at: new Date().toISOString(),
          ai_summary: extractedParameters.aiAnalysis?.summary || null
        }])
        .select()
        .single();
  
      if (reportError) throw reportError;
  
      // Save extracted parameters if any
      if (extractedParameters?.parameters && Object.keys(extractedParameters.parameters).length > 0) {
        const { error: paramError } = await supabase
          .from('health_parameters')
          .insert(
            Object.entries(extractedParameters.parameters).map(([key, value]) => ({
              user_id: userId,
              record_id: reportData.id,
              parameter_name: key,
              parameter_value: value || "N/A", // Provide default for empty values
              created_at: new Date().toISOString()
            }))
          );
      
        if (paramError) console.error('Error saving parameters:', paramError);
      } else {
        console.log('No parameters to save');
      }
  
      // Save conditions if any
      if (extractedParameters?.aiAnalysis?.conditions?.length > 0) {
        const { error: condError } = await supabase
          .from('report_conditions')
          .insert(
            extractedParameters.aiAnalysis.conditions.map(condition => ({
              record_id: reportData.id,
              condition_name: condition,
              user_id: userId, // Add this line
              created_at: new Date().toISOString()
            }))
          );
      
        if (condError) console.error('Error saving conditions:', condError);
      } else {
        console.log('No conditions to save');
      }
      
      // Save medications if any
      if (extractedParameters?.aiAnalysis?.medications?.length > 0) {
        const { error: medError } = await supabase
          .from('report_medications')
          .insert(
            extractedParameters.aiAnalysis.medications.map(medication => ({
              record_id: reportData.id,
              medication_name: medication,
              created_at: new Date().toISOString()
            }))
          );
      
        if (medError) console.error('Error saving medications:', medError);
      } else {
        console.log('No medications to save');
      }
      
      // Save recommendations if any
      if (extractedParameters?.aiAnalysis?.recommendations) {
        const { error: recError } = await supabase
          .from('report_recommendations')
          .insert([{
            record_id: reportData.id,
            recommendation_text: extractedParameters.aiAnalysis.recommendations,
            created_at: new Date().toISOString()
          }]);
      
        if (recError) console.error('Error saving recommendations:', recError);
      } else {
        console.log('No recommendations to save');
      }
  
      // Refresh data
      fetchHealthData(userId);
      
      // Reset form
      setShowModal(false);
      setNewReport({ disease_id: '', since: '', file: null });
      setPreview(null);
      setExtractedParameters({});
      
      // Show success notification
      setNotification({
        message: 'Report uploaded successfully!',
        type: 'success'
      });
      
    } catch (error) {
      console.error('Error uploading report:', error);
      setNotification({
        message: `Error uploading report: ${error.message}`,
        type: 'danger'
      });
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
      
      setNotification({
        message: 'Report deleted successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error in delete process:', error);
      setNotification({
        message: `Error deleting report: ${error.message}`,
        type: 'danger'
      });
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setReportToDelete(null);
    }
  };

  return (
    <Container className="py-4">
      {loading && <Spinner />}
      {notification && (
        <div 
          className={`alert alert-${notification.type} position-fixed`} 
          style={{top: '20px', right: '20px', zIndex: 1050}}
          role="alert"
        >
          {notification.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setNotification(null)}
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
                      {name}: {value}
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
                        <p>{extractedParameters.aiAnalysis.summary}</p>
                      </>
                    ) : (
                      <p className="text-muted">No summary available for this document.</p>
                    )}
                    
                    {/* Rest of your display logic */}
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
    </Container>
  );
};

export default HealthOverview;
