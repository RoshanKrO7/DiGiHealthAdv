// src/NotificationContext.jsx
import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({ message: '', type: '' });

  // showNotification function that sets the notification and clears it after a delay
  const showNotification = (message, type = 'info', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, duration);
  };

  return (
    <NotificationContext.Provider value={{ notification, showNotification }}>
      {/* Notification container fixed at top-right */}
      <div
        id="global-notification-container"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1050,
          width: '300px',
        }}
      >
        {notification.message && (
          <div className={`alert alert-${notification.type} alert-dismissible fade show`} role="alert">
            {notification.message}
          </div>
        )}
      </div>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notifications in any component
export const useNotification = () => useContext(NotificationContext);
