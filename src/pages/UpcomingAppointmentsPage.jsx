import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCalendarCheck, FaPlus, FaTrash, FaEdit, FaClock, FaMapMarkerAlt, FaUserMd } from 'react-icons/fa';
import '../styles.css';

const UpcomingAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState({
    id: null,
    doctor_name: '',
    specialty: '',
    date: '',
    time: '',
    location: '',
    notes: '',
    reminder_set: false
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', today)
        .order('date', { ascending: true });
        
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setNotification({ message: 'Error fetching appointments.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentAppointment(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
        // Update existing appointment
        const { error } = await supabase
          .from('appointments')
          .update({
            doctor_name: currentAppointment.doctor_name,
            specialty: currentAppointment.specialty,
            date: currentAppointment.date,
            time: currentAppointment.time,
            location: currentAppointment.location,
            notes: currentAppointment.notes,
            reminder_set: currentAppointment.reminder_set
          })
          .eq('id', currentAppointment.id);
          
        if (error) throw error;
        setNotification({ message: 'Appointment updated successfully!', type: 'success' });
      } else {
        // Add new appointment
        const { error } = await supabase
          .from('appointments')
          .insert([{
            doctor_name: currentAppointment.doctor_name,
            specialty: currentAppointment.specialty,
            date: currentAppointment.date,
            time: currentAppointment.time,
            location: currentAppointment.location,
            notes: currentAppointment.notes,
            reminder_set: currentAppointment.reminder_set,
            user_id: user.id
          }]);
          
        if (error) throw error;
        setNotification({ message: 'Appointment added successfully!', type: 'success' });
      }
      
      // Reset form and fetch updated appointments
      resetForm();
      fetchAppointments();
    } catch (error) {
      console.error('Error saving appointment:', error);
      setNotification({ message: 'Error saving appointment.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (appointment) => {
    setIsEditing(true);
    setCurrentAppointment(appointment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setAppointments(appointments.filter(appointment => appointment.id !== id));
      setNotification({ message: 'Appointment deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setNotification({ message: 'Error deleting appointment.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentAppointment({
      id: null,
      doctor_name: '',
      specialty: '',
      date: '',
      time: '',
      location: '',
      notes: '',
      reminder_set: false
    });
  };

  // Check if an appointment is today
  const isToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  // Check if an appointment is within the next 3 days
  const isUpcoming = (dateString) => {
    const today = new Date();
    const appointmentDate = new Date(dateString);
    const diffTime = appointmentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 3;
  };

  if (loading && appointments.length === 0) {
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
        <FaCalendarCheck className="me-2" /> Upcoming Appointments
      </h1>
      
      <div className="card shadow-lg p-4 mb-4">
        <h3>{isEditing ? 'Edit Appointment' : 'Schedule New Appointment'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="doctor_name" className="form-label">Doctor Name</label>
              <input 
                type="text" 
                className="form-control" 
                id="doctor_name" 
                name="doctor_name" 
                value={currentAppointment.doctor_name} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="specialty" className="form-label">Specialty</label>
              <input 
                type="text" 
                className="form-control" 
                id="specialty" 
                name="specialty" 
                value={currentAppointment.specialty} 
                onChange={handleChange} 
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="date" className="form-label">Date</label>
              <input 
                type="date" 
                className="form-control" 
                id="date" 
                name="date" 
                value={currentAppointment.date} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="time" className="form-label">Time</label>
              <input 
                type="time" 
                className="form-control" 
                id="time" 
                name="time" 
                value={currentAppointment.time} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="location" className="form-label">Location</label>
            <input 
              type="text" 
              className="form-control" 
              id="location" 
              name="location" 
              value={currentAppointment.location} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea 
              className="form-control" 
              id="notes" 
              name="notes" 
              rows="3" 
              value={currentAppointment.notes} 
              onChange={handleChange}
            ></textarea>
          </div>
          
          <div className="mb-3 form-check">
            <input 
              type="checkbox" 
              className="form-check-input" 
              id="reminder_set" 
              name="reminder_set" 
              checked={currentAppointment.reminder_set} 
              onChange={handleChange} 
            />
            <label className="form-check-label" htmlFor="reminder_set">Set Reminder</label>
          </div>
          
          <div className="d-flex justify-content-between">
            <button type="submit" className="btn btn-primary">
              {isEditing ? <><FaEdit className="me-2" /> Update Appointment</> : <><FaPlus className="me-2" /> Schedule Appointment</>}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Today's Appointments Section */}
      {appointments.some(app => isToday(app.date)) && (
        <div className="card shadow mb-4">
          <div className="card-header bg-primary text-white">
            <h3 className="mb-0"><FaClock className="me-2" /> Today's Appointments</h3>
          </div>
          <div className="card-body">
            <div className="row">
              {appointments
                .filter(app => isToday(app.date))
                .map(appointment => (
                  <div key={`today-${appointment.id}`} className="col-md-6 mb-3">
                    <div className="card h-100 border-primary">
                      <div className="card-body">
                        <h5 className="card-title">{appointment.doctor_name}</h5>
                        <h6 className="card-subtitle mb-2 text-muted">{appointment.specialty}</h6>
                        <p className="card-text">
                          <FaClock className="me-2" /> {appointment.time}<br />
                          <FaMapMarkerAlt className="me-2" /> {appointment.location}
                        </p>
                        {appointment.notes && <p className="card-text">{appointment.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
      
      <h2 className="text-center mb-3">All Upcoming Appointments</h2>
      
      {appointments.length === 0 ? (
        <div className="alert alert-info text-center">
          No upcoming appointments. Schedule your first appointment above.
        </div>
      ) : (
        <div className="row">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="col-md-6 col-lg-4 mb-4">
              <div className={`card h-100 shadow ${isToday(appointment.date) ? 'border-primary' : isUpcoming(appointment.date) ? 'border-warning' : ''}`}>
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaUserMd className="me-2" /> {appointment.doctor_name}
                  </h5>
                  {isToday(appointment.date) && (
                    <span className="badge bg-primary">Today</span>
                  )}
                  {isUpcoming(appointment.date) && !isToday(appointment.date) && (
                    <span className="badge bg-warning text-dark">Soon</span>
                  )}
                </div>
                <div className="card-body">
                  {appointment.specialty && (
                    <p className="card-text"><strong>Specialty:</strong> {appointment.specialty}</p>
                  )}
                  <p className="card-text">
                    <FaCalendarCheck className="me-2" /> {new Date(appointment.date).toLocaleDateString()}
                  </p>
                  <p className="card-text">
                    <FaClock className="me-2" /> {appointment.time}
                  </p>
                  <p className="card-text">
                    <FaMapMarkerAlt className="me-2" /> {appointment.location}
                  </p>
                  {appointment.notes && (
                    <p className="card-text">
                      <strong>Notes:</strong><br />
                      {appointment.notes}
                    </p>
                  )}
                  {appointment.reminder_set && (
                    <p className="card-text">
                      <span className="badge bg-info text-dark">Reminder Set</span>
                    </p>
                  )}
                </div>
                <div className="card-footer d-flex justify-content-between">
                  <button 
                    className="btn btn-sm btn-primary" 
                    onClick={() => handleEdit(appointment)}
                  >
                    <FaEdit className="me-1" /> Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => handleDelete(appointment.id)}
                  >
                    <FaTrash className="me-1" /> Cancel
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

export default UpcomingAppointmentsPage; 