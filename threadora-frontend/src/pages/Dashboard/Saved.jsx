import { useState, useEffect, useCallback } from 'react';
import { Bookmark } from 'lucide-react';
import ThreadCard from '../../components/threads/ThreadCard';
import { getSavedThreads } from '../../api/threadApi';
import { getCategories } from '../../api/categoryApi';
import { useAuth } from '../../hooks/useAuth';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';


import { ThreadFeedSkeleton } from '../../components/common/Skeletons';
import InfiniteScrollSentinel from '../../components/common/InfiniteScrollSentinel';
import { useVoteHandler } from '../../hooks/useVoteHandler';

const THREADS_PER_PAGE = 15;

export default function Saved() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Fetch categories for pills
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  const fetchSavedThreads = useCallback(async (pageNum = 1, override = false) => {
    if (override || pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const params = { page: pageNum, limit: THREADS_PER_PAGE };
      if (selectedCategory) params.categoryId = selectedCategory;
      const data = await getSavedThreads(params);
      
      const newThreads = data.threads || [];
      setThreads(prev => {
        if (override || pageNum === 1) return newThreads;
        const merged = [...prev, ...newThreads];
        // Deduplicate
        return Array.from(new Map(merged.map(t => [t._id, t])).values());
      });
      setHasMore(data.currentPage < data.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching saved threads:', err);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (user) {
      // Reset on category change
      setThreads([]);
      setPage(1);
      setHasMore(true);
      fetchSavedThreads(1, true);
    } else {
      setIsLoading(false);
    }
  }, [selectedCategory, user, user?.savedThreads?.length, fetchSavedThreads]);

  const loadMore = useCallback(() => {
    fetchSavedThreads(page + 1);
  }, [fetchSavedThreads, page]);

  // Infinite scroll sentinel
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, isLoading || isFetchingMore);

  const { handleVote } = useVoteHandler(setThreads);

  if (isLoading && threads.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-8 border-b border-white/5 pb-6">
          <div className="skeleton h-10 w-48 rounded-lg mb-2" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 px-2">
            <div className="skeleton h-9 w-16 rounded-full flex-shrink-0" />
            <div className="skeleton h-9 w-24 rounded-full flex-shrink-0" />
            <div className="skeleton h-9 w-20 rounded-full flex-shrink-0" />
            <div className="skeleton h-9 w-28 rounded-full flex-shrink-0" />
        </div>
        <ThreadFeedSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 border-b border-white/5 pb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-[#6366F1]" />
          Saved Threads
        </h2>
        <p className="text-[#908FA0] text-sm mt-1">Threads you've bookmarked for later</p>
      </div>

      {/* Pill Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 px-2 pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            !selectedCategory
              ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/20'
              : 'glass-panel text-[#908FA0] hover:text-white hover:bg-white/5 border border-white/5'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setSelectedCategory(cat._id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat._id
                ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/20'
                : 'glass-panel text-[#908FA0] hover:text-white hover:bg-white/5 border border-white/5'
            }`}
          >
            #{cat.name.toLowerCase()}
          </button>
        ))}
      </div>

      {threads.length > 0 ? (
        <div className="space-y-4">
          {threads.map((thread) => (
            <ThreadCard
              key={thread._id}
              thread={thread}
              onVote={handleVote}
              onDelete={(id) => setThreads(prev => prev.filter(t => t._id !== id))}
            />
          ))}

          <InfiniteScrollSentinel
            sentinelRef={sentinelRef}
            isFetchingMore={isFetchingMore}
            hasMore={hasMore}
            itemCount={threads.length}
            minCountForEndMessage={THREADS_PER_PAGE}
          />
        </div>
      ) : !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 glass-panel rounded-3xl min-h-[400px]">
          <Bookmark className="w-12 h-12 text-[#6366F1] mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">No saved threads</h2>
          <p className="text-sm text-[#908FA0]">You haven't saved any threads yet in this category.</p>
        </div>
      )}
    </div>
  );
}
