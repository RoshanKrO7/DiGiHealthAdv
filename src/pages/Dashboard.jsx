import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import '../dashboardstyle.css'; // Dashboard-specific styles
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import Spinner from '../components/Spinner'; // Import Spinner component
import EmergencyQRCode from '../components/EmergencyQRCode'; // Import EmergencyQRCode
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Col, Card, Button, Row } from 'react-bootstrap';
import { FaQrcode, FaEdit, FaInfoCircle } from 'react-icons/fa';

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
        },
        {
            title: 'Document Scanner',
            icon: 'fa-file-medical-alt',
            description: 'Extract text from medical documents with AI',
            link: '/ai/document-scanner',
            color: 'warning'
        },
        {
            title: 'Medication Identifier',
            icon: 'fa-pills',
            description: 'Identify medications from images',
            link: '/ai/medication-identifier',
            color: 'secondary'
        }
    ];

    if (loading) return <Spinner />;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="container-fluid py-4" >
            <div className="row mb-4">
                <div className="col">
                    <h1 className="h3">Welcome, {healthData.profile?.first_name || 'User'}!</h1>
                    <p className="text-muted">Here's an overview of your health information</p>
                </div>
            </div>

            {/* Main Features Section and Emergency QR Code in a row */}
            <div className="row g-4 mb-5">
            <h4 className="mb-3">Main Features</h4>
                {/* First 3 main feature cards */}
                {mainFeatureCards.slice(0, 3).map((card, index) => (
                    <div key={index} className="col-12 col-md-6 col-lg-3">
                        <Link to={card.link} className="text-decoration-none h-100">
                            <div className={`card hover-card border-${card.color} h-100`}>
                                <div className="card-body d-flex flex-column">
                                    <div className="d-flex align-items-center mb-2">
                                        <div className={`icon-circle bg-${card.color} text-white`}>
                                            <i className={`fas ${card.icon}`}></i>
                                        </div>
                                        <h5 className="card-title mb-0 ms-3">{card.title}</h5>
                                    </div>
                                    <p className="card-text text-muted flex-grow-1">{card.description}</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}

                {/* Emergency QR Code */}
                <div className="col-12 col-md-6 col-lg-3">
                    <Card className="hover-card border-danger h-100">
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex align-items-center mb-2">
                                <div className="icon-circle bg-danger text-white">
                                    <FaQrcode />
                                </div>
                                <h5 className="card-title mb-0 ms-3">Emergency QR</h5>
                            </div>
                            <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
                                {user ? (
                                    <>
                                        <EmergencyQRCode 
                                            size={110} 
                                            showDownloadButton={false} 
                                            showHeader={false}
                                            showOptions={false}
                                            showCard={false}
                                            onClick={() => navigate('/profile?section=emergency-qr')}
                                        />
                                        {/* <p className="text-muted small mt-2 text-center">Click to view emergency QR</p> */}
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <Spinner animation="border" role="status" size="sm">
                                            <span className="visually-hidden">Loading...</span>
                                        </Spinner>
                                        <p className="text-muted small mt-2">Loading user data...</p>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* 4th main feature card moved to next row */}
            <div className="row g-4 mb-5">
                <div className="col-12 col-md-6 col-lg-3">
                    <Link to={mainFeatureCards[3].link} className="text-decoration-none h-100">
                        <div className={`card hover-card border-${mainFeatureCards[3].color} h-100`}>
                            <div className="card-body d-flex flex-column">
                                <div className="d-flex align-items-center mb-2">
                                    <div className={`icon-circle bg-${mainFeatureCards[3].color} text-white`}>
                                        <i className={`fas ${mainFeatureCards[3].icon}`}></i>
                                    </div>
                                    <h5 className="card-title mb-0 ms-3">{mainFeatureCards[3].title}</h5>
                                </div>
                                <p className="card-text text-muted flex-grow-1">{mainFeatureCards[3].description}</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* This div is intentionally left empty for grid balance */}
                <div className="col-12 col-md-6 col-lg-9"></div>
            </div>

            {/* AI Features Section */}
            <h4 className="mb-3">AI-Powered Features</h4>
            <div className="row g-4 mb-5">
                <div className="col-12 col-md-6 col-lg-3">
                    <Link to="/ai/chat" className="dashboard-card">
                        <div className="card-icon">
                            <i className="fas fa-comments"></i>
                        </div>
                        <h3>AI Health Assistant</h3>
                        <p>Chat with our AI assistant for health advice</p>
                    </Link>
                </div>

                <div className="col-12 col-md-6 col-lg-3">
                    <Link to="/ai/vision" className="dashboard-card">
                        <div className="card-icon">
                            <i className="fas fa-eye"></i>
                        </div>
                        <h3>AI Vision Analysis</h3>
                        <p>Analyze medical images with AI</p>
                    </Link>
                </div>

                <div className="col-12 col-md-6 col-lg-3">
                    <Link to="/ai/medication" className="dashboard-card">
                        <div className="card-icon">
                            <i className="fas fa-pills"></i>
                        </div>
                        <h3>AI Medication Assistant</h3>
                        <p>Get AI-powered medication guidance</p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
