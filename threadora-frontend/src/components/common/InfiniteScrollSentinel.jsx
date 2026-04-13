/**
 * InfiniteScrollSentinel
 * Shared sentinel + loading spinner + "end of feed" message.
 * Replaces duplicated sentinel blocks in UserHome, MyThreads, Saved.
 *
 * @param {React.Ref} sentinelRef          - Ref from useInfiniteScroll hook
 * @param {boolean}   isFetchingMore       - Whether more data is being fetched
 * @param {boolean}   hasMore              - Whether there are more items to load
 * @param {number}    itemCount            - Current number of rendered items
 * @param {number}    minCountForEndMessage- Minimum items before showing "end" text (default 15)
 */
export default function InfiniteScrollSentinel({
  sentinelRef,
  isFetchingMore,
  hasMore,
  itemCount,
  minCountForEndMessage = 15,
}) {
  return (
    <div ref={sentinelRef} className="infinite-scroll-sentinel">
      {isFetchingMore && (
        <div className="infinite-spinner">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      )}
      {!hasMore && itemCount >= minCountForEndMessage && (
        <p className="text-center text-xs text-[#908FA0]/50 py-6 font-medium tracking-wide uppercase">
          You've reached the end
        </p>
      )}
    </div>
  );
}
