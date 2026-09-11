import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Login } from './features/Auth/Login';
import { Dashboard } from './features/Dashboard/Dashboard';
import { IncidentForm } from './features/Incidents/IncidentForm';
import { CheckIn } from './features/Tracking/CheckIn';
import { AssignmentDetails } from './features/Assignments/AssignmentDetails';
import './index.css';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Demo PU for check-in (replace with real assignment data)
  const demoPU = { id: 1, name: 'Demo Polling Unit', latitude: 9.0765, longitude: 7.3985 };

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        }>
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><IncidentForm pollingUnitId={demoPU.id} /></ProtectedRoute>} />
            <Route path="/checkin" element={<ProtectedRoute><CheckIn assignedPU={demoPU} /></ProtectedRoute>} />
            <Route path="/assignment" element={<ProtectedRoute><AssignmentDetails /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
