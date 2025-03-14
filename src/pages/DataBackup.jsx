import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FaDownload, FaUpload, FaHistory, FaTrash, FaFileAlt } from 'react-icons/fa';

const DataBackup = () => {
  const [backupHistory, setBackupHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchBackupHistory();
  }, []);

  const fetchBackupHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('backup_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackupHistory(data || []);
    } catch (error) {
      setError('Failed to load backup history');
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Fetch all user data
      const [
        { data: profile },
        { data: healthData },
        { data: appointments },
        { data: medications }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('health_data').select('*').eq('user_id', user.id),
        supabase.from('appointments').select('*').eq('user_id', user.id),
        supabase.from('medications').select('*').eq('user_id', user.id)
      ]);

      // Create backup record
      const { data: backup, error: backupError } = await supabase
        .from('backup_history')
        .insert([
          {
            user_id: user.id,
            type: 'export',
            status: 'completed',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (backupError) throw backupError;

      // Create downloadable file
      const backupData = {
        profile,
        healthData,
        appointments,
        medications,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `digihealth-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Data exported successfully');
      fetchBackupHistory();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);

          // Create backup record
          const { data: backup, error: backupError } = await supabase
            .from('backup_history')
            .insert([
              {
                user_id: user.id,
                type: 'import',
                status: 'completed',
                created_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (backupError) throw backupError;

          // Import data to respective tables
          if (backupData.profile) {
            await supabase
              .from('profiles')
              .upsert({ ...backupData.profile, id: user.id });
          }

          if (backupData.healthData) {
            await supabase
              .from('health_data')
              .upsert(backupData.healthData.map(data => ({ ...data, user_id: user.id })));
          }

          if (backupData.appointments) {
            await supabase
              .from('appointments')
              .upsert(backupData.appointments.map(app => ({ ...app, user_id: user.id })));
          }

          if (backupData.medications) {
            await supabase
              .from('medications')
              .upsert(backupData.medications.map(med => ({ ...med, user_id: user.id })));
          }

          setSuccess('Data imported successfully');
          fetchBackupHistory();
        } catch (error) {
          setError('Invalid backup file format');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Data Backup & Restore</h2>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">
                <FaDownload className="me-2" />
                Export Data
              </h5>
              <p className="card-text">
                Download a backup of your health data, including profile information,
                health records, appointments, and medications.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleExportData}
                disabled={loading}
              >
                {loading ? 'Exporting...' : 'Export Data'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <FaUpload className="me-2" />
                Import Data
              </h5>
              <p className="card-text">
                Restore your health data from a previous backup file.
              </p>
              <input
                type="file"
                className="form-control mb-3"
                accept=".json"
                onChange={handleImportData}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <FaHistory className="me-2" />
                Backup History
              </h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupHistory.map((backup) => (
                      <tr key={backup.id}>
                        <td>{new Date(backup.created_at).toLocaleString()}</td>
                        <td>
                          {backup.type === 'export' ? (
                            <FaDownload className="me-1" />
                          ) : (
                            <FaUpload className="me-1" />
                          )}
                          {backup.type.charAt(0).toUpperCase() + backup.type.slice(1)}
                        </td>
                        <td>
                          <span className={`badge bg-${backup.status === 'completed' ? 'success' : 'warning'}`}>
                            {backup.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataBackup; 