import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HealthOverview from './pages/HealthOverview';
import MedicalHistoryPage from './pages/MedicalHistoryPage';
import ChronicDiseaseManagementPage from './pages/ChronicDiseaseManagementPage';
import VaccinationHistoryPage from './pages/VaccinationHistoryPage';
import MedicationTracker from './pages/MedicationTracker';
import HealthAnalyticsPage from './pages/HealthAnalyticsPage';
import UpcomingAppointmentsPage from './pages/UpcomingAppointmentsPage';
import AppointmentHistoryPage from './pages/AppointmentHistoryPage';
import TelehealthConsultationsPage from './pages/TelehealthConsultationsPage';
import AppointmentRemindersPage from './pages/AppointmentRemindersPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ContactSupportPage from './pages/ContactSupportPage';
import LiveChat from './pages/LiveChat';
import ProfilePage from './pages/ProfilePage';
import SecuritySettings from './pages/SecuritySettings';
import DataBackup from './pages/DataBackup';
import DatabaseSetup from './pages/DatabaseSetup';

function App() {
  return (
    <Router basename="/DiGiHealthAdv">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/health-overview" element={<DashboardLayout><HealthOverview /></DashboardLayout>} />
          <Route path="/medical-history" element={<DashboardLayout><MedicalHistoryPage /></DashboardLayout>} />
          <Route path="/chronic-disease-management" element={<DashboardLayout><ChronicDiseaseManagementPage /></DashboardLayout>} />
          <Route path="/vaccination-history" element={<DashboardLayout><VaccinationHistoryPage /></DashboardLayout>} />
          <Route path="/medication-tracker" element={<DashboardLayout><MedicationTracker /></DashboardLayout>} />
          <Route path="/health-analytics" element={<DashboardLayout><HealthAnalyticsPage /></DashboardLayout>} />
          <Route path="/appointments/upcoming" element={<DashboardLayout><UpcomingAppointmentsPage /></DashboardLayout>} />
          <Route path="/appointments/history" element={<DashboardLayout><AppointmentHistoryPage /></DashboardLayout>} />
          <Route path="/appointments/telehealth" element={<DashboardLayout><TelehealthConsultationsPage /></DashboardLayout>} />
          <Route path="/appointments/reminders" element={<DashboardLayout><AppointmentRemindersPage /></DashboardLayout>} />
          <Route path="/help-center" element={<DashboardLayout><HelpCenterPage /></DashboardLayout>} />
          <Route path="/support/contact" element={<DashboardLayout><ContactSupportPage /></DashboardLayout>} />
          <Route path="/support/chat" element={<DashboardLayout><LiveChat /></DashboardLayout>} />
          <Route path="/profile" element={<DashboardLayout><ProfilePage /></DashboardLayout>} />
          <Route path="/settings/security" element={<DashboardLayout><SecuritySettings /></DashboardLayout>} />
          <Route path="/settings/backup" element={<DashboardLayout><DataBackup /></DashboardLayout>} />
          <Route path="/admin/database-setup" element={<DashboardLayout><DatabaseSetup /></DashboardLayout>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
