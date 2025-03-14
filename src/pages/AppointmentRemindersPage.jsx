import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaClock, FaBell, FaToggleOn, FaToggleOff, FaCalendarAlt, FaUserMd, FaTrash } from 'react-icons/fa';
import '../styles.css';

const AppointmentRemindersPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [reminderSettings, setReminderSettings] = useState({
    email_reminders: true,
    sms_reminders: false,
    browser_notifications: true,
    reminder_time: '24', // hours before appointment
    phone_number: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      // Fetch upcoming appointments
      const today = new Date().toISOString().split('T')[0];
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', today)
        .order('date', { ascending: true });
        
      if (appointmentsError) throw appointmentsError;
      
      // Fetch telehealth consultations
      const { data: telehealthData, error: telehealthError } = await supabase
        .from('telehealth_consultations')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', today)
        .order('date', { ascending: true });
        
      if (telehealthError) throw telehealthError;
      
      // Combine and format appointments and telehealth consultations
      const allAppointments = [
        ...(appointmentsData || []).map(app => ({
          ...app,
          type: 'appointment'
        })),
        ...(telehealthData || []).map(tel => ({
          ...tel,
          type: 'telehealth',
          doctor_name: tel.doctor_name
        }))
      ].sort((a, b) => {
        // Sort by date and time
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
      });
      
      setAppointments(allAppointments);
      
      // Fetch user reminder settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw settingsError;
      }
      
      if (settingsData) {
        setReminderSettings(settingsData);
      }
      
      // Fetch active reminders
      const { data: remindersData, error: remindersError } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .gte('reminder_time', new Date().toISOString())
        .order('reminder_time', { ascending: true });
        
      if (remindersError) throw remindersError;
      setReminders(remindersData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setNotification({ message: 'Error fetching data.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReminderSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveReminderSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      const { error } = await supabase
        .from('reminder_settings')
        .upsert({
          ...reminderSettings,
          user_id: user.id
        });
        
      if (error) throw error;
      setNotification({ message: 'Reminder settings saved successfully!', type: 'success' });
    } catch (error) {
      console.error('Error saving reminder settings:', error);
      setNotification({ message: 'Error saving reminder settings.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (appointment) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      // Check if the appointment already has a reminder
      const hasReminder = appointment.reminder_set;
      
      if (hasReminder) {
        // Remove reminder
        if (appointment.type === 'appointment') {
          const { error } = await supabase
            .from('appointments')
            .update({ reminder_set: false })
            .eq('id', appointment.id);
            
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('telehealth_consultations')
            .update({ reminder_set: false })
            .eq('id', appointment.id);
            
          if (error) throw error;
        }
        
        // Delete any existing reminders for this appointment
        const { error: deleteError } = await supabase
          .from('reminders')
          .delete()
          .eq('appointment_id', appointment.id)
          .eq('appointment_type', appointment.type);
          
        if (deleteError) throw deleteError;
        
        setNotification({ message: 'Reminder removed successfully!', type: 'success' });
      } else {
        // Add reminder
        const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
        const reminderHours = parseInt(reminderSettings.reminder_time, 10);
        const reminderTime = new Date(appointmentDate.getTime() - (reminderHours * 60 * 60 * 1000));
        
        // Update appointment to set reminder flag
        if (appointment.type === 'appointment') {
          const { error } = await supabase
            .from('appointments')
            .update({ reminder_set: true })
            .eq('id', appointment.id);
            
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('telehealth_consultations')
            .update({ reminder_set: true })
            .eq('id', appointment.id);
            
          if (error) throw error;
        }
        
        // Create reminder record
        const { error: reminderError } = await supabase
          .from('reminders')
          .insert([{
            user_id: user.id,
            appointment_id: appointment.id,
            appointment_type: appointment.type,
            reminder_time: reminderTime.toISOString(),
            appointment_time: appointmentDate.toISOString(),
            doctor_name: appointment.doctor_name,
            location: appointment.location || '',
            sent: false
          }]);
          
        if (reminderError) throw reminderError;
        
        setNotification({ message: 'Reminder set successfully!', type: 'success' });
      }
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error toggling reminder:', error);
      setNotification({ message: 'Error toggling reminder.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    
    try {
      setLoading(true);
      
      // Get the reminder to find the associated appointment
      const { data: reminderData, error: fetchError } = await supabase
        .from('reminders')
        .select('*')
        .eq('id', reminderId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Update the appointment to remove the reminder flag
      if (reminderData.appointment_type === 'appointment') {
        const { error } = await supabase
          .from('appointments')
          .update({ reminder_set: false })
          .eq('id', reminderData.appointment_id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('telehealth_consultations')
          .update({ reminder_set: false })
          .eq('id', reminderData.appointment_id);
          
        if (error) throw error;
      }
      
      // Delete the reminder
      const { error: deleteError } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId);
        
      if (deleteError) throw deleteError;
      
      setNotification({ message: 'Reminder deleted successfully!', type: 'success' });
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setNotification({ message: 'Error deleting reminder.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  // Format date and time for display
  const formatDateTime = (date, time) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString();
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

  if (loading && appointments.length === 0 && reminders.length === 0) {
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
        <FaBell className="me-2" /> Appointment Reminders
      </h1>
      
      <div className="card shadow mb-4">
        <div className="card-header">
          <h3 className="mb-0">Reminder Settings</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="email_reminders" 
                  name="email_reminders" 
                  checked={reminderSettings.email_reminders} 
                  onChange={handleSettingsChange} 
                />
                <label className="form-check-label" htmlFor="email_reminders">
                  Email Reminders
                </label>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="browser_notifications" 
                  name="browser_notifications" 
                  checked={reminderSettings.browser_notifications} 
                  onChange={handleSettingsChange} 
                />
                <label className="form-check-label" htmlFor="browser_notifications">
                  Browser Notifications
                </label>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="sms_reminders" 
                  name="sms_reminders" 
                  checked={reminderSettings.sms_reminders} 
                  onChange={handleSettingsChange} 
                />
                <label className="form-check-label" htmlFor="sms_reminders">
                  SMS Reminders
                </label>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="phone_number" className="form-label">Phone Number (for SMS)</label>
              <input 
                type="tel" 
                className="form-control" 
                id="phone_number" 
                name="phone_number" 
                value={reminderSettings.phone_number} 
                onChange={handleSettingsChange} 
                placeholder="Enter your phone number"
                disabled={!reminderSettings.sms_reminders}
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="reminder_time" className="form-label">Send Reminders</label>
              <select 
                className="form-select" 
                id="reminder_time" 
                name="reminder_time" 
                value={reminderSettings.reminder_time} 
                onChange={handleSettingsChange}
              >
                <option value="1">1 hour before</option>
                <option value="2">2 hours before</option>
                <option value="6">6 hours before</option>
                <option value="12">12 hours before</option>
                <option value="24">24 hours before</option>
                <option value="48">2 days before</option>
                <option value="72">3 days before</option>
              </select>
            </div>
            <div className="col-md-6 mb-3 d-flex align-items-end">
              <button 
                className="btn btn-primary w-100" 
                onClick={saveReminderSettings}
                disabled={loading}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-center mb-3">Active Reminders</h2>
      
      {reminders.length === 0 ? (
        <div className="alert alert-info text-center">
          No active reminders. Set reminders for your appointments below.
        </div>
      ) : (
        <div className="table-responsive mb-4">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Appointment</th>
                <th>Doctor</th>
                <th>Appointment Time</th>
                <th>Reminder Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((reminder) => (
                <tr key={reminder.id}>
                  <td>{reminder.appointment_type === 'telehealth' ? 'Telehealth' : 'In-person'}</td>
                  <td>{reminder.doctor_name}</td>
                  <td>{new Date(reminder.appointment_time).toLocaleString()}</td>
                  <td>{new Date(reminder.reminder_time).toLocaleString()}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-danger" 
                      onClick={() => deleteReminder(reminder.id)}
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
      
      <h2 className="text-center mb-3">Upcoming Appointments</h2>
      
      {appointments.length === 0 ? (
        <div className="alert alert-info text-center">
          No upcoming appointments found. Schedule appointments to set reminders.
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
                  <p className="card-text">
                    <FaCalendarAlt className="me-2" /> {new Date(appointment.date).toLocaleDateString()}
                  </p>
                  <p className="card-text">
                    <FaClock className="me-2" /> {appointment.time}
                  </p>
                  <p className="card-text">
                    <strong>Type:</strong> {appointment.type === 'telehealth' ? 'Telehealth Consultation' : 'In-person Appointment'}
                  </p>
                  {appointment.location && (
                    <p className="card-text">
                      <strong>Location:</strong> {appointment.location}
                    </p>
                  )}
                </div>
                <div className="card-footer">
                  <button 
                    className="btn btn-block w-100" 
                    onClick={() => toggleReminder(appointment)}
                    disabled={loading}
                  >
                    {appointment.reminder_set ? (
                      <><FaToggleOn className="me-2" /> Reminder On</>
                    ) : (
                      <><FaToggleOff className="me-2" /> Set Reminder</>
                    )}
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

export default AppointmentRemindersPage; 