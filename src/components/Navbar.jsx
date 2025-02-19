import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { setupMenuListeners } from '../utils/menuHandlers';

const Navbar = () => {
  useEffect(() => {
    setupMenuListeners();
  }, []);

  return (
    <nav id="menu">
        <div className="logo"><a href="/dashboard" data-link>
            <img src="./favicon_io/android-chrome-512x512-Photoroom.png" alt="Logo" className="logo"/>
        </a></div>
        <div className="menu-item">
            <div className="menu-text">
                <a href="#" data-link>Your Journey</a>
            </div>
            <div className="sub-menu triple">
                <div className="icon-box" id="health-overview">
                    <div className="icon"><i className="fa fa-hospital-user"></i></div>
                    <div className="text">
                        <div className="title">Health Overview</div>
                        <div className="sub-text">See, add and update your Journey</div>
                    </div>
                </div>
                <div className="icon-box" id="medical-history">
                    <div className="icon"><i className="fa fa-timeline"></i></div>
                    <div className="text">
                        <div className="title">Medical History</div>
                        <div className="sub-text">Through your Journey</div>
                    </div>
                </div>
                <div className="icon-box" id="chronic-disease-management">
                    <div className="icon"><i className="fa fa-diagnoses"></i></div>
                    <div className="text">
                        <div className="title">Chronic Disease Management</div>
                        <div className="sub-text">Manage your chronic conditions</div>
                    </div>
                </div>
                <div className="icon-box" id="vaccination-history">
                    <div className="icon"><i className="fa fa-syringe"></i></div>
                    <div className="text">
                        <div className="title">Vaccination History</div>
                        <div className="sub-text">View and manage vaccinations</div>
                    </div>
                </div>
                <div className="icon-box" id="medication-tracker">
                    <div className="icon"><i className="fa fa-pills"></i></div>
                    <div className="text">
                        <div className="title">Medication Tracker</div>
                        <div className="sub-text">Track prescribed medications</div>
                    </div>
                </div>
                <div className="icon-box" id="health-analytics">
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
                <div className="icon-box" id="upcoming-appointments">
                    <div className="icon"><i className="fa fa-calendar-check"></i></div>
                    <div className="text">
                        <div className="title">Upcoming Appointments</div>
                        <div className="sub-text">View and manage appointments</div>
                    </div>
                </div>
                <div className="icon-box" id="appointment-history">
                    <div className="icon"><i className="fa fa-history"></i></div>
                    <div className="text">
                        <div className="title">Appointment History</div>
                        <div className="sub-text">Check past appointments</div>
                    </div>
                </div>
                <div className="icon-box" id="telehealth-consultations">
                    <div className="icon"><i className="fa fa-phone-alt"></i></div>
                    <div className="text">
                        <div className="title">Telehealth Consultations</div>
                        <div className="sub-text">Book virtual appointments</div>
                    </div>
                </div>
                <div className="icon-box" id="appointment-reminders">
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
                <div className="icon-box" id="help-center">
                    <div className="icon"><i className="fa fa-book"></i></div>
                    <div className="text">
                        <div className="title">Help Center</div>
                        <div className="sub-text">FAQs and tutorials</div>
                    </div>
                </div>
                <div className="icon-box" id="contact-support">
                    <div className="icon"><i className="fa fa-life-ring"></i></div>
                    <div className="text">
                        <div className="title">Contact Support</div>
                        <div className="sub-text">Reach out to our team</div>
                    </div>
                </div>
                <div className="icon-box" id="live-chat">
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
                <a href="#" data-link>Account</a>
            </div>
            <div className="sub-menu double">
                <div className="icon-box" id="profile-settings">
                    <div className="icon"><i className="fa fa-user-cog"></i></div>
                    <div className="text">
                        <div className="title">Profile Settings</div>
                        <div className="sub-text">Edit your personal details</div>
                    </div>
                </div>
                <div className="icon-box" id="security-settings">
                    <div className="icon"><i className="fa fa-lock"></i></div>
                    <div className="text">
                        <div className="title">Security Settings</div>
                        <div className="sub-text">Manage passwords and 2FA</div>
                    </div>
                </div>
                <div className="icon-box" id="data-backup">
                    <div className="icon"><i className="fa fa-download"></i></div>
                    <div className="text">
                        <div className="title">Data Backup & Export</div>
                        <div className="sub-text">Backup and download your data</div>
                    </div>
                </div>
                <div className="icon-box" id="logout-div">
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
