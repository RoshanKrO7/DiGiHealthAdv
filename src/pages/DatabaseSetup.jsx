import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import SetupDatabase from '../components/SetupDatabase';
import { FaDatabase, FaTable, FaFolder, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Navigate } from 'react-router-dom';

const DatabaseSetup = () => {
  const { user } = useAuth();

  // Only allow admins to access this page
  if (!user || user.user_metadata?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">
        <FaDatabase className="me-2" />
        Database Management
      </h1>

      <div className="alert alert-warning mb-4" role="alert">
        <FaExclamationTriangle className="me-2" />
        <strong>Warning:</strong> This page is for administrators only. The actions performed here will affect all users of the application.
      </div>

      <div className="row">
        <div className="col-md-8">
          <SetupDatabase />
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <FaInfoCircle className="me-2" />
                Database Information
              </h5>
              <p className="card-text">
                The setup process will create the following resources:
              </p>

              <h6 className="mt-3">
                <FaTable className="me-2" />
                Tables
              </h6>
              <ul className="list-group mb-3">
                <li className="list-group-item">detailed_profiles</li>
                <li className="list-group-item">profiles</li>
                <li className="list-group-item">conditions</li>
                <li className="list-group-item">medications</li>
                <li className="list-group-item">appointments</li>
                <li className="list-group-item">telehealth_consultations</li>
                <li className="list-group-item">vitals</li>
                <li className="list-group-item">diseases</li>
                <li className="list-group-item">medical_reports</li>
                <li className="list-group-item">support_tickets</li>
                <li className="list-group-item">chat_sessions</li>
                <li className="list-group-item">chat_messages</li>
                <li className="list-group-item">alerts</li>
                <li className="list-group-item">security_settings</li>
                <li className="list-group-item">backup_history</li>
              </ul>

              <h6 className="mt-3">
                <FaFolder className="me-2" />
                Storage Buckets
              </h6>
              <ul className="list-group">
                <li className="list-group-item">profile-pictures</li>
                <li className="list-group-item">medical-reports</li>
                <li className="list-group-item">health-reports</li>
                <li className="list-group-item">chat-attachments</li>
                <li className="list-group-item">support-attachments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup; 