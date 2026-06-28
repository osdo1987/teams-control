import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { authService } from './services/authService';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import ClubLogin from './pages/ClubLogin';
import ClubLanding from './pages/ClubLanding';
import LandingEditor from './components/Admin/LandingEditor';
import AdminLayout from './components/Admin/AdminLayout';
import TrainerLayout from './components/Trainer/TrainerLayout';
import AthleteLayout from './components/Athlete/AthleteLayout';
import SuperAdminLayout from './components/SuperAdmin/SuperAdminLayout';
import SubscriptionGate from './components/UI/SubscriptionGate';
import DashboardHome from './pages/admin/DashboardHome';
import AthleteList from './pages/admin/athletes/AthleteList';
import AthleteProfile from './pages/admin/athletes/AthleteProfile';
import GroupList from './pages/admin/groups/GroupList';
import GroupProfile from './pages/admin/groups/GroupProfile';
import UserList from './pages/admin/UserList';
import TrainerList from './pages/admin/trainers/TrainerList';
import AdminTrainerProfile from './pages/admin/trainers/TrainerProfile';
import PaymentList from './pages/admin/payments/PaymentList';
import AttendanceList from './pages/admin/attendance/AttendanceList';
import TestList from './pages/admin/tests/TestList';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import ClubList from './pages/superadmin/ClubList';
import PricingPlans from './pages/superadmin/PricingPlans';
import ClubPermissions from './pages/superadmin/ClubPermissions';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerGroups from './pages/trainer/TrainerGroups';
import TrainerAttendance from './pages/trainer/TrainerAttendance';
import TrainerTests from './pages/trainer/TrainerTests';
import TrainerPayments from './pages/trainer/TrainerPayments';
import TrainerProfile from './pages/trainer/TrainerProfile';
import AthleteDashboard from './pages/athlete/AthleteDashboard';
import AthleteSelfProfile from './pages/athlete/AthleteProfile';
import AthleteRegistration from './pages/AthleteRegistration';
import TrainingPlanList from './pages/admin/TrainingPlanList';
import PermissionsPage from './pages/admin/PermissionsPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();
  if (!user) {
    const lastClubSlug = sessionStorage.getItem('last_club_slug');
    sessionStorage.removeItem('last_club_slug');
    if (lastClubSlug) {
      return <Navigate to={`/${lastClubSlug}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.club_slug) {
      return <Navigate to={`/${user.club_slug}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const isAppSubdomain = window.location.hostname.startsWith('club-manager');

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<AthleteRegistration />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SubscriptionGate>
                <AdminLayout />
              </SubscriptionGate>
            </ProtectedRoute>
          }>
            <Route index element={<DashboardHome />} />
            <Route path="athletes" element={<AthleteList />} />
            <Route path="athletes/:id" element={<AthleteProfile />} />
            <Route path="groups" element={<GroupList />} />
            <Route path="groups/:id" element={<GroupProfile />} />
            <Route path="users" element={<UserList />} />
            <Route path="trainers" element={<TrainerList />} />
            <Route path="trainers/:id" element={<AdminTrainerProfile />} />
            <Route path="payments" element={<PaymentList />} />
            <Route path="attendance" element={<AttendanceList />} />
            <Route path="tests" element={<TestList />} />
            <Route path="training-plans" element={<TrainingPlanList />} />
            <Route path="landing" element={<LandingEditor />} />
            <Route path="permissions" element={<PermissionsPage />} />
          </Route>

          {/* Super Admin Routes */}
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="clubs" element={<ClubList />} />
            <Route path="users" element={<UserList />} />
            <Route path="pricing" element={<PricingPlans />} />
            <Route path="permissions" element={<ClubPermissions />} />
          </Route>

          {/* Trainer Routes */}
          <Route path="/trainer" element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
              <SubscriptionGate>
                <TrainerLayout />
              </SubscriptionGate>
            </ProtectedRoute>
          }>
            <Route index element={<TrainerDashboard />} />
            <Route path="groups" element={<TrainerGroups />} />
            <Route path="attendance" element={<TrainerAttendance />} />
            <Route path="tests" element={<TrainerTests />} />
            <Route path="payments" element={<TrainerPayments />} />
            <Route path="profile" element={<TrainerProfile />} />
          </Route>

          {/* Athlete Routes */}
          <Route path="/athlete" element={
            <ProtectedRoute allowedRoles={['ATHLETE']}>
              <AthleteLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AthleteDashboard />} />
            <Route path="profile" element={<AthleteSelfProfile />} />
          </Route>

          {/* Root Routes */}
          <Route path="/" element={
            isAppSubdomain ? <Navigate to="/login" replace /> : <LandingPage />
          } />
          <Route path="/:clubSlug" element={<ClubLanding />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;