import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Spinner from '../components/Spinner';
import EmergencyQRCode from '../components/EmergencyQRCode';
import 'bootstrap/dist/css/bootstrap.min.css';
import './ProfilePage.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    first_name: null,
    last_name: null,
    email: null,
    date_of_birth: null,
    gender: null,
    blood_group: null,
    height: '',
    weight: '',
    allergies: [],
    medical_conditions: [],
    emergency_contact_name: null,
    emergency_contact_phone: null,
    emergency_contact_relationship: null,
    phone: null,
    address: null,
    bio: '',
    profile_picture: null
  });
  const [diseaseNames, setDiseaseNames] = useState([]);
  const [newDiseaseName, setNewDiseaseName] = useState('');
  const [parameters, setParameters] = useState([]);
  const [newParameter, setNewParameter] = useState({ name: '', value: '', unit: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notification, setNotification] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [newAllergy, setNewAllergy] = useState({ name: '', severity: 'mild' });
  const [commonDiseases, setCommonDiseases] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchProfile();
    fetchDiseases();
    fetchAllergies();
    fetchParameters();
    
    // Check for URL parameters
    const queryParams = new URLSearchParams(window.location.search);
    const section = queryParams.get('section');
    if (section) {
        setActiveSection(section);
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === 'diseases') {
      fetchCommonDiseases();
    }
  }, [activeSection]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('detailed_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const { data: newProfile, error: createError } = await supabase
            .from('detailed_profiles')
            .insert([{ id: user.id }])
            .select()
            .single();
            
          if (createError) throw createError;
          setProfile(newProfile || {});
        } else {
          throw error;
        }
      } else {
        setProfile(data || {});
      }
    } catch (error) {
      toast.error('Error fetching profile: ' + error.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDiseases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('user_diseases')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      setDiseaseNames(data || []);
    } catch (error) {
      console.error('Error fetching diseases:', error);
    }
  };

  const fetchCommonDiseases = async () => {
    try {
      const { data, error } = await supabase
        .from('common_diseases')
        .select('*');
        
      if (error) throw error;
      setCommonDiseases(data || []);
    } catch (error) {
      console.error('Error fetching common diseases:', error);
    }
  };

  const fetchAllergies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('user_allergies')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      setAllergies(data || []);
    } catch (error) {
      console.error('Error fetching allergies:', error);
    }
  };

  const fetchParameters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('user_parameters')
        .select('*')
        .eq('user_id', user.id)
        .order('date_recorded', { ascending: false });
        
      if (error) throw error;
      setParameters(data || []);
    } catch (error) {
      console.error('Error fetching parameters:', error);
    }
  };

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Only include fields that are in the detailed_profiles table
      const updatedProfile = {
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        email: profile.email || null,
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender || null,
        blood_group: profile.blood_group || null,
        height: profile.height || null,  // Add height field
        weight: profile.weight || null,  // Add weight field
        phone: profile.phone || null,
        address: profile.address || null,
        emergency_contact_name: profile.emergency_contact_name || null,
        emergency_contact_phone: profile.emergency_contact_phone || null,
        emergency_contact_relationship: profile.emergency_contact_relationship || null,
        profile_picture: profile.profile_picture || null,
        bio: profile.bio || null,       // Add bio field if needed
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('detailed_profiles')
        .update(updatedProfile)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      setEditing(false);
    } catch (error) {
      toast.error('Error updating profile: ' + error.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiseaseName = async () => {
    if (newDiseaseName.trim()) {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');
        
        // Check if disease already exists for user
        const { data: existingDisease, error: checkError } = await supabase
          .from('user_diseases')
          .select('*')
          .eq('user_id', user.id)
          .eq('disease_name', newDiseaseName)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        
        if (!existingDisease) {
          // Insert the disease for this user
          const { data, error } = await supabase
            .from('user_diseases')
            .insert([{
              user_id: user.id,
              disease_name: newDiseaseName,
              date_diagnosed: new Date().toISOString()
            }])
            .select();
            
          if (error) throw error;
          
          setDiseaseNames([...diseaseNames, ...data]);
          toast.success('Disease added successfully!', {
            position: "top-right",
            autoClose: 3000
          });
        } else {
          toast.info('This disease is already in your list', {
            position: "top-right",
            autoClose: 3000
          });
        }
        
        setNewDiseaseName('');
      } catch (error) {
        console.error('Error adding disease:', error);
        toast.error('Error adding disease: ' + error.message, {
          position: "top-right",
          autoClose: 5000
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddParameter = async () => {
    if (newParameter.name.trim() && newParameter.value.trim()) {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');
        
        // Insert the parameter for this user
        const { data, error } = await supabase
          .from('user_parameters')
          .insert([{
            user_id: user.id,
            parameter_name: newParameter.name,
            value: newParameter.value,
            unit: newParameter.unit || '',
            date_recorded: new Date().toISOString()
          }])
          .select();
          
        if (error) throw error;
        
        setParameters([...parameters, ...data]);
        setNewParameter({ name: '', value: '', unit: '' });
        toast.success('Parameter added successfully!', {
          position: "top-right",
          autoClose: 3000
        });
      } catch (error) {
        console.error('Error adding parameter:', error);
        toast.error('Error adding parameter: ' + error.message, {
          position: "top-right", 
          autoClose: 5000
        });
      } finally {
        setLoading(false);
      }
    } else {
      toast.warning('Please enter both parameter name and value', {
        position: "top-right",
        autoClose: 3000
      });
    }
  };

  const handleAddAllergy = async () => {
    if (newAllergy.name.trim()) {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');
        
        // Check if allergy already exists for user
        const { data: existingAllergy, error: checkError } = await supabase
          .from('user_allergies')
          .select('*')
          .eq('user_id', user.id)
          .eq('allergy_name', newAllergy.name)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        
        if (!existingAllergy) {
          // Insert the allergy for this user
          const { data, error } = await supabase
            .from('user_allergies')
            .insert([{
              user_id: user.id,
              allergy_name: newAllergy.name,
              severity: newAllergy.severity
            }])
            .select();
            
          if (error) throw error;
          
          setAllergies([...allergies, ...data]);
          toast.success('Allergy added successfully!', {
            position: "top-right",
            autoClose: 3000
          });
        } else {
          toast.info('This allergy is already in your list', {
            position: "top-right", 
            autoClose: 3000
          });
        }
        
        setNewAllergy({ name: '', severity: 'mild' });
      } catch (error) {
        console.error('Error adding allergy:', error);
        toast.error('Error adding allergy: ' + error.message, {
          position: "top-right",
          autoClose: 5000
        });
      } finally {
        setLoading(false);
      }
    } else {
      toast.warning('Please enter an allergy name', {
        position: "top-right",
        autoClose: 3000
      });
    }
  };

  const handleImageUpload = async (e) => {
    try {
      setUploadingImage(true);
      const file = e.target.files[0];
      if (!file) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, profile_picture: publicUrl }));
      
      // Update the profile with the new image URL
      const { error: updateError } = await supabase
        .from('detailed_profiles')
        .update({ profile_picture: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Profile picture updated successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (error) {
      toast.error('Error uploading image: ' + error.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="profile-page container-fluid">
      {notification && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          {notification}
          <button type="button" className="btn-close" onClick={() => setNotification('')}></button>
        </div>
      )}
      
      <div className="row">
        {/* Left Sidebar - Make it collapsible on mobile */}
        <div className="col-lg-3 col-md-4">
          <div className="profile-sidebar card mb-3">
            <div className="d-lg-none">
              <button 
                className="btn btn-link w-100 text-start" 
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <i className="fas fa-bars me-2"></i>
                Menu
              </button>
            </div>
            <div className={`card-body ${showSidebar ? '' : 'd-none d-lg-block'}`}>
              <div className="profile-picture-container mb-3">
                <img
                  src={profile.profile_picture || '/default-profile.png'}
                  alt="Profile"
                  className="profile-picture img-fluid rounded-circle mb-2"
                />
                {editing && (
                  <div className="mt-2">
                    <input type="file" onChange={handleImageUpload} className="form-control form-control-sm" />
                  </div>
                )}
                {uploadingImage && <Spinner />}
              </div>
              <h3 className="mb-0">{profile.first_name} {profile.last_name}</h3>
              <p className="text-muted">{profile.email}</p>
              <button 
                onClick={() => setEditing(!editing)} 
                className={`btn ${editing ? 'btn-secondary' : 'btn-primary'} w-100`}
              >
                {editing ? 'Cancel Editing' : 'Edit Profile'}
              </button>
            </div>
            
            <div className="list-group list-group-flush">
              <button 
                className={`list-group-item list-group-item-action ${activeSection === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveSection('profile')}
              >
                <i className="fas fa-user me-2"></i> Basic Information
              </button>
              <button 
                className={`list-group-item list-group-item-action ${activeSection === 'medical' ? 'active' : ''}`}
                onClick={() => setActiveSection('medical')}
              >
                <i className="fas fa-heartbeat me-2"></i> Medical Information
              </button>
              <button 
                className={`list-group-item list-group-item-action ${activeSection === 'emergency' ? 'active' : ''}`}
                onClick={() => setActiveSection('emergency')}
              >
                <i className="fas fa-phone-alt me-2"></i> Emergency Contacts
              </button>
              <button 
                className={`list-group-item list-group-item-action ${activeSection === 'diseases' ? 'active' : ''}`}
                onClick={() => setActiveSection('diseases')}
              >
                <i className="fas fa-notes-medical me-2"></i> Diseases & Conditions
              </button>
              <button 
                className={`list-group-item list-group-item-action ${activeSection === 'parameters' ? 'active' : ''}`}
                onClick={() => setActiveSection('parameters')}
              >
                <i className="fas fa-chart-line me-2"></i> Health Parameters
              </button>
              <button 
                className={`list-group-item list-group-item-action ${activeSection === 'emergency-qr' ? 'active' : ''}`}
                onClick={() => setActiveSection('emergency-qr')}
              >
                <i className="fas fa-qrcode me-2"></i> Emergency QR Code
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-lg-9 col-md-8">
          <div className="card">
            <div className="card-body">
              {activeSection === 'profile' && (
                <div className="profile-section">
                  <h4 className="card-title mb-4">Basic Information</h4>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>First Name:</label>
                        {editing ? (
                          <input type="text" name="first_name" value={profile.first_name} onChange={handleChange} className="form-control" />
                        ) : (
                          <p className="form-control-plaintext">{profile.first_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>Last Name:</label>
                        {editing ? (
                          <input type="text" name="last_name" value={profile.last_name} onChange={handleChange} className="form-control" />
                        ) : (
                          <p className="form-control-plaintext">{profile.last_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>Email:</label>
                        {editing ? (
                          <input type="email" name="email" value={profile.email} onChange={handleChange} className="form-control" />
                        ) : (
                          <p className="form-control-plaintext">{profile.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>Phone:</label>
                        {editing ? (
                          <input type="tel" name="phone" value={profile.phone} onChange={handleChange} className="form-control" />
                        ) : (
                          <p className="form-control-plaintext">{profile.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="profile-field">
                        <label>Address:</label>
                        {editing ? (
                          <input type="text" name="address" value={profile.address} onChange={handleChange} className="form-control" />
                        ) : (
                          <p className="form-control-plaintext">{profile.address}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="profile-field">
                        <label>Bio:</label>
                        {editing ? (
                          <textarea name="bio" value={profile.bio} onChange={handleChange} className="form-control" rows="3"></textarea>
                        ) : (
                          <p className="form-control-plaintext">{profile.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'medical' && (
                <div className="medical-section">
                  <h4 className="card-title mb-4">Medical Information</h4>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>Date of Birth:</label>
                        {editing ? (
                          <input type="date" name="date_of_birth" value={profile.date_of_birth} onChange={handleChange} className="form-control" />
                        ) : (
                          <p className="form-control-plaintext">{profile.date_of_birth}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>Gender:</label>
                        {editing ? (
                          <select name="gender" value={profile.gender} onChange={handleChange} className="form-control">
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <p className="form-control-plaintext">{profile.gender}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>Blood Group:</label>
                        {editing ? (
                          <select name="blood_group" value={profile.blood_group} onChange={handleChange} className="form-control">
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        ) : (
                          <p className="form-control-plaintext">{profile.blood_group}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>Height (cm):</label>
                        {editing ? (
                          <input type="number" name="height" value={profile.height} onChange={handleChange} className="form-control" />
                        ) : (
                          <p className="form-control-plaintext">{profile.height}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>Weight (kg):</label>
                        {editing ? (
                          <input type="number" name="weight" value={profile.weight} onChange={handleChange} className="form-control" />
                        ) : (
                          <p className="form-control-plaintext">{profile.weight}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'emergency' && (
                <div className="emergency-section">
                  <h4 className="card-title mb-4">Emergency Contact Information</h4>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>Emergency Contact Name:</label>
                        {editing ? (
                          <input type="text" name="emergency_contact_name" value={profile.emergency_contact_name} onChange={handleChange} className="form-control" />
                        ) : (
                          <p className="form-control-plaintext">{profile.emergency_contact_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>Emergency Contact Phone:</label>
                        {editing ? (
                          <input type="tel" name="emergency_contact_phone" value={profile.emergency_contact_phone} onChange={handleChange} className="form-control" />
                        ) : (
                          <p className="form-control-plaintext">{profile.emergency_contact_phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="profile-field">
                        <label>Relationship:</label>
                        {editing ? (
                          <input type="text" name="emergency_contact_relationship" value={profile.emergency_contact_relationship} onChange={handleChange} className="form-control" />
                        ) : (
                          <p className="form-control-plaintext">{profile.emergency_contact_relationship}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'diseases' && (
                <div className="diseases-section">
                  <h4 className="card-title mb-4">Diseases & Medical Conditions</h4>
                  <div className="row">
                    <div className="col-12">
                      <div className="disease-list mb-4">
                        {diseaseNames.map((disease) => (
                          <span key={disease.id} className="badge bg-warning text-dark me-2 mb-2 p-2">
                            {disease.disease_name}
                          </span>
                        ))}
                      </div>
                      {editing && (
                        <div className="input-group mb-3">
                          <select
                            className="form-select"
                            value={newDiseaseName}
                            onChange={(e) => setNewDiseaseName(e.target.value)}
                          >
                            <option value="">Select a disease</option>
                            {commonDiseases.map((disease) => (
                              <option key={disease.id} value={disease.name}>
                                {disease.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Or enter a new disease"
                            value={newDiseaseName === "" ? "" : newDiseaseName}
                            onChange={(e) => setNewDiseaseName(e.target.value)}
                          />
                          <button onClick={handleAddDiseaseName} className="btn btn-primary">Add</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Allergies Section */}
                  <h5 className="card-title mb-3 mt-4">Allergies</h5>
                  <div className="row">
                    <div className="col-12">
                      <div className="allergy-list mb-4">
                        {allergies.map((allergy) => (
                          <span key={allergy.id} className="badge bg-warning text-dark me-2 mb-2 p-2">
                            {allergy.allergy_name} ({allergy.severity})
                          </span>
                        ))}
                      </div>
                      {editing && (
                        <div className="row g-2">
                          <div className="col-sm-6">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Allergy name"
                              value={newAllergy.name}
                              onChange={(e) => setNewAllergy({...newAllergy, name: e.target.value})}
                            />
                          </div>
                          <div className="col-sm-4">
                            <select
                              className="form-select"
                              value={newAllergy.severity}
                              onChange={(e) => setNewAllergy({...newAllergy, severity: e.target.value})}
                            >
                              <option value="mild">Mild</option>
                              <option value="moderate">Moderate</option>
                              <option value="severe">Severe</option>
                            </select>
                          </div>
                          <div className="col-sm-2">
                            <button onClick={handleAddAllergy} className="btn btn-primary w-100">Add</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'parameters' && (
                <div className="parameters-section">
                  <h4 className="card-title mb-4">Health Parameters</h4>
                  <div className="row">
                    <div className="col-12">
                      <div className="parameter-list mb-4">
                        {parameters.map((param) => (
                          <div key={param.id} className="badge bg-success text-dark me-2 mb-2 p-2">
                            {param.parameter_name}: {param.value} {param.unit}
                          </div>
                        ))}
                      </div>
                      {editing && (
                        <div className="row g-2">
                          <div className="col-sm-4">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Parameter name"
                              value={newParameter.name}
                              onChange={(e) => setNewParameter({...newParameter, name: e.target.value})}
                            />
                          </div>
                          <div className="col-sm-4">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Value"
                              value={newParameter.value}
                              onChange={(e) => setNewParameter({...newParameter, value: e.target.value})}
                            />
                          </div>
                          <div className="col-sm-2">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Unit"
                              value={newParameter.unit}
                              onChange={(e) => setNewParameter({...newParameter, unit: e.target.value})}
                            />
                          </div>
                          <div className="col-sm-2">
                            <button onClick={handleAddParameter} className="btn btn-primary w-100">Add</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'emergency-qr' && (
                <div className="emergency-qr-section">
                  <h4 className="card-title mb-4">Emergency Medical QR Code</h4>
                  <div className="row">
                    <div className="col-md-8 offset-md-2">
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        This QR code contains your essential medical information for emergency situations. 
                        Keep it accessible, such as in your wallet, on your phone, or on emergency medical ID.
                      </div>
                      <EmergencyQRCode size={180} />
                      <div className="mt-4">
                        <p className="text-muted">
                          <i className="fas fa-shield-alt me-2"></i>
                          <strong>Privacy Note:</strong> The QR code is updated automatically when you change your 
                          profile information, allergies, or medical conditions. The information included in the 
                          QR code is limited to what would be helpful in a medical emergency.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editing && activeSection !== 'emergency-qr' && activeSection !== 'parameters' && activeSection !== 'diseases' && (
                <div className="mt-4 text-end">
                  <button onClick={handleSave} className="btn btn-success">
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;