import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const AdminRoute = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  
  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#0B0F14]">
      <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default AdminRoute;
