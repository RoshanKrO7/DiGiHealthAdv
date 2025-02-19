import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
