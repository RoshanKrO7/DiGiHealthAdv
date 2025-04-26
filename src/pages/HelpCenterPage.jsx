import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaBook, FaSearch, FaQuestionCircle, FaVideo, FaFileAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../styles.css';

const HelpCenterPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [faqs, setFaqs] = useState([]);
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [categories, setCategories] = useState([]);

  const fetchHelpCenterData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch FAQs from Supabase
      const { data: faqData, error: faqError } = await supabase
        .from('faqs')
        .select('*')
        .order('id');
        
      if (faqError) throw faqError;
      
      // Fetch tutorials from Supabase
      const { data: tutorialData, error: tutorialError } = await supabase
        .from('tutorials')
        .select('*')
        .order('id');
        
      if (tutorialError) throw tutorialError;
      
      // Set the data
      setFaqs(faqData || []);
      setTutorials(tutorialData || []);
      
      // Extract unique categories from both FAQs and tutorials
      const faqCategories = [...new Set(faqData.map(faq => faq.category))];
      const tutorialCategories = [...new Set(tutorialData.map(tutorial => tutorial.category))];
      const allCategories = [...new Set([...faqCategories, ...tutorialCategories])];
      setCategories(allCategories);
      
    } catch (error) {
      console.error('Error fetching help center data:', error);
      setNotification({ message: 'Error loading help center content.', type: 'danger' });
      
      // Fallback to static data if API fails
      setFaqs(staticFaqs);
      setTutorials(staticTutorials);
      setCategories([...new Set([
        ...staticFaqs.map(faq => faq.category),
        ...staticTutorials.map(tutorial => tutorial.category)
      ])]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHelpCenterData();
  }, [fetchHelpCenterData]);

  // Static data as fallback
  const staticFaqs = [
    {
      id: 1,
      category: 'account',
      question: 'How do I create an account?',
      answer: 'To create an account, click on the "Sign Up" button on the login page. Fill in your personal details, including your email address and a secure password. Follow the verification steps sent to your email to complete the registration process.'
    },
    {
      id: 2,
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'If you forgot your password, click on the "Forgot Password" link on the login page. Enter your registered email address, and we will send you a password reset link. Follow the instructions in the email to create a new password.'
    },
    {
      id: 3,
      category: 'appointments',
      question: 'How do I schedule an appointment?',
      answer: 'To schedule an appointment, navigate to the "Appointments" section in the navigation menu and select "Upcoming Appointments". Click on the "Schedule New Appointment" button and fill in the required details such as doctor name, date, time, and location. Click "Schedule Appointment" to confirm.'
    },
    {
      id: 4,
      category: 'appointments',
      question: 'How do I cancel or reschedule an appointment?',
      answer: 'To cancel or reschedule an appointment, go to the "Upcoming Appointments" page. Find the appointment you want to modify, then click the "Edit" button to change the date or time, or click the "Cancel" button to cancel the appointment entirely.'
    },
    {
      id: 5,
      category: 'medical',
      question: 'How do I add my medical history?',
      answer: 'To add your medical history, navigate to the "Medical History" page from the "Your Journey" menu. Click on "Add New Medical Record" and fill in the details about your condition, diagnosis date, doctor, and treatment. Click "Add Record" to save the information.'
    },
    {
      id: 6,
      category: 'medical',
      question: 'How do I track my medications?',
      answer: 'To track your medications, go to the "Medication Tracker" page from the "Your Journey" menu. Enter the medication name, frequency, and quantity, then click "Add Medication". You can view and manage all your medications from this page.'
    },
    {
      id: 7,
      category: 'telehealth',
      question: 'How do I join a telehealth consultation?',
      answer: 'To join a telehealth consultation, go to the "Telehealth Consultations" page. On the day of your appointment, you will see your consultation listed under "Today\'s Consultations". Click the "Join Meeting" button at the scheduled time to enter the virtual consultation room.'
    },
    {
      id: 8,
      category: 'telehealth',
      question: 'What equipment do I need for a telehealth consultation?',
      answer: 'For a telehealth consultation, you need a device with a camera and microphone (smartphone, tablet, or computer), a stable internet connection, and a quiet, private space. Make sure your device is charged and your browser allows camera and microphone access.'
    },
    {
      id: 9,
      category: 'data',
      question: 'Is my health data secure?',
      answer: 'Yes, your health data is secure. We use industry-standard encryption and security measures to protect your personal and medical information. Our platform complies with healthcare privacy regulations, and your data is only accessible to you and the healthcare providers you authorize.'
    },
    {
      id: 10,
      category: 'data',
      question: 'How do I export my health data?',
      answer: 'To export your health data, go to the "Data Backup & Export" page under the "Account" menu. Select the type of data you want to export and the format (PDF, CSV, etc.). Click "Export Data" and follow the prompts to download your information.'
    }
  ];

  const staticTutorials = [
    {
      id: 1,
      category: 'getting-started',
      title: 'Getting Started with DigiHealth',
      type: 'video',
      description: 'Learn the basics of navigating the DigiHealth platform and setting up your profile.',
      link: '#'
    },
    {
      id: 2,
      category: 'appointments',
      title: 'How to Schedule and Manage Appointments',
      type: 'guide',
      description: 'A step-by-step guide to scheduling, rescheduling, and canceling appointments.',
      link: '#'
    },
    {
      id: 3,
      category: 'medical',
      title: 'Managing Your Medical Records',
      type: 'video',
      description: 'Learn how to add, edit, and organize your medical history and records.',
      link: '#'
    },
    {
      id: 4,
      category: 'telehealth',
      title: 'Preparing for Your First Telehealth Consultation',
      type: 'guide',
      description: 'Tips and instructions for a successful virtual healthcare appointment.',
      link: '#'
    },
    {
      id: 5,
      category: 'data',
      title: 'Understanding Your Health Analytics',
      type: 'video',
      description: 'How to interpret and use the health analytics features to monitor your well-being.',
      link: '#'
    },
    {
      id: 6,
      category: 'account',
      title: 'Account Security Best Practices',
      type: 'guide',
      description: 'Learn how to keep your DigiHealth account secure with strong passwords and two-factor authentication.',
      link: '#'
    }
  ];

  // Filter FAQs based on search term and active category
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Filter tutorials based on search term and active category
  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = searchTerm === '' || 
      tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || tutorial.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Toggle FAQ expansion
  const toggleFaq = (id) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Track FAQ view for analytics
  const trackFaqView = async (faqId) => {
    try {
      // Only track if not already expanded (first view)
      if (!expandedFaqs[faqId]) {
        await supabase
          .from('faq_analytics')
          .insert([{
            faq_id: faqId,
            viewed_at: new Date().toISOString()
          }]);
      }
    } catch (error) {
      console.error('Error tracking FAQ view:', error);
      // Silent fail - don't show error to user
    }
  };

  // Track tutorial click for analytics
  const trackTutorialClick = async (tutorialId) => {
    try {
      await supabase
        .from('tutorial_analytics')
        .insert([{
          tutorial_id: tutorialId,
          clicked_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error tracking tutorial click:', error);
      // Silent fail - don't show error to user
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container mt-4">
      {notification && (
        <div className={`alert alert-${notification.type} text-center`}>
          {notification.message}
        </div>
      )}
      
      <h1 className="text-center mb-4">
        <FaBook className="me-2" /> Help Center
      </h1>
      
      {/* Search and Filter */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-8 mb-3">
              <div className="input-group">
                <span className="input-group-text"><FaSearch /></span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search for help topics..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <select 
                className="form-select" 
                value={activeCategory} 
                onChange={(e) => setActiveCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Frequently Asked Questions */}
      <div className="card shadow mb-4">
        <div className="card-header bg-primary text-white">
          <h2 className="mb-0">
            <FaQuestionCircle className="me-2" /> Frequently Asked Questions
          </h2>
        </div>
        <div className="card-body">
          {filteredFaqs.length === 0 ? (
            <div className="alert alert-info">
              No FAQs match your search criteria. Try a different search term or category.
            </div>
          ) : (
            <div className="accordion">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="card mb-2">
                  <div 
                    className="card-header d-flex justify-content-between align-items-center"
                    onClick={() => {
                      toggleFaq(faq.id);
                      trackFaqView(faq.id);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <h5 className="mb-0">{faq.question}</h5>
                    {expandedFaqs[faq.id] ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  {expandedFaqs[faq.id] && (
                    <div className="card-body">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Video Tutorials and Guides */}
      <div className="card shadow mb-4">
        <div className="card-header bg-success text-white">
          <h2 className="mb-0">
            <FaVideo className="me-2" /> Tutorials & Guides
          </h2>
        </div>
        <div className="card-body">
          {filteredTutorials.length === 0 ? (
            <div className="alert alert-info">
              No tutorials match your search criteria. Try a different search term or category.
            </div>
          ) : (
            <div className="row">
              {filteredTutorials.map((tutorial) => (
                <div key={tutorial.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header">
                      {tutorial.type === 'video' ? (
                        <FaVideo className="me-2 text-danger" />
                      ) : (
                        <FaFileAlt className="me-2 text-primary" />
                      )}
                      <span className="badge bg-secondary">{tutorial.category.replace('-', ' ')}</span>
                    </div>
                    <div className="card-body">
                      <h5 className="card-title">{tutorial.title}</h5>
                      <p className="card-text">{tutorial.description}</p>
                    </div>
                    <div className="card-footer">
                      <a 
                        href={tutorial.link} 
                        className="btn btn-primary btn-sm w-100"
                        onClick={() => trackTutorialClick(tutorial.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {tutorial.type === 'video' ? 'Watch Video' : 'Read Guide'}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Additional Help */}
      <div className="card shadow mb-4">
        <div className="card-header bg-info text-white">
          <h2 className="mb-0">Need More Help?</h2>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <h3>Contact Support</h3>
                  <p>Reach out to our support team for personalized assistance.</p>
                  <a href="/contact-support" className="btn btn-primary">Contact Support</a>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <h3>Live Chat</h3>
                  <p>Chat with our support agents in real-time for immediate help.</p>
                  <a href="/live-chat" className="btn btn-primary">Start Chat</a>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <h3>Email Support</h3>
                  <p>Send us an email and we'll get back to you within 24 hours.</p>
                  <a href="mailto:support@digihealth.com" className="btn btn-primary">Email Us</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage; 