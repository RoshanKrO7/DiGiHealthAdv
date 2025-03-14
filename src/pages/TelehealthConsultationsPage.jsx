import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPhone, FaVideo, FaPlus, FaTrash, FaEdit, FaClock, FaUserMd, FaLink } from 'react-icons/fa';
import '../styles.css';

const TelehealthConsultationsPage = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentConsultation, setCurrentConsultation] = useState({
    id: null,
    doctor_name: '',
    specialty: '',
    date: '',
    time: '',
    consultation_type: 'video',
    meeting_link: '',
    notes: '',
    reminder_set: false
  });

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      const { data, error } = await supabase
        .from('telehealth_consultations')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });
        
      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      setNotification({ message: 'Error fetching consultations.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentConsultation(prev => ({
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
        // Update existing consultation
        const { error } = await supabase
          .from('telehealth_consultations')
          .update({
            doctor_name: currentConsultation.doctor_name,
            specialty: currentConsultation.specialty,
            date: currentConsultation.date,
            time: currentConsultation.time,
            consultation_type: currentConsultation.consultation_type,
            meeting_link: currentConsultation.meeting_link,
            notes: currentConsultation.notes,
            reminder_set: currentConsultation.reminder_set
          })
          .eq('id', currentConsultation.id);
          
        if (error) throw error;
        setNotification({ message: 'Consultation updated successfully!', type: 'success' });
      } else {
        // Add new consultation
        const { error } = await supabase
          .from('telehealth_consultations')
          .insert([{
            doctor_name: currentConsultation.doctor_name,
            specialty: currentConsultation.specialty,
            date: currentConsultation.date,
            time: currentConsultation.time,
            consultation_type: currentConsultation.consultation_type,
            meeting_link: currentConsultation.meeting_link,
            notes: currentConsultation.notes,
            reminder_set: currentConsultation.reminder_set,
            user_id: user.id
          }]);
          
        if (error) throw error;
        setNotification({ message: 'Consultation added successfully!', type: 'success' });
      }
      
      // Reset form and fetch updated consultations
      resetForm();
      fetchConsultations();
    } catch (error) {
      console.error('Error saving consultation:', error);
      setNotification({ message: 'Error saving consultation.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (consultation) => {
    setIsEditing(true);
    setCurrentConsultation(consultation);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this consultation?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('telehealth_consultations')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setConsultations(consultations.filter(consultation => consultation.id !== id));
      setNotification({ message: 'Consultation deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting consultation:', error);
      setNotification({ message: 'Error deleting consultation.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentConsultation({
      id: null,
      doctor_name: '',
      specialty: '',
      date: '',
      time: '',
      consultation_type: 'video',
      meeting_link: '',
      notes: '',
      reminder_set: false
    });
  };

  // Check if a consultation is today
  const isToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  // Check if a consultation is in the past
  const isPast = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString < today;
  };

  // Check if a consultation is upcoming (within the next 3 days)
  const isUpcoming = (dateString) => {
    const today = new Date();
    const consultationDate = new Date(dateString);
    const diffTime = consultationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 3;
  };

  // Filter consultations by upcoming and past
  const upcomingConsultations = consultations.filter(consultation => !isPast(consultation.date));
  const pastConsultations = consultations.filter(consultation => isPast(consultation.date));

  if (loading && consultations.length === 0) {
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
        <FaVideo className="me-2" /> Telehealth Consultations
      </h1>
      
      <div className="card shadow-lg p-4 mb-4">
        <h3>{isEditing ? 'Edit Consultation' : 'Schedule New Consultation'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="doctor_name" className="form-label">Doctor Name</label>
              <input 
                type="text" 
                className="form-control" 
                id="doctor_name" 
                name="doctor_name" 
                value={currentConsultation.doctor_name} 
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
                value={currentConsultation.specialty} 
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
                value={currentConsultation.date} 
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
                value={currentConsultation.time} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="consultation_type" className="form-label">Consultation Type</label>
              <select 
                className="form-control" 
                id="consultation_type" 
                name="consultation_type" 
                value={currentConsultation.consultation_type} 
                onChange={handleChange}
                required
              >
                <option value="video">Video Call</option>
                <option value="phone">Phone Call</option>
                <option value="chat">Chat</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="meeting_link" className="form-label">Meeting Link/Phone Number</label>
              <input 
                type="text" 
                className="form-control" 
                id="meeting_link" 
                name="meeting_link" 
                value={currentConsultation.meeting_link} 
                onChange={handleChange} 
                placeholder="Enter meeting link or phone number"
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
              value={currentConsultation.notes} 
              onChange={handleChange}
              placeholder="Reason for consultation, questions to ask, etc."
            ></textarea>
          </div>
          
          <div className="mb-3 form-check">
            <input 
              type="checkbox" 
              className="form-check-input" 
              id="reminder_set" 
              name="reminder_set" 
              checked={currentConsultation.reminder_set} 
              onChange={handleChange} 
            />
            <label className="form-check-label" htmlFor="reminder_set">Set Reminder</label>
          </div>
          
          <div className="d-flex justify-content-between">
            <button type="submit" className="btn btn-primary">
              {isEditing ? <><FaEdit className="me-2" /> Update Consultation</> : <><FaPlus className="me-2" /> Schedule Consultation</>}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Today's Consultations Section */}
      {consultations.some(cons => isToday(cons.date)) && (
        <div className="card shadow mb-4">
          <div className="card-header bg-primary text-white">
            <h3 className="mb-0"><FaClock className="me-2" /> Today's Consultations</h3>
          </div>
          <div className="card-body">
            <div className="row">
              {consultations
                .filter(cons => isToday(cons.date))
                .map(consultation => (
                  <div key={`today-${consultation.id}`} className="col-md-6 mb-3">
                    <div className="card h-100 border-primary">
                      <div className="card-body">
                        <h5 className="card-title">{consultation.doctor_name}</h5>
                        <h6 className="card-subtitle mb-2 text-muted">{consultation.specialty}</h6>
                        <p className="card-text">
                          <FaClock className="me-2" /> {consultation.time}<br />
                          {consultation.consultation_type === 'video' ? (
                            <><FaVideo className="me-2" /> Video Call</>
                          ) : consultation.consultation_type === 'phone' ? (
                            <><FaPhone className="me-2" /> Phone Call</>
                          ) : (
                            <><FaLink className="me-2" /> Chat</>
                          )}
                        </p>
                        {consultation.meeting_link && (
                          <p className="card-text">
                            <a href={consultation.consultation_type === 'video' ? consultation.meeting_link : `tel:${consultation.meeting_link}`} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="btn btn-sm btn-success">
                              {consultation.consultation_type === 'video' ? 'Join Meeting' : 'Call Now'}
                            </a>
                          </p>
                        )}
                        {consultation.notes && <p className="card-text"><small>{consultation.notes}</small></p>}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
      
      <h2 className="text-center mb-3">Upcoming Consultations</h2>
      
      {upcomingConsultations.length === 0 ? (
        <div className="alert alert-info text-center">
          No upcoming consultations. Schedule your first consultation above.
        </div>
      ) : (
        <div className="row">
          {upcomingConsultations.map((consultation) => (
            <div key={consultation.id} className="col-md-6 col-lg-4 mb-4">
              <div className={`card h-100 shadow ${isToday(consultation.date) ? 'border-primary' : isUpcoming(consultation.date) ? 'border-warning' : ''}`}>
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaUserMd className="me-2" /> {consultation.doctor_name}
                  </h5>
                  {isToday(consultation.date) && (
                    <span className="badge bg-primary">Today</span>
                  )}
                  {isUpcoming(consultation.date) && !isToday(consultation.date) && (
                    <span className="badge bg-warning text-dark">Soon</span>
                  )}
                </div>
                <div className="card-body">
                  {consultation.specialty && (
                    <p className="card-text"><strong>Specialty:</strong> {consultation.specialty}</p>
                  )}
                  <p className="card-text">
                    <strong>Date:</strong> {new Date(consultation.date).toLocaleDateString()}
                  </p>
                  <p className="card-text">
                    <strong>Time:</strong> {consultation.time}
                  </p>
                  <p className="card-text">
                    <strong>Type:</strong> {consultation.consultation_type === 'video' ? 'Video Call' : 
                                          consultation.consultation_type === 'phone' ? 'Phone Call' : 'Chat'}
                  </p>
                  {consultation.meeting_link && (
                    <p className="card-text">
                      <strong>Link/Number:</strong> {consultation.meeting_link}
                    </p>
                  )}
                  {consultation.notes && (
                    <p className="card-text">
                      <strong>Notes:</strong><br />
                      {consultation.notes}
                    </p>
                  )}
                  {consultation.reminder_set && (
                    <p className="card-text">
                      <span className="badge bg-info text-dark">Reminder Set</span>
                    </p>
                  )}
                </div>
                <div className="card-footer d-flex justify-content-between">
                  <button 
                    className="btn btn-sm btn-primary" 
                    onClick={() => handleEdit(consultation)}
                  >
                    <FaEdit className="me-1" /> Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => handleDelete(consultation.id)}
                  >
                    <FaTrash className="me-1" /> Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {pastConsultations.length > 0 && (
        <>
          <h2 className="text-center mb-3 mt-5">Past Consultations</h2>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {pastConsultations.map((consultation) => (
                  <tr key={`past-${consultation.id}`}>
                    <td>{consultation.doctor_name}</td>
                    <td>{consultation.specialty}</td>
                    <td>{new Date(consultation.date).toLocaleDateString()}</td>
                    <td>{consultation.time}</td>
                    <td>
                      {consultation.consultation_type === 'video' ? (
                        <><FaVideo className="me-1" /> Video</>
                      ) : consultation.consultation_type === 'phone' ? (
                        <><FaPhone className="me-1" /> Phone</>
                      ) : (
                        <><FaLink className="me-1" /> Chat</>
                      )}
                    </td>
                    <td>{consultation.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default TelehealthConsultationsPage; 