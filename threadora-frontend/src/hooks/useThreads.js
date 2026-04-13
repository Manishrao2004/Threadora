import { useState, useRef, useCallback } from 'react';
import { getThreads } from '../api/threadApi';

/**
 * Manages paginated thread state for a single feed view.
 *
 * Two distinct loading states exist to drive different UI affordances:
 *   isLoading      — initial skeleton load on first render or filter change
 *   isFetchingMore — spinner at the bottom of the list during infinite scroll
 *
 * Filter params (categoryId, sortBy, authorId) are stored in a ref so that
 * the loadMore callback can read the current filter without being re-created
 * every time a filter changes (avoids reconnecting the IntersectionObserver).
 */
export const useThreads = () => {
  const [threads, setThreads]           = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError]               = useState(null);
  const [totalThreads, setTotalThreads] = useState(0);
  const [hasMore, setHasMore]           = useState(true);
  const [page, setPage]                 = useState(1);

  const filterRef = useRef({ categoryId: null, sortBy: 'trending', authorId: null, limit: 20 });

  const fetchThreads = useCallback(async (
    pageNum  = 1,
    limit    = 20,
    categoryId = null,
    override   = false,
    sortBy   = 'trending',
    authorId = null
  ) => {
    if (override || pageNum === 1) setIsLoading(true);
    else                           setIsFetchingMore(true);

    setError(null);
    filterRef.current = { categoryId, sortBy, authorId, limit };

    try {
      const params = { page: pageNum, limit, sort_by: sortBy };
      if (categoryId) params.categoryId = categoryId;
      if (authorId)   params.authorId   = authorId;

      const data = await getThreads(params);

      setTotalThreads(data.total || 0);
      setThreads(prev => {
        if (override || pageNum === 1) return data.threads || [];
        const merged = [...prev, ...(data.threads || [])];
        // Deduplicate by _id in case the same thread appears across pages
        // (possible if a new thread is inserted at the top between requests)
        return Array.from(new Map(merged.map(t => [t._id, t])).values());
      });
      setHasMore(data.currentPage < data.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch threads');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  // Loads the next page using the stored filter context — called by the
  // IntersectionObserver sentinel when the user scrolls near the bottom.
  const loadMore = useCallback(() => {
    const { categoryId, sortBy, authorId, limit } = filterRef.current;
    fetchThreads(page + 1, limit, categoryId, false, sortBy, authorId);
  }, [fetchThreads, page]);

  // Resets all state — called when the user changes a filter or sort option
  // so the next fetchThreads call starts from a clean slate.
  const resetThreads = useCallback(() => {
    setThreads([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setTotalThreads(0);
  }, []);

  return {
    threads, setThreads,
    isLoading, isFetchingMore,
    error,
    fetchThreads, loadMore, resetThreads,
    hasMore, totalThreads, page
  };
};
