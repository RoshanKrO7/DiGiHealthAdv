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
      const promptText = `Generate health recommendations for a ${calculateAge(userProfile.date_of_birth)} year old ${userProfile.gender || 'person'} with the following profile:
      Height: ${userProfile.height ? `${userProfile.height} cm` : 'Not provided'}
      Weight: ${userProfile.weight ? `${userProfile.weight} kg` : 'Not provided'}
      BMI: ${userProfile.bmi || 'Not calculated'}
      Medical Conditions: ${userProfile.conditions.length > 0 ? userProfile.conditions.join(', ') : 'None'}
      Medications: ${userProfile.medications.length > 0 ? userProfile.medications.join(', ') : 'None'}
      
      Focus Area: ${selectedFocus}
      
      ${additionalContext ? `Additional Context: ${additionalContext}` : ''}
      
      Please provide recommendations in the following categories:
      - General health recommendations
      - Lifestyle changes
      - Dietary advice
      - Exercise plan
      - Follow-up actions
      
      Format the response as a JSON object with these fields:
      - recommendations: array of specific health recommendations
      - lifestyleChanges: array of lifestyle modifications
      - dietaryAdvice: array of dietary recommendations
      - exercisePlan: array of exercise recommendations
      - followUpActions: array of follow-up actions
      - summary: a brief summary of all recommendations`;

      // Call the backend API with simplified request
      const response = await fetch('https://digihealth-backend.onrender.com/api/analyze-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: promptText,
          analysisType: 'recommendations'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recommendations');
      }

      const result = await response.json();
      
      // Store the result 
      const newRecommendations = {
        focus_area: selectedFocus,
        summary: result.summary || 'No specific recommendations generated.',
        recommendations: result.recommendations || [],
        lifestyleChanges: result.lifestyleChanges || [],
        dietaryAdvice: result.dietaryAdvice || [],
        exercisePlan: result.exercisePlan || [],
        followUpActions: result.followUpActions || [],
        created_at: new Date().toISOString()
      };
      
      setRecommendations(newRecommendations);
      
      // Save to database
      await saveRecommendationsToDatabase(newRecommendations);
      
      // Refresh history
      fetchRecommendationHistory(userId);

    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Provide fallback recommendations when the backend fails
      const fallbackRecommendations = {
        focus_area: selectedFocus,
        summary: 'Based on your profile, here are some general health recommendations:',
        recommendations: [
          'Maintain a balanced diet with plenty of fruits and vegetables',
          'Stay physically active with regular exercise',
          'Get adequate sleep (7-9 hours per night)',
          'Stay hydrated by drinking plenty of water',
          'Schedule regular check-ups with your healthcare provider'
        ],
        lifestyleChanges: [
          'Incorporate regular physical activity into your daily routine',
          'Practice stress management techniques',
          'Maintain a consistent sleep schedule',
          'Limit alcohol consumption and avoid smoking'
        ],
        dietaryAdvice: [
          'Eat a variety of nutrient-rich foods',
          'Limit processed foods and added sugars',
          'Include lean proteins in your diet',
          'Stay hydrated throughout the day'
        ],
        exercisePlan: [
          'Aim for at least 150 minutes of moderate exercise per week',
          'Include both cardio and strength training',
          'Start slowly and gradually increase intensity',
          'Find activities you enjoy to stay motivated'
        ],
        followUpActions: [
          'Schedule a follow-up with your healthcare provider',
          'Track your progress and adjust as needed',
          'Join a support group or find an accountability partner',
          'Set specific, measurable health goals'
        ],
        created_at: new Date().toISOString()
      };
      
      setRecommendations(fallbackRecommendations);
      setError('Note: These are general recommendations as the AI service is currently unavailable. Please consult with your healthcare provider for personalized advice.');
      
      // Save fallback recommendations to database
      await saveRecommendationsToDatabase(fallbackRecommendations);
      
      // Refresh history
      fetchRecommendationHistory(userId);
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
    <div className="health-recommendations">
      <h1>Health Recommendations</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="recommendations-form">
        <div className="form-group">
          <label>Focus Area:</label>
          <select 
            value={selectedFocus} 
            onChange={(e) => setSelectedFocus(e.target.value)}
          >
            {focusAreas.map(area => (
              <option key={area.id} value={area.id}>
                {area.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Additional Context (optional):</label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Add any additional information or specific concerns..."
          />
        </div>

        <button 
          onClick={generateRecommendations}
          disabled={loading}
          className="generate-button"
        >
          {loading ? <Spinner /> : 'Generate Recommendations'}
        </button>
      </div>

      {recommendations && (
        <div className="recommendations-results">
          <h2>Your Personalized Recommendations</h2>
          
          <div className="summary-section">
            <h3>Summary</h3>
            <p>{recommendations.summary}</p>
          </div>

          <div className="recommendations-grid">
            <div className="recommendation-category">
              <h3>General Recommendations</h3>
              <ul>
                {recommendations.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>

            <div className="recommendation-category">
              <h3>Lifestyle Changes</h3>
              <ul>
                {recommendations.lifestyleChanges.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </div>

            <div className="recommendation-category">
              <h3>Dietary Advice</h3>
              <ul>
                {recommendations.dietaryAdvice.map((advice, index) => (
                  <li key={index}>{advice}</li>
                ))}
              </ul>
            </div>

            <div className="recommendation-category">
              <h3>Exercise Plan</h3>
              <ul>
                {recommendations.exercisePlan.map((exercise, index) => (
                  <li key={index}>{exercise}</li>
                ))}
              </ul>
            </div>

            <div className="recommendation-category">
              <h3>Follow-up Actions</h3>
              <ul>
                {recommendations.followUpActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="recommendation-history">
          <h2>Previous Recommendations</h2>
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <h3>{focusAreas.find(area => area.id === item.focus_area)?.label || item.focus_area}</h3>
                <p>{new Date(item.created_at).toLocaleDateString()}</p>
                <button onClick={() => viewHistoricalRecommendation(item.id)}>
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthRecommendations;