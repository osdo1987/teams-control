import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import ClubLogin from './pages/ClubLogin';
import ClubLanding from './pages/ClubLanding';
import LandingEditor from './components/Admin/LandingEditor';
import AdminLayout from './components/Admin/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import AthleteList from './pages/admin/AthleteList';
import GroupList from './pages/admin/GroupList';
import UserList from './pages/admin/UserList';
import TrainerList from './pages/admin/TrainerList';
import PaymentList from './pages/admin/PaymentList';
import AttendanceList from './pages/admin/AttendanceList';
import TestList from './pages/admin/TestList';
import AthleteProfile from './pages/admin/AthleteProfile';
import SuperAdminLayout from './components/SuperAdmin/SuperAdminLayout';
import ClubList from './pages/superadmin/ClubList';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import PricingPlans from './pages/superadmin/PricingPlans';
import SubscriptionGate from './components/UI/SubscriptionGate';

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
  const isAppSubdomain = window.location.hostname.startsWith('club-manager');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <SubscriptionGate>
              <AdminLayout />
            </SubscriptionGate>
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="athletes" element={<AthleteList />} />
          <Route path="groups" element={<GroupList />} />
          <Route path="users" element={<UserList />} />
          <Route path="trainers" element={<TrainerList />} />
          <Route path="payments" element={<PaymentList />} />
          <Route path="attendance" element={<AttendanceList />} />
          <Route path="tests" element={<TestList />} />
          <Route path="athletes/:id" element={<AthleteProfile />} />
          <Route path="landing" element={<LandingEditor />} />
        </Route>

        <Route path="/super-admin" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="clubs" element={<ClubList />} />
          <Route path="users" element={<UserList />} />
          <Route path="pricing" element={<PricingPlans />} />
        </Route>

        <Route path="/trainer/*" element={
          <ProtectedRoute allowedRoles={['TRAINER']}>
            <SubscriptionGate>
              <div className="app-shell">
                <aside className="sidebar">
                  <div className="sidebar-brand">
                    <div className="brand-mark">⚡</div>
                    <div className="brand-text">
                      <span className="name">Club Manager</span>
                      <span className="tag">Trainer</span>
                    </div>
                  </div>
                  <nav className="sidebar-nav">
                    <div style={{ flex: 1 }}></div>
                    <button className="logout-btn" onClick={() => authService.logout(authService.getCurrentUser()?.club_slug)}>🚪 Cerrar Sesión</button>
                  </nav>
                </aside>
                <div className="app-main">
                  <div className="app-content">
                    <TrainerDashboard />
                  </div>
                </div>
              </div>
            </SubscriptionGate>
          </ProtectedRoute>
        } />

        <Route path="/athlete/*" element={
          <ProtectedRoute allowedRoles={['ATHLETE']}>
            <div className="app-shell">
              <aside className="sidebar">
                <div className="sidebar-brand">
                  <div className="brand-mark">⚡</div>
                  <div className="brand-text">
                    <span className="name">Club Manager</span>
                    <span className="tag">Atleta</span>
                  </div>
                </div>
                <nav className="sidebar-nav">
                  <div style={{ flex: 1 }}></div>
                  <button className="logout-btn" onClick={() => authService.logout(authService.getCurrentUser()?.club_slug)}>🚪 Cerrar Sesión</button>
                </nav>
              </aside>
              <div className="app-main">
                <div className="app-content">
                  <AthleteDashboard />
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } />

        {/* Root logic: Landing Page for osdosoft.com, Login for subdomain */}
        <Route path="/" element={
          isAppSubdomain ? <Navigate to="/login" replace /> : <LandingPage />
        } />
        <Route path="/:clubSlug" element={<ClubLanding />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;