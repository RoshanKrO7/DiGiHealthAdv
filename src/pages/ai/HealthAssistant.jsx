import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/main';
// Assuming you have a gemini utility or integrated it into openai utility
import { gemini, MODELS } from '../../utils/openai'; // Placeholder: Replace with your actual gemini import
import Spinner from '../../components/Spinner';

const HealthAssistant = ({ mode = 'chat' }) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI health assistant. How can I help you today? You can ask me about general health information, symptoms, medications, or lifestyle advice.'
    }
  ]);
  const [input, setInput] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [userConditions, setUserConditions] = useState([]);
  const [userMedications, setUserMedications] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('detailed_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profileData);

      // Fetch user conditions/diseases
      const { data: conditions } = await supabase
        .from('user_diseases')
        .select('*')
        .eq('user_id', user.id);

      setUserConditions(conditions || []);

      // Fetch user medications
      const { data: medications } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id);

      setUserMedications(medications || []);

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let systemMessage = "";

      // Construct system message based on mode
      if (mode === 'chat') {
        systemMessage = "You are a helpful AI health assistant. Provide accurate, evidence-based information about general medical topics and answer medical questions. Always clarify you're not a doctor and serious concerns require medical attention.";
      } else if (mode === 'diet') {
        systemMessage = "You are an AI dietary assistant. Provide diet plan suggestions and nutritional information based on the user's medical conditions and medications. Consider the following user context:";
        if (userProfile) {
          systemMessage += `\nAge: ${calculateAge(userProfile.date_of_birth)}`;
          systemMessage += `\nGender: ${userProfile.gender || 'Unknown'}`;
        }
        if (userConditions.length) {
          systemMessage += `\nMedical Conditions: ${userConditions.map(c => c.disease_name).join(', ')}`;
        }
        if (userMedications.length) {
          systemMessage += `\nMedications: ${userMedications.map(m => m.name).join(', ')}`;
        }
        systemMessage += "\nAlways emphasize that this is for informational purposes and not a substitute for professional medical or dietary advice.";
      } else if (mode === 'first aid') {
        systemMessage = "You are an AI first aid assistant. Provide clear, step-by-step instructions for medical emergencies based on the user's input. Prioritize safety and advise the user to seek professional medical help immediately. Do NOT provide medical diagnoses or prescribe treatments.";
      }

      // Get conversation history - limit to last 10 messages to save tokens
      const conversationHistory = messages.slice(-10);

      // Call Gemini API (Placeholder - Replace with your actual implementation)
      const response = await gemini.chat.completions.create({
        model: MODELS.GEMINI, // Placeholder: Replace with your actual Gemini model
        messages: [
          { role: 'system', content: systemMessage },
          ...conversationHistory,
          userMessage
        ],
        temperature: 0.7,
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.choices[0].message.content
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Optionally save the conversation
      saveConversation([...conversationHistory, userMessage, assistantMessage]);

    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m sorry, I encountered an error. Please try again later.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const saveConversation = async (conversationMessages) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save conversation to database for future reference
      await supabase
        .from('health_assistant_chats')
        .insert({
          user_id: user.id,
          conversation: conversationMessages,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error saving conversation:', error);
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

  return (
    <div className="container-fluid py-4">
      {/* Assuming mode switching is handled outside this component or via other UI */}
      {/* The current 'symptoms' mode check is kept for now, but might need adjustment */}
      {mode === 'symptoms' ? (
        // Symptom checker UI (if any)
        <h1>Symptom Checker</h1>
      ) : (
        // Normal health assistant UI for chat, diet, and first aid modes
        <div className="health-assistant">
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                {message.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Type your message for ${mode} mode...`}
            />
            <button type="submit" disabled={loading}>
              {loading ? <Spinner /> : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default HealthAssistant;
