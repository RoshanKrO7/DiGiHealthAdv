import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/main';
import { callOpenAI } from '../../utils/openai'; // Use our proxy utility instead of direct OpenAI
import Spinner from '../../components/Spinner';
import './HealthRecommendations.css';

const HealthRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedFocus, setSelectedFocus] = useState('general');
  const [additionalContext, setAdditionalContext] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Focus area options
  const focusAreas = [
    { id: 'general', label: 'General Health' },
    { id: 'nutrition', label: 'Nutrition & Diet' },
    { id: 'fitness', label: 'Fitness & Exercise' },
    { id: 'sleep', label: 'Sleep Improvement' },
    { id: 'stress', label: 'Stress Management' },
    { id: 'chronic', label: 'Chronic Condition Management' }
  ];

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        setUserId(user.id);
        fetchUserProfile(user.id);
        fetchRecommendationHistory(user.id);
      } catch (error) {
        console.error('Error checking authentication', error);
      }
    };

    checkUser();
  }, [navigate]);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          first_name, 
          last_name, 
          date_of_birth, 
          gender, 
          height, 
          weight,
          user_conditions (
            condition_name
          ),
          user_medications (
            medication_name,
            dosage
          ),
          health_metrics (*)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Calculate BMI if height and weight are available
      let bmi = null;
      if (data.height && data.weight) {
        const heightInMeters = data.height / 100;
        bmi = (data.weight / (heightInMeters * heightInMeters)).toFixed(1);
      }

      setUserProfile({
        ...data,
        bmi,
        conditions: data.user_conditions?.map(c => c.condition_name) || [],
        medications: data.user_medications?.map(m => m.medication_name) || []
      });

    } catch (error) {
      console.error('Error fetching profile', error);
    }
  };

  const fetchRecommendationHistory = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('health_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching recommendation history', error);
    }
  };

  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);

    if (!userProfile) {
      setError('Please complete your health profile first.');
      setLoading(false);
      return;
    }

    try {
      // Create a prompt for recommendations
      const prompt = `
        You are a health and wellness advisor. Based on the following user profile, provide personalized health recommendations.
        
        User Profile:
        - Age: ${calculateAge(userProfile.date_of_birth)}
        - Gender: ${userProfile.gender || 'Not specified'}
        - Height: ${userProfile.height ? `${userProfile.height} cm` : 'Not provided'}
        - Weight: ${userProfile.weight ? `${userProfile.weight} kg` : 'Not provided'}
        - BMI: ${userProfile.bmi || 'Not calculated'}
        ${userProfile.conditions.length > 0 ? `- Medical Conditions: ${userProfile.conditions.join(', ')}` : '- No medical conditions specified'}
        ${userProfile.medications.length > 0 ? `- Medications: ${userProfile.medications.join(', ')}` : '- No medications specified'}
        
        Focus area: ${selectedFocus}
        
        ${additionalContext ? `Additional context: ${additionalContext}` : ''}
        
        Please provide detailed health recommendations specific to the focus area. Include:
        1. A summary of key recommendations
        2. Detailed explanations and guidance
        3. Specific actionable steps
        4. Any relevant warnings or precautions
        
        Format your response as a JSON object with these keys:
        - summary: A brief summary of recommendations (1-2 sentences)
        - recommendations: Array of specific recommendation objects, each with:
          - title: Short title for the recommendation
          - description: Detailed explanation
          - action_steps: Array of specific action steps
        - warnings: Any important precautions or warnings
      `;

      // Call our backend API through the utility function
      const result = await callOpenAI(prompt);
      
      // Store the result 
      const newRecommendations = {
        focus_area: selectedFocus,
        summary: result.summary || '',
        recommendations: result.recommendations || [],
        warnings: result.warnings || [],
        created_at: new Date().toISOString()
      };
      
      setRecommendations(newRecommendations);
      
      // Save to database
      await saveRecommendationsToDatabase(newRecommendations);
      
      // Refresh history
      fetchRecommendationHistory(userId);

    } catch (error) {
      console.error('Error generating recommendations:', error);
      setError('Failed to generate recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const saveRecommendationsToDatabase = async (recommendations) => {
    try {
      const { error } = await supabase
        .from('health_recommendations')
        .insert([{
          user_id: userId,
          focus_area: recommendations.focus_area,
          recommendations: JSON.stringify(recommendations),
          created_at: recommendations.created_at
        }]);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error saving recommendations:', error);
      // Continue anyway - user still has the recommendations displayed
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const viewHistoricalRecommendation = async (id) => {
    try {
      const item = history.find(h => h.id === id);
      if (item) {
        setRecommendations(JSON.parse(item.recommendations));
      }
    } catch (error) {
      console.error('Error viewing historical recommendation:', error);
    }
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4">AI Health Recommendations</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Generate Recommendations</h5>
              
              {!userProfile ? (
                <div className="alert alert-warning">
                  Please complete your health profile to receive personalized recommendations.
                  <div className="mt-3">
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate('/profile')}
                    >
                      Complete Profile
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label htmlFor="focusArea" className="form-label">Focus Area</label>
                    <select
                      id="focusArea"
                      className="form-select"
                      value={selectedFocus}
                      onChange={(e) => setSelectedFocus(e.target.value)}
                      disabled={loading}
                    >
                      {focusAreas.map(area => (
                        <option key={area.id} value={area.id}>{area.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="additionalContext" className="form-label">Additional Context (Optional)</label>
                    <textarea
                      id="additionalContext"
                      className="form-control"
                      rows="3"
                      placeholder="Add any specific concerns or goals..."
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      disabled={loading}
                    ></textarea>
                  </div>
                  
                  <button
                    className="btn btn-primary w-100"
                    onClick={generateRecommendations}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" /> Generating...
                      </>
                    ) : (
                      'Generate Recommendations'
                    )}
                  </button>
                </>
              )}
              
              {history.length > 0 && (
                <div className="mt-4">
                  <h6>Previous Recommendations</h6>
                  <div className="list-group" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {history.map(item => (
                      <button
                        key={item.id}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        onClick={() => viewHistoricalRecommendation(item.id)}
                      >
                        <div>
                          <div>{focusAreas.find(fa => fa.id === item.focus_area)?.label || item.focus_area}</div>
                          <small className="text-muted">
                            {new Date(item.created_at).toLocaleDateString()}
                          </small>
                        </div>
                        <span className="badge bg-primary rounded-pill">View</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-lg-8">
          {loading ? (
            <div className="card shadow-sm">
              <div className="card-body text-center py-5">
                <Spinner />
                <p className="mt-3">Generating personalized health recommendations...</p>
                <p className="text-muted small">This may take a moment as our AI analyzes your health profile</p>
              </div>
            </div>
          ) : recommendations ? (
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  {focusAreas.find(fa => fa.id === recommendations.focus_area)?.label || recommendations.focus_area} Recommendations
                </h5>
              </div>
              <div className="card-body">
                <p className="lead">{recommendations.summary}</p>
                
                <div className="recommendations-list mt-4">
                  {recommendations.recommendations.map((rec, index) => (
                    <div key={index} className="recommendation-item mb-4">
                      <h5>{rec.title}</h5>
                      <p>{rec.description}</p>
                      
                      {rec.action_steps?.length > 0 && (
                        <div className="action-steps">
                          <h6>Action Steps:</h6>
                          <ul>
                            {rec.action_steps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {recommendations.warnings && (
                  <div className="alert alert-warning mt-3">
                    <h6>Important Notes:</h6>
                    <p>{recommendations.warnings}</p>
                  </div>
                )}
                
                <div className="disclaimer mt-4">
                  <small className="text-muted">
                    <strong>Disclaimer:</strong> These recommendations are generated by AI based on your profile information. 
                    They are not a substitute for professional medical advice. Always consult with healthcare providers before 
                    making significant changes to your health regimen.
                  </small>
                </div>
              </div>
              <div className="card-footer text-muted">
                <small>Generated on {new Date(recommendations.created_at).toLocaleString()}</small>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm">
              <div className="card-body p-5 text-center">
                <div className="text-muted mb-3">
                  <i className="fas fa-lightbulb fa-3x"></i>
                </div>
                <h5>Select a focus area and generate recommendations</h5>
                <p className="text-muted">
                  Our AI will analyze your health profile and provide personalized recommendations
                  based on your specific needs and goals.
                </p>
              </div>
            </div>
          )}
          
          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h5>How We Create Your Recommendations</h5>
              <p>
                Our AI-powered recommendation system uses multiple data points from your health profile to generate personalized health guidance:
              </p>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="d-flex mb-2">
                    <div className="me-3 text-primary">
                      <i className="fas fa-user-circle fa-lg"></i>
                    </div>
                    <div>
                      <h6>Your Profile</h6>
                      <p className="text-muted small mb-0">
                        Age, gender, height, weight, and BMI are used to tailor recommendations to your body type and demographics.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex mb-2">
                    <div className="me-3 text-primary">
                      <i className="fas fa-notes-medical fa-lg"></i>
                    </div>
                    <div>
                      <h6>Medical Conditions</h6>
                      <p className="text-muted small mb-0">
                        Any conditions listed in your profile are considered to ensure recommendations are appropriate and safe.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex mb-2">
                    <div className="me-3 text-primary">
                      <i className="fas fa-chart-line fa-lg"></i>
                    </div>
                    <div>
                      <h6>Health Parameters</h6>
                      <p className="text-muted small mb-0">
                        Your recorded health metrics like blood pressure, cholesterol, and glucose levels inform specific health guidance.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <div className="me-3 text-primary">
                      <i className="fas fa-brain fa-lg"></i>
                    </div>
                    <div>
                      <h6>AI Analysis</h6>
                      <p className="text-muted small mb-0">
                        Advanced AI models analyze your complete health profile to generate evidence-based recommendations specific to your selected focus area.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="alert alert-info mt-3 mb-0">
                <small>
                  <strong>Privacy Note:</strong> Your health data is processed securely. We use anonymized data when communicating with AI services to ensure your privacy is protected.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthRecommendations;