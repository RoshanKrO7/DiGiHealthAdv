import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaDiagnoses, FaPlus, FaTrash, FaEdit, FaChartLine } from 'react-icons/fa';
import '../styles.css';

const ChronicDiseaseManagementPage = () => {
  const [chronicDiseases, setChronicDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDisease, setCurrentDisease] = useState({
    id: null,
    disease_name: '',
    diagnosis_date: '',
    severity: 'Mild',
    medications: '',
    symptoms: '',
    notes: ''
  });

  useEffect(() => {
    fetchChronicDiseases();
  }, []);

  const fetchChronicDiseases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      const { data, error } = await supabase
        .from('chronic_diseases')
        .select('*')
        .eq('user_id', user.id)
        .order('diagnosis_date', { ascending: false });
        
      if (error) throw error;
      setChronicDiseases(data || []);
    } catch (error) {
      console.error('Error fetching chronic diseases:', error);
      setNotification({ message: 'Error fetching chronic diseases.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentDisease(prev => ({
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
        // Update existing disease
        const { error } = await supabase
          .from('chronic_diseases')
          .update({
            disease_name: currentDisease.disease_name,
            diagnosis_date: currentDisease.diagnosis_date,
            severity: currentDisease.severity,
            medications: currentDisease.medications,
            symptoms: currentDisease.symptoms,
            notes: currentDisease.notes
          })
          .eq('id', currentDisease.id);
          
        if (error) throw error;
        setNotification({ message: 'Chronic disease updated successfully!', type: 'success' });
      } else {
        // Add new disease
        const { error } = await supabase
          .from('chronic_diseases')
          .insert([{
            disease_name: currentDisease.disease_name,
            diagnosis_date: currentDisease.diagnosis_date,
            severity: currentDisease.severity,
            medications: currentDisease.medications,
            symptoms: currentDisease.symptoms,
            notes: currentDisease.notes,
            user_id: user.id
          }]);
          
        if (error) throw error;
        setNotification({ message: 'Chronic disease added successfully!', type: 'success' });
      }
      
      // Reset form and fetch updated diseases
      resetForm();
      fetchChronicDiseases();
    } catch (error) {
      console.error('Error saving chronic disease:', error);
      setNotification({ message: 'Error saving chronic disease.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (disease) => {
    setIsEditing(true);
    setCurrentDisease(disease);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this chronic disease record?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('chronic_diseases')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setChronicDiseases(chronicDiseases.filter(disease => disease.id !== id));
      setNotification({ message: 'Chronic disease deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting chronic disease:', error);
      setNotification({ message: 'Error deleting chronic disease.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentDisease({
      id: null,
      disease_name: '',
      diagnosis_date: '',
      severity: 'Mild',
      medications: '',
      symptoms: '',
      notes: ''
    });
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'Mild':
        return 'bg-success';
      case 'Moderate':
        return 'bg-warning text-dark';
      case 'Severe':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  if (loading && chronicDiseases.length === 0) {
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
        <FaDiagnoses className="me-2" /> Chronic Disease Management
      </h1>
      
      <div className="card shadow-lg p-4 mb-4">
        <h3>{isEditing ? 'Edit Chronic Disease' : 'Add New Chronic Disease'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="disease_name" className="form-label">Disease Name</label>
              <input 
                type="text" 
                className="form-control" 
                id="disease_name" 
                name="disease_name" 
                value={currentDisease.disease_name} 
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
                value={currentDisease.diagnosis_date} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="severity" className="form-label">Severity</label>
              <select 
                className="form-control" 
                id="severity" 
                name="severity" 
                value={currentDisease.severity} 
                onChange={handleChange}
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="medications" className="form-label">Medications</label>
              <input 
                type="text" 
                className="form-control" 
                id="medications" 
                name="medications" 
                value={currentDisease.medications} 
                onChange={handleChange} 
                placeholder="Separate multiple medications with commas"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="symptoms" className="form-label">Symptoms</label>
            <input 
              type="text" 
              className="form-control" 
              id="symptoms" 
              name="symptoms" 
              value={currentDisease.symptoms} 
              onChange={handleChange} 
              placeholder="Separate multiple symptoms with commas"
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea 
              className="form-control" 
              id="notes" 
              name="notes" 
              rows="3" 
              value={currentDisease.notes} 
              onChange={handleChange}
            ></textarea>
          </div>
          
          <div className="d-flex justify-content-between">
            <button type="submit" className="btn btn-primary">
              {isEditing ? <><FaEdit className="me-2" /> Update Disease</> : <><FaPlus className="me-2" /> Add Disease</>}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      <h2 className="text-center mb-3">Your Chronic Diseases</h2>
      
      {chronicDiseases.length === 0 ? (
        <div className="alert alert-info text-center">
          No chronic diseases found. Add your first record above.
        </div>
      ) : (
        <div className="row">
          {chronicDiseases.map((disease) => (
            <div key={disease.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{disease.disease_name}</h5>
                  <span className={`badge ${getSeverityBadgeClass(disease.severity)}`}>
                    {disease.severity}
                  </span>
                </div>
                <div className="card-body">
                  <p><strong>Diagnosed:</strong> {new Date(disease.diagnosis_date).toLocaleDateString()}</p>
                  
                  {disease.medications && (
                    <p>
                      <strong>Medications:</strong><br />
                      {disease.medications.split(',').map((med, index) => (
                        <span key={index} className="badge bg-info text-dark me-1 mb-1">
                          {med.trim()}
                        </span>
                      ))}
                    </p>
                  )}
                  
                  {disease.symptoms && (
                    <p>
                      <strong>Symptoms:</strong><br />
                      {disease.symptoms.split(',').map((symptom, index) => (
                        <span key={index} className="badge bg-secondary me-1 mb-1">
                          {symptom.trim()}
                        </span>
                      ))}
                    </p>
                  )}
                  
                  {disease.notes && (
                    <p>
                      <strong>Notes:</strong><br />
                      {disease.notes}
                    </p>
                  )}
                </div>
                <div className="card-footer d-flex justify-content-between">
                  <button 
                    className="btn btn-sm btn-primary" 
                    onClick={() => handleEdit(disease)}
                  >
                    <FaEdit className="me-1" /> Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => handleDelete(disease.id)}
                  >
                    <FaTrash className="me-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChronicDiseaseManagementPage; 