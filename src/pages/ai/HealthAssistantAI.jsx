import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Spinner from '../../components/Spinner';

const HealthAssistantAI = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');

    try {
      // Call your OpenAI API endpoint here
      // For now, just a placeholder response
      const aiResponse = { role: 'assistant', content: 'This is a placeholder response. Implement OpenAI API call here.' };
      setChatHistory(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">AI Health Assistant</h2>
          
          {/* Chat History */}
          <div className="card mb-4" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <div className="card-body">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`mb-3 ${msg.role === 'user' ? 'text-end' : ''}`}>
                  <div className={`d-inline-block p-3 rounded-3 ${
                    msg.role === 'user' ? 'bg-primary text-white' : 'bg-light'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-center">
                  <Spinner />
                </div>
              )}
            </div>
          </div>

          {/* Message Input */}
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Type your health-related question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !message.trim()}>
                <i className="fas fa-paper-plane me-2"></i>
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HealthAssistantAI; 