import { useState, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Home, Bookmark, LogOut, Search, PlusCircle, Settings, Hash, Shield, User, LogIn, UserPlus, Pin, X } from 'lucide-react';
import { updateProfile } from '../../api/authApi';

export default function SidebarNav({ mobileMenuOpen, setMobileMenuOpen, categories, setIsNewThreadModalOpen }) {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();

  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [isCommunitySearchOpen, setIsCommunitySearchOpen] = useState(false);
  const communitySearchInputRef = useRef(null);

  const pinnedCommunities = useMemo(() => user?.pinnedCommunities || {}, [user?.pinnedCommunities]);
 
  const togglePin = async (e, categoryId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
 
    const nextPins = { ...pinnedCommunities };
    if (nextPins[categoryId]) {
      delete nextPins[categoryId];
    } else {
      nextPins[categoryId] = Date.now();
    }
 
    updateUser({ pinnedCommunities: nextPins });
 
    try {
      await updateProfile({ pinnedCommunities: nextPins });
    } catch (error) {
      console.error('Failed to sync pin to cloud:', error);
      updateUser({ pinnedCommunities });
    }
  };
 
  const sortedCategories = [...categories].sort((a, b) => {
    const aPinned = pinnedCommunities[a._id];
    const bPinned = pinnedCommunities[b._id];
 
    if (aPinned && bPinned) return aPinned - bPinned;
    if (aPinned) return -1;
    if (bPinned) return 1;
    return a.name.localeCompare(b.name);
  });

  const guestNavLinks = [
    { name: 'Global Feed', path: '/dashboard', icon: Home },
  ];

  const authNavLinks = [
    { name: 'Global Feed', path: '/dashboard', icon: Home },
    { name: 'My Threads', path: '/my-threads', icon: User },
    { name: 'Saved', path: '/saved', icon: Bookmark },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const navLinks = user ? authNavLinks : guestNavLinks;

  return (
    <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 glass-panel border-y-0 border-l-0 z-[60] transform transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="hidden md:block">
            <Link to="/dashboard" className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent hover:opacity-80 transition-opacity">Threadora</Link>
          </div>
          <div className="flex md:hidden items-center justify-between w-full">
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent hover:opacity-80 transition-opacity">Threadora</Link>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Identity Card */}
        <div className="mb-4">
          {user ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.08)]">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[#6366F1] to-[#3B82F6] flex items-center justify-center font-bold text-white uppercase shadow-lg border border-white/10">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover"/>
                ) : (
                  user.username?.[0] || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{user.username || 'User'}</p>
                <p className="text-xs text-[#908FA0] truncate">{user.email || 'user@example.com'}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.08)]">
              <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[#6366F1]/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white">Guest</p>
                <p className="text-xs text-[#908FA0]">Browsing as guest</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mb-4">
          {user ? (
            <button 
              onClick={() => setIsNewThreadModalOpen(true)}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 shadow-lg shadow-[#6366F1]/10"
            >
              <PlusCircle className="w-5 h-5" />
              New Thread
            </button>
          ) : (
            <Link
              to="/register"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white font-semibold text-sm shadow-lg shadow-[#6366F1]/10 hover:opacity-90 transition-opacity"
            >
              <UserPlus className="w-5 h-5" />
              Join Threadora
            </Link>
          )}
        </div>

        {/* Main Nav */}
        <nav className="space-y-1 mb-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${isActive ? 'bg-[#6366F1]/10 text-[#6366F1]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Scrollable Communities List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
          <div className="flex items-center justify-between mb-3 px-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Communities</p>
            <button 
              onClick={() => {
                setIsCommunitySearchOpen(!isCommunitySearchOpen);
                if (!isCommunitySearchOpen) setTimeout(() => communitySearchInputRef.current?.focus(), 100);
                else setCommunitySearchQuery('');
              }}
              className={`p-1 rounded-md transition-colors ${isCommunitySearchOpen ? 'bg-[#6366F1]/20 text-[#6366F1]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {isCommunitySearchOpen && (
            <div className="px-4 mb-3 animate-slideDown">
              <div className="relative">
                <input
                  ref={communitySearchInputRef}
                  type="text"
                  placeholder="Filter communities..."
                  value={communitySearchQuery}
                  onChange={(e) => setCommunitySearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-1.5 pl-3 pr-8 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#6366F1]/50 transition-all"
                />
                {communitySearchQuery && (
                  <button 
                    onClick={() => setCommunitySearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <nav className="space-y-0.5">
            {sortedCategories
              .filter(cat => cat.name.toLowerCase().includes(communitySearchQuery.toLowerCase()))
              .map((cat, index) => {
                const isPinned = !!pinnedCommunities[cat._id];
                return (
                  <Link 
                    key={`${cat._id}-${index}`}
                    to={`/c/${cat._id}`}
                    className={`group flex items-center justify-between px-4 py-2 rounded-xl transition-all duration-200 font-medium text-sm ${location.pathname === `/c/${cat._id}` ? 'bg-[#6366F1]/10 text-[#6366F1]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Hash className={`w-4 h-4 flex-shrink-0 ${isPinned ? 'text-[#6366F1]' : 'text-[#908FA0]'}`} />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    {user && (
                      <button
                        onClick={(e) => togglePin(e, cat._id)}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${isPinned ? 'text-[#6366F1] opacity-100' : 'text-gray-600 opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:bg-white/10 hover:text-gray-300'}`}
                        title={isPinned ? "Unpin community" : "Pin to top"}
                      >
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </Link>
                );
              })}
            {categories.filter(cat => cat.name.toLowerCase().includes(communitySearchQuery.toLowerCase())).length === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-xs text-gray-600 italic">No matches found</p>
              </div>
            )}
          </nav>
        </div>

        {/* Lower Actions */}
        <div className="mt-auto pt-4 flex flex-col gap-1">
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-4 py-2.5 text-[#6366F1] hover:text-[#818CF8] hover:bg-[#6366F1]/10 rounded-xl transition-all duration-200 font-medium text-sm border border-[#6366F1]/10 mb-1"
                >
                  <Shield className="w-5 h-5" />
                  Admin Core
                </Link>
              )}
              <button 
                onClick={() => { logout(); window.location.href='/login'; }}
                className="flex items-center gap-3 px-4 py-2.5 text-red-500/70 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-200 font-medium text-sm border border-red-500/10"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-3 px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 font-medium text-sm border border-white/5 mb-1"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-3 px-4 py-2.5 text-[#6366F1] hover:text-[#818CF8] hover:bg-[#6366F1]/10 rounded-xl transition-all duration-200 font-medium text-sm border border-[#6366F1]/10"
              >
                <UserPlus className="w-5 h-5" />
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
