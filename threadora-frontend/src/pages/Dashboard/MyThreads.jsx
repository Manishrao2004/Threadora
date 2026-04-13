import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useThreads } from '../../hooks/useThreads';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { Loader2, User, LayoutList } from 'lucide-react';

import ThreadCard from '../../components/threads/ThreadCard';
import EditThreadModal from '../../components/common/EditThreadModal';

import { ThreadFeedSkeleton } from '../../components/common/Skeletons';
import InfiniteScrollSentinel from '../../components/common/InfiniteScrollSentinel';
import { useVoteHandler } from '../../hooks/useVoteHandler';

const THREADS_PER_PAGE = 15;

export default function MyThreads() {
  const { user } = useAuth();
  const { 
    threads, isLoading, isFetchingMore, error, 
    fetchThreads, setThreads, loadMore, hasMore, totalThreads 
  } = useThreads();
  const [editingThread, setEditingThread] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Infinite scroll sentinel
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, isLoading || isFetchingMore);

  useEffect(() => {
    if (user?._id) {
      fetchThreads(1, THREADS_PER_PAGE, null, true, 'new', user._id);
    }
  }, [fetchThreads, user?._id]);

  const { handleVote } = useVoteHandler(setThreads);

  if (isLoading && threads.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-8 border-b border-white/5 pb-6">
          <div className="skeleton h-10 w-48 rounded-lg mb-2" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        <ThreadFeedSkeleton count={4} />
      </div>
    );
  }

  if (error && threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <LayoutList className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Failed to load threads</h3>
        <p className="text-[#908FA0] max-w-xs mx-auto mb-8">{error}</p>
        <button 
          onClick={() => fetchThreads(1, THREADS_PER_PAGE, null, true, 'new', user?._id)}
          className="btn-primary px-8"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 border-b border-white/5 pb-6 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <User className="w-8 h-8 text-[#6366F1]" /> 
            My Threads
          </h2>
          <p className="text-[#908FA0] text-sm mt-1">Manage and track your platform contributions.</p>
        </div>
        <div className="bg-[#6366F1]/10 px-4 py-2 rounded-2xl border border-[#6366F1]/20 hidden sm:block">
          <span className="text-xs font-bold text-[#6366F1] uppercase tracking-wider">
            Total Contributions: {totalThreads}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {threads.length > 0 ? (
          <>
            {threads.map((thread, index) => (
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
              itemCount={threads.length}
              minCountForEndMessage={THREADS_PER_PAGE}
            />
          </>
        ) : !isLoading && (
          <div className="text-center py-32 glass-panel rounded-3xl border-dashed border-2 border-white/5">
            <LayoutList className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No threads yet</h3>
            <p className="text-[#908FA0] max-w-xs mx-auto mb-8">
              You haven't posted any threads yet. Start sharing your thoughts with the community!
            </p>
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
