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
    <div className="profile-page">
      {notification && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          {notification}
          <button type="button" className="btn-close" onClick={() => setNotification('')}></button>
        </div>
      )}
      
      {/* Left Sidebar */}
      <div className="profile-sidebar">
        <div className="profile-picture-container">
          <img
            src={profile.profile_picture || '/default-profile.png'}
            alt="Profile"
            className="profile-picture"
          />
          {editing && (
            <div className="mt-2">
              <input type="file" onChange={handleImageUpload} className="form-control form-control-sm" />
            </div>
          )}
          {uploadingImage && <Spinner />}
        </div>
        
        <h3 className="profile-name">{profile.first_name} {profile.last_name}</h3>
        <p className="profile-email">{profile.email}</p>
        
        <button 
          onClick={() => setEditing(!editing)} 
          className="edit-profile-btn"
        >
          {editing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
        
        <nav className="profile-nav">
          <button 
            className={`profile-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <i className="fas fa-user"></i> Basic Information
          </button>
          <button 
            className={`profile-nav-item ${activeSection === 'medical' ? 'active' : ''}`}
            onClick={() => setActiveSection('medical')}
          >
            <i className="fas fa-heartbeat"></i> Medical Information
          </button>
          <button 
            className={`profile-nav-item ${activeSection === 'emergency' ? 'active' : ''}`}
            onClick={() => setActiveSection('emergency')}
          >
            <i className="fas fa-phone-alt"></i> Emergency Contacts
          </button>
          <button 
            className={`profile-nav-item ${activeSection === 'diseases' ? 'active' : ''}`}
            onClick={() => setActiveSection('diseases')}
          >
            <i className="fas fa-notes-medical"></i> Diseases & Conditions
          </button>
          <button 
            className={`profile-nav-item ${activeSection === 'parameters' ? 'active' : ''}`}
            onClick={() => setActiveSection('parameters')}
          >
            <i className="fas fa-chart-line"></i> Health Parameters
          </button>
          <button 
            className={`profile-nav-item ${activeSection === 'emergency-qr' ? 'active' : ''}`}
            onClick={() => setActiveSection('emergency-qr')}
          >
            <i className="fas fa-qrcode"></i> Emergency QR Code
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        {activeSection === 'profile' && (
          <div className="profile-section">
            <h2 className="section-title">Basic Information</h2>
            <div className="profile-field">
              <div>
                <label>First Name</label>
                {editing ? (
                  <input type="text" name="first_name" value={profile.first_name || ''} onChange={handleChange} className="form-control" />
                ) : (
                  <div className="profile-field-value">{profile.first_name}</div>
                )}
              </div>
              <div>
                <label>Last Name</label>
                {editing ? (
                  <input type="text" name="last_name" value={profile.last_name || ''} onChange={handleChange} className="form-control" />
                ) : (
                  <div className="profile-field-value">{profile.last_name}</div>
                )}
              </div>
            </div>
            
            <div className="profile-field">
              <div>
                <label>Email</label>
                {editing ? (
                  <input type="email" name="email" value={profile.email || ''} onChange={handleChange} className="form-control" />
                ) : (
                  <div className="profile-field-value">{profile.email}</div>
                )}
              </div>
              <div>
                <label>Phone</label>
                {editing ? (
                  <input type="tel" name="phone" value={profile.phone || ''} onChange={handleChange} className="form-control" />
                ) : (
                  <div className="profile-field-value">{profile.phone}</div>
                )}
              </div>
            </div>

            <div className="profile-field">
              <div>
                <label>Address</label>
                {editing ? (
                  <input type="text" name="address" value={profile.address || ''} onChange={handleChange} className="form-control" />
                ) : (
                  <div className="profile-field-value">{profile.address}</div>
                )}
              </div>
              <div>
                <label>Bio</label>
                {editing ? (
                  <textarea name="bio" value={profile.bio || ''} onChange={handleChange} className="form-control" rows="3"></textarea>
                ) : (
                  <div className="profile-field-value">{profile.bio}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'medical' && (
          <div className="profile-section">
            <h2 className="section-title">Medical Information</h2>
            <div className="profile-field">
              <div>
                <label>Date of Birth</label>
                {editing ? (
                  <input type="date" name="date_of_birth" value={profile.date_of_birth || ''} onChange={handleChange} className="form-control" />
                ) : (
                  <div className="profile-field-value">{profile.date_of_birth}</div>
                )}
              </div>
              <div>
                <label>Gender</label>
                {editing ? (
                  <select name="gender" value={profile.gender || ''} onChange={handleChange} className="form-control">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <div className="profile-field-value">{profile.gender}</div>
                )}
              </div>
            </div>

            <div className="profile-field">
              <div>
                <label>Blood Group</label>
                {editing ? (
                  <select name="blood_group" value={profile.blood_group || ''} onChange={handleChange} className="form-control">
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
                  <div className="profile-field-value">{profile.blood_group}</div>
                )}
              </div>
              <div>
                <label>Height (cm)</label>
                {editing ? (
                  <input type="number" name="height" value={profile.height || ''} onChange={handleChange} className="form-control" />
                ) : (
                  <div className="profile-field-value">{profile.height}</div>
                )}
              </div>
            </div>

            <div className="profile-field">
              <div>
                <label>Weight (kg)</label>
                {editing ? (
                  <input type="number" name="weight" value={profile.weight || ''} onChange={handleChange} className="form-control" />
                ) : (
                  <div className="profile-field-value">{profile.weight}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'emergency' && (
          <div className="profile-section">
            <h2 className="section-title">Emergency Contact Information</h2>
            <div className="profile-field">
              <div>
                <label>Emergency Contact Name</label>
                {editing ? (
                  <input 
                    type="text" 
                    name="emergency_contact_name" 
                    value={profile.emergency_contact_name || ''} 
                    onChange={handleChange} 
                    className="form-control" 
                  />
                ) : (
                  <div className="profile-field-value">{profile.emergency_contact_name}</div>
                )}
              </div>
              <div>
                <label>Emergency Contact Phone</label>
                {editing ? (
                  <input 
                    type="tel" 
                    name="emergency_contact_phone" 
                    value={profile.emergency_contact_phone || ''} 
                    onChange={handleChange} 
                    className="form-control" 
                  />
                ) : (
                  <div className="profile-field-value">{profile.emergency_contact_phone}</div>
                )}
              </div>
            </div>
            <div className="profile-field">
              <div>
                <label>Relationship</label>
                {editing ? (
                  <input 
                    type="text" 
                    name="emergency_contact_relationship" 
                    value={profile.emergency_contact_relationship || ''} 
                    onChange={handleChange} 
                    className="form-control" 
                  />
                ) : (
                  <div className="profile-field-value">{profile.emergency_contact_relationship}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'diseases' && (
          <div className="profile-section">
            <h2 className="section-title">Diseases & Medical Conditions</h2>
            <div className="disease-list">
              {diseaseNames.map((disease) => (
                <span key={disease.id} className="badge bg-info me-2 mb-2">
                  {disease.disease_name}
                </span>
              ))}
            </div>
            {editing && (
              <div className="add-disease-form mt-4">
                <h3 className="subsection-title">Add Disease</h3>
                <div className="input-group">
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
              </div>
            )}

            <h3 className="subsection-title mt-5">Allergies</h3>
            <div className="allergy-list">
              {allergies.map((allergy) => (
                <span key={allergy.id} className="badge bg-warning text-dark me-2 mb-2">
                  {allergy.allergy_name} ({allergy.severity})
                </span>
              ))}
            </div>
            {editing && (
              <div className="add-allergy-form mt-4">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Allergy name"
                    value={newAllergy.name}
                    onChange={(e) => setNewAllergy({...newAllergy, name: e.target.value})}
                  />
                  <select
                    className="form-select"
                    value={newAllergy.severity}
                    onChange={(e) => setNewAllergy({...newAllergy, severity: e.target.value})}
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                  <button onClick={handleAddAllergy} className="btn btn-primary">Add</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'parameters' && (
          <div className="profile-section">
            <h2 className="section-title">Health Parameters</h2>
            <div className="parameter-list">
              {parameters.map((param) => (
                <div key={param.id} className="parameter-item">
                  <span className="parameter-name">{param.parameter_name}</span>
                  <span className="parameter-value">{param.value} {param.unit}</span>
                  <span className="parameter-date">
                    {new Date(param.date_recorded).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
            {editing && (
              <div className="add-parameter-form mt-4">
                <h3 className="subsection-title">Add Parameter</h3>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Parameter name"
                    value={newParameter.name}
                    onChange={(e) => setNewParameter({...newParameter, name: e.target.value})}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Value"
                    value={newParameter.value}
                    onChange={(e) => setNewParameter({...newParameter, value: e.target.value})}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Unit"
                    value={newParameter.unit}
                    onChange={(e) => setNewParameter({...newParameter, unit: e.target.value})}
                  />
                  <button onClick={handleAddParameter} className="btn btn-primary">Add</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'emergency-qr' && (
          <div className="emergency-qr-section">
            <h2 className="section-title">Emergency Medical QR Code</h2>
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              This QR code contains your essential medical information for emergency situations. 
              Keep it accessible, such as in your wallet, on your phone, or on emergency medical ID.
            </div>
            
            <div className="qrcode-container">
              <EmergencyQRCode size={180} />
            </div>
            
            <p className="section-description">
              <i className="fas fa-shield-alt me-2"></i>
              <strong>Privacy Note:</strong> The QR code is updated automatically when you change your 
              profile information, allergies, or medical conditions. The information included in the 
              QR code is limited to what would be helpful in a medical emergency.
            </p>
          </div>
        )}

        {editing && activeSection !== 'emergency-qr' && (
          <div className="mt-4">
            <button onClick={handleSave} className="btn btn-success">
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;