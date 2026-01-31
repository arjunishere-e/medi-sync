import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

// Import context
import { AuthProvider, useAuth } from './context/AuthContext';

// Import pages
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import OfficeDashboard from './Pages/OfficeDashboard';
import DoctorDashboard from './Pages/DoctorDashboard';
import PatientDashboard from './Pages/PatientDashboard';
import BookAppointment from './Pages/BookAppointment';
import Patients from './Pages/Patients';
import PatientDetails from './Pages/PatientDetails';
import PatientRegistration from './Pages/PatientRegistration';
import StaffScheduling from './Pages/StaffScheduling';
import WardManagement from './Pages/WardManagement';
import Navigation from './Components/navigation/Navigation';

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navigation />}
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {user?.role === 'doctor' ? <DoctorDashboard /> : user?.role === 'patient' ? <PatientDashboard /> : user?.role === 'office' ? <OfficeDashboard /> : <Dashboard />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <Patients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute>
              <PatientDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient-registration"
          element={
            <ProtectedRoute>
              <PatientRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/office-dashboard"
          element={
            <ProtectedRoute>
              <OfficeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-appointment"
          element={
            <ProtectedRoute>
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff-scheduling"
          element={
            <ProtectedRoute>
              <StaffScheduling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ward-management"
          element={
            <ProtectedRoute>
              <WardManagement />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
