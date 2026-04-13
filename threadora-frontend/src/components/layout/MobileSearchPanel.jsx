import { useEffect } from 'react';
import { Search, X } from 'lucide-react';
import SearchDropdown from './SearchDropdown';
import { useThreadSearch } from '../../hooks/useThreadSearch';

export default function MobileSearchPanel({ searchPlaceholder, activeCategoryId, isMyThreads, user, onClose }) {
  const {
    searchQuery, searchResults, isSearching, showSearchDropdown, setShowSearchDropdown,
    activeIndex, setActiveIndex, hasMoreSearch, isFetchingMoreSearch, searchRef,
    searchInputRef, handleSearchChange, handleSearchKeyDown, loadMoreSearch, navigateToThread, clearSearch
  } = useThreadSearch({ user, isMyThreads, activeCategoryId, onClose });

  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  return (
    <div className="md:hidden fixed inset-x-0 top-[52px] z-[60] bg-[#0B0F14] border-b border-white/5 p-4 animate-slideDown" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#908FA0]" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          className="w-full bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#6366F1]/50 transition-all placeholder-[#908FA0]"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {showSearchDropdown && (
          <SearchDropdown
            results={searchResults}
            query={searchQuery}
            isLoading={isSearching}
            activeIdx={activeIndex}
            navigateToThread={navigateToThread}
            setActiveIndex={setActiveIndex}
            hasMore={hasMoreSearch}
            isFetchingMore={isFetchingMoreSearch}
            onLoadMore={loadMoreSearch}
          />
        )}
      </div>
    </div>
  );
}
