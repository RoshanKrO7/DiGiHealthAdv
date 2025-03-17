import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../utils/main';
import { useAuth } from '../contexts/AuthContext';
import { FaRobot, FaUser, FaSpinner, FaPaperPlane, FaUtensils, FaFirstAid } from 'react-icons/fa';

const HealthAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('chat'); // chat, diet, firstAid
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getModeSystemPrompt = () => {
    switch (mode) {
      case 'diet':
        return "You are a nutritionist AI assistant. Provide personalized diet recommendations based on user's health conditions and goals. Always emphasize the importance of consulting healthcare providers before making significant dietary changes.";
      case 'firstAid':
        return "You are a first aid instruction AI assistant. Provide clear, step-by-step first aid guidance for non-emergency situations. Always emphasize when professional medical attention is needed and include emergency contact recommendations when appropriate.";
      default:
        return "You are a helpful medical assistant. Explain medical terms in simple language and provide general health information. Always remind users to consult healthcare professionals for proper medical advice.";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to chat
    const newMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);

    try {
      // Get user's health context
      const { data: profile } = await supabase
        .from('profiles')
        .select('medical_conditions, allergies, current_medications')
        .eq('id', user.id)
        .single();

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: getModeSystemPrompt()
            },
            {
              role: "user",
              content: `User's health context - Medical conditions: ${profile.medical_conditions.join(', ')}, Allergies: ${profile.allergies.join(', ')}, Current medications: ${profile.current_medications.join(', ')}`
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      
      // Add AI response to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date().toISOString()
      }]);

      // Save conversation to database
      await supabase.from('chat_history').insert([{
        user_id: user.id,
        mode,
        message: userMessage,
        response: data.choices[0].message.content,
        created_at: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="card-title mb-0">
            {mode === 'diet' ? (
              <><FaUtensils className="me-2" /> Diet Assistant</>
            ) : mode === 'firstAid' ? (
              <><FaFirstAid className="me-2" /> First Aid Guide</>
            ) : (
              <><FaRobot className="me-2" /> Health Assistant</>
            )}
          </h3>

          <div className="btn-group">
            <button
              className={`btn btn-${mode === 'chat' ? 'primary' : 'outline-primary'}`}
              onClick={() => setMode('chat')}
            >
              Chat
            </button>
            <button
              className={`btn btn-${mode === 'diet' ? 'primary' : 'outline-primary'}`}
              onClick={() => setMode('diet')}
            >
              Diet
            </button>
            <button
              className={`btn btn-${mode === 'firstAid' ? 'primary' : 'outline-primary'}`}
              onClick={() => setMode('firstAid')}
            >
              First Aid
            </button>
          </div>
        </div>

        <div className="chat-container bg-light p-3 rounded" style={{ height: '400px', overflowY: 'auto' }}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`d-flex ${message.role === 'user' ? 'justify-content-end' : 'justify-content-start'} mb-3`}
            >
              <div
                className={`${
                  message.role === 'user' ? 'bg-primary text-white' : 'bg-white'
                } p-3 rounded shadow-sm`}
                style={{ maxWidth: '75%' }}
              >
                <div className="d-flex align-items-center mb-1">
                  {message.role === 'user' ? (
                    <FaUser className="me-2" />
                  ) : (
                    <FaRobot className="me-2" />
                  )}
                  <small className="text-muted">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </small>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-3 d-flex">
          <input
            type="text"
            className="form-control me-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              mode === 'diet'
                ? "Ask about diet recommendations..."
                : mode === 'firstAid'
                ? "Ask about first aid instructions..."
                : "Ask your health-related question..."
            }
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthAssistant; 