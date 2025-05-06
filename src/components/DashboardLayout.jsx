import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import '../dashboardstyle.css';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
      <Footer />
      <style>
        {`
          .dashboard-layout {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 100vw;
            overflow-x: hidden;
            padding-top: var(--navbar-height);
          }

          .dashboard-main {
            flex: 1;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 1.5rem 1rem;
          }

          .content-wrapper {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            box-sizing: border-box;
            overflow-x: hidden;
          }

          @media (max-width: 768px) {
            .dashboard-layout {
              padding-top: calc(var(--navbar-height) + 1rem);
            }
            
            .dashboard-main {
              padding: 1rem 0.5rem;
            }

            .content-wrapper {
              padding: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default DashboardLayout;
