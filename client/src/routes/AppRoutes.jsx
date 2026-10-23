import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, RequireRole } from './guards.jsx';
import { AppLayout } from '../layouts/AppLayout.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import LeadsPage from '../pages/LeadsPage.jsx';
import LeadNewPage from '../pages/LeadNewPage.jsx';
import LeadDetailPage from '../pages/LeadDetailPage.jsx';
import UsersPage from '../pages/UsersPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/new" element={<LeadNewPage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<RequireRole role="admin" />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
