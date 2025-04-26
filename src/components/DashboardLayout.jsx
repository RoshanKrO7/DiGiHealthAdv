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
    </div>
  );
};

export default DashboardLayout;
