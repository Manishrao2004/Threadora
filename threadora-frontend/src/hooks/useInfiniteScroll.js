import { useEffect, useRef, useCallback } from 'react';

/**
 * Infinite scroll using the IntersectionObserver API.
 *
 * Attach the returned ref to a sentinel element positioned at the end of the
 * list. When the sentinel enters the viewport (or comes within `rootMargin`
 * pixels of it), `onLoadMore` is triggered — but only when `hasMore` is true
 * and no fetch is already in-flight.
 *
 * The observer is re-created whenever `handleIntersect` or `rootMargin`
 * changes (e.g. after a filter switch resets paging state) so it never fires
 * against a stale closure.
 *
 * @param {Function} onLoadMore  - Callback that fetches the next page
 * @param {boolean}  hasMore     - Whether more pages exist
 * @param {boolean}  isLoading   - Whether a fetch is currently in-flight
 * @param {number}   rootMargin  - Trigger distance in pixels (default: 200)
 */
export const useInfiniteScroll = (onLoadMore, hasMore, isLoading, rootMargin = 200) => {
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const handleIntersect = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoading]
  );

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: `${rootMargin}px`,
    });

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersect, rootMargin]);

  return sentinelRef;
};
