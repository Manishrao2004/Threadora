import { Loader2, MessageSquare, ArrowRight, Search } from 'lucide-react';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

const highlightMatch = (text, query) => {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="text-[#6366F1] font-semibold bg-[#6366F1]/10 rounded px-0.5">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const truncateText = (text, maxLength = 80) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '…' : text;
};

export default function SearchDropdown({ 
  results, query, isLoading, activeIdx, navigateToThread, 
  setActiveIndex, hasMore, isFetchingMore, onLoadMore 
}) {
  const sentinelRef = useInfiniteScroll(onLoadMore, hasMore, isFetchingMore, 50);

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-[100] max-h-[420px] overflow-y-auto overscroll-contain search-dropdown custom-scrollbar">
      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-8 text-[#908FA0]">
          <Loader2 className="w-5 h-5 animate-spin text-[#6366F1]" />
          <span className="text-sm">Searching threads…</span>
        </div>
      ) : results.length > 0 ? (
        <div>
          <div className="px-4 py-2.5 border-b border-white/5">
            <span className="text-[10px] font-bold text-[#908FA0] uppercase tracking-widest">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </span>
          </div>
          {results.map((thread, idx) => (
            <button
              key={thread._id}
              onClick={() => navigateToThread(thread._id)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-all duration-150 border-b border-white/[0.03] last:border-0 group border-l-2 ${
                idx === activeIdx
                  ? 'bg-[#6366F1]/10 border-l-[#6366F1]'
                  : 'border-l-transparent hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1]/20 to-[#3B82F6]/20 flex items-center justify-center mt-0.5">
                <MessageSquare className="w-4 h-4 text-[#6366F1]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight mb-1">
                  {highlightMatch(thread.title, query)}
                </p>
                <p className="text-xs text-[#908FA0] line-clamp-1 leading-relaxed">
                  {highlightMatch(truncateText(thread.content), query)}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-[#6366F1] font-medium">
                    c/{thread.categoryId?.name || 'general'}
                  </span>
                  <span className="text-gray-600 text-[10px]">•</span>
                  <span className="text-[10px] text-[#908FA0]">
                    @{thread.authorId?.username || 'user'}
                  </span>
                </div>
              </div>
              <ArrowRight className={`w-4 h-4 flex-shrink-0 mt-1 transition-all ${
                idx === activeIdx ? 'text-[#6366F1] translate-x-0 opacity-100' : 'text-gray-600 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
              }`} />
            </button>
          ))}
          {(hasMore || isFetchingMore) && (
            <div ref={sentinelRef} className="py-4 flex justify-center">
              {isFetchingMore && <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-[#908FA0]">
          <Search className="w-8 h-8 mb-3 text-gray-600" />
          <p className="text-sm font-medium text-gray-400">No threads found</p>
          <p className="text-xs mt-1">Try different keywords</p>
        </div>
      )}
    </div>
  );
}
