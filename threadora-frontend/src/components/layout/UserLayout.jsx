import { Outlet, Link, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Search, Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getCategories } from '../../api/categoryApi';
import CreateThreadModal from '../common/CreateThreadModal';

import SearchBar from './SearchBar';
import MobileSearchPanel from './MobileSearchPanel';
import SidebarNav from './SidebarNav';

const UserLayout = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const mainScrollRef = useRef(null);

  const categoryMatch = matchPath({ path: '/c/:categoryId' }, location.pathname);
  const isMyThreads = location.pathname === '/my-threads';
  const activeCategoryId = categoryMatch?.params?.categoryId;
  const activeCategory = activeCategoryId ? categories.find(c => c._id === activeCategoryId) : null;

  let searchPlaceholder = "Search threads…";
  if (activeCategory) searchPlaceholder = `Search #${activeCategory.name}…`;
  else if (isMyThreads) searchPlaceholder = "Search My Threads…";

  useEffect(() => {
    getCategories()
      .then(data => setCategories(data))
      .catch(err => console.error("Failed to load categories", err));
  }, []);

  useEffect(() => {
    const isLocked = mobileMenuOpen || mobileSearchOpen;
    if (isLocked) {
      document.body.style.overflow = 'hidden';
      // Prevent momentum scrolling on iOS
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen, mobileSearchOpen]);

  useEffect(() => {
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
    
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0 });
    }
  }, [location.pathname]);

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row bg-[#0B0F14] text-[#E0E2EA]">
      {/* Mobile Topbar */}
      <div className="md:hidden sticky top-0 z-50 px-5 py-4 bg-[#0B0F14] border-b border-white/[0.05] flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent hover:opacity-80 transition-opacity">Threadora</Link>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)} 
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Search Panel */}
      {mobileSearchOpen && (
        <MobileSearchPanel
          searchPlaceholder={searchPlaceholder}
          activeCategoryId={activeCategoryId}
          isMyThreads={isMyThreads}
          user={user}
          onClose={() => setMobileSearchOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <SidebarNav 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
        categories={categories}
        setIsNewThreadModalOpen={setIsNewThreadModalOpen}
      />

      {/* Main Content Area */}
      <main ref={mainScrollRef} className="flex-1 min-w-0 relative h-screen overflow-y-auto overscroll-y-contain custom-scrollbar">
        {/* Desktop Search Header */}
        <header className="hidden md:flex sticky top-0 z-30 bg-[#0B0F14]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] px-8 py-4 justify-between items-center">
          <h2 className="text-lg font-semibold text-white">
            {location.pathname === '/dashboard' && 'Global Feed'}
            {location.pathname === '/saved' && 'Saved Threads'}
            {location.pathname === '/my-threads' && 'My Threads'}
            {location.pathname === '/settings' && 'Account Settings'}
            {location.pathname.startsWith('/t/') && 'Thread'}
            {location.pathname.startsWith('/c/') && (activeCategory ? `#${activeCategory.name}` : 'Community')}
          </h2>
          <SearchBar 
            searchPlaceholder={searchPlaceholder}
            activeCategoryId={activeCategoryId}
            isMyThreads={isMyThreads}
            user={user}
          />
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden transform-gpu"
          style={{ 
            willChange: 'backdrop-filter',
            WebkitBackdropFilter: 'blur(4px)',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            bottom: 0 
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[55] md:hidden transform-gpu"
          style={{ bottom: 0 }}
          onClick={() => setMobileSearchOpen(false)}
        />
      )}

      <CreateThreadModal 
        isOpen={isNewThreadModalOpen} 
        onClose={() => setIsNewThreadModalOpen(false)} 
        onSuccess={(thread) => {
          window.dispatchEvent(new CustomEvent('threadCreated', { detail: thread }));
          if (location.pathname !== '/dashboard' && !location.pathname.startsWith('/c/')) {
            navigate('/dashboard');
          }
        }} 
      />
    </div>
  );
};

export default UserLayout;
