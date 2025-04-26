// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient'; // Update import
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.css';
import './Auth.css';

const Login = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const navigate = useNavigate();

  // Notification helper
  const showNotification = (message, type = 'info') => {
    console.log(`Notification: ${message}, Type: ${type}`); // Log the notification type
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Toggle between login and signup
  const toggleForm = (e) => {
    if (e) e.preventDefault();
    setShowSignup(!showSignup);
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      showNotification('Login successful!', 'success');
      // Delay redirect to allow the notification to be seen
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000); // Adjust delay as needed
    } catch (error) {
      console.error('Login error:', error.message);
      showNotification(error.message, 'danger');
    }
  };

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupPassword !== confirmPassword) {
      showNotification("Passwords don't match", 'error');
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (error) throw error;

      // Optionally insert additional profile data into your "profiles" table
      if (data.user) {
        const { error: profileError } = await supabase.from('detailed_profiles').insert([
          {
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            email: signupEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
        ]);
        if (profileError) throw profileError;
      }
      
      showNotification('Account created successfully!', 'success');
      // Show login form after successful signup instead of redirecting
      setShowSignup(false);
    } catch (error) {
      console.error('Signup error:', error.message);
      showNotification(error.message, 'danger');
    }
  };

  return (
    <div id="app" className="auth-container">
      <header className="auth-header">
        <img
          src={process.env.PUBLIC_URL + '/favicon_io/android-chrome-512x512-Photoroom.png'}
          alt="Logo"
          className="logo" style={{width: "200px", height: "auto"}}
        />
      </header>

      {/* Notification Container */}
      {notification && (
        <div className={`alert alert-${notification.type} alert-dismissible fade show`} role="alert">
          {notification.message}
{/*           <button type="button" className="btn-close" aria-label="Close" onClick={() => setNotification(null)}></button> */}
        </div>
      )}

      <div id="login-signup" className={showSignup ? 'signup-mode' : 'login-mode'}>
        {!showSignup ? (
          <div id="login-form" className="active">
            <h2>Login</h2>
            <form className="form1" onSubmit={handleLogin}>
              <label>
                <input
                  required
                  name="email"
                  type="email"
                  className="input"
                  id="login-email"
                  autoComplete="new-password"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder=" "
                />
                <span>Email</span>
              </label>
              <label>
                <input
                  required
                  name="password"
                  type="password"
                  className="input"
                  id="login-password"
                  autoComplete="login-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder=" "
                />
                <span>Password</span>
              </label>
              <div>
                <button type="submit" id="login-button">
                  Login
                </button>
                <button type="button" onClick={toggleForm}>
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div id="signup-form" className="active">
            <form className="form" onSubmit={handleSignup}>
              <p className="message">Signup now</p>
              <div className="flex">
                <label>
                  <input
                    required
                    name="firstname"
                    type="text"
                    className="input"
                    placeholder=" "
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <span>Firstname</span>
                </label>
                <label>
                  <input
                    required
                    name="lastname"
                    type="text"
                    className="input"
                    placeholder=" "
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <span>Lastname</span>
                </label>
              </div>
              <label>
                <input
                  required
                  name="email"
                  type="email"
                  className="input"
                  id="signup-email"
                  placeholder=" "
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
                <span>Email</span>
              </label>
              <label>
                <input
                  required
                  name="password"
                  type="password"
                  className="input"
                  id="signup-password"
                  placeholder=" "
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
                <span>Password</span>
              </label>
              <label>
                <input
                  required
                  name="confirmPassword"
                  type="password"
                  className="input"
                  placeholder=" "
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span>Confirm password</span>
              </label>
              <button type="submit" className="submit">
                Sign Up
              </button>
              <div className="signin">
                <span>Already have an account?</span>
                <a href="#" onClick={toggleForm} className="signin-link">Sign in</a>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;