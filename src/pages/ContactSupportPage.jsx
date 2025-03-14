import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaLifeRing, FaEnvelope, FaPhone, FaComments, FaQuestionCircle, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';
import '../styles.css';

const ContactSupportPage = () => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [supportTicket, setSupportTicket] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
    attachFile: null
  });
  const [faqSuggestions, setFaqSuggestions] = useState([]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    // Simple FAQ suggestion system based on subject and message
    if (supportTicket.subject.length > 3 || supportTicket.message.length > 10) {
      const searchText = `${supportTicket.subject} ${supportTicket.message}`.toLowerCase();
      
      // Sample FAQs that might match user's query
      const faqs = [
        {
          question: 'How do I reset my password?',
          answer: 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.',
          keywords: ['password', 'reset', 'forgot', 'login', 'sign in', 'cannot access']
        },
        {
          question: 'How do I schedule an appointment?',
          answer: 'Go to "Upcoming Appointments" and click "Schedule New Appointment".',
          keywords: ['schedule', 'appointment', 'book', 'doctor', 'visit', 'consultation']
        },
        {
          question: 'How do I update my profile information?',
          answer: 'Navigate to "Profile Settings" under the Account menu to edit your personal details.',
          keywords: ['profile', 'update', 'change', 'information', 'details', 'personal']
        },
        {
          question: 'How do I export my health data?',
          answer: 'Go to "Data Backup & Export" under the Account menu to download your information.',
          keywords: ['export', 'download', 'data', 'backup', 'information', 'records']
        },
        {
          question: 'How do I join a telehealth consultation?',
          answer: 'On the day of your appointment, go to "Telehealth Consultations" and click "Join Meeting".',
          keywords: ['telehealth', 'virtual', 'video', 'call', 'consultation', 'join', 'meeting']
        }
      ];
      
      // Find matching FAQs
      const suggestions = faqs.filter(faq => {
        return faq.keywords.some(keyword => searchText.includes(keyword));
      });
      
      setFaqSuggestions(suggestions.slice(0, 3)); // Limit to 3 suggestions
    } else {
      setFaqSuggestions([]);
    }
  }, [supportTicket.subject, supportTicket.message]);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      const { data, error } = await supabase
        .from('detailed_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setNotification({ message: 'Error fetching user profile.', type: 'danger' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSupportTicket(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setSupportTicket(prev => ({
      ...prev,
      attachFile: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      // Upload attachment if exists
      let attachmentUrl = null;
      if (supportTicket.attachFile) {
        const fileName = `${user.id}-${Date.now()}-${supportTicket.attachFile.name}`;
        const { data: fileData, error: fileError } = await supabase.storage
          .from('support-attachments')
          .upload(fileName, supportTicket.attachFile);
          
        if (fileError) throw fileError;
        
        const { data: urlData } = supabase.storage
          .from('support-attachments')
          .getPublicUrl(fileName);
          
        attachmentUrl = urlData.publicUrl;
      }
      
      // Create support ticket
      const { error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user.id,
          subject: supportTicket.subject,
          category: supportTicket.category,
          priority: supportTicket.priority,
          message: supportTicket.message,
          attachment_url: attachmentUrl,
          status: 'open',
          created_at: new Date().toISOString()
        }]);
        
      if (error) throw error;
      
      setNotification({ message: 'Support ticket submitted successfully! Our team will respond shortly.', type: 'success' });
      
      // Reset form
      setSupportTicket({
        subject: '',
        category: 'general',
        priority: 'medium',
        message: '',
        attachFile: null
      });
      
      // Reset file input
      document.getElementById('attachFile').value = '';
      
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      setNotification({ message: 'Error submitting support ticket. Please try again.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      {notification && (
        <div className={`alert alert-${notification.type} text-center`}>
          {notification.message}
        </div>
      )}
      
      <h1 className="text-center mb-4">
        <FaLifeRing className="me-2" /> Contact Support
      </h1>
      
      <div className="row">
        <div className="col-lg-8">
          {/* Support Ticket Form */}
          <div className="card shadow mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">Submit a Support Request</h2>
            </div>
            <div className="card-body">
              {faqSuggestions.length > 0 && (
                <div className="alert alert-info mb-4">
                  <h5><FaLightbulb className="me-2" /> Did you know?</h5>
                  <p>We found some help articles that might answer your question:</p>
                  <ul className="mb-0">
                    {faqSuggestions.map((faq, index) => (
                      <li key={index}>
                        <strong>{faq.question}</strong> - {faq.answer}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="subject" className="form-label">Subject</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="subject" 
                    name="subject" 
                    value={supportTicket.subject} 
                    onChange={handleChange} 
                    required 
                    placeholder="Brief description of your issue"
                  />
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="category" className="form-label">Category</label>
                    <select 
                      className="form-select" 
                      id="category" 
                      name="category" 
                      value={supportTicket.category} 
                      onChange={handleChange}
                    >
                      <option value="general">General Question</option>
                      <option value="account">Account Issues</option>
                      <option value="appointments">Appointments</option>
                      <option value="medical">Medical Records</option>
                      <option value="telehealth">Telehealth</option>
                      <option value="technical">Technical Problem</option>
                      <option value="billing">Billing & Payments</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="priority" className="form-label">Priority</label>
                    <select 
                      className="form-select" 
                      id="priority" 
                      name="priority" 
                      value={supportTicket.priority} 
                      onChange={handleChange}
                    >
                      <option value="low">Low - General Question</option>
                      <option value="medium">Medium - Need Help Soon</option>
                      <option value="high">High - Urgent Issue</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="message" className="form-label">Message</label>
                  <textarea 
                    className="form-control" 
                    id="message" 
                    name="message" 
                    rows="6" 
                    value={supportTicket.message} 
                    onChange={handleChange} 
                    required 
                    placeholder="Please describe your issue in detail. Include any error messages or steps to reproduce the problem."
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="attachFile" className="form-label">Attach File (optional)</label>
                  <input 
                    type="file" 
                    className="form-control" 
                    id="attachFile" 
                    onChange={handleFileChange} 
                  />
                  <div className="form-text">
                    You can attach screenshots or documents to help explain your issue (max 5MB).
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Support Request'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          {/* Contact Information */}
          <div className="card shadow mb-4">
            <div className="card-header bg-info text-white">
              <h3 className="mb-0">Contact Information</h3>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <FaEnvelope className="me-3 fs-4 text-primary" />
                <div>
                  <h5 className="mb-0">Email Support</h5>
                  <p className="mb-0">support@digihealth.com</p>
                  <small className="text-muted">Response within 24 hours</small>
                </div>
              </div>
              
              <div className="d-flex align-items-center mb-3">
                <FaPhone className="me-3 fs-4 text-primary" />
                <div>
                  <h5 className="mb-0">Phone Support</h5>
                  <p className="mb-0">1-800-DIGI-HEALTH</p>
                  <small className="text-muted">Mon-Fri, 9am-5pm EST</small>
                </div>
              </div>
              
              <div className="d-flex align-items-center">
                <FaComments className="me-3 fs-4 text-primary" />
                <div>
                  <h5 className="mb-0">Live Chat</h5>
                  <p className="mb-0">
                    <a href="/live-chat" className="btn btn-sm btn-outline-primary mt-1">Start Chat</a>
                  </p>
                  <small className="text-muted">Available 24/7</small>
                </div>
              </div>
            </div>
          </div>
          
          {/* Support Resources */}
          <div className="card shadow mb-4">
            <div className="card-header bg-success text-white">
              <h3 className="mb-0">Support Resources</h3>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <FaQuestionCircle className="me-3 fs-4 text-success" />
                <div>
                  <h5 className="mb-0">Help Center</h5>
                  <p className="mb-0">
                    <a href="/help-center" className="btn btn-sm btn-outline-success mt-1">Browse FAQs</a>
                  </p>
                </div>
              </div>
              
              <div className="d-flex align-items-center">
                <FaExclamationTriangle className="me-3 fs-4 text-warning" />
                <div>
                  <h5 className="mb-0">System Status</h5>
                  <p className="mb-0">
                    <span className="badge bg-success">All Systems Operational</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupportPage; 