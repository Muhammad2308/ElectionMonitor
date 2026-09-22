import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { isAdminRole, homeRouteForRole } from './utils/roles';
import { Login } from './features/Auth/Login';
import { Dashboard } from './features/Dashboard/Dashboard';
import { IncidentForm } from './features/Incidents/IncidentForm';
import { CheckIn } from './features/Tracking/CheckIn';
import { AssignmentDetails } from './features/Assignments/AssignmentDetails';
import './index.css';

const AdminDashboard = lazy(() => import('./features/Admin/AdminDashboard'));
const UsersPage = lazy(() => import('./features/Admin/UsersPage'));
const RolesPage = lazy(() => import('./features/Admin/RolesPage'));
const IncidentsPage = lazy(() => import('./features/Admin/IncidentsPage'));
const MapView = lazy(() => import('./features/Admin/MapView'));

// Protected Route wrapper — any authenticated user
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Admin Route wrapper — authenticated AND holding an admin-tier role
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdminRole(role)) return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        }>
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to={homeRouteForRole(role)} /> : <Login />} />

            {/* Observer field app */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><IncidentForm /></ProtectedRoute>} />
            <Route path="/checkin" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
            <Route path="/assignment" element={<ProtectedRoute><AssignmentDetails /></ProtectedRoute>} />

            {/* Admin / situation-room console */}
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
            <Route path="/admin/roles" element={<AdminRoute><RolesPage /></AdminRoute>} />
            <Route path="/admin/incidents" element={<AdminRoute><IncidentsPage /></AdminRoute>} />
            <Route path="/admin/map" element={<AdminRoute><MapView /></AdminRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
