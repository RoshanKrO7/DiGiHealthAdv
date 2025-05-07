import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import HealthMetricsVisualizer from './components/HealthMetricsVisualizer';
import HealthAssistant from './pages/ai/HealthAssistant';
import AIInsightsDashboard from './components/AIInsightsDashboard';
import HealthMetricsAI from './pages/ai/HealthMetricsAI';
import HealthAssistantAI from './pages/ai/HealthAssistantAI';
import SymptomCheckerAI from './pages/ai/SymptomCheckerAI';
import HealthRecommendations from './pages/ai/HealthRecommendations';
import DocumentScanner from './pages/ai/DocumentScanner';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          transition="Bounce"
          limit={3}
        />
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
          <Route path="/health-metrics" element={<DashboardLayout><HealthMetricsVisualizer /></DashboardLayout>} />
          {/* <Route path="/health-assistant" element={<DashboardLayout><HealthAssistant /></DashboardLayout>} /> */}
          <Route path="/ai-insights" element={<DashboardLayout><AIInsightsDashboard /></DashboardLayout>} />
          <Route path="/health-metrics/upload" element={<DashboardLayout><HealthMetricsVisualizer mode="upload" /></DashboardLayout>} />
          <Route path="/health-assistant/recommendations" element={<DashboardLayout><HealthAssistant mode="recommendations" /></DashboardLayout>} />
          <Route path="/ai/health-metrics" element={<DashboardLayout><HealthMetricsAI /></DashboardLayout>} />
          <Route path="/ai/health-assistant" element={<DashboardLayout><HealthAssistant /></DashboardLayout>} />
          <Route path="/ai/health-recommendations" element={<DashboardLayout><HealthRecommendations /></DashboardLayout>} />
          <Route path="/ai/symptom-checker" element={<DashboardLayout><SymptomCheckerAI /></DashboardLayout>} />
          <Route path="/ai/document-scanner" element={<DashboardLayout><DocumentScanner /></DashboardLayout>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
