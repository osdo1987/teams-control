import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import Login from './pages/Login';
import AdminLayout from './components/Admin/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import AthleteList from './pages/admin/AthleteList';
import GroupList from './pages/admin/GroupList';

import UserList from './pages/admin/UserList';
import PaymentList from './pages/admin/PaymentList';
import AttendanceList from './pages/admin/AttendanceList';
import SuperAdminLayout from './components/SuperAdmin/SuperAdminLayout';
import ClubList from './pages/superadmin/ClubList';

// Placeholder for missing Dashboards
const TrainerDashboard = () => <div className="card"><h2>Trainer Dashboard</h2><p>Welcome, Trainer!</p></div>;
const AthleteDashboard = () => <div className="card"><h2>Athlete Dashboard</h2><p>Welcome, Athlete!</p></div>;

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="athletes" element={<AthleteList />} />
          <Route path="groups" element={<GroupList />} />
          <Route path="users" element={<UserList />} />
          <Route path="payments" element={<PaymentList />} />
          <Route path="attendance" element={<AttendanceList />} />
        </Route>
        
        <Route path="/super-admin" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ClubList />} />
          <Route path="users" element={<UserList />} />
        </Route>
        
        <Route path="/trainer/*" element={
          <ProtectedRoute allowedRoles={['TRAINER']}>
            <div className="app-container">
              <div className="sidebar glass-panel">
                <h3>Teams Control</h3>
                <button className="btn" style={{marginTop: '2rem'}} onClick={() => authService.logout()}>Logout</button>
              </div>
              <div className="main-content">
                <TrainerDashboard />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/athlete/*" element={
          <ProtectedRoute allowedRoles={['ATHLETE']}>
             <div className="app-container">
              <div className="sidebar glass-panel">
                <h3>Teams Control</h3>
                <button className="btn" style={{marginTop: '2rem'}} onClick={() => authService.logout()}>Logout</button>
              </div>
              <div className="main-content">
                <AthleteDashboard />
              </div>
            </div>
          </ProtectedRoute>
        } />


        {/* Root redirect based on role */}
        <Route path="/" element={
          <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
