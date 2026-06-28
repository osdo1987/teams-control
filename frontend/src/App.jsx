import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { authService } from './services/authService';
import Topbar from './components/UI/Topbar';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import ClubLogin from './pages/ClubLogin';
import ClubLanding from './pages/ClubLanding';
import LandingEditor from './components/Admin/LandingEditor';
import AdminLayout from './components/Admin/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import AthleteList from './pages/admin/athletes/AthleteList';
import GroupList from './pages/admin/groups/GroupList';
import UserList from './pages/admin/UserList';
import TrainerList from './pages/admin/trainers/TrainerList';
import AdminTrainerProfile from './pages/admin/trainers/TrainerProfile';
import PaymentList from './pages/admin/payments/PaymentList';
import AttendanceList from './pages/admin/attendance/AttendanceList';
import TestList from './pages/admin/tests/TestList';
import AthleteProfile from './pages/admin/athletes/AthleteProfile';
import GroupProfile from './pages/admin/groups/GroupProfile';
import PermissionsPage from './pages/admin/PermissionsPage';
import SuperAdminLayout from './components/SuperAdmin/SuperAdminLayout';
import ClubList from './pages/superadmin/ClubList';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import PricingPlans from './pages/superadmin/PricingPlans';
import SubscriptionGate from './components/UI/SubscriptionGate';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerProfile from './pages/trainer/TrainerProfile';
import AthleteDashboard from './pages/athlete/AthleteDashboard';
import AthleteSelfProfile from './pages/athlete/AthleteProfile';
import AthleteRegistration from './pages/AthleteRegistration';
import ClubPermissions from './pages/superadmin/ClubPermissions';
import TrainingPlanList from './pages/admin/TrainingPlanList';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();
  if (!user) {
    // If there's a saved club slug from a previous session, redirect to the club login
    const lastClubSlug = sessionStorage.getItem('last_club_slug');
    sessionStorage.removeItem('last_club_slug');
    if (lastClubSlug) {
      return <Navigate to={`/${lastClubSlug}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If the user has a club_slug and doesn't have the right role, redirect to club login
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

          <Route path="/register" element={<AthleteRegistration />} />

          <Route path="/trainer" element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
              <SubscriptionGate>
                <div className="app-shell">
                  <aside className="sidebar">
                    <div className="sidebar-brand">
                      <div className="brand-mark">⚡</div>
                      <div className="brand-text">
                        <span className="name">{authService.getCurrentUser()?.club_name || 'Club Manager'}</span>
                        <span className="tag">Entrenador</span>
                      </div>
                    </div>
                    <nav className="sidebar-nav">
                      <a href="/trainer" className="nav-link">🏠 Inicio</a>
                      <a href="/trainer/groups" className="nav-link">📋 Mis Grupos</a>
                      <a href="/trainer/attendance" className="nav-link">📊 Asistencia</a>
                      <a href="/trainer/tests" className="nav-link">🧪 Tests</a>
                      <a href="/trainer/payments" className="nav-link">💳 Pagos</a>
                      <a href="/trainer/training-plans" className="nav-link">🏋️‍♂️ Planes de Ent.</a>
                      <a href="/trainer/profile" className="nav-link">👤 Mi Perfil</a>
                    </nav>
                    <div className="sidebar-footer">
                      <button className="logout-btn" onClick={() => authService.logout(authService.getCurrentUser()?.club_slug)}>🚪 Cerrar Sesión</button>
                    </div>
                  </aside>
                  <div className="app-main">
                    <Topbar breadcrumb="Club" title="Panel de Entrenador" />
                    <div className="app-content">
                      <TrainerDashboard />
                    </div>
                  </div>
                </div>
              </SubscriptionGate>
            </ProtectedRoute>
          } />
          <Route path="/trainer/profile" element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
              <SubscriptionGate>
                <div className="app-shell">
                  <aside className="sidebar">
                    <div className="sidebar-brand">
                      <div className="brand-mark">⚡</div>
                      <div className="brand-text">
                        <span className="name">{authService.getCurrentUser()?.club_name || 'Club Manager'}</span>
                        <span className="tag">Entrenador</span>
                      </div>
                    </div>
                    <nav className="sidebar-nav">
                      <a href="/trainer" className="nav-link">🏠 Inicio</a>
                      <a href="/trainer/groups" className="nav-link">📋 Mis Grupos</a>
                      <a href="/trainer/attendance" className="nav-link">📊 Asistencia</a>
                      <a href="/trainer/tests" className="nav-link">🧪 Tests</a>
                      <a href="/trainer/payments" className="nav-link">💳 Pagos</a>
                      <a href="/trainer/training-plans" className="nav-link">🏋️‍♂️ Planes de Ent.</a>
                      <a href="/trainer/profile" className="nav-link active">👤 Mi Perfil</a>
                    </nav>
                    <div className="sidebar-footer">
                      <button className="logout-btn" onClick={() => authService.logout(authService.getCurrentUser()?.club_slug)}>🚪 Cerrar Sesión</button>
                    </div>
                  </aside>
                  <div className="app-main">
                    <Topbar breadcrumb="Club" title="Mi Perfil" />
                    <div className="app-content">
                      <TrainerProfile />
                    </div>
                  </div>
                </div>
              </SubscriptionGate>
            </ProtectedRoute>
          } />
          <Route path="/trainer/groups" element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
              <SubscriptionGate>
                <div className="app-shell">
                  <aside className="sidebar">
                    <div className="sidebar-brand">
                      <div className="brand-mark">⚡</div>
                      <div className="brand-text">
                        <span className="name">{authService.getCurrentUser()?.club_name || 'Club Manager'}</span>
                        <span className="tag">Entrenador</span>
                      </div>
                    </div>
                    <nav className="sidebar-nav">
                      <a href="/trainer" className="nav-link">🏠 Inicio</a>
                      <a href="/trainer/groups" className="nav-link active">📋 Mis Grupos</a>
                      <a href="/trainer/attendance" className="nav-link">📊 Asistencia</a>
                      <a href="/trainer/tests" className="nav-link">🧪 Tests</a>
                      <a href="/trainer/payments" className="nav-link">💳 Pagos</a>
                      <a href="/trainer/training-plans" className="nav-link">🏋️‍♂️ Planes de Ent.</a>
                      <a href="/trainer/profile" className="nav-link">👤 Mi Perfil</a>
                    </nav>
                    <div className="sidebar-footer">
                      <button className="logout-btn" onClick={() => authService.logout(authService.getCurrentUser()?.club_slug)}>🚪 Cerrar Sesión</button>
                    </div>
                  </aside>
                  <div className="app-main">
                    <Topbar breadcrumb="Club" title="Mis Grupos" />
                    <div className="app-content">
                      <GroupList />
                    </div>
                  </div>
                </div>
              </SubscriptionGate>
            </ProtectedRoute>
          } />
          <Route path="/trainer/attendance" element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
              <SubscriptionGate>
                <div className="app-shell">
                  <aside className="sidebar">
                    <div className="sidebar-brand">
                      <div className="brand-mark">⚡</div>
                      <div className="brand-text">
                        <span className="name">{authService.getCurrentUser()?.club_name || 'Club Manager'}</span>
                        <span className="tag">Entrenador</span>
                      </div>
                    </div>
                    <nav className="sidebar-nav">
                      <a href="/trainer" className="nav-link">🏠 Inicio</a>
                      <a href="/trainer/groups" className="nav-link">📋 Mis Grupos</a>
                      <a href="/trainer/attendance" className="nav-link active">📊 Asistencia</a>
                      <a href="/trainer/tests" className="nav-link">🧪 Tests</a>
                      <a href="/trainer/payments" className="nav-link">💳 Pagos</a>
                      <a href="/trainer/training-plans" className="nav-link">🏋️‍♂️ Planes de Ent.</a>
                      <a href="/trainer/profile" className="nav-link">👤 Mi Perfil</a>
                    </nav>
                    <div className="sidebar-footer">
                      <button className="logout-btn" onClick={() => authService.logout(authService.getCurrentUser()?.club_slug)}>🚪 Cerrar Sesión</button>
                    </div>
                  </aside>
                  <div className="app-main">
                    <Topbar breadcrumb="Club" title="Asistencia" />
                    <div className="app-content">
                      <AttendanceList />
                    </div>
                  </div>
                </div>
              </SubscriptionGate>
            </ProtectedRoute>
          } />
          <Route path="/trainer/tests" element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
              <SubscriptionGate>
                <div className="app-shell">
                  <aside className="sidebar">
                    <div className="sidebar-brand">
                      <div className="brand-mark">⚡</div>
                      <div className="brand-text">
                        <span className="name">{authService.getCurrentUser()?.club_name || 'Club Manager'}</span>
                        <span className="tag">Entrenador</span>
                      </div>
                    </div>
                    <nav className="sidebar-nav">
                      <a href="/trainer" className="nav-link">🏠 Inicio</a>
                      <a href="/trainer/groups" className="nav-link">📋 Mis Grupos</a>
                      <a href="/trainer/attendance" className="nav-link">📊 Asistencia</a>
                      <a href="/trainer/tests" className="nav-link active">🧪 Tests</a>
                      <a href="/trainer/payments" className="nav-link">💳 Pagos</a>
                      <a href="/trainer/training-plans" className="nav-link">🏋️‍♂️ Planes de Ent.</a>
                      <a href="/trainer/profile" className="nav-link">👤 Mi Perfil</a>
                    </nav>
                    <div className="sidebar-footer">
                      <button className="logout-btn" onClick={() => authService.logout(authService.getCurrentUser()?.club_slug)}>🚪 Cerrar Sesión</button>
                    </div>
                  </aside>
                  <div className="app-main">
                    <Topbar breadcrumb="Club" title="Tests Físicos" />
                    <div className="app-content">
                      <TestList />
                    </div>
                  </div>
                </div>
              </SubscriptionGate>
            </ProtectedRoute>
          } />
          <Route path="/trainer/payments" element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
              <SubscriptionGate>
                <div className="app-shell">
                  <aside className="sidebar">
                    <div className="sidebar-brand">
                      <div className="brand-mark">⚡</div>
                      <div className="brand-text">
                        <span className="name">{authService.getCurrentUser()?.club_name || 'Club Manager'}</span>
                        <span className="tag">Entrenador</span>
                      </div>
                    </div>
                    <nav className="sidebar-nav">
                      <a href="/trainer" className="nav-link">🏠 Inicio</a>
                      <a href="/trainer/groups" className="nav-link">📋 Mis Grupos</a>
                      <a href="/trainer/attendance" className="nav-link">📊 Asistencia</a>
                      <a href="/trainer/tests" className="nav-link">🧪 Tests</a>
                      <a href="/trainer/payments" className="nav-link active">💳 Pagos</a>
                      <a href="/trainer/training-plans" className="nav-link">🏋️‍♂️ Planes de Ent.</a>
                      <a href="/trainer/profile" className="nav-link">👤 Mi Perfil</a>
                    </nav>
                    <div className="sidebar-footer">
                      <button className="logout-btn" onClick={() => authService.logout(authService.getCurrentUser()?.club_slug)}>🚪 Cerrar Sesión</button>
                    </div>
                  </aside>
                  <div className="app-main">
                    <Topbar breadcrumb="Club" title="Pagos" />
                    <div className="app-content">
                      <PaymentList />
                    </div>
                  </div>
                </div>
              </SubscriptionGate>
            </ProtectedRoute>
          } />
          <Route path="/trainer/training-plans" element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
              <SubscriptionGate>
                <div className="app-shell">
                  <aside className="sidebar">
                    <div className="sidebar-brand">
                      <div className="brand-mark">⚡</div>
                      <div className="brand-text">
                        <span className="name">{authService.getCurrentUser()?.club_name || 'Club Manager'}</span>
                        <span className="tag">Entrenador</span>
                      </div>
                    </div>
                    <nav className="sidebar-nav">
                      <a href="/trainer" className="nav-link">🏠 Inicio</a>
                      <a href="/trainer/groups" className="nav-link">📋 Mis Grupos</a>
                      <a href="/trainer/attendance" className="nav-link">📊 Asistencia</a>
                      <a href="/trainer/tests" className="nav-link">🧪 Tests</a>
                      <a href="/trainer/payments" className="nav-link">💳 Pagos</a>
                      <a href="/trainer/training-plans" className="nav-link active">🏋️‍♂️ Planes de Ent.</a>
                      <a href="/trainer/profile" className="nav-link">👤 Mi Perfil</a>
                    </nav>
                    <div className="sidebar-footer">
                      <button className="logout-btn" onClick={() => authService.logout(authService.getCurrentUser()?.club_slug)}>🚪 Cerrar Sesión</button>
                    </div>
                  </aside>
                  <div className="app-main">
                    <Topbar breadcrumb="Club" title="Planes de Entrenamiento" />
                    <div className="app-content">
                      <TrainingPlanList />
                    </div>
                  </div>
                </div>
              </SubscriptionGate>
            </ProtectedRoute>
          } />

          <Route path="/athlete" element={
            <ProtectedRoute allowedRoles={['ATHLETE']}>
              <div className="app-shell">
                <aside className="sidebar">
                  <div className="sidebar-brand">
                    <div className="brand-mark">⚡</div>
                    <div className="brand-text">
                      <span className="name">{authService.getCurrentUser()?.club_name || 'Club Manager'}</span>
                      <span className="tag">Atleta</span>
                    </div>
                  </div>
                  <nav className="sidebar-nav">
                    <a href="/athlete" className="nav-link">🏠 Inicio</a>
                    <a href="/athlete/profile" className="nav-link">👤 Mi Perfil</a>
                  </nav>
                  <div className="sidebar-footer">
                    <button className="logout-btn" onClick={() => authService.logout(authService.getCurrentUser()?.club_slug)}>🚪 Cerrar Sesión</button>
                  </div>
                </aside>
                <div className="app-main">
                  <Topbar breadcrumb="Club" title="Panel de Atleta" />
                  <div className="app-content">
                    <AthleteDashboard />
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/athlete/profile" element={
            <ProtectedRoute allowedRoles={['ATHLETE']}>
              <AthleteSelfProfile />
            </ProtectedRoute>
          } />

          {/* Root logic: Landing Page for osdosoft.com, Login for subdomain */}
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