import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import AdminLayout from './components/Admin/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import AthleteList from './pages/admin/AthleteList';
import GroupList from './pages/admin/GroupList';
import UserList from './pages/admin/UserList';
import TrainerList from './pages/admin/TrainerList';
import PaymentList from './pages/admin/PaymentList';
import AttendanceList from './pages/admin/AttendanceList';
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
  const [user, setUser] = React.useState(authService.getCurrentUser());

  // Listen for storage changes (for multiple tabs) or manual updates
  React.useEffect(() => {
    const handleStorageChange = () => {
      setUser(authService.getCurrentUser());
    };
    window.addEventListener('storage', handleStorageChange);
    // Also update when the route changes to catch logins in the same tab
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isAppSubdomain = window.location.hostname.startsWith('club-manager');

  // Update user when navigating back from login
  React.useEffect(() => {
    setUser(authService.getCurrentUser());
  }, [window.location.pathname]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <SubscriptionGate status={user?.subscription_status}>
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
            <SubscriptionGate status={user?.subscription_status}>
              <div className="app-container">
                <div className="sidebar glass-panel">
                  <h3>Club Manager</h3>
                  <button className="btn" style={{marginTop: '2rem'}} onClick={() => authService.logout()}>Logout</button>
                </div>
                <div className="main-content">
                  <TrainerDashboard />
                </div>
              </div>
            </SubscriptionGate>
          </ProtectedRoute>
        } />
        
        <Route path="/athlete/*" element={
          <ProtectedRoute allowedRoles={['ATHLETE']}>
             <div className="app-container">
              <div className="sidebar glass-panel">
                <h3>Club Manager</h3>
                <button className="btn" style={{marginTop: '2rem'}} onClick={() => authService.logout()}>Logout</button>
              </div>
              <div className="main-content">
                <AthleteDashboard />
              </div>
            </div>
          </ProtectedRoute>
        } />


        {/* Root logic: Landing Page for osdosoft.com, Login for subdomain */}
        <Route path="/" element={
          isAppSubdomain ? <Navigate to="/login" replace /> : <LandingPage />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
