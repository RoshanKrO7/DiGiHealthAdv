import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, getDiseaseNames, addDiseaseName, getParameters, addParameter } from '../utils/api';
import {supabase} from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import './ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    profile_picture: '',
  });
  const [diseaseNames, setDiseaseNames] = useState([]);
  const [newDiseaseName, setNewDiseaseName] = useState('');
  const [parameters, setParameters] = useState([]);
  const [newParameter, setNewParameter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchDiseaseNames = async () => {
      try {
        const diseases = await getDiseaseNames();
        setDiseaseNames(diseases);
      } catch (error) {
        console.error('Error fetching disease names:', error);
      }
    };

    const fetchParameters = async () => {
      try {
        const params = await getParameters();
        setParameters(params);
      } catch (error) {
        console.error('Error fetching parameters:', error);
      }
    };

    fetchProfile();
    fetchDiseaseNames();
    fetchParameters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile(profile);
      setNotification('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification('Error updating profile.');
    } finally {
      setLoading(false);
      setEditing(false);
    }
  };

  const handleAddDiseaseName = async () => {
    if (newDiseaseName.trim()) {
      try {
        await addDiseaseName(newDiseaseName);
        setDiseaseNames([...diseaseNames, newDiseaseName]);
        setNewDiseaseName('');
        setNotification('Disease added successfully!');
      } catch (error) {
        console.error('Error adding disease name:', error);
        setNotification('Error adding disease name.');
      }
    }
  };

  const handleAddParameter = async () => {
    if (newParameter.trim()) {
      try {
        await addParameter(newParameter);
        setParameters([...parameters, newParameter]);
        setNewParameter('');
        setNotification('Parameter added successfully!');
      } catch (error) {
        console.error('Error adding parameter:', error);
        setNotification('Error adding parameter.');
      }
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('User not authenticated', authError);
      setNotification('User not authenticated.');
      setUploading(false);
      return;
    }

    const fileName = `${user.id}`; // Ensuring one profile picture per user

    // Upload profile picture to Supabase Storage (upsert to replace existing)
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error('Error uploading profile picture:', error);
      setNotification('Error uploading profile picture.');
      setUploading(false);
      return;
    }

    // Retrieve the public URL of the uploaded profile picture
    const { data: publicURLData, error: urlError } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    if (urlError) {
      console.error('Error getting public URL:', urlError);
      setNotification('Error getting public URL.');
      setUploading(false);
      return;
    }

    const publicURL = publicURLData.publicUrl;

    // Update user profile in the database with new profile picture URL
    try {
      await updateUserProfile({ ...profile, profile_picture: publicURL });
      setProfile((prevProfile) => ({
        ...prevProfile,
        profile_picture: publicURL,
      }));
      setNotification('Profile picture updated successfully!');
    } catch (updateError) {
      console.error('Error updating profile with new profile picture URL:', updateError);
      setNotification('Error updating profile picture.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="profile-page container">
      {notification && <div className="alert alert-info">{notification}</div>}
      <div className="profile-header row">
        <div className="col-md-2">
          <img
            src={profile.profile_picture || '/default-profile.png'}
            alt="Profile"
            className="profile-picture img-fluid rounded-circle"
          />
          {editing && (
            <input type="file" onChange={handleProfilePictureUpload} className="form-control mt-2" />
          )}
          {uploading && <Spinner />}
        </div>
        <div className="col-md-5 d-flex align-items-center justify-content-between">
          <h1>{profile.first_name} {profile.last_name}</h1>
          {/* <button onClick={() => setEditing(!editing)} className="btn btn-primary">
            {editing ? 'Cancel' : 'Edit Profile'}
          </button> */}
        </div>
        <div className="col-md-5 d-flex align-items-center justify-content-between">
          {/* <h1>{profile.first_name} {profile.last_name}</h1> */}
          <button onClick={() => setEditing(!editing)} className="btn btn-primary">
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>
      <div className="navigation-buttons my-3">
        <button className={`btn btn-outline-primary ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => setActiveSection('profile')}>Profile</button>
        <button className={`btn btn-outline-primary ${activeSection === 'diseases' ? 'active' : ''}`} onClick={() => setActiveSection('diseases')}>Diseases</button>
        <button className={`btn btn-outline-primary ${activeSection === 'parameters' ? 'active' : ''}`} onClick={() => setActiveSection('parameters')}>Parameters</button>
      </div>
      {activeSection === 'profile' && (
        <div className="profile-details">
          <div className="profile-field">
            <label>First Name:</label>
            {editing ? (
              <input type="text" name="first_name" value={profile.first_name} onChange={handleChange} className="form-control" />
            ) : (
              <span>{profile.first_name}</span>
            )}
          </div>
          <div className="profile-field">
            <label>Last Name:</label>
            {editing ? (
              <input type="text" name="last_name" value={profile.last_name} onChange={handleChange} className="form-control" />
            ) : (
              <span>{profile.last_name}</span>
            )}
          </div>
          <div className="profile-field">
            <label>Email:</label>
            {editing ? (
              <input type="email" name="email" value={profile.email} onChange={handleChange} className="form-control" />
            ) : (
              <span>{profile.email}</span>
            )}
          </div>
          <div className="profile-field">
            <label>Phone:</label>
            {editing ? (
              <input type="text" name="phone" value={profile.phone} onChange={handleChange} className="form-control" />
            ) : (
              <span>{profile.phone}</span>
            )}
          </div>
          <div className="profile-field">
            <label>Address:</label>
            {editing ? (
              <input type="text" name="address" value={profile.address} onChange={handleChange} className="form-control" />
            ) : (
              <span>{profile.address}</span>
            )}
          </div>
          <div className="profile-field">
            <label>Bio:</label>
            {editing ? (
              <textarea name="bio" value={profile.bio} onChange={handleChange} className="form-control"></textarea>
            ) : (
              <span>{profile.bio}</span>
            )}
          </div>
          {editing && (
            <button onClick={handleSave} className="btn btn-success mt-3">Save Changes</button>
          )}
        </div>
      )}
      {activeSection === 'diseases' && (
        <div className="disease-management">
          <h2>Disease Management</h2>
          <div className="disease-list">
            {diseaseNames.map((disease, index) => (
              <div key={index} className="disease-item">{disease}</div>
            ))}
          </div>
          <input
            type="text"
            value={newDiseaseName}
            onChange={(e) => setNewDiseaseName(e.target.value)}
            placeholder="Add new disease"
            className="form-control"
          />
          <button onClick={handleAddDiseaseName} className="btn btn-primary mt-2">Add Disease</button>
        </div>
      )}
      {activeSection === 'parameters' && (
        <div className="parameter-management">
          <h2>Parameter Management</h2>
          <div className="parameter-list">
            {parameters.map((param, index) => (
              <div key={index} className="parameter-item">{param}</div>
            ))}
          </div>
          <input
            type="text"
            value={newParameter}
            onChange={(e) => setNewParameter(e.target.value)}
            placeholder="Add new parameter"
            className="form-control"
          />
          <button onClick={handleAddParameter} className="btn btn-primary mt-2">Add Parameter</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;