import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/main';
import { openai, MODELS } from '../../utils/openai';
import Spinner from '../../components/Spinner';

const HealthRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userDiseases, setUserDiseases] = useState([]);
  const [userParameters, setUserParameters] = useState([]);
  const [focusArea, setFocusArea] = useState('general');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [recommendationHistory, setRecommendationHistory] = useState([]);
  
  const focusAreas = {
    general: "General health recommendations",
    nutrition: "Nutrition and diet recommendations",
    fitness: "Exercise and fitness recommendations",
    sleep: "Sleep improvement recommendations",
    stress: "Stress management recommendations",
    chronic: "Recommendations for managing chronic conditions"
  };
  
  // Fetch user data
  useEffect(() => {
    fetchUserData();
    fetchRecommendationHistory();
  }, []);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('detailed_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      setUserProfile(profile);
      
      // Get diseases
      const { data: diseases, error: diseasesError } = await supabase
        .from('user_diseases')
        .select('*')
        .eq('user_id', user.id);
        
      if (diseasesError) throw diseasesError;
      setUserDiseases(diseases || []);
      
      // Get health parameters
      const { data: parameters, error: parametersError } = await supabase
        .from('user_parameters')
        .select('*')
        .eq('user_id', user.id)
        .order('date_recorded', { ascending: false });
        
      if (parametersError) throw parametersError;
      
      // Group parameters by name to get the latest value
      const latestParams = {};
      parameters?.forEach(param => {
        if (!latestParams[param.parameter_name] || 
            new Date(param.date_recorded) > new Date(latestParams[param.parameter_name].date_recorded)) {
          latestParams[param.parameter_name] = param;
        }
      });
      
      setUserParameters(Object.values(latestParams));
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setNotification({
        message: 'Error fetching your health data',
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRecommendationHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('health_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      setRecommendationHistory(data || []);
      
    } catch (error) {
      console.error('Error fetching recommendations history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateRecommendations = async () => {
    if (!userProfile) {
      setNotification({
        message: 'Please complete your profile first to get personalized recommendations',
        type: 'warning'
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Calculate age from date of birth
      const age = userProfile.date_of_birth ? 
        Math.floor((new Date() - new Date(userProfile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
        'unknown';
      
      // Format health parameters
      const formattedParameters = userParameters.map(
        param => `${param.parameter_name}: ${param.parameter_value} ${param.unit || ''}`
      ).join(', ');
      
      // Format medical conditions
      const formattedDiseases = userDiseases.map(
        disease => disease.disease_name
      ).join(', ');
      
      const prompt = `
      Please provide personalized health recommendations for a ${age} year old ${userProfile.gender || 'person'}.
      
      Focus area: ${focusAreas[focusArea]}
      
      Health profile:
      - Height: ${userProfile.height || 'unknown'} cm
      - Weight: ${userProfile.weight || 'unknown'} kg
      - BMI: ${userProfile.height && userProfile.weight ? 
        (userProfile.weight / ((userProfile.height/100) * (userProfile.height/100))).toFixed(1) : 'unknown'}
      ${formattedParameters ? `- Health parameters: ${formattedParameters}` : ''}
      ${formattedDiseases ? `- Medical conditions: ${formattedDiseases}` : ''}
      
      ${additionalInfo ? `Additional information: ${additionalInfo}` : ''}
      
      Please provide:
      1. Personalized recommendations based on the profile
      2. Specific actionable steps to improve health
      3. Any relevant warnings or precautions
      4. Suggested health goals
      `;
      
      const response = await openai.chat.completions.create({
        model: MODELS.GPT4,
        messages: [
          {
            role: "system",
            content: "You are a health recommendations assistant that provides evidence-based, personalized health advice. Focus on practical, actionable recommendations. Include appropriate disclaimers but be positive and motivational in tone. Present information in well-organized sections with clear headings."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      });

      // Parse the response
      const recommendationsText = response.choices[0].message.content;
      
      // Structure the results
      const structuredResults = {
        focusArea: focusArea,
        recommendations: recommendationsText,
        disclaimer: "These recommendations are generated by AI based on the information provided and are not a substitute for professional medical advice. Always consult with healthcare professionals before making significant changes to your health regimen.",
        date: new Date().toISOString()
      };
      
      setResults(structuredResults);
      
      // Save to database
      await saveRecommendationsToDatabase(structuredResults);
      
      // Refresh history
      fetchRecommendationHistory();
      
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setError("Error generating health recommendations. Please try again.");
      setNotification({
        message: 'Error generating recommendations: ' + err.message,
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRecommendationsToDatabase = async (recommendationsData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Save the recommendations
      const { error: dbError } = await supabase
        .from('health_recommendations')
        .insert([
          {
            user_id: user.id,
            focus_area: recommendationsData.focusArea,
            recommendations: recommendationsData.recommendations,
            created_at: new Date().toISOString()
          }
        ]);
      
      if (dbError) throw dbError;
      
    } catch (error) {
      console.error('Error saving recommendations:', error);
    }
  };

  const viewHistoricalRecommendation = async (id) => {
    const recommendation = recommendationHistory.find(rec => rec.id === id);
    if (recommendation) {
      setResults({
        focusArea: recommendation.focus_area,
        recommendations: recommendation.recommendations,
        disclaimer: "These recommendations are generated by AI based on the information provided and are not a substitute for professional medical advice. Always consult with healthcare professionals before making significant changes to your health regimen.",
        date: recommendation.created_at
      });
      
      // Scroll to results
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="container py-4">
      {notification && (
        <div className={`alert alert-${notification.type} alert-dismissible fade show`}>
          {notification.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setNotification(null)}
          ></button>
        </div>
      )}

      <h1 className="mb-4">Personalized Health Recommendations</h1>
      
      <div className="row">
        <div className="col-lg-5">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title">Get Personalized Recommendations</h5>
              
              {!userProfile ? (
                <div className="alert alert-info">
                  Please complete your health profile to get personalized recommendations.
                </div>
              ) : (
                <>
                  <p className="card-text text-muted">
                    Our AI will analyze your health profile and provide personalized recommendations.
                  </p>
                  
                  <div className="mb-3">
                    <label htmlFor="focusArea" className="form-label">Focus Area</label>
                    <select 
                      id="focusArea"
                      className="form-select"
                      value={focusArea}
                      onChange={(e) => setFocusArea(e.target.value)}
                    >
                      <option value="general">General Health</option>
                      <option value="nutrition">Nutrition & Diet</option>
                      <option value="fitness">Exercise & Fitness</option>
                      <option value="sleep">Sleep Improvement</option>
                      <option value="stress">Stress Management</option>
                      <option value="chronic">Chronic Condition Management</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="additionalInfo" className="form-label">Additional Information (optional)</label>
                    <textarea
                      id="additionalInfo"
                      className="form-control"
                      rows="3"
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Any specific concerns, goals, or lifestyle factors"
                    ></textarea>
                  </div>
                  
                  <div className="d-grid">
                    <button 
                      className="btn btn-primary" 
                      onClick={generateRecommendations}
                      disabled={loading}
                    >
                      {loading ? <><Spinner size="sm" /> Generating...</> : 'Generate Recommendations'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="card-title mb-0">Your Recommendation History</h5>
            </div>
            <div className="card-body">
              {historyLoading ? (
                <div className="text-center py-3">
                  <Spinner />
                </div>
              ) : recommendationHistory.length > 0 ? (
                <div className="list-group">
                  {recommendationHistory.map(rec => (
                    <button
                      key={rec.id}
                      className="list-group-item list-group-item-action"
                      onClick={() => viewHistoricalRecommendation(rec.id)}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">
                          {focusAreas[rec.focus_area] || rec.focus_area}
                        </h6>
                        <small>{new Date(rec.created_at).toLocaleDateString()}</small>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center">No previous recommendations found.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-lg-7">
          {loading ? (
            <div className="card shadow-sm mb-4">
              <div className="card-body text-center py-5">
                <Spinner />
                <p className="mt-3">Generating your personalized recommendations...</p>
                <p className="text-muted small">This may take a moment as we analyze your health profile</p>
              </div>
            </div>
          ) : results ? (
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">Your {focusAreas[results.focusArea]}</h5>
              </div>
              <div className="card-body">
                <div className="recommendations-content">
                  {results.recommendations.split('\n').map((paragraph, idx) => (
                    paragraph ? <p key={idx}>{paragraph}</p> : <br key={idx} />
                  ))}
                </div>
                <div className="alert alert-warning mt-3">
                  <strong>Important Disclaimer:</strong> {results.disclaimer}
                </div>
              </div>
              <div className="card-footer text-muted">
                <small>Recommendations generated on {new Date(results.date).toLocaleString()}</small>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">
              {error}
            </div>
          ) : (
            <div className="card shadow-sm mb-4">
              <div className="card-body p-5 text-center">
                <div className="text-muted mb-3">
                  <i className="fas fa-heart fa-3x"></i>
                </div>
                <h5>Your personalized health recommendations will appear here</h5>
                <p className="text-muted">
                  Select a focus area and click "Generate Recommendations" to get started.
                </p>
              </div>
            </div>
          )}
          
          <div className="card shadow-sm">
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