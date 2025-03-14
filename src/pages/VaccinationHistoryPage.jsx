import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaSyringe, FaPlus, FaTrash, FaEdit, FaCalendarCheck } from 'react-icons/fa';
import '../styles.css';

const VaccinationHistoryPage = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentVaccination, setCurrentVaccination] = useState({
    id: null,
    vaccine_name: '',
    date_administered: '',
    administered_by: '',
    lot_number: '',
    next_dose_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchVaccinations();
  }, []);

  const fetchVaccinations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('user_id', user.id)
        .order('date_administered', { ascending: false });
        
      if (error) throw error;
      setVaccinations(data || []);
    } catch (error) {
      console.error('Error fetching vaccinations:', error);
      setNotification({ message: 'Error fetching vaccinations.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

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

  if (loading && vaccinations.length === 0) {
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
        <FaSyringe className="me-2" /> Vaccination History
      </h1>
      
      <div className="card shadow-lg p-4 mb-4">
        <h3>{isEditing ? 'Edit Vaccination Record' : 'Add New Vaccination'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="vaccine_name" className="form-label">Vaccine Name</label>
              <input 
                type="text" 
                className="form-control" 
                id="vaccine_name" 
                name="vaccine_name" 
                value={currentVaccination.vaccine_name} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="date_administered" className="form-label">Date Administered</label>
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
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="administered_by" className="form-label">Administered By</label>
              <input 
                type="text" 
                className="form-control" 
                id="administered_by" 
                name="administered_by" 
                value={currentVaccination.administered_by} 
                onChange={handleChange} 
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="lot_number" className="form-label">Lot Number</label>
              <input 
                type="text" 
                className="form-control" 
                id="lot_number" 
                name="lot_number" 
                value={currentVaccination.lot_number} 
                onChange={handleChange} 
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="next_dose_date" className="form-label">Next Dose Date (if applicable)</label>
              <input 
                type="date" 
                className="form-control" 
                id="next_dose_date" 
                name="next_dose_date" 
                value={currentVaccination.next_dose_date} 
                onChange={handleChange} 
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea 
                className="form-control" 
                id="notes" 
                name="notes" 
                rows="3" 
                value={currentVaccination.notes} 
                onChange={handleChange}
              ></textarea>
            </div>
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
      
      {/* Upcoming Vaccinations Section */}
      {vaccinations.some(vax => isDueSoon(vax.next_dose_date) || isOverdue(vax.next_dose_date)) && (
        <div className="card shadow mb-4">
          <div className="card-header bg-warning text-dark">
            <h3 className="mb-0"><FaCalendarCheck className="me-2" /> Upcoming & Overdue Vaccinations</h3>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vaccine</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vaccinations
                    .filter(vax => isDueSoon(vax.next_dose_date) || isOverdue(vax.next_dose_date))
                    .map(vax => (
                      <tr key={`upcoming-${vax.id}`}>
                        <td>{vax.vaccine_name}</td>
                        <td>{new Date(vax.next_dose_date).toLocaleDateString()}</td>
                        <td>
                          {isOverdue(vax.next_dose_date) ? (
                            <span className="badge bg-danger">Overdue</span>
                          ) : (
                            <span className="badge bg-warning text-dark">Due Soon</span>
                          )}
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
      
      <h2 className="text-center mb-3">Your Vaccination History</h2>
      
      {vaccinations.length === 0 ? (
        <div className="alert alert-info text-center">
          No vaccination records found. Add your first record above.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Vaccine</th>
                <th>Date</th>
                <th>Administered By</th>
                <th>Lot Number</th>
                <th>Next Dose</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vaccinations.map((vaccination) => (
                <tr key={vaccination.id}>
                  <td>{vaccination.vaccine_name}</td>
                  <td>{new Date(vaccination.date_administered).toLocaleDateString()}</td>
                  <td>{vaccination.administered_by}</td>
                  <td>{vaccination.lot_number}</td>
                  <td>
                    {vaccination.next_dose_date ? (
                      <>
                        {new Date(vaccination.next_dose_date).toLocaleDateString()}
                        {isOverdue(vaccination.next_dose_date) && (
                          <span className="badge bg-danger ms-2">Overdue</span>
                        )}
                        {isDueSoon(vaccination.next_dose_date) && !isOverdue(vaccination.next_dose_date) && (
                          <span className="badge bg-warning text-dark ms-2">Due Soon</span>
                        )}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary me-2" 
                      onClick={() => handleEdit(vaccination)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn btn-sm btn-danger" 
                      onClick={() => handleDelete(vaccination.id)}
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

export default VaccinationHistoryPage; 