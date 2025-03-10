import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import supabase from '../supabaseClient';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';

const HealthOverview = () => {
  const [healthData, setHealthData] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userDetails, setUserDetails] = useState({ first_name: '', last_name: '', email: '' });
  const [showModal, setShowModal] = useState(false);
  const [newReport, setNewReport] = useState({
    disease_name: '',
    since: '',
    disease_type: '',
    file: null,
  });
  const [preview, setPreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHealthData = async (uid) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('healthrecords')
      .select('*')
      .eq('user_id', uid);

    if (error) {
      console.error('Error fetching health data:', error);
    } else {
      setHealthData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchUserId = async () => {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        setLoading(false);
        return;
      }
      if (user) {
        setUserId(user.id);
        fetchUserDetails(user.id);
        fetchHealthData(user.id);
      }
      setLoading(false);
    };

    const fetchUserDetails = async (uid) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', uid)
        .single();

      if (error) {
        console.error('Error fetching user details:', error);
      } else {
        setUserDetails(data);
      }
    };

    fetchUserId();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddReport = async () => {
    console.log('handleAddReport called');
    const { first_name, last_name, email } = userDetails;
    const { disease_name, since, disease_type, file } = newReport;

    if (!file) {
      showNotification('Please select a file to upload', 'warning');
      return;
    }

    try {
      setLoading(true);
      console.log('Uploading file to Supabase Storage...');
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from('DiGiHealth')
        .upload(fileName, file);

      if (fileError) {
        console.error('Error uploading file:', fileError);
        showNotification('Error uploading file', 'danger');
        setLoading(false);
        return;
      }

      console.log('Getting public URL...');
      // Get public URL
      const { data: fileUrlData, error: fileUrlError } = supabase
        .storage
        .from('DiGiHealth')
        .getPublicUrl(fileName);

      if (fileUrlError || !fileUrlData) {
        console.error('Error getting file URL:', fileUrlError);
        showNotification('Error getting file URL', 'danger');
        setLoading(false);
        return;
      }

      const fileUrl = fileUrlData.publicUrl;

      console.log('Inserting report into database...');
      // Insert report into database
      const { data: reportData, error } = await supabase
        .from('healthrecords')
        .insert([{ user_id: userId, first_name, last_name, email, disease_name, since, disease_type, document_url: fileUrl }]);

      if (error) {
        console.error('Error adding report:', error);
        showNotification('Error adding report', 'danger');
      } else {
        setShowModal(false); // Close the modal first
        setNewReport({ disease_name: '', since: '', disease_type: '', file: null });
        setPreview(null);
        showNotification('Report added successfully!', 'success');
        // Refresh the health data
        fetchHealthData(userId);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      showNotification('Unexpected error occurred', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('healthrecords')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Error deleting report:', error);
      showNotification('Error deleting report', 'danger');
    } else {
      setHealthData(healthData.filter(report => report.id !== reportId));
      showNotification('Report deleted successfully!', 'success');
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewReport({ ...newReport, file });

    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {loading && <Spinner />}

      {/* Notification Container */}
      {notification && (
        <div className={`alert alert-${notification.type} alert-dismissible fade show`} role="alert">
          {notification.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Health Reports</h1>
        <Button onClick={() => setShowModal(true)} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '5px', fontSize: '14px' }}>
          Upload New Report
        </Button>
      </div>

      {/* Health Records Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {healthData.map((report) => (
          <div key={report.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <p>{report.disease_name}</p>
            <p>{report.disease_type}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Button onClick={() => handleDeleteReport(report.id)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>
                Delete
              </Button>
              <Button onClick={() => window.open(report.document_url, '_blank')} style={{ background: 'blue', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>
                View
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Uploading New Report */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload New Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formDiseaseName">
              <Form.Label>Disease Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter disease name"
                value={newReport.disease_name}
                onChange={(e) => setNewReport({ ...newReport, disease_name: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="formSince">
              <Form.Label>Since</Form.Label>
              <Form.Control
                type="text"
                placeholder="Since when"
                value={newReport.since}
                onChange={(e) => setNewReport({ ...newReport, since: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="formDiseaseType">
              <Form.Label>Disease Type</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter disease type"
                value={newReport.disease_type}
                onChange={(e) => setNewReport({ ...newReport, disease_type: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="formReportFile">
              <Form.Label>File</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              {preview && (
                <div style={{ marginTop: '10px' }}>
                  <img src={preview} alt="File Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleAddReport}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HealthOverview;
