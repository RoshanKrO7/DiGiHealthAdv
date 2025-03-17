import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SetupDatabase from '../components/SetupDatabase';
import { FaDatabase, FaTable, FaFolder, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Navigate } from 'react-router-dom';
import { supabase } from '../utils/main';

const DatabaseSetup = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('');

  // Only allow admins to access this page
  if (!user || user.user_metadata?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  const setupDatabase = async () => {
    try {
      setStatus('Setting up database...');

      // Create profiles table with all necessary columns
      const { error: profilesError } = await supabase.rpc('setup_profiles_table', {
        sql_command: `
          CREATE TABLE IF NOT EXISTS profiles (
            id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            date_of_birth DATE,
            gender VARCHAR(50),
            blood_group VARCHAR(10),
            height DECIMAL,
            weight DECIMAL,
            allergies TEXT[],
            medical_conditions TEXT[],
            emergency_contact_name VARCHAR(255),
            emergency_contact_phone VARCHAR(20),
            emergency_contact_relationship VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
          );

          -- Add RLS policies
          ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Users can view their own profile"
            ON profiles FOR SELECT
            USING (auth.uid() = id);

          CREATE POLICY "Users can update their own profile"
            ON profiles FOR UPDATE
            USING (auth.uid() = id);

          CREATE POLICY "Users can insert their own profile"
            ON profiles FOR INSERT
            WITH CHECK (auth.uid() = id);
        `
      });

      if (profilesError) throw profilesError;

      // Create health_metrics table
      const { error: metricsError } = await supabase.rpc('setup_health_metrics_table', {
        sql_command: `
          CREATE TABLE IF NOT EXISTS health_metrics (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            metric_type VARCHAR(50),
            value DECIMAL,
            unit VARCHAR(20),
            recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            notes TEXT
          );

          ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Users can view their own health metrics"
            ON health_metrics FOR SELECT
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert their own health metrics"
            ON health_metrics FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        `
      });

      if (metricsError) throw metricsError;

      // Create medical_analyses table
      const { error: analysesError } = await supabase.rpc('setup_medical_analyses_table', {
        sql_command: `
          CREATE TABLE IF NOT EXISTS medical_analyses (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            image_type VARCHAR(50),
            image_url TEXT,
            result TEXT,
            confidence DECIMAL,
            analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
          );

          ALTER TABLE medical_analyses ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Users can view their own medical analyses"
            ON medical_analyses FOR SELECT
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert their own medical analyses"
            ON medical_analyses FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        `
      });

      if (analysesError) throw analysesError;

      // Create chat_history table
      const { error: chatError } = await supabase.rpc('setup_chat_history_table', {
        sql_command: `
          CREATE TABLE IF NOT EXISTS chat_history (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            message TEXT,
            response TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
          );

          ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Users can view their own chat history"
            ON chat_history FOR SELECT
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert into their own chat history"
            ON chat_history FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        `
      });

      if (chatError) throw chatError;

      // Create ai_recommendations table
      const { error: recsError } = await supabase.rpc('setup_ai_recommendations_table', {
        sql_command: `
          CREATE TABLE IF NOT EXISTS ai_recommendations (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            category VARCHAR(50),
            recommendation TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
          );

          ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Users can view their own recommendations"
            ON ai_recommendations FOR SELECT
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert their own recommendations"
            ON ai_recommendations FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        `
      });

      if (recsError) throw recsError;

      setStatus('Database setup completed successfully!');
    } catch (error) {
      console.error('Database setup error:', error);
      setStatus(`Error setting up database: ${error.message}`);
    }
  };

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

      <div className="mt-5">
        <button 
          className="btn btn-primary"
          onClick={setupDatabase}
        >
          Initialize Database
        </button>
        <div className="mt-3">
          <p>{status}</p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup; 