import React from 'react';
import './Spinner.css';

const Spinner = () => {
  return (
    <div className="spinner-overlay">
      <div className="medical-spinner">
        <div className="spinner-container">
          <div className="cross-container">
            <div className="cross-horizontal"></div>
            <div className="cross-vertical"></div>
          </div>
          <div className="spinner-ring"></div>
        </div>
        
        <div className="heartbeat-container">
          <svg viewBox="0 0 400 100" className="ecg-line">
            <polyline
              className="ecg-path"
              points="0,50 30,50 45,50 60,20 75,80 90,50 105,50 120,50 150,50 170,50 185,50 200,20 215,80 230,50 245,50 270,50 300,50 320,50 335,50 350,20 365,80 380,50 395,50 400,50"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        <div className="spinner-text">Loading...</div>
      </div>
    </div>
  );
};

export default Spinner;