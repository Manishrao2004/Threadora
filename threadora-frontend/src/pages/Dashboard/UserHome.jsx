import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThreads } from '../../hooks/useThreads';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { getCategories } from '../../api/categoryApi';
import { Loader2, Hash, Sparkles, Clock, Trophy, UserPlus } from 'lucide-react';

import ThreadComposer from '../../components/common/ThreadComposer';
import SlimComposer from '../../components/common/SlimComposer';
import TrustBadge from '../../components/common/TrustBadge';
import ThreadCard from '../../components/threads/ThreadCard';
import EditThreadModal from '../../components/common/EditThreadModal';
import { ThreadFeedSkeleton } from '../../components/common/Skeletons';
import InfiniteScrollSentinel from '../../components/common/InfiniteScrollSentinel';
import { useVoteHandler } from '../../hooks/useVoteHandler';

const THREADS_PER_PAGE = 15;

export default function UserHome() {
  const { categoryId } = useParams();
  const { user } = useAuth();
  const { 
    threads, isLoading, isFetchingMore, error, 
    fetchThreads, setThreads, loadMore, hasMore 
  } = useThreads();
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('trending');
  const [editingThread, setEditingThread] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Infinite scroll sentinel
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, isLoading || isFetchingMore);

  useEffect(() => {
    fetchThreads(1, THREADS_PER_PAGE, categoryId, true, sortBy);
    
    getCategories()
      .then(data => {
        setCategories(data);
      })
      .catch(() => {});
  }, [fetchThreads, categoryId, sortBy]);

  useEffect(() => {
    const handleThreadCreated = (e) => {
      const newThread = e.detail;
      // Only add to feed if we're on the global feed, or if the thread belongs to the current category filter
      if (!categoryId || newThread.categoryId === categoryId || newThread.categoryId?._id === categoryId) {
        setThreads(prev => [newThread, ...prev]);
      }
    };
    window.addEventListener('threadCreated', handleThreadCreated);
    return () => window.removeEventListener('threadCreated', handleThreadCreated);
  }, [categoryId, setThreads]);

  const { handleVote } = useVoteHandler(setThreads);

  // Filter threads if we are in a /c/:categoryId route
  const displayedThreads = categoryId 
    ? threads.filter(t => t.categoryId?._id === categoryId || t.categoryId === categoryId)
    : threads;

  if (isLoading && threads.length === 0) {
    return (
      <div className="space-y-6">
        {/* Mirror Header for Skeleton if categoryId exists */}
        {categoryId && (
          <div className="flex items-center gap-3 py-2">
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div className="skeleton h-8 w-48 rounded-lg" />
          </div>
        )}
        <ThreadFeedSkeleton count={5} />
      </div>
    );
  }

  if (error && threads.length === 0) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Community Header (Only for /c/:categoryId) */}
      {categoryId && (() => {
        const currentCategory = categories.find(c => c._id === categoryId);
        return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 py-2 mb-2">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#6366F1]/10 to-[#3B82F6]/10 border border-[#6366F1]/20 rounded-xl flex-shrink-0">
                <Hash className="w-6 h-6 text-[#6366F1]" /> 
              </div>
              <span className="truncate">{currentCategory?.name || 'Community'}</span>
            </h2>
            {currentCategory?.description && (
              <p className="mt-3 text-sm text-[#908FA0] line-clamp-2 leading-relaxed max-w-3xl">
                {currentCategory.description}
              </p>
            )}
          </div>

          <div className="flex w-full sm:w-auto items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
            {[
              { id: 'trending', name: 'Trending', icon: Sparkles },
              { id: 'new', name: 'Newest', icon: Clock },
              { id: 'top', name: 'Top Voted', icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = sortBy === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSortBy(tab.id)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-1 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    active 
                      ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/20 border border-white/10' 
                      : 'text-[#908FA0] hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden min-[360px]:inline">{tab.name}</span>
                  <span className="min-[360px]:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
        );
      })()}

      {/* Post Composer logic */}
      {categoryId ? (
        // Community Slim Composer
        user ? (
          <SlimComposer 
            categoryId={categoryId}
            categoryName={categories.find(c => c._id === categoryId)?.name}
            onSuccess={(thread) => setThreads(prev => [thread, ...prev])}
          />
        ) : (
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-white/5">
             <span className="text-sm text-[#908FA0]">Join #{(categories.find(c => c._id === categoryId)?.name || 'community')} to start a discussion</span>
             <Link to="/login" className="px-4 py-1.5 bg-[#6366F1] text-white text-xs font-bold rounded-xl hover:bg-[#5558E6] transition-all">Sign In</Link>
          </div>
        )
      ) : (
        // Global Feed Standard Composer
        user ? (
          <ThreadComposer onSuccess={(thread) => setThreads(prev => [thread, ...prev])} />
        ) : (
          <div className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 border border-[#6366F1]/10 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-[#6366F1]/70" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-white text-sm mb-0.5">Start a discussion</p>
              <p className="text-xs text-[#908FA0]">Sign in or create an account to post threads and participate in the community.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-white/80 border border-white/10 rounded-xl hover:bg-white/5 transition-all">
                Sign In
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-[#6366F1] hover:bg-[#5558E6] rounded-xl transition-all shadow-lg shadow-[#6366F1]/20">
                Sign Up
              </Link>
            </div>
          </div>
        )
      )}

      {/* Legacy Filter Removed - Handled in Header above */}
      <div className="space-y-4">
        {displayedThreads.length > 0 ? (
          <>
            {displayedThreads.map((thread, index) => (
              <ThreadCard 
                key={`${thread._id}-${index}`}
                thread={thread}
                onVote={handleVote}
                onDelete={(id) => setThreads(prev => prev.filter(t => t._id !== id))}
                onEdit={(t) => {
                  setEditingThread(t);
                  setIsEditModalOpen(true);
                }}
              />
            ))}

            <InfiniteScrollSentinel
              sentinelRef={sentinelRef}
              isFetchingMore={isFetchingMore}
              hasMore={hasMore}
              itemCount={displayedThreads.length}
              minCountForEndMessage={THREADS_PER_PAGE}
            />
          </>
        ) : !isLoading && (
          <div className="text-center py-20 glass-panel rounded-3xl">
            <h3 className="text-lg font-semibold text-white mb-2">It's incredibly quiet here.</h3>
            <p className="text-[#908FA0]">Be the first to curate a discussion.</p>
          </div>
        )}
      </div>

      <EditThreadModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        thread={editingThread}
        onSuccess={(updated) => {
          setThreads(prev => prev.map(t => t._id === updated._id ? updated : t));
        }}
      />
    </div>
  );
}
