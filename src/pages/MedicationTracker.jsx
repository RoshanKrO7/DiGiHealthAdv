import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Spinner from '../components/Spinner';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { 
  FaPills, FaTrash, FaPlus, FaExclamationTriangle, FaHistory, 
  FaBell, FaCheck, FaTimes, FaListAlt, FaEdit, FaCalendarAlt 
} from 'react-icons/fa';
import './MedicationTracker.css';

const MedicationTracker = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('medications'); // 'medications' or 'add'
  const [newMedication, setNewMedication] = useState({
    name: '',
    total_tablets: '',
    dose_per_intake: '',
    times_per_day: 1,
    frequency: 'daily',
    selected_days: [],
    reminder_time: '08:00'
  });
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeMedication, setActiveMedication] = useState(null);
  const [hasLowStock, setHasLowStock] = useState(false);

  useEffect(() => {
    fetchMedications();
  }, []);

  useEffect(() => {
    // Check if any medication has low stock
    const checkLowStock = medications.some(med => 
      med.remaining_tablets <= (med.dose_per_intake * med.times_per_day * 3)
    );
    setHasLowStock(checkLowStock);
  }, [medications]);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
        
      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      setNotification({ message: 'Error fetching medications.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!newMedication.name || !newMedication.total_tablets || !newMedication.dose_per_intake) {
      setNotification({ message: 'Please fill all required fields.', type: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }

      const { error } = await supabase
        .from('medications')
        .insert([{
          name: newMedication.name,
          total_tablets: parseInt(newMedication.total_tablets),
          dose_per_intake: parseInt(newMedication.dose_per_intake),
          times_per_day: parseInt(newMedication.times_per_day),
          frequency: newMedication.frequency,
          selected_days: newMedication.selected_days,
          reminder_time: newMedication.reminder_time,
          user_id: user.id,
          remaining_tablets: parseInt(newMedication.total_tablets)
        }]);

      if (error) throw error;
      
      setNewMedication({
        name: '',
        total_tablets: '',
        dose_per_intake: '',
        times_per_day: 1,
        frequency: 'daily',
        selected_days: [],
        reminder_time: '08:00'
      });
      
      setNotification({ message: 'Medication added successfully!', type: 'success' });
      fetchMedications();
      setActiveTab('medications'); // Switch back to medications list after adding
    } catch (error) {
      console.error('Error adding medication:', error);
      setNotification({ message: 'Error adding medication.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setMedications(medications.filter(med => med.id !== id));
      setNotification({ message: 'Medication deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting medication:', error);
      setNotification({ message: 'Error deleting medication.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (medicationId) => {
    try {
      const { data, error } = await supabase
        .from('medication_history')
        .select('*')
        .eq('medication_id', medicationId)
        .order('taken_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleTakeDose = async (medication) => {
    const remaining = medication.remaining_tablets - medication.dose_per_intake;
    
    if (remaining < 0) {
      setNotification({ message: 'Not enough tablets remaining!', type: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('medications')
        .update({ 
          remaining_tablets: remaining,
          last_taken_at: new Date().toISOString() 
        })
        .eq('id', medication.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('medication_history')
        .insert([{
          medication_id: medication.id,
          user_id: medication.user_id,
          status: 'taken',
          taken_at: new Date().toISOString()
        }]);

      if (historyError) throw historyError;

      setNotification({ message: 'Dose recorded successfully!', type: 'success' });
      fetchMedications();
    } catch (error) {
      console.error('Error recording dose:', error);
      setNotification({ message: 'Error recording dose.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleMissDose = async (medication) => {
    try {
      const { error } = await supabase
        .from('medication_history')
        .insert([{
          medication_id: medication.id,
          user_id: medication.user_id,
          status: 'missed',
          taken_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setNotification({ message: 'Missed dose recorded.', type: 'warning' });
      if (activeMedication?.id === medication.id) {
        fetchHistory(medication.id);
      }
    } catch (error) {
      console.error('Error recording missed dose:', error);
      setNotification({ message: 'Error recording missed dose.', type: 'danger' });
    }
  };

  const showMedicationHistory = (medication) => {
    setActiveMedication(medication);
    fetchHistory(medication.id);
    setShowHistory(true);
  };

  const handleDaySelection = (day) => {
    setNewMedication(prev => {
      const newDays = prev.selected_days.includes(day)
        ? prev.selected_days.filter(d => d !== day)
        : [...prev.selected_days, day];
      return { ...prev, selected_days: newDays };
    });
  };

  const renderMedicationsList = () => {
    if (medications.length === 0) {
      return (
        <div className="empty-state">
          <FaPills className="mb-3" style={{ fontSize: '3rem', color: 'var(--secondary-color)' }} />
          <h3 className="text-primary">No medications found</h3>
          <p>Click "Add New Medication" to record your first medication</p>
          <Button variant="primary" onClick={() => setActiveTab('add')}>
            <FaPlus className="me-2" /> Add New Medication
          </Button>
        </div>
      );
    }

    // Identify medications with low stock
    const lowStockMeds = medications.filter(med => 
      med.remaining_tablets <= (med.dose_per_intake * med.times_per_day * 3)
    );

    return (
      <>
        {lowStockMeds.length > 0 && (
          <div className="upcoming-section mb-4">
            <div className="upcoming-header">
              <h3 className="mb-0"><FaExclamationTriangle className="me-2 text-primary" /> Low Stock Medications</h3>
            </div>
            <div className="upcoming-body">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Medication</th>
                      <th>Remaining</th>
                      <th>Per Dose</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockMeds.map(med => (
                      <tr key={`low-stock-${med.id}`}>
                        <td><FaPills className="me-2 text-primary" /> {med.name}</td>
                        <td>{med.remaining_tablets} tablets</td>
                        <td>{med.dose_per_intake} tablets</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => {
                              setActiveTab('add');
                              // You could add functionality here to pre-fill the form for restock
                            }}
                          >
                            <FaPlus className="me-1" /> Restock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        <h2 className="section-title">Your Medications</h2>
        
        <div className="row">
          {medications.map((medication) => (
            <div key={medication.id} className="col-md-6 col-lg-4 mb-4">
              <div className="medication-card">
                <h4>{medication.name}</h4>
                <p><strong>Total Tablets:</strong> {medication.total_tablets}</p>
                <p><strong>Tablets per Dose:</strong> {medication.dose_per_intake}</p>
                <p><strong>Times per Day:</strong> {
                  medication.times_per_day === 1 ? 'Once a Day' :
                  medication.times_per_day === 2 ? 'Twice a Day' :
                  medication.times_per_day === 3 ? 'Three Times a Day' :
                  'Four Times a Day'
                }</p>
                <p><strong>Frequency:</strong> {
                  medication.frequency === 'daily' ? 'Daily' :
                  medication.frequency === 'twice_week' ? 'Twice a Week' :
                  medication.frequency === 'thrice_week' ? 'Three Times a Week' :
                  medication.frequency === 'once_week' ? 'Once a Week' :
                  'Alternate Days'
                }</p>
                {medication.selected_days && medication.selected_days.length > 0 && (
                  <p><strong>Days:</strong> {medication.selected_days.join(', ')}</p>
                )}
                <p><strong>Remaining:</strong> {medication.remaining_tablets}</p>
                <p><strong>Reminder Time:</strong> {medication.reminder_time}</p>
                
                {medication.remaining_tablets <= (medication.dose_per_intake * medication.times_per_day * 3) && (
                  <p className="text-danger">
                    <FaExclamationTriangle className="me-2" />
                    Low stock! Please restock soon.
                  </p>
                )}
                
                <div className="btn-group">
                  <button
                    className="btn btn-success"
                    onClick={() => handleTakeDose(medication)}
                  >
                    <FaCheck className="me-2" /> Take
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={() => handleMissDose(medication)}
                  >
                    <FaTimes className="me-2" /> Missed
                  </button>
                  <button
                    className="btn btn-info"
                    onClick={() => showMedicationHistory(medication)}
                  >
                    <FaHistory className="me-2" /> History
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(medication.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderAddMedicationForm = () => {
    return (
      <div className="medication-form-card">
        <h3 className="form-title">
          <FaPlus className="me-2 text-primary" /> Add New Medication
        </h3>
        
        <form onSubmit={handleAddMedication} className="medication-form">
          <div className="form-section">
            <h4 className="form-section-title">
              <FaPills className="me-2 text-primary" /> Basic Information
            </h4>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="medication_name" className="form-label text-dark">
                  <span className="text-danger">*</span> Medication Name
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="medication_name" 
                  value={newMedication.name}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Paracetamol"
                  required 
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="total_tablets" className="form-label text-dark">
                  <span className="text-danger">*</span> Total Tablets
                </label>
                <input 
                  type="number" 
                  className="form-control" 
                  id="total_tablets" 
                  value={newMedication.total_tablets}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, total_tablets: e.target.value }))}
                  placeholder="e.g., 30"
                  required 
                />
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h4 className="form-section-title">
              <FaBell className="me-2 text-primary" /> Dosage Information
            </h4>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label htmlFor="dose_per_intake" className="form-label text-dark">
                  <span className="text-danger">*</span> Tablets per Dose
                </label>
                <input 
                  type="number" 
                  className="form-control" 
                  id="dose_per_intake" 
                  value={newMedication.dose_per_intake}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, dose_per_intake: e.target.value }))}
                  placeholder="e.g., 2"
                  required 
                />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="times_per_day" className="form-label text-dark">
                  Times per Day
                </label>
                <select
                  className="form-control"
                  id="times_per_day"
                  value={newMedication.times_per_day}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, times_per_day: e.target.value }))}
                >
                  <option value="1">Once a Day</option>
                  <option value="2">Twice a Day</option>
                  <option value="3">Three Times a Day</option>
                  <option value="4">Four Times a Day</option>
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="reminder_time" className="form-label text-dark">
                  <FaCalendarAlt className="me-1 text-primary" /> Reminder Time
                </label>
                <input
                  type="time"
                  className="form-control"
                  id="reminder_time"
                  value={newMedication.reminder_time}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, reminder_time: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="frequency" className="form-label text-dark">
                  Frequency
                </label>
                <select
                  className="form-control"
                  id="frequency"
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value, selected_days: [] }))}
                >
                  <option value="daily">Daily</option>
                  <option value="twice_week">Twice a Week</option>
                  <option value="thrice_week">Three Times a Week</option>
                  <option value="once_week">Once a Week</option>
                  <option value="alternate">Alternate Days</option>
                </select>
              </div>
              {(newMedication.frequency === 'twice_week' || 
                newMedication.frequency === 'thrice_week' || 
                newMedication.frequency === 'once_week') && (
                <div className="col-md-6 mb-3">
                  <label className="form-label text-dark">Select Days</label>
                  <div className="d-flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <button
                        key={day}
                        type="button"
                        className={`btn btn-sm ${newMedication.selected_days.includes(day) ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handleDaySelection(day)}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg">
              <FaPlus className="me-2" /> Add Medication
            </button>
            <button 
              type="button" 
              className="btn btn-light btn-lg ms-auto" 
              onClick={() => setActiveTab('medications')}
            >
              Back to Medications
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (loading && medications.length === 0) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container>
      <h1 className="my-4 page-title">
        <FaPills className="me-2 text-primary" /> Medication Tracker
      </h1>

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
      
      <div className="tabs-container">
        <div className="nav-tabs-wrapper">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'medications' ? 'active' : ''}`} 
                onClick={() => setActiveTab('medications')}
              >
                <FaListAlt className="me-2 text-primary" /> Your Medications
                {hasLowStock && <span className="upcoming-badge ms-2">!</span>}
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'add' ? 'active' : ''}`} 
                onClick={() => setActiveTab('add')}
              >
                <FaPlus className="me-2 text-primary" /> Add New Medication
              </button>
            </li>
          </ul>
        </div>
        
        <div className="tab-content">
          {activeTab === 'medications' && (
            <div className="tab-pane active">
              {renderMedicationsList()}
            </div>
          )}
          
          {activeTab === 'add' && (
            <div className="tab-pane active">
              {renderAddMedicationForm()}
            </div>
          )}
        </div>
      </div>

      {showHistory && activeMedication && (
        <div className="history-section">
          <h3>
            <FaHistory className="me-2" />
            History for {activeMedication.name}
          </h3>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={record.id}>
                    <td>{new Date(record.taken_at).toLocaleDateString()}</td>
                    <td>{new Date(record.taken_at).toLocaleTimeString()}</td>
                    <td>
                      <span className={`status-badge status-${record.status}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td>{record.notes || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">No history records found</td>
                </tr>
              )}
            </tbody>
          </table>
          <button
            className="btn btn-secondary mt-3"
            onClick={() => setShowHistory(false)}
          >
            Close History
          </button>
        </div>
      )}
    </Container>
  );
};

export default MedicationTracker;
