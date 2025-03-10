import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Card, Container, Row, Col } from 'react-bootstrap';
import supabase from '../supabaseClient';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';

const HealthOverview = () => {
  const [healthData, setHealthData] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userDetails, setUserDetails] = useState({ first_name: '', last_name: '', email: '' });
  const [showModal, setShowModal] = useState(false);
  const [newReport, setNewReport] = useState({ disease_name: '', since: '', disease_type: '', file: null });
  const [preview, setPreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return;
      if (user) {
        setUserId(user.id);
        fetchHealthData(user.id);
        fetchUserDetails(user.id);
      }
      setLoading(false);
    };

    const fetchUserDetails = async (uid) => {
      const { data, error } = await supabase.from('profiles').select('first_name, last_name, email').eq('id', uid).single();
      if (!error) setUserDetails(data);
    };

    fetchUser();
  }, []);

  const fetchHealthData = async (uid) => {
    setLoading(true);
    const { data, error } = await supabase.from('healthrecords').select('*').eq('user_id', uid);
    if (!error) setHealthData(data);
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewReport({ ...newReport, file });
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  return (
    <Container className="py-4">
      {loading && <Spinner />}
      {notification && <div className={`alert alert-${notification.type}`} role="alert">{notification.message}</div>}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary">Health Reports</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>+ Upload Report</Button>
      </div>
      
      <Row>
        {healthData.map((report) => (
          <Col md={3} sm={6} key={report.id} className="mb-3">
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title>Disease: {report.disease_name}</Card.Title>
                <Card.Text>Type: {report.disease_type}</Card.Text>
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
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Disease Name</Form.Label>
              <Form.Control type="text" placeholder="Enter disease name" onChange={(e) => setNewReport({ ...newReport, disease_name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Since</Form.Label>
              <Form.Control type="text" placeholder="Since when" onChange={(e) => setNewReport({ ...newReport, since: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Disease Type</Form.Label>
              <Form.Control type="text" placeholder="Enter disease type" onChange={(e) => setNewReport({ ...newReport, disease_type: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Upload File</Form.Label>
              <Form.Control type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} />
            </Form.Group>
            {preview && <img src={preview} alt="Preview" className="img-fluid rounded mb-3" />}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="primary" onClick={() => console.log('Upload')}>Upload</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default HealthOverview;
