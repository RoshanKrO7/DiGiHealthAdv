import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setupMenuListeners } from '../utils/menuHandlers';
import { supabase } from '../utils/supabaseClient';
import './Navbar.css'; // Import the dedicated Navbar CSS file

const Navbar = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setupMenuListeners();
    checkUserRole();
    fetchUserProfile();

    // Close mobile menu on route change
    return () => {
      setIsMobileMenuOpen(false);
    };
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.role === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('detailed_profiles')
          .select('first_name, last_name, profile_picture')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setUserProfile(data);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleMenuClick = (e) => {
    e.preventDefault();
    const targetId = e.currentTarget.id;
    setIsMobileMenuOpen(false);
    document.body.classList.remove('mobile-menu-open');
    
    switch (targetId) {
      case 'health-overview':
        navigate('/health-overview');
        break;
      case 'medical-history':
        navigate('/medical-history');
        break;
      case 'chronic-disease-management':
        navigate('/chronic-disease-management');
        break;
      case 'vaccination-history':
        navigate('/vaccination-history');
        break;
      case 'health-analytics':
        navigate('/health-analytics');
        break;
      case 'medication-tracker':
        navigate('/medication-tracker');
        break;
      case 'profile-settings':
        navigate('/profile');
        break;
      case 'upcoming-appointments':
        navigate('/appointments/upcoming');
        break;
      case 'appointment-history':
        navigate('/appointments/history');
        break;
      case 'telehealth-consultations':
        navigate('/appointments/telehealth');
        break;
      case 'appointment-reminders':
        navigate('/appointments/reminders');
        break;
      case 'help-center':
        navigate('/help-center');
        break;
      case 'contact-support':
        navigate('/support/contact');
        break;
      case 'live-chat':
        navigate('/support/chat');
        break;
      case 'security-settings':
        navigate('/settings/security');
        break;
      case 'data-backup':
        navigate('/settings/backup');
        break;
      case 'database-setup':
        navigate('/admin/database-setup');
        break;
      case 'logout-div':
        handleLogout();
        break;
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Toggle body class for scroll locking
    document.body.classList.toggle('mobile-menu-open');
  };

  // Clean up body class when component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('mobile-menu-open');
      setIsMobileMenuOpen(false);
    };
  }, []);

  return (
    <header className="modern-navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/dashboard">
            <img 
              src={process.env.PUBLIC_URL + '/favicon_io/android-chrome-512x512-Photoroom.png'} 
              alt="DigiHealth Logo" 
              className="logo-image" 
            />
          </Link>
        </div>
        
        <button 
          className={`hamburger-menu ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <nav id="menu" className="navbar-menu">
          <div className="menu-item">
            <div className="menu-text">
              <a href="#" data-link>Your Journey</a>
            </div>
            <div className="sub-menu double">
              <div className="icon-box" id="health-overview" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-hospital-user"></i></div>
                <div className="text">
                  <div className="title">Health Overview</div>
                  <div className="sub-text">See, add and update your Journey</div>
                </div>
              </div>
              {/* <div className="icon-box" id="medical-history" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-timeline"></i></div>
                <div className="text">
                  <div className="title">Medical History</div>
                  <div className="sub-text">Through your Journey</div>
                </div>
              </div> */}
              {/* <div className="icon-box" id="chronic-disease-management" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-diagnoses"></i></div>
                <div className="text">
                  <div className="title">Chronic Disease Management</div>
                  <div className="sub-text">Manage your chronic conditions</div>
                </div>
              </div> */}
              <div className="icon-box" id="vaccination-history" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-syringe"></i></div>
                <div className="text">
                  <div className="title">Vaccination History</div>
                  <div className="sub-text">View and manage vaccinations</div>
                </div>
              </div>
              <div className="icon-box" id="medication-tracker" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-pills"></i></div>
                <div className="text">
                  <div className="title">Medication Tracker</div>
                  <div className="sub-text">Track prescribed medications</div>
                </div>
              </div>
              <div className="icon-box" id="health-analytics" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-chart-line"></i></div>
                <div className="text">
                  <div className="title">Health Analytics</div>
                  <div className="sub-text">View your health trends</div>
                </div>
              </div>
            </div>
          </div>

          <div className="menu-item">
            <div className="menu-text">
              <a href="#" data-link>Appointments</a>
            </div>
            <div className="sub-menu double">
              <div className="icon-box" id="upcoming-appointments" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-calendar-check"></i></div>
                <div className="text">
                  <div className="title">Upcoming Appointments</div>
                  <div className="sub-text">View and manage appointments</div>
                </div>
              </div>
              <div className="icon-box" id="appointment-history" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-history"></i></div>
                <div className="text">
                  <div className="title">Appointment History</div>
                  <div className="sub-text">Check past appointments</div>
                </div>
              </div>
              <div className="icon-box" id="telehealth-consultations" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-phone-alt"></i></div>
                <div className="text">
                  <div className="title">Telehealth Consultations</div>
                  <div className="sub-text">Book virtual appointments</div>
                </div>
              </div>
              <div className="icon-box" id="appointment-reminders" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-clock"></i></div>
                <div className="text">
                  <div className="title">Appointment Reminders</div>
                  <div className="sub-text">Set and manage reminders</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="menu-item">
            <div className="menu-text">
              <a href="#" data-link>Support</a>
            </div>
            <div className="sub-menu double">
              <div className="icon-box" id="help-center" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-book"></i></div>
                <div className="text">
                  <div className="title">Help Center</div>
                  <div className="sub-text">FAQs and tutorials</div>
                </div>
              </div>
              <div className="icon-box" id="contact-support" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-life-ring"></i></div>
                <div className="text">
                  <div className="title">Contact Support</div>
                  <div className="sub-text">Reach out to our team</div>
                </div>
              </div>
              <div className="icon-box" id="live-chat" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-comment-dots"></i></div>
                <div className="text">
                  <div className="title">Live Chat</div>
                  <div className="sub-text">Chat with support agents</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="menu-item">
            <div className="menu-text">
              <a href="#" data-link>AI Tools</a>
            </div>
            <div className="sub-menu double">
              <div className="icon-box" id="ai-health-metrics" onClick={(e) => { e.preventDefault(); navigate('/ai/health-metrics'); }}>
                <div className="icon"><i className="fa fa-chart-bar"></i></div>
                <div className="text">
                  <div className="title">Health Metrics AI</div>
                  <div className="sub-text">Smart analysis of your health data</div>
                </div>
              </div>
              <div className="icon-box" id="ai-symptom-checker" onClick={(e) => { e.preventDefault(); navigate('/ai/symptom-checker'); }}>
                <div className="icon"><i className="fa fa-stethoscope"></i></div>
                <div className="text">
                  <div className="title">Symptom Checker</div>
                  <div className="sub-text">AI-powered symptom analysis</div>
                </div>
              </div>
              <div className="icon-box" id="ai-document-scanner" onClick={(e) => { e.preventDefault(); navigate('/ai/document-scanner'); }}>
                <div className="icon"><i className="fa fa-file-medical-alt"></i></div>
                <div className="text">
                  <div className="title">Document Scanner</div>
                  <div className="sub-text">Extract text from medical documents</div>
                </div>
              </div>
              <div className="icon-box" id="ai-medication-identifier" onClick={(e) => { e.preventDefault(); navigate('/ai/medication-identifier'); }}>
                <div className="icon"><i className="fa fa-pills"></i></div>
                <div className="text">
                  <div className="title">Medication Identifier</div>
                  <div className="sub-text">Identify pills from images</div>
                </div>
              </div>
              <div className="icon-box" id="ai-image-analysis" onClick={(e) => { e.preventDefault(); navigate('/ai/image-analysis'); }}>
                <div className="icon"><i className="fa fa-microscope"></i></div>
                <div className="text">
                  <div className="title">Medical Image Analysis</div>
                  <div className="sub-text">AI analysis of medical images</div>
                </div>
              </div>
              <div className="icon-box" id="ai-health-assistant" onClick={(e) => { e.preventDefault(); navigate('/ai/health-assistant'); }}>
                <div className="icon"><i className="fa fa-robot"></i></div>
                <div className="text">
                  <div className="title">Health Assistant</div>
                  <div className="sub-text">AI health chat assistant</div>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        <div className={`mobile-drawer ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="menu-item">
            <div className="menu-text">
              <a href="#" data-link>Your Journey</a>
            </div>
            <div className="sub-menu double">
              <div className="icon-box" id="health-overview" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-hospital-user"></i></div>
                <div className="text">
                  <div className="title">Health Overview</div>
                  <div className="sub-text">See, add and update your Journey</div>
                </div>
              </div>
              <div className="icon-box" id="vaccination-history" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-syringe"></i></div>
                <div className="text">
                  <div className="title">Vaccination History</div>
                  <div className="sub-text">View and manage vaccinations</div>
                </div>
              </div>
              <div className="icon-box" id="medication-tracker" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-pills"></i></div>
                <div className="text">
                  <div className="title">Medication Tracker</div>
                  <div className="sub-text">Track prescribed medications</div>
                </div>
              </div>
              <div className="icon-box" id="health-analytics" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-chart-line"></i></div>
                <div className="text">
                  <div className="title">Health Analytics</div>
                  <div className="sub-text">View your health trends</div>
                </div>
              </div>
            </div>
          </div>

          <div className="menu-item">
            <div className="menu-text">
              <a href="#" data-link>Appointments</a>
            </div>
            <div className="sub-menu double">
              <div className="icon-box" id="upcoming-appointments" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-calendar-check"></i></div>
                <div className="text">
                  <div className="title">Upcoming Appointments</div>
                  <div className="sub-text">View and manage appointments</div>
                </div>
              </div>
              <div className="icon-box" id="appointment-history" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-history"></i></div>
                <div className="text">
                  <div className="title">Appointment History</div>
                  <div className="sub-text">Check past appointments</div>
                </div>
              </div>
              <div className="icon-box" id="telehealth-consultations" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-phone-alt"></i></div>
                <div className="text">
                  <div className="title">Telehealth Consultations</div>
                  <div className="sub-text">Book virtual appointments</div>
                </div>
              </div>
              <div className="icon-box" id="appointment-reminders" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-clock"></i></div>
                <div className="text">
                  <div className="title">Appointment Reminders</div>
                  <div className="sub-text">Set and manage reminders</div>
                </div>
              </div>
            </div>
          </div>

          <div className="menu-item">
            <div className="menu-text">
              <a href="#" data-link>AI Tools</a>
            </div>
            <div className="sub-menu double">
              <div className="icon-box" id="ai-health-metrics" onClick={(e) => { e.preventDefault(); navigate('/ai/health-metrics'); }}>
                <div className="icon"><i className="fa fa-chart-bar"></i></div>
                <div className="text">
                  <div className="title">Health Metrics AI</div>
                  <div className="sub-text">Smart analysis of your health data</div>
                </div>
              </div>
              <div className="icon-box" id="ai-symptom-checker" onClick={(e) => { e.preventDefault(); navigate('/ai/symptom-checker'); }}>
                <div className="icon"><i className="fa fa-stethoscope"></i></div>
                <div className="text">
                  <div className="title">Symptom Checker</div>
                  <div className="sub-text">AI-powered symptom analysis</div>
                </div>
              </div>
              <div className="icon-box" id="ai-document-scanner" onClick={(e) => { e.preventDefault(); navigate('/ai/document-scanner'); }}>
                <div className="icon"><i className="fa fa-file-medical-alt"></i></div>
                <div className="text">
                  <div className="title">Document Scanner</div>
                  <div className="sub-text">Extract text from medical documents</div>
                </div>
              </div>
              <div className="icon-box" id="ai-medication-identifier" onClick={(e) => { e.preventDefault(); navigate('/ai/medication-identifier'); }}>
                <div className="icon"><i className="fa fa-pills"></i></div>
                <div className="text">
                  <div className="title">Medication Identifier</div>
                  <div className="sub-text">Identify pills from images</div>
                </div>
              </div>
              <div className="icon-box" id="ai-image-analysis" onClick={(e) => { e.preventDefault(); navigate('/ai/image-analysis'); }}>
                <div className="icon"><i className="fa fa-microscope"></i></div>
                <div className="text">
                  <div className="title">Medical Image Analysis</div>
                  <div className="sub-text">AI analysis of medical images</div>
                </div>
              </div>
              <div className="icon-box" id="ai-health-assistant" onClick={(e) => { e.preventDefault(); navigate('/ai/health-assistant'); }}>
                <div className="icon"><i className="fa fa-robot"></i></div>
                <div className="text">
                  <div className="title">Health Assistant</div>
                  <div className="sub-text">AI health chat assistant</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
        
        <div className="navbar-profile">
          <div className="profile-menu menu-item">
            <div className="profile-button">
              {userProfile?.profile_picture ? (
                <img 
                  src={userProfile.profile_picture} 
                  alt="Profile" 
                  className="profile-image" 
                />
              ) : (
                <div className="profile-avatar">
                  <i className="fas fa-user"></i>
                </div>
              )}
            </div>
            <div className="sub-menu profile-dropdown">
              <div className="profile-info">
                <div className="profile-name">
                  {userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}` : 'User'}
                </div>
              </div>
              <div className="icon-box" id="profile-settings" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-user-cog"></i></div>
                <div className="text">
                  <div className="title">Profile Settings</div>
                </div>
              </div>
              <div className="icon-box" id="security-settings" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-shield-alt"></i></div>
                <div className="text">
                  <div className="title">Security Settings</div>
                </div>
              </div>
              <div className="icon-box" id="data-backup" onClick={handleMenuClick}>
                <div className="icon"><i className="fa fa-database"></i></div>
                <div className="text">
                  <div className="title">Data Backup</div>
                </div>
              </div>
              {isAdmin && (
                <div className="icon-box" id="database-setup" onClick={handleMenuClick}>
                  <div className="icon"><i className="fa fa-server"></i></div>
                  <div className="text">
                    <div className="title">Database Setup</div>
                  </div>
                </div>
              )}
              <div className="icon-box logout" id="logout-div" onClick={handleLogout}>
                <div className="icon"><i className="fa fa-sign-out-alt"></i></div>
                <div className="text">
                  <div className="title">Logout</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
