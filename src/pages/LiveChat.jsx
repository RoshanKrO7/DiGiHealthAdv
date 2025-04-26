import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { FaPaperPlane, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaFile, FaImage } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const LiveChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatStatus, setChatStatus] = useState('connecting');
  const [supportAgent, setSupportAgent] = useState(null);
  const [chatSubscription, setChatSubscription] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeChat();
    return () => {
      // Cleanup subscription
      if (chatSubscription) {
        chatSubscription.unsubscribe();
      }
    };
  }, [user, chatSubscription]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Get or create chat session
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw sessionError;
      }

      let sessionId;
      if (!sessionData) {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert([
            {
              user_id: user.id,
              status: 'active',
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (createError) throw createError;
        sessionId = newSession.id;
      } else {
        sessionId = sessionData.id;
      }

      // Fetch existing messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Subscribe to new messages
      const subscription = supabase
        .channel('chat_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new]);
          }
        )
        .subscribe();
        
      setChatSubscription(subscription);

      // Get support agent info
      const { data: agentData, error: agentError } = await supabase
        .from('support_agents')
        .select('*')
        .eq('status', 'online')
        .single();

      if (agentError && agentError.code !== 'PGRST116') {
        throw agentError;
      }

      if (agentData) {
        setSupportAgent(agentData);
        setChatStatus('connected');
      } else {
        setChatStatus('waiting');
      }

    } catch (error) {
      console.error('Error initializing chat:', error);
      setChatStatus('error');
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { data: sessionData } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!sessionData) {
        throw new Error('No active chat session');
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert([
          {
            session_id: sessionData.id,
            user_id: user.id,
            message: newMessage.trim(),
            type: 'text',
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: sessionData } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!sessionData) {
        throw new Error('No active chat session');
      }

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([
          {
            session_id: sessionData.id,
            user_id: user.id,
            message: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'file',
            attachment_url: filePath,
            created_at: new Date().toISOString()
          }
        ]);

      if (messageError) throw messageError;
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div className="container-fluid h-100">
      <div className="row h-100">
        {/* Sidebar */}
        <div className="col-md-3 p-0 border-end">
          <div className="p-3 border-bottom">
            <h5 className="mb-0">Chat Information</h5>
            <small className="text-muted">
              Status: <span className={`text-${chatStatus === 'connected' ? 'success' : 'warning'}`}>
                {chatStatus.charAt(0).toUpperCase() + chatStatus.slice(1)}
              </span>
            </small>
          </div>
          {supportAgent && (
            <div className="p-3">
              <h6 className="mb-2">Support Agent</h6>
              <div className="d-flex align-items-center">
                <div className="avatar-circle me-2">
                  {supportAgent.name.charAt(0)}
                </div>
                <div>
                  <div className="fw-bold">{supportAgent.name}</div>
                  <small className="text-muted">{supportAgent.role}</small>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="col-md-9 p-0 d-flex flex-column">
          {/* Messages */}
          <div className="flex-grow-1 p-3 overflow-auto" style={{ height: 'calc(100vh - 200px)' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`d-flex ${message.user_id === user.id ? 'justify-content-end' : 'justify-content-start'} mb-3`}
              >
                <div
                  className={`chat-message ${
                    message.user_id === user.id ? 'bg-primary text-white' : 'bg-light'
                  }`}
                >
                  {message.type === 'text' ? (
                    <p className="mb-0">{message.message}</p>
                  ) : message.type === 'image' ? (
                    <img
                      src={`${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/chat-attachments/${message.attachment_url}`}
                      alt="Shared image"
                      className="img-fluid rounded"
                      style={{ maxWidth: '200px' }}
                    />
                  ) : (
                    <a
                      href={`${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/chat-attachments/${message.attachment_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      <FaFile className="me-2" />
                      {message.message}
                    </a>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-top">
            <form onSubmit={sendMessage} className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
              />
              <label className="btn btn-outline-primary">
                <input
                  type="file"
                  className="d-none"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <FaFile />
              </label>
              <button type="submit" className="btn btn-primary">
                <FaPaperPlane />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveChat; 