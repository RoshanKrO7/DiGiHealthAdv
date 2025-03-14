import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaHistory, FaSearch, FaFileDownload, FaUserMd, FaCalendarAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import '../styles.css';

const AppointmentHistoryPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchAppointmentHistory();
  }, []);

  const fetchAppointmentHistory = async () => {
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
        .lt('date', today)
        .order('date', { ascending: false });
        
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointment history:', error);
      setNotification({ message: 'Error fetching appointment history.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterDate = (e) => {
    setFilterDate(e.target.value);
  };

  const handleFilterDoctor = (e) => {
    setFilterDoctor(e.target.value);
  };

  const handleSortChange = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const exportToCsv = () => {
    const headers = ['Doctor', 'Specialty', 'Date', 'Time', 'Location', 'Notes'];
    const csvData = filteredAppointments.map(app => [
      app.doctor_name,
      app.specialty,
      new Date(app.date).toLocaleDateString(),
      app.time,
      app.location,
      app.notes
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `appointment_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort appointments based on search term, filters, and sort order
  const filteredAppointments = appointments
    .filter(app => {
      const matchesSearch = searchTerm === '' || 
        app.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.specialty && app.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.location && app.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDate = filterDate === '' || app.date === filterDate;
      
      const matchesDoctor = filterDoctor === '' || 
        app.doctor_name.toLowerCase().includes(filterDoctor.toLowerCase());
      
      return matchesSearch && matchesDate && matchesDoctor;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

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
        <FaHistory className="me-2" /> Appointment History
      </h1>
      
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6 mb-2">
              <div className="input-group">
                <span className="input-group-text"><FaSearch /></span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search appointments..." 
                  value={searchTerm} 
                  onChange={handleSearch} 
                />
              </div>
            </div>
            <div className="col-md-3 mb-2">
              <input 
                type="date" 
                className="form-control" 
                placeholder="Filter by date" 
                value={filterDate} 
                onChange={handleFilterDate} 
              />
            </div>
            <div className="col-md-3 mb-2">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Filter by doctor" 
                value={filterDoctor} 
                onChange={handleFilterDoctor} 
              />
            </div>
          </div>
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <button 
              className="btn btn-outline-secondary" 
              onClick={handleSortChange}
            >
              Sort by Date: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
            
            <button 
              className="btn btn-success" 
              onClick={exportToCsv}
              disabled={filteredAppointments.length === 0}
            >
              <FaFileDownload className="me-2" /> Export to CSV
            </button>
          </div>
        </div>
      </div>
      
      {appointments.length === 0 ? (
        <div className="alert alert-info text-center">
          No appointment history found.
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="alert alert-warning text-center">
          No appointments match your search criteria.
        </div>
      ) : (
        <div className="row">
          {filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow">
                <div className="card-header">
                  <h5 className="mb-0">
                    <FaUserMd className="me-2" /> {appointment.doctor_name}
                  </h5>
                </div>
                <div className="card-body">
                  {appointment.specialty && (
                    <p className="card-text"><strong>Specialty:</strong> {appointment.specialty}</p>
                  )}
                  <p className="card-text">
                    <FaCalendarAlt className="me-2" /> {new Date(appointment.date).toLocaleDateString()}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentHistoryPage; 