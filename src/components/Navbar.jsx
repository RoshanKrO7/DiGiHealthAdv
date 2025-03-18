import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setupMenuListeners } from '../utils/menuHandlers';
import { supabase } from '../utils/supabaseClient';
import '../dashboardstyle.css'; // Ensure you import your CSS file

const Navbar = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setupMenuListeners();
    checkUserRole();
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

  const handleMenuClick = (e) => {
    e.preventDefault();
    const targetId = e.currentTarget.id;
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

  return (
    <nav id="menu">
      <div className="logo">
        <Link to="/dashboard">
          <img 
            src={process.env.PUBLIC_URL + '/favicon_io/android-chrome-512x512-Photoroom.png'} 
            alt="Logo" 
            className="logo" 
          />
        </Link>
      </div>
      <div className="menu-item">
        <div className="menu-text">
          <a href="#" data-link>Your Journey</a>
        </div>
        <div className="sub-menu triple">
          <div className="icon-box" id="health-overview" onClick={handleMenuClick}>
            <div className="icon"><i className="fa fa-hospital-user"></i></div>
            <div className="text">
              <div className="title">Health Overview</div>
              <div className="sub-text">See, add and update your Journey</div>
            </div>
          </div>
          <div className="icon-box" id="medical-history" onClick={handleMenuClick}>
            <div className="icon"><i className="fa fa-timeline"></i></div>
            <div className="text">
              <div className="title">Medical History</div>
              <div className="sub-text">Through your Journey</div>
            </div>
          </div>
          <div className="icon-box" id="chronic-disease-management" onClick={handleMenuClick}>
            <div className="icon"><i className="fa fa-diagnoses"></i></div>
            <div className="text">
              <div className="title">Chronic Disease Management</div>
              <div className="sub-text">Manage your chronic conditions</div>
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
      {/* Add a new menu item for AI features */}
      <div className="menu-item">
        <div className="menu-text">
          <a href="#" data-link>AI Tools</a>
        </div>
        <div className="sub-menu double">
          <div className="icon-box" id="ai-image-analysis" onClick={(e) => {
            e.preventDefault();
            navigate('/ai/image-analysis');
          }}>
            <div className="icon"><i className="fa fa-microscope"></i></div>
            <div className="text">
              <div className="title">Medical Image Analysis</div>
              <div className="sub-text">AI analysis of medical images</div>
            </div>
          </div>
          <div className="icon-box" id="ai-health-assistant" onClick={(e) => {
            e.preventDefault();
            navigate('/ai/health-assistant');
          }}>
            <div className="icon"><i className="fa fa-robot"></i></div>
            <div className="text">
              <div className="title">Health Assistant</div>
              <div className="sub-text">Chat with our AI assistant</div>
            </div>
          </div>
          <div className="icon-box" id="ai-recommendations" onClick={(e) => {
            e.preventDefault();
            navigate('/ai/health-recommendations');
          }}>
            <div className="icon"><i className="fa fa-lightbulb"></i></div>
            <div className="text">
              <div className="title">Health Recommendations</div>
              <div className="sub-text">Get personalized AI recommendations</div>
            </div>
          </div>
          <div className="icon-box" id="ai-symptom-checker" onClick={(e) => {
            e.preventDefault();
            navigate('/ai/symptom-checker');
          }}>
            <div className="icon"><i className="fa fa-stethoscope"></i></div>
            <div className="text">
              <div className="title">Symptom Checker</div>
              <div className="sub-text">AI analysis of symptoms</div>
            </div>
          </div>
        </div>
      </div>

      <div className="menu-item">
        <div className="menu-text">
          <a href="#" data-link>Account</a>
        </div>
        <div className="sub-menu double">
          <div className="icon-box" id="profile-settings" onClick={handleMenuClick}>
            <div className="icon"><i className="fa fa-user-cog"></i></div>
            <div className="text">
              <div className="title">Profile Settings</div>
              <div className="sub-text">Edit your personal details</div>
            </div>
          </div>
          <div className="icon-box" id="security-settings" onClick={handleMenuClick}>
            <div className="icon"><i className="fa fa-lock"></i></div>
            <div className="text">
              <div className="title">Security Settings</div>
              <div className="sub-text">Manage passwords and 2FA</div>
            </div>
          </div>
          <div className="icon-box" id="data-backup" onClick={handleMenuClick}>
            <div className="icon"><i className="fa fa-download"></i></div>
            <div className="text">
              <div className="title">Data Backup & Export</div>
              <div className="sub-text">Backup and download your data</div>
            </div>
          </div>
          {isAdmin && (
            <div className="icon-box" id="database-setup" onClick={handleMenuClick}>
              <div className="icon"><i className="fa fa-database"></i></div>
              <div className="text">
                <div className="title">Database Setup</div>
                <div className="sub-text">Reset and setup database tables</div>
              </div>
            </div>
          )}
          <div className="icon-box" id="logout-div" onClick={handleMenuClick}>
            <div className="icon"><i className="fa-solid fa-arrow-right-from-bracket"></i></div>
            <div className="text">
              <div className="title">Logout</div>
              <div className="sub-text">Logout your account</div>
            </div>
          </div>
        </div>
      </div>  
    </nav>
  );
};

export default Navbar;
