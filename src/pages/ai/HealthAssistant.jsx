import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/main';
import { openai, MODELS } from '../../utils/openai';
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
      // Create system message with user context
      let systemMessage = "You are a helpful AI health assistant. Provide accurate, evidence-based information about general health topics, symptoms, medications, and lifestyle advice. Always clarify you're not a doctor and serious concerns require medical attention.";
      
      // Add user context if available
      if (userProfile || userConditions.length || userMedications.length) {
        systemMessage += "\n\nUser context (use this to personalize advice, but don't explicitly reference it unless relevant):";
        
        if (userProfile) {
          systemMessage += `\nAge: ${calculateAge(userProfile.date_of_birth)}`;
          systemMessage += `\nGender: ${userProfile.gender || 'Unknown'}`;
          systemMessage += `\nHeight: ${userProfile.height || 'Unknown'}`;
          systemMessage += `\nWeight: ${userProfile.weight || 'Unknown'}`;
          systemMessage += `\nBlood Type: ${userProfile.blood_group || 'Unknown'}`;
        }
        
        if (userConditions.length) {
          systemMessage += `\nMedical Conditions: ${userConditions.map(c => c.disease_name).join(', ')}`;
        }
        
        if (userMedications.length) {
          systemMessage += `\nMedications: ${userMedications.map(m => m.name).join(', ')}`;
        }
      }
      
      // Get conversation history - limit to last 10 messages to save tokens
      const conversationHistory = messages.slice(-10);
      
      const response = await openai.chat.completions.create({
        model: MODELS.GPT4,
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
      {mode === 'symptoms' ? (
        // Symptom checker UI
        <h1>Symptom Checker</h1>
      ) : (
        // Normal health assistant UI
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
              placeholder="Type your message..." 
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