import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/main';
import '../dashboardstyle.css'; // Dashboard-specific styles
import { setupMenuListeners } from '../utils/menuHandlers';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import Spinner from '../components/Spinner'; // Import Spinner component
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  FaHeartbeat,
  FaPills,
  FaCalendarAlt,
  FaFileMedical,
  FaUserMd,
  FaVideo,
  FaChartLine,
  FaBell,
  FaExclamationTriangle,
  FaCheckCircle,
  FaQrcode,
  FaSyringe,
  FaStethoscope,
  FaBone,
  FaAmbulance
} from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const [healthData, setHealthData] = useState({
        vitals: [],
        medications: [],
        appointments: [],
        conditions: [],
        alerts: []
    });
    const [error, setError] = useState(null);

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        // Fetch user profile and update UI
        async function fetchUserProfile() {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                console.log('Fetched user:', user, 'Error:', userError);
                if (userError || !user) {
                    window.location.href = '/';
                    return;
                }
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (error) throw error;
                if (profile) {
                    const userNameEl = document.getElementById('user-name');
                    if (userNameEl) {
                        userNameEl.textContent = `${profile.first_name} ${profile.last_name}`;
                    }
                    // console.log(`Welcome back, ${profile.first_name}!`);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false); // Set loading to false after fetching profile
            }
        }
        fetchUserProfile();

        // Set up menu listeners from menuHandlers.js
        setupMenuListeners();

        // Set up Logout listener
        const logoutDiv = document.getElementById('logout-div');
        if (logoutDiv) {
            logoutDiv.addEventListener('click', async () => {
                try {
                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;
                    showNotification('Logout successful!', 'success'); // Show success notification
                    setTimeout(() => {
                        navigate('/');
                    }, 3000); // Adjust delay as needed
                } catch (error) {
                    console.error('Logout error:', error);
                    showNotification('Logout failed. Please try again.', 'danger'); // Show error notification
                }
            });
        }

        // Load QR Code
        async function loadQRCode() {
            const userResponse = await supabase.auth.getUser();
            if (!userResponse || !userResponse.data.user) return;
            const user_id = userResponse.data.user.id;
            const { data, error } = await supabase
                .from('emergency_contacts')
                .select('qr_code_url')
                .eq('user_id', user_id)
                .single();
            if (error) {
                console.error('Error fetching QR code URL:', error);
                return;
            }
            if (data && data.qr_code_url) {
                const qrCodeContainer = document.getElementById('qrCodeCard');
                if (qrCodeContainer) {
                    qrCodeContainer.innerHTML = `<img src="${data.qr_code_url}" alt="QR Code" />`;
                }
            }
        }
        loadQRCode();

        // Listen for auth state changes
        const authListener = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                navigate('/');
            }
        });
        return () => {
            if (authListener && typeof authListener.unsubscribe === 'function') {
                authListener.unsubscribe();
            }
        };
    }, [navigate]);

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch all relevant data
            const [
                { data: vitals, error: vitalsError },
                { data: medications, error: medicationsError },
                { data: appointments, error: appointmentsError },
                { data: conditions, error: conditionsError },
                { data: alerts, error: alertsError }
            ] = await Promise.all([
                supabase.from('vitals').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
                supabase.from('medications').select('*').eq('user_id', user.id),
                supabase.from('appointments').select('*').eq('user_id', user.id).order('date', { ascending: true }).limit(5),
                supabase.from('conditions').select('*').eq('user_id', user.id),
                supabase.from('alerts').select('*').eq('user_id', user.id).eq('status', 'active')
            ]);

            if (vitalsError) throw vitalsError;
            if (medicationsError) throw medicationsError;
            if (appointmentsError) throw appointmentsError;
            if (conditionsError) throw conditionsError;
            if (alertsError) throw alertsError;

            setHealthData({
                vitals: vitals || [],
                medications: medications || [],
                appointments: appointments || [],
                conditions: conditions || [],
                alerts: alerts || []
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Spinner />; // Show spinner while loading
    }

    return (
        <div id="dashboard">
            {/* Navigation Menu is provided by Navbar in Layout */}
            <br /><br />
            <div className="container">
                {/* Notification Container */}
                {notification && (
                    <div className={`alert alert-${notification.type} alert-dismissible fade show`} role="alert">
                        {notification.message}
                    </div>
                )}

                {/* Welcome Message */}
                <div className="home-header">
                    <h1>Welcome to Your Digital Health Passport</h1>
                    <p>Your health, managed smarter and more securely.</p>
                    <p className="user-welcome">
                        Hello, <span id="user-name"></span>. Here's what's happening today.
                    </p>
                </div>

                {/* Dashboard Cards Section */}
                <div className="home-cards">
                    <div className="card" id="upcoming-appointments-card">
                        <div className="icon"><FaCalendarAlt /></div>
                        <div className="content">
                            <h3>Upcoming Appointments</h3>
                            <p>View and manage your appointments effortlessly.</p>
                            <Link to="/appointments" className="action-link">View Details</Link>
                        </div>
                    </div>
                    {/* Other cards (vaccination records, health records, etc.) */}
                    <div className="card" id="qrCodeCard">
                        <div className="icon"><FaQrcode /></div>
                        <div className="content">
                            <h3>Emergency Contact QR Code</h3>
                            <p>Your emergency contact QR code.</p>
                        </div>
                    </div>
                    <div className="card" id="vaccination-records-card">
                        <div className="icon"><FaSyringe /></div>
                        <div className="content">
                            <h3>Vaccination Records</h3>
                            <p>Track and update your vaccination history.</p>
                            <Link to="/vaccinations" className="action-link">View Details</Link>
                        </div>
                    </div>
                    <div className="card" id="health-records-card">
                        <div className="icon"><FaFileMedical /></div>
                        <div className="content">
                            <h3>Health Records</h3>
                            <p>Access all your health records in one place.</p>
                            <Link to="/health-records" className="action-link">View Details</Link>
                        </div>
                    </div>
                    <div className="card" id="doctor-consultations-card">
                        <div className="icon"><FaStethoscope /></div>
                        <div className="content">
                            <h3>Doctor Consultations</h3>
                            <p>Review past doctor consultations and notes.</p>
                            <Link to="/consultations" className="action-link">View Details</Link>
                        </div>
                    </div>
                    <div className="card" id="medication-history-card">
                        <div className="icon"><FaPills /></div>
                        <div className="content">
                            <h3>Medication History</h3>
                            <p>Keep track of your medications and prescriptions.</p>
                            <Link to="/medications" className="action-link">View Details</Link>
                        </div>
                    </div>
                    <div className="card" id="bone-health-card">
                        <div className="icon"><FaBone /></div>
                        <div className="content">
                            <h3>Bone Health</h3>
                            <p>Monitor your bone health status and treatments.</p>
                            <Link to="/bone-health" className="action-link">View Details</Link>
                        </div>
                    </div>
                    <div className="card" id="emergency-contacts-card">
                        <div className="icon"><FaAmbulance /></div>
                        <div className="content">
                            <h3>Emergency Contacts</h3>
                            <p>Update and view your emergency contact details.</p>
                            <Link to="/emergency-contacts" className="action-link">View Details</Link>
                        </div>
                    </div>
                </div>
            </div>

            <div id="main-content"></div>
            <div className="overlay"></div>
        </div>
    );
};

export default Dashboard;
