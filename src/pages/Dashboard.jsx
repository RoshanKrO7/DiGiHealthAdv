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
  FaAmbulance,
  FaRobot,
  FaBrain
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
    const [loading, setLoading] = useState(true);
    const [healthData, setHealthData] = useState({
        vitals: [],
        medications: [],
        appointments: [],
        conditions: [],
        alerts: [],
        profile: null
    });
    const [error, setError] = useState(null);

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    navigate('/');
                    return;
                }
                
                const { data: profileData, error: profileError } = await supabase
                    .from('detailed_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    if (profileError.code === 'PGRST116') {
                        // Profile doesn't exist, create one
                        const { data: newProfile, error: createError } = await supabase
                            .from('detailed_profiles')
                            .insert([{ id: user.id }])
                            .select()
                            .single();
                            
                        if (createError) throw createError;
                        setHealthData(prev => ({ ...prev, profile: newProfile }));
                    } else {
                        throw profileError;
                    }
                } else {
                    setHealthData(prev => ({ ...prev, profile: profileData }));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const mainFeatureCards = [
        {
            title: 'Profile',
            icon: 'fa-user',
            description: 'View and manage your profile information',
            link: '/profile',
            color: 'primary'
        },
        {
            title: 'Health Records',
            icon: 'fa-file-medical',
            description: 'Access your health records and history',
            link: '/health-records',
            color: 'info'
        },
        {
            title: 'Appointments',
            icon: 'fa-calendar-check',
            description: 'Schedule and manage appointments',
            link: '/appointments',
            color: 'success'
        },
        {
            title: 'Medications',
            icon: 'fa-pills',
            description: 'Track your medications and prescriptions',
            link: '/medications',
            color: 'warning'
        }
    ];

    const aiFeatureCards = [
        {
            title: 'Health Recommendations',
            icon: 'fa-chart-line',
            description: 'AI-powered health recommendations based on your profile',
            link: '/ai/health-recommendations',
            color: 'primary'
        },
        {
            title: 'Medical Image Analysis',
            icon: 'fa-microscope',
            description: 'AI analysis of medical images',
            link: '/ai/image-analysis',
            color: 'info'
        },
        {
            title: 'Health Assistant',
            icon: 'fa-robot',
            description: 'Chat with our AI health assistant',
            link: '/ai/health-assistant',
            color: 'success'
        },
        {
            title: 'Symptom Checker',
            icon: 'fa-stethoscope',
            description: 'AI-powered symptom analysis',
            link: '/ai/symptom-checker',
            color: 'danger'
        }
    ];

    if (loading) return <Spinner />;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="dashboard container-fluid py-4" >
            <div className="row mb-4">
                <div className="col">
                    <h1 className="h3">Welcome, {healthData.profile?.first_name || 'User'}!</h1>
                    <p className="text-muted">Here's an overview of your health information</p>
                </div>
            </div>

            {/* Main Features Section */}
            <div className="row mb-4"></div>
            <h4 className="mb-3">Main Features</h4>
            <div className="row g-4 mb-5">
                {mainFeatureCards.map((card, index) => (
                    <div key={index} className="col-12 col-md-6 col-lg-3">
                        <Link to={card.link} className="text-decoration-none">
                            <div className={`card h-100 border-${card.color} shadow-sm hover-card`}>
                                <div className="card-body">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className={`icon-circle bg-${card.color} text-white`}>
                                            <i className={`fas ${card.icon}`}></i>
                                        </div>
                                        <h5 className="card-title mb-0 ms-3">{card.title}</h5>
                                    </div>
                                    <p className="card-text text-muted">{card.description}</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            {/* AI Features Section */}
            <h4 className="mb-3">AI-Powered Features</h4>
            <div className="row g-4 mb-5">
                {aiFeatureCards.map((card, index) => (
                    <div key={index} className="col-12 col-md-6 col-lg-3">
                        <Link to={card.link} className="text-decoration-none">
                            <div className={`card h-100 border-${card.color} shadow-sm hover-card`}>
                                <div className="card-body">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className={`icon-circle bg-${card.color} text-white`}>
                                            <i className={`fas ${card.icon}`}></i>
                                        </div>
                                        <h5 className="card-title mb-0 ms-3">{card.title}</h5>
                                    </div>
                                    <p className="card-text text-muted">{card.description}</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            {/* Quick Actions Section */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Quick Actions</h5>
                            <div className="row g-2">
                                <div className="col-6 col-md-3">
                                    <Link to="/appointments/new" className="btn btn-outline-primary w-100">
                                        <i className="fas fa-plus-circle me-2"></i>
                                        New Appointment
                                    </Link>
                                </div>
                                <div className="col-6 col-md-3">
                                    <Link to="/medications/add" className="btn btn-outline-success w-100">
                                        <i className="fas fa-pills me-2"></i>
                                        Add Medication
                                    </Link>
                                </div>
                                <div className="col-6 col-md-3">
                                    <Link to="/reports/upload" className="btn btn-outline-info w-100">
                                        <i className="fas fa-upload me-2"></i>
                                        Upload Report
                                    </Link>
                                </div>
                                <div className="col-6 col-md-3">
                                    <Link to="/ai/health-assistant" className="btn btn-outline-danger w-100">
                                        <i className="fas fa-robot me-2"></i>
                                        AI Assistant
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
