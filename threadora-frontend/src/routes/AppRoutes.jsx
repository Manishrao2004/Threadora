import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import AdminRoute from './AdminRoute';
import Maintenance from '../pages/Maintenance';
import UserLayout from '../components/layout/UserLayout';
import AdminLayout from '../components/layout/AdminLayout';

import UserHome from '../pages/Dashboard/UserHome';
import ThreadDetail from '../pages/Dashboard/ThreadDetail';
import Saved from '../pages/Dashboard/Saved';
import Settings from '../pages/Dashboard/Settings';
import MyThreads from '../pages/Dashboard/MyThreads';
import AdminOverview from '../pages/Admin/AdminOverview';
import AdminModeration from '../pages/Admin/AdminModeration';
import AdminUsers from '../pages/Admin/AdminUsers';
import AdminReports from '../pages/Admin/AdminReports';
import AdminSettings from '../pages/Admin/AdminSettings';
import AdminCategories from '../pages/Admin/AdminCategories';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/maintenance" element={<Maintenance />} />

      {/* Public read-only routes — accessible by guests & authenticated users */}
      <Route element={<GuestRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<UserHome />} />
          <Route path="/c/:categoryId" element={<UserHome />} />
          <Route path="/t/:threadId" element={<ThreadDetail />} />
        </Route>
      </Route>

      {/* Auth-only routes — require login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/saved" element={<Saved />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/my-threads" element={<MyThreads />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/moderation" element={<AdminModeration />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/communities" element={<AdminCategories />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
