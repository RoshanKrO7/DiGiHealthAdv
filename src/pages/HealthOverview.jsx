import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Card, Container, Row, Col } from 'react-bootstrap';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    setNewReport({ ...newReport, file });
    
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
      }

      // Extract parameters from the file
      try {
        const extractedData = await extractParametersFromFile(file);
        setExtractedParameters(extractedData);
      } catch (error) {
        console.error('Error extracting parameters:', error);
        setNotification({ message: 'Error extracting parameters from file', type: 'danger' });
      }
    }
  };

  const extractParametersFromFile = async (file) => {
    try {
      let text = '';
      
      // Read file content based on type
      if (file.type === 'application/pdf') {
        // For PDF files, we'll use a simple text extraction
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map(item => item.str).join(' ') + '\n';
        }
      } else {
        // For text files, read directly
        text = await file.text();
      }

      // Extract parameters using user's defined parameters
      const extractedData = {};
      userParameters.forEach(param => {
        // Create a regex pattern to find the parameter value
        // This will look for patterns like "Parameter: value" or "Parameter = value"
        const pattern = new RegExp(`${param.parameter_name}\\s*[:=]\\s*([\\d.]+)`, 'i');
        const match = text.match(pattern);
        if (match) {
          extractedData[param.parameter_name] = match[1];
        }
      });

      return extractedData;
    } catch (error) {
      console.error('Error extracting parameters:', error);
      throw error;
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
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (reportError) throw reportError;

      // Save extracted parameters
      if (Object.keys(extractedParameters).length > 0) {
        const parameterRecords = Object.entries(extractedParameters).map(([name, value]) => ({
          report_id: reportData.id,
          parameter_id: userParameters.find(p => p.parameter_name === name)?.id,
          value: value
        }));

        const { error: paramError } = await supabase
          .from('report_parameters')
          .insert(parameterRecords);

        if (paramError) throw paramError;
      }

      setNotification({ message: 'Report uploaded successfully!', type: 'success' });
      setShowModal(false);
      fetchHealthData(userId);
    } catch (error) {
      console.error('Error uploading report:', error);
      setNotification({ message: 'Error uploading report', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      {loading && <Spinner />}
      {notification && (
        <div className={`alert alert-${notification.type}`} role="alert">
          {notification.message}
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
                  <Button variant="danger" size="md" className='m-2' onClick={() => console.log('Delete', report.id)}>Delete</Button>
                  <Button variant="info" size="md" className='m-2' onClick={() => window.open(report.document_url, '_blank')}>View</Button>
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
            
            {/* Display extracted parameters */}
            {Object.keys(extractedParameters).length > 0 && (
              <div className="mb-3">
                <h5>Extracted Parameters:</h5>
                <ul className="list-group">
                  {Object.entries(extractedParameters).map(([name, value]) => (
                    <li key={name} className="list-group-item">
                      {name}: {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Report'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default HealthOverview;
