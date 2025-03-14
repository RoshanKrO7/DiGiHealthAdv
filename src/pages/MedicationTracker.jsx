import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPills, FaTrash, FaPlus } from 'react-icons/fa';
import '../styles.css';

const MedicationTracker = () => {
  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState({
    name: '',
    frequency: '',
    customFrequency: '',
    quantity: '',
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/';
          return;
        }
        const { data, error } = await supabase
          .from('medications')
          .select('*')
          .eq('user_id', user.id);
        if (error) throw error;
        setMedications(data);
      } catch (error) {
        console.error('Error fetching medications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedications();
  }, []);

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission !== 'granted') {
          console.warn('Notification permission not granted');
        }
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewMedication((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddMedication = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      const frequency = newMedication.customFrequency || newMedication.frequency;
      const { data, error } = await supabase
        .from('medications')
        .insert([{ name: newMedication.name, frequency, quantity: newMedication.quantity, user_id: user.id, last_taken: new Date().toISOString() }])
        .select();
      if (error) throw error;
      setMedications([...medications, ...data]);
      setNewMedication({ name: '', frequency: '', customFrequency: '', quantity: '' });
      setNotification({ message: 'Medication added successfully!', type: 'success' });
      new Notification('Medication added successfully!');
    } catch (error) {
      console.error('Error adding medication:', error);
      setNotification({ message: 'Error adding medication.', type: 'danger' });
      new Notification('Error adding medication.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedication = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setMedications(medications.filter((med) => med.id !== id));
      setNotification({ message: 'Medication deleted successfully!', type: 'success' });
      new Notification('Medication deleted successfully!');
    } catch (error) {
      console.error('Error deleting medication:', error);
      setNotification({ message: 'Error deleting medication.', type: 'danger' });
      new Notification('Error deleting medication.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container mt-4">
      {notification && (
        <div className={`alert alert-${notification.type} text-center`}>{notification.message}</div>
      )}
      <h1 className="text-center mb-4"><FaPills className="me-2" /> Medication Tracker</h1>
      <div className="card shadow-lg p-4 mb-4">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="name" className="form-label">Medication Name</label>
            <input type="text" className="form-control" id="name" name="name" value={newMedication.name} onChange={handleChange} />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="quantity" className="form-label">Quantity (number of tablets)</label>
            <input type="number" className="form-control" id="quantity" name="quantity" value={newMedication.quantity} onChange={handleChange} />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="frequency" className="form-label">Frequency</label>
            <select className="form-control" id="frequency" name="frequency" value={newMedication.frequency} onChange={handleChange}>
              <option value="">Select frequency</option>
              <option value="Once a day">Once a day</option>
              <option value="Twice a day">Twice a day</option>
              <option value="Three times a day">Three times a day</option>
              <option value="Every 6 hours">Every 6 hours</option>
              <option value="Every 8 hours">Every 8 hours</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="customFrequency" className="form-label">Custom Frequency</label>
            <input type="text" className="form-control" id="customFrequency" name="customFrequency" placeholder="e.g., Every 4 hours" value={newMedication.customFrequency} onChange={handleChange} />
          </div>
        </div>
        <button className="btn btn-primary w-100" onClick={handleAddMedication}><FaPlus className="me-2" /> Add Medication</button>
      </div>
      <h2 className="text-center mb-3">Your Medications</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Frequency</th>
            <th>Quantity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((med) => (
            <tr key={med.id}>
              <td>{med.name}</td>
              <td>{med.frequency}</td>
              <td>{med.quantity}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMedication(med.id)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MedicationTracker;
