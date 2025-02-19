// src/pages/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../style.css';

const Home = () => {
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

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
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
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            email: signupEmail,
          },
        ]);
        if (profileError) throw profileError;
      }
      
      showNotification('Account created successfully!', 'success');
      // Redirect to dashboard after signup (update the path as needed)
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error.message);
      showNotification(error.message, 'danger');
    }
  };

  return (
    <div id="app">
      <header>
        <img
          src="/favicon_io/android-chrome-512x512-Photoroom.png"
          alt="Logo"
          className="logo" style={{width: "250px", height: "100%"}}
        />
      </header>

      {/* Notification Container */}
      {notification && (
        <div className={`alert alert-${notification.type} alert-dismissible fade show`} role="alert">
          {notification.message}
{/*           <button type="button" className="btn-close" aria-label="Close" onClick={() => setNotification(null)}></button> */}
        </div>
      )}

      <div id="login-signup">
        {/* Login Form */}
        {!showSignup ? (
          <div id="login-form">
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
                />
                <span>Password</span>
              </label>
              <div>
                <button type="submit" id="login-button">
                  Login
                </button>
                <button type="button" onClick={() => setShowSignup(true)}>
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        ) : (
          // Signup Form
          <div id="signup-form">
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
                Submit
              </button>
              <p className="signin">
                Already have an account?{' '}
                <a href="/" onClick={() => setShowSignup(false)}>
                  Signin
                </a>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;