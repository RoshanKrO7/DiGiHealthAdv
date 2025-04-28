import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, ListGroup, Modal } from 'react-bootstrap';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import { 
  FaSyringe, FaPlus, FaTrash, FaEdit, FaCalendarCheck, 
  FaCalendarAlt, FaUserMd, FaInfoCircle, FaShieldVirus, 
  FaHospital, FaClock, FaStickyNote, FaHistory, FaListAlt
} from 'react-icons/fa';
import './VaccinationHistoryPage.css';

const VaccinationHistoryPage = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('records'); // 'records' or 'form'
  const [currentVaccination, setCurrentVaccination] = useState({
    id: null,
    vaccine_name: '',
    date_administered: '',
    administered_by: '',
    lot_number: '',
    next_dose_date: '',
    notes: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);

  const navigate = useNavigate();

  const fetchVaccinations = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user logged in');
        setLoading(false);
        return; // Return early instead of redirecting
      }
      
      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('user_id', user.id)
        .order('vaccine_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching vaccinations:', error);
        return;
      }
      
      setVaccinations(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchVaccinations();
  }, [fetchVaccinations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentVaccination(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      if (isEditing) {
        // Update existing vaccination
        const { error } = await supabase
          .from('vaccinations')
          .update({
            vaccine_name: currentVaccination.vaccine_name,
            date_administered: currentVaccination.date_administered,
            administered_by: currentVaccination.administered_by,
            lot_number: currentVaccination.lot_number,
            next_dose_date: currentVaccination.next_dose_date,
            notes: currentVaccination.notes
          })
          .eq('id', currentVaccination.id);
          
        if (error) throw error;
        setNotification({ message: 'Vaccination record updated successfully!', type: 'success' });
      } else {
        // Add new vaccination
        const { error } = await supabase
          .from('vaccinations')
          .insert([{
            vaccine_name: currentVaccination.vaccine_name,
            date_administered: currentVaccination.date_administered,
            administered_by: currentVaccination.administered_by,
            lot_number: currentVaccination.lot_number,
            next_dose_date: currentVaccination.next_dose_date,
            notes: currentVaccination.notes,
            user_id: user.id
          }]);
          
        if (error) throw error;
        setNotification({ message: 'Vaccination record added successfully!', type: 'success' });
      }
      
      // Reset form and fetch updated vaccinations
      resetForm();
      fetchVaccinations();
      setActiveTab('records'); // Switch back to records view after successful submission
    } catch (error) {
      console.error('Error saving vaccination record:', error);
      setNotification({ message: 'Error saving vaccination record.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vaccination) => {
    setIsEditing(true);
    setCurrentVaccination(vaccination);
    setActiveTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vaccination record?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vaccinations')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setVaccinations(vaccinations.filter(vaccination => vaccination.id !== id));
      setNotification({ message: 'Vaccination record deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting vaccination record:', error);
      setNotification({ message: 'Error deleting vaccination record.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentVaccination({
      id: null,
      vaccine_name: '',
      date_administered: '',
      administered_by: '',
      lot_number: '',
      next_dose_date: '',
      notes: ''
    });
  };

  // Check if a vaccination is due soon (within 30 days)
  const isDueSoon = (nextDoseDate) => {
    if (!nextDoseDate) return false;
    
    const today = new Date();
    const dueDate = new Date(nextDoseDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 30;
  };

  // Check if a vaccination is overdue
  const isOverdue = (nextDoseDate) => {
    if (!nextDoseDate) return false;
    
    const today = new Date();
    const dueDate = new Date(nextDoseDate);
    
    return dueDate < today;
  };

  // Get status text and class
  const getStatusInfo = (vaccination) => {
    if (isOverdue(vaccination.next_dose_date)) {
      return { text: 'Overdue', className: 'status-overdue' };
    } else if (isDueSoon(vaccination.next_dose_date)) {
      return { text: 'Due Soon', className: 'status-due-soon' };
    } else if (vaccination.next_dose_date) {
      return { text: 'Scheduled', className: '' };
    } else {
      return { text: 'Completed', className: 'status-completed' };
    }
  };

  // Add function to handle opening the add modal
  const handleOpenAddModal = () => {
    resetForm(); // Ensure the form is reset
    setShowAddModal(true);
  };

  if (loading && vaccinations.length === 0) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const hasUpcomingVaccines = vaccinations.some(vax => 
    isDueSoon(vax.next_dose_date) || isOverdue(vax.next_dose_date)
  );

  return (
    <Container>
      <h1 className="my-4 page-title">
        <FaSyringe className="me-2 text-primary" /> Vaccination History
      </h1>
      
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          <div className="tabs-container">
            <div className="nav-tabs-wrapper">
              <ul className="nav nav-tabs">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'records' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('records')}
                  >
                    <FaListAlt className="me-2" /> Vaccination Records
                    {hasUpcomingVaccines && <span className="upcoming-badge ms-2">!</span>}
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'form' ? 'active' : ''}`} 
                    onClick={() => {
                      setActiveTab('form');
                      if (isEditing) {
                        resetForm();
                      }
                    }}
                  >
                    <FaPlus className="me-2" /> {isEditing ? 'Edit Record' : 'Add New Record'}
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="tab-content">
              {activeTab === 'records' && (
                <div className="tab-pane active">
                  {vaccinations.length === 0 ? (
                    <div className="empty-state">
                      <FaSyringe className="mb-3" style={{ fontSize: '3rem', color: 'var(--secondary-color)' }} />
                      <h3 className="text-primary">No vaccination records found</h3>
                      <p>Click "Add New Record" tab to record your first vaccination</p>
                      <Button variant="primary" onClick={() => setActiveTab('form')}>
                        <FaPlus className="me-2" /> Add New Record
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Upcoming Vaccinations Section */}
                      {hasUpcomingVaccines && (
                        <div className="upcoming-section">
                          <div className="upcoming-header">
                            <h3 className="mb-0"><FaCalendarCheck className="me-2" /> Upcoming & Overdue Vaccinations</h3>
                          </div>
                          <div className="upcoming-body">
                            <div className="table-responsive">
                              <table className="table">
                                <thead>
                                  <tr>
                                    <th>Vaccine</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {vaccinations
                                    .filter(vax => isDueSoon(vax.next_dose_date) || isOverdue(vax.next_dose_date))
                                    .map(vax => (
                                      <tr key={`upcoming-${vax.id}`}>
                                        <td><FaSyringe className="me-2 text-primary" /> {vax.vaccine_name}</td>
                                        <td><FaCalendarAlt className="me-2 text-primary" /> {new Date(vax.next_dose_date).toLocaleDateString()}</td>
                                        <td>
                                          <span className={`status-badge ${isOverdue(vax.next_dose_date) ? 'status-overdue' : 'status-due-soon'}`}>
                                            {isOverdue(vax.next_dose_date) ? 'Overdue' : 'Due Soon'}
                                          </span>
                                        </td>
                                        <td>
                                          <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(vax)}>
                                            <FaEdit className="me-1" /> Edit
                                          </button>
                                        </td>
                                      </tr>
                                    ))
                                  }
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <h2 className="section-title">Your Vaccination History</h2>
                      
                      <div className="vaccination-cards">
                        {vaccinations.map((vaccination) => {
                          const status = getStatusInfo(vaccination);
                          return (
                            <div className="vaccine-card" key={vaccination.id}>
                              <h4><FaSyringe className="me-2 text-primary" />{vaccination.vaccine_name}</h4>
                              
                              <div className="vaccine-card-info">
                                <p>
                                  <strong><FaCalendarAlt className="me-1 text-primary" /> Date Administered:</strong> 
                                  {new Date(vaccination.date_administered).toLocaleDateString()}
                                </p>
                                {vaccination.administered_by && (
                                  <p><strong><FaUserMd className="me-1 text-primary" /> Healthcare Provider:</strong> {vaccination.administered_by}</p>
                                )}
                                {vaccination.lot_number && (
                                  <p><strong><FaInfoCircle className="me-1 text-primary" /> Lot Number:</strong> {vaccination.lot_number}</p>
                                )}
                                <p>
                                  <strong><FaCalendarCheck className="me-1 text-primary" /> Next Dose:</strong> 
                                  {vaccination.next_dose_date
                                    ? new Date(vaccination.next_dose_date).toLocaleDateString()
                                    : 'N/A'
                                  }
                                  {status.className && (
                                    <span className={`status-badge ${status.className}`}>
                                      {status.text}
                                    </span>
                                  )}
                                </p>
                                {vaccination.notes && (
                                  <p><strong><FaStickyNote className="me-1 text-primary" /> Notes:</strong> {vaccination.notes}</p>
                                )}
                              </div>
                              
                              <div className="vaccine-card-actions">
                                <button 
                                  className="btn btn-primary" 
                                  onClick={() => handleEdit(vaccination)}
                                >
                                  <FaEdit className="me-2" /> Edit
                                </button>
                                <button 
                                  className="btn btn-danger" 
                                  onClick={() => handleDelete(vaccination.id)}
                                >
                                  <FaTrash className="me-2" /> Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
        </div>
      )}
      
              {activeTab === 'form' && (
                <div className="tab-pane active">
                  <div className="vaccine-form-card">
                    <h3 className="form-title">
                      {isEditing ? (
                        <><FaEdit className="me-2 text-primary" /> Edit Vaccination Record</>
                      ) : (
                        <><FaPlus className="me-2 text-primary" /> Add New Vaccination</>
                      )}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="vaccination-form">
                      <div className="form-section">
                        <h4 className="form-section-title">
                          <FaShieldVirus className="me-2 text-primary" /> Basic Information
                        </h4>
          <div className="row">
            <div className="col-md-6 mb-3">
                            <label htmlFor="vaccine_name" className="form-label text-dark">
                              <span className="text-danger">*</span> Vaccine Name
                            </label>
              <input 
                type="text" 
                className="form-control" 
                id="vaccine_name" 
                name="vaccine_name" 
                value={currentVaccination.vaccine_name} 
                onChange={handleChange} 
                              placeholder="Enter vaccine name"
                required 
              />
                            <small className="form-text text-muted">
                              <FaInfoCircle className="me-1" /> E.g., Influenza, COVID-19, Tetanus, HPV
                            </small>
            </div>
            <div className="col-md-6 mb-3">
                            <label htmlFor="date_administered" className="form-label text-dark">
                              <span className="text-danger">*</span> Date Administered
                            </label>
              <input 
                type="date" 
                className="form-control" 
                id="date_administered" 
                name="date_administered" 
                value={currentVaccination.date_administered} 
                onChange={handleChange} 
                required 
              />
                            <small className="form-text text-muted">
                              <FaCalendarAlt className="me-1" /> When was the vaccine administered?
                            </small>
                          </div>
            </div>
          </div>
          
                      <div className="form-section">
                        <h4 className="form-section-title">
                          <FaUserMd className="me-2 text-primary" /> Additional Details
                        </h4>
          <div className="row">
            <div className="col-md-6 mb-3">
                            <label htmlFor="administered_by" className="form-label text-dark">
                              <FaHospital className="me-1 text-primary" /> Healthcare Provider
                            </label>
              <input 
                type="text" 
                className="form-control" 
                id="administered_by" 
                name="administered_by" 
                value={currentVaccination.administered_by} 
                onChange={handleChange} 
                              placeholder="Enter provider name or facility"
              />
                            <small className="form-text text-muted">
                              <FaInfoCircle className="me-1" /> Doctor, clinic, or healthcare facility
                            </small>
            </div>
            <div className="col-md-6 mb-3">
                            <label htmlFor="lot_number" className="form-label text-dark">
                              <FaInfoCircle className="me-1 text-primary" /> Lot Number
                            </label>
              <input 
                type="text" 
                className="form-control" 
                id="lot_number" 
                name="lot_number" 
                value={currentVaccination.lot_number} 
                onChange={handleChange} 
                              placeholder="Enter vaccine lot number"
              />
                            <small className="form-text text-muted">
                              <FaInfoCircle className="me-1" /> Found on your vaccination card
                            </small>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
                            <label htmlFor="next_dose_date" className="form-label text-dark">
                              <FaCalendarCheck className="me-1 text-primary" /> Next Dose Date
                            </label>
              <input 
                type="date" 
                className="form-control" 
                id="next_dose_date" 
                name="next_dose_date" 
                value={currentVaccination.next_dose_date} 
                onChange={handleChange} 
              />
                            <small className="form-text text-muted">
                              <FaClock className="me-1" /> If another dose is required
                            </small>
            </div>
            <div className="col-md-6 mb-3">
                            <label htmlFor="notes" className="form-label text-dark">
                              <FaStickyNote className="me-1 text-primary" /> Notes
                            </label>
              <textarea 
                className="form-control" 
                id="notes" 
                name="notes" 
                rows="3" 
                value={currentVaccination.notes} 
                onChange={handleChange}
                              placeholder="Any reactions, side effects, or important information"
              ></textarea>
                          </div>
            </div>
          </div>
          
                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary btn-lg">
                          {isEditing ? (
                            <><FaEdit className="me-2" /> Update Record</>
                          ) : (
                            <><FaPlus className="me-2" /> Save Record</>
                          )}
            </button>
            {isEditing && (
                          <button type="button" className="btn btn-secondary btn-lg ms-3" onClick={resetForm}>
                Cancel
              </button>
            )}
                        <button 
                          type="button" 
                          className="btn btn-light btn-lg ms-auto" 
                          onClick={() => setActiveTab('records')}
                        >
                          Back to Records
                        </button>
          </div>
        </form>
      </div>
          </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {notification && (
        <div className={`alert alert-${notification.type} text-center alert-dismissible fade show`}>
          {notification.message}
                    <button 
            type="button" 
            className="btn-close" 
            onClick={() => setNotification(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Add Vaccination Modal */}
      <Modal 
        show={showAddModal} 
        onHide={() => setShowAddModal(false)} 
        size="lg" 
        centered
        className="vaccination-modal"
      >
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title>
            <FaPlus className="me-2 text-primary" /> Add New Vaccination
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <div className="vaccine-form-card border-0">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
              setShowAddModal(false);
            }} className="vaccination-form">
              <div className="form-section">
                <h4 className="form-section-title text-dark">
                  <FaShieldVirus className="me-2 text-primary" /> Basic Information
                </h4>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="vaccine_name" className="form-label text-dark">
                      <span className="text-danger">*</span> Vaccine Name
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="vaccine_name" 
                      name="vaccine_name" 
                      value={currentVaccination.vaccine_name} 
                      onChange={handleChange} 
                      placeholder="Enter vaccine name"
                      required 
                    />
                    <small className="form-text text-muted">
                      <FaInfoCircle className="me-1" /> E.g., Influenza, COVID-19, Tetanus, HPV
                    </small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="date_administered" className="form-label text-dark">
                      <span className="text-danger">*</span> Date Administered
                    </label>
                    <input 
                      type="date" 
                      className="form-control" 
                      id="date_administered" 
                      name="date_administered" 
                      value={currentVaccination.date_administered} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h4 className="form-section-title text-dark">
                  <FaUserMd className="me-2 text-primary" /> Additional Details
                </h4>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="administered_by" className="form-label text-dark">
                      Healthcare Provider
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="administered_by" 
                      name="administered_by" 
                      value={currentVaccination.administered_by} 
                      onChange={handleChange} 
                      placeholder="Enter provider name or facility"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="lot_number" className="form-label text-dark">
                      Lot Number
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="lot_number" 
                      name="lot_number" 
                      value={currentVaccination.lot_number} 
                      onChange={handleChange} 
                      placeholder="Enter vaccine lot number"
                    />
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="next_dose_date" className="form-label text-dark">
                      <FaCalendarCheck className="me-1 text-primary" /> Next Dose Date
                    </label>
                    <input 
                      type="date" 
                      className="form-control" 
                      id="next_dose_date" 
                      name="next_dose_date" 
                      value={currentVaccination.next_dose_date} 
                      onChange={handleChange}
                    />
                    <small className="form-text text-muted">
                      <FaClock className="me-1" /> If another dose is required
                    </small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="notes" className="form-label text-dark">
                      <FaStickyNote className="me-1 text-primary" /> Notes
                    </label>
                    <textarea 
                      className="form-control" 
                      id="notes" 
                      name="notes" 
                      rows="2" 
                      value={currentVaccination.notes} 
                      onChange={handleChange}
                      placeholder="Any reactions, side effects, or important information"
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="d-flex justify-content-end mt-3">
                <Button variant="secondary" className="me-2" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  <FaPlus className="me-2" /> Save Vaccination
                </Button>
              </div>
            </form>
    </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default VaccinationHistoryPage; 