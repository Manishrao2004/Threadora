import { useEffect } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import SearchDropdown from './SearchDropdown';
import { useThreadSearch } from '../../hooks/useThreadSearch';

export default function SearchBar({ searchPlaceholder, activeCategoryId, isMyThreads, user }) {
  const {
    searchQuery, searchResults, isSearching, showSearchDropdown, setShowSearchDropdown,
    activeIndex, setActiveIndex, hasMoreSearch, isFetchingMoreSearch, searchRef,
    searchInputRef, handleSearchChange, handleSearchKeyDown, loadMoreSearch, navigateToThread, clearSearch
  } = useThreadSearch({ user, isMyThreads, activeCategoryId });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSearchDropdown, setActiveIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-96 group" ref={searchRef}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#908FA0] group-focus-within:text-[#6366F1] transition-colors z-10" />
      <input
        ref={searchInputRef}
        type="text"
        placeholder={searchPlaceholder}
        value={searchQuery}
        onChange={handleSearchChange}
        onKeyDown={handleSearchKeyDown}
        onFocus={() => { if (searchQuery.trim() && searchResults.length > 0) setShowSearchDropdown(true); }}
        className="w-full bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-full pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40 focus:border-[#6366F1]/30 focus:bg-[#0d1320] transition-all placeholder-[#908FA0]"
      />
      {searchQuery && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />}
          <button onClick={clearSearch} className="text-gray-500 hover:text-white transition-colors p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {!searchQuery && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-gray-500 bg-white/5 border border-white/10 rounded-md">
            Ctrl+K
          </kbd>
        </div>
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
  );
}
