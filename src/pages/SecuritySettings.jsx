import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FaLock, FaShieldAlt, FaUserLock, FaKey, FaHistory } from 'react-icons/fa';

const SecuritySettings = () => {
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginNotifications: true,
    passwordExpiry: 90,
    maxLoginAttempts: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      setError('Failed to load security settings');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('security_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSuccess('Security settings updated successfully');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Security Settings</h2>
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
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <h5 className="card-title">
                <FaShieldAlt className="me-2" />
                Two-Factor Authentication
              </h5>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="twoFactorEnabled"
                  name="twoFactorEnabled"
                  checked={settings.twoFactorEnabled}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="twoFactorEnabled">
                  Enable two-factor authentication
                </label>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="card-title">
                <FaUserLock className="me-2" />
                Login Security
              </h5>
              <div className="mb-3">
                <label className="form-label">Maximum Login Attempts</label>
                <input
                  type="number"
                  className="form-control"
                  name="maxLoginAttempts"
                  value={settings.maxLoginAttempts}
                  onChange={handleChange}
                  min="1"
                  max="10"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password Expiry (days)</label>
                <input
                  type="number"
                  className="form-control"
                  name="passwordExpiry"
                  value={settings.passwordExpiry}
                  onChange={handleChange}
                  min="30"
                  max="365"
                />
              </div>
            </div>

            <div className="mb-4">
              <h5 className="card-title">
                <FaHistory className="me-2" />
                Activity Notifications
              </h5>
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="emailNotifications"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="emailNotifications">
                  Email notifications for security events
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="loginNotifications"
                  name="loginNotifications"
                  checked={settings.loginNotifications}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="loginNotifications">
                  Notify on new device login
                </label>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="card-title">
                <FaKey className="me-2" />
                Password Management
              </h5>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => {/* Implement password change logic */}}
              >
                Change Password
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Security Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings; 