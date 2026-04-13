import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Shield, Users, AlertTriangle, Settings, LogOut, Menu, X, LayoutDashboard, Home, Hash } from 'lucide-react';
import { useState, useEffect } from 'react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isSuperAdmin = user?.role === 'superadmin';

  const navLinks = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Moderation', path: '/admin/moderation', icon: Shield },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Reports Queue', path: '/admin/reports', icon: AlertTriangle },
    ...(isSuperAdmin ? [
      { name: 'Communities', path: '/admin/communities', icon: Hash },
      { name: 'System Config', path: '/admin/settings', icon: Settings },
    ] : []),
  ];

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row bg-[#0B0F14] text-[#E0E2EA]">
      {/* Mobile Topbar */}
      <div className="md:hidden sticky top-0 z-50 px-5 py-4 bg-[#0B0F14] border-b border-white/[0.05] flex justify-between items-center">
        <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#6366F1]" /> Admin Core
        </span>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0B0F14] border-r border-white/[0.05] z-[60] transform transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full overflow-hidden">
          {/* Header (Fixed) */}
          <div className="flex items-center justify-between mb-10">
            <div className="hidden md:flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Admin Core</span>
            </div>
            {/* Mobile-only branding and close button */}
            <div className="flex md:hidden items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#6366F1]" />
                <span className="text-xl font-bold tracking-tight text-white">Admin Core</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Admin Identity Card (Top) */}
          <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.08)]">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-white/10 bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold uppercase">
                  {user?.username?.[0] || 'A'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm text-white truncate">{user?.username || 'Admin'}</p>
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
              </div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
                {isSuperAdmin ? 'Full Control' : 'Moderator Access'}
              </p>
            </div>
          </div>

          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">Control Panel</p>

          {/* Nav Links */}
          <nav className="space-y-3 flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.name} 
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Icon className="w-5 h-5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Utility Actions (Bottom) */}
          <div className="mt-auto">
            <div className="flex flex-col gap-2">
              <Link
                to="/dashboard"
                className="w-full flex items-center justify-center gap-2 py-2.5 text-[#6366F1] hover:text-[#818CF8] hover:bg-[#6366F1]/10 rounded-xl transition-all duration-200 font-medium text-sm border border-[#6366F1]/20"
              >
                <Home className="w-4 h-4" />
                User Dashboard
              </Link>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-200 font-medium text-sm border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-[#050505] h-screen overflow-y-auto overscroll-y-contain">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-[55] md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
