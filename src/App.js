import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthLayout from './components/AuthLayout';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HealthOverview from './pages/HealthOverview'; // Import the HealthOverview page
import ProfilePage from './pages/ProfilePage';


function App() {
  return (
    <Router>
      {/* <Navbar /> */}
      <Routes>
        {/* Public pages */}
        <Route
          path="/"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />
        {/* Private pages */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />
        <Route
          path="/health-overview"
          element={
            <DashboardLayout>
              <HealthOverview />
            </DashboardLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <DashboardLayout>
              <ProfilePage />
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
