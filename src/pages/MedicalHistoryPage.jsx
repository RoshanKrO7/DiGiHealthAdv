import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaHistory, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import '../styles.css';

const MedicalHistoryPage = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecord, setCurrentRecord] = useState({
    id: null,
    condition: '',
    diagnosis_date: '',
    doctor: '',
    treatment: '',
    notes: ''
  });

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('user_id', user.id)
        .order('diagnosis_date', { ascending: false });
        
      if (error) throw error;
      setMedicalRecords(data || []);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setNotification({ message: 'Error fetching medical records.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentRecord(prev => ({
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
        // Update existing record
        const { error } = await supabase
          .from('medical_history')
          .update({
            condition: currentRecord.condition,
            diagnosis_date: currentRecord.diagnosis_date,
            doctor: currentRecord.doctor,
            treatment: currentRecord.treatment,
            notes: currentRecord.notes
          })
          .eq('id', currentRecord.id);
          
        if (error) throw error;
        setNotification({ message: 'Medical record updated successfully!', type: 'success' });
      } else {
        // Add new record
        const { error } = await supabase
          .from('medical_history')
          .insert([{
            condition: currentRecord.condition,
            diagnosis_date: currentRecord.diagnosis_date,
            doctor: currentRecord.doctor,
            treatment: currentRecord.treatment,
            notes: currentRecord.notes,
            user_id: user.id
          }]);
          
        if (error) throw error;
        setNotification({ message: 'Medical record added successfully!', type: 'success' });
      }
      
      // Reset form and fetch updated records
      resetForm();
      fetchMedicalRecords();
    } catch (error) {
      console.error('Error saving medical record:', error);
      setNotification({ message: 'Error saving medical record.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setIsEditing(true);
    setCurrentRecord(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('medical_history')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setMedicalRecords(medicalRecords.filter(record => record.id !== id));
      setNotification({ message: 'Medical record deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting medical record:', error);
      setNotification({ message: 'Error deleting medical record.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentRecord({
      id: null,
      condition: '',
      diagnosis_date: '',
      doctor: '',
      treatment: '',
      notes: ''
    });
  };

  if (loading && medicalRecords.length === 0) {
    return <Spinner />;
  }

  return (
    <div className="container mt-4">
      {notification && (
        <div className={`alert alert-${notification.type} text-center`}>
          {notification.message}
        </div>
      )}
      
      <h1 className="text-center mb-4">
        <FaHistory className="me-2" /> Medical History
      </h1>
      
      <div className="card shadow-lg p-4 mb-4">
        <h3>{isEditing ? 'Edit Medical Record' : 'Add New Medical Record'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="condition" className="form-label">Condition/Diagnosis</label>
              <input 
                type="text" 
                className="form-control" 
                id="condition" 
                name="condition" 
                value={currentRecord.condition} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="diagnosis_date" className="form-label">Diagnosis Date</label>
              <input 
                type="date" 
                className="form-control" 
                id="diagnosis_date" 
                name="diagnosis_date" 
                value={currentRecord.diagnosis_date} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="doctor" className="form-label">Doctor/Healthcare Provider</label>
              <input 
                type="text" 
                className="form-control" 
                id="doctor" 
                name="doctor" 
                value={currentRecord.doctor} 
                onChange={handleChange} 
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="treatment" className="form-label">Treatment</label>
              <input 
                type="text" 
                className="form-control" 
                id="treatment" 
                name="treatment" 
                value={currentRecord.treatment} 
                onChange={handleChange} 
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea 
              className="form-control" 
              id="notes" 
              name="notes" 
              rows="3" 
              value={currentRecord.notes} 
              onChange={handleChange}
            ></textarea>
          </div>
          
          <div className="d-flex justify-content-between">
            <button type="submit" className="btn btn-primary">
              {isEditing ? <><FaEdit className="me-2" /> Update Record</> : <><FaPlus className="me-2" /> Add Record</>}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      <h2 className="text-center mb-3">Your Medical History</h2>
      
      {medicalRecords.length === 0 ? (
        <div className="alert alert-info text-center">
          No medical records found. Add your first record above.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Condition</th>
                <th>Diagnosis Date</th>
                <th>Doctor</th>
                <th>Treatment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicalRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.condition}</td>
                  <td>{new Date(record.diagnosis_date).toLocaleDateString()}</td>
                  <td>{record.doctor}</td>
                  <td>{record.treatment}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary me-2" 
                      onClick={() => handleEdit(record)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn btn-sm btn-danger" 
                      onClick={() => handleDelete(record.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MedicalHistoryPage; 