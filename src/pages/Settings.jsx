import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { FaCog, FaUser, FaShieldAlt, FaDatabase, FaBell, FaPalette, FaLanguage } from 'react-icons/fa';
import SetupDatabase from '../components/SetupDatabase';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [detailedProfile, setDetailedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    language: 'english',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  });

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      // Fetch detailed profile data
      const { data: detailedData, error: detailedError } = await supabase
        .from('detailed_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (detailedError && detailedError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error, which is fine for new users
        throw detailedError;
      }

      // Fetch legacy profile data for backward compatibility
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setDetailedProfile(detailedData);
      setProfile(profileData);
      
      // Initialize form data
      if (detailedData) {
        setFormData({
          firstName: detailedData.first_name || '',
          lastName: detailedData.last_name || '',
          email: detailedData.email || user.email || '',
          phone: detailedData.phone || '',
          address: detailedData.address || '',
          bio: detailedData.bio || '',
          language: profileData?.language || 'english',
          theme: profileData?.theme || 'light',
          notifications: profileData?.notifications || {
            email: true,
            push: true,
            sms: false
          }
        });
      } else if (profileData) {
        // Fallback to legacy profile data
        const nameParts = (profileData.full_name || '').split(' ');
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: profileData.email || user.email || '',
          phone: profileData.phone_number || '',
          address: profileData.address || '',
          bio: '',
          language: profileData.language || 'english',
          theme: profileData.theme || 'light',
          notifications: profileData.notifications || {
            email: true,
            push: true,
            sms: false
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('notification_')) {
      const notificationType = name.replace('notification_', '');
      setFormData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationType]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user) throw new Error('You must be logged in');

      // Update detailed_profiles table
      const { error: detailedError } = await supabase
        .from('detailed_profiles')
        .upsert({
          id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio,
          profile_picture: detailedProfile?.profile_picture || null
        });

      if (detailedError) throw detailedError;

      // Update profiles table for backward compatibility
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone_number: formData.phone,
          address: formData.address,
          language: formData.language,
          theme: formData.theme,
          notifications: formData.notifications,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;
      
      setSuccess('Settings updated successfully');
      fetchProfileData();
    } catch (error) {
      console.error('Error updating settings:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile && !detailedProfile) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">
        <FaCog className="me-2" />
        Settings
      </h1>

      <div className="row">
        <div className="col-md-3 mb-4">
          <div className="list-group">
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <FaUser className="me-2" />
              Profile Settings
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <FaBell className="me-2" />
              Notifications
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <FaPalette className="me-2" />
              Appearance
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <FaShieldAlt className="me-2" />
              Security
            </button>
            {profile?.role === 'admin' && (
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => setActiveTab('database')}
              >
                <FaDatabase className="me-2" />
                Database Setup
              </button>
            )}
          </div>
        </div>

        <div className="col-md-9">
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

          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Profile Settings</h5>
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="firstName" className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="lastName" className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                    />
                    <div className="form-text">Email cannot be changed. Contact support for assistance.</div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="bio" className="form-label">Bio</label>
                    <textarea
                      className="form-control"
                      id="bio"
                      name="bio"
                      rows="3"
                      value={formData.bio}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="language" className="form-label">
                      <FaLanguage className="me-2" />
                      Language
                    </label>
                    <select
                      className="form-select"
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                    >
                      <option value="english">English</option>
                      <option value="spanish">Spanish</option>
                      <option value="french">French</option>
                      <option value="german">German</option>
                      <option value="chinese">Chinese</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Notification Settings</h5>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="notification_email"
                        name="notification_email"
                        checked={formData.notifications.email}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="notification_email">
                        Email Notifications
                      </label>
                    </div>
                    <div className="form-text">Receive notifications via email</div>
                  </div>
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="notification_push"
                        name="notification_push"
                        checked={formData.notifications.push}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="notification_push">
                        Push Notifications
                      </label>
                    </div>
                    <div className="form-text">Receive push notifications in your browser</div>
                  </div>
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="notification_sms"
                        name="notification_sms"
                        checked={formData.notifications.sms}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="notification_sms">
                        SMS Notifications
                      </label>
                    </div>
                    <div className="form-text">Receive notifications via SMS (requires verified phone number)</div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Appearance Settings</h5>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Theme</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="theme"
                          id="themeLight"
                          value="light"
                          checked={formData.theme === 'light'}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="themeLight">
                          Light
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="theme"
                          id="themeDark"
                          value="dark"
                          checked={formData.theme === 'dark'}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="themeDark">
                          Dark
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="theme"
                          id="themeSystem"
                          value="system"
                          checked={formData.theme === 'system'}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="themeSystem">
                          System Default
                        </label>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Security Settings</h5>
                <p>Manage your security settings, password, and two-factor authentication.</p>
                <div className="d-grid gap-2">
                  <a href="/settings/security" className="btn btn-outline-primary">
                    <FaShieldAlt className="me-2" />
                    Go to Security Settings
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && profile?.role === 'admin' && (
            <SetupDatabase />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 