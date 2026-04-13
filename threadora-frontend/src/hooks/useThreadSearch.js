import { useState, useRef, useCallback, useEffect } from 'react';
import { searchThreads } from '../api/threadApi';
import { useNavigate } from 'react-router-dom';

/**
 * Encapsulates all search behaviour for the thread feed header.
 *
 * Features:
 *   - 300ms debounce on keystroke to avoid hammering the API
 *   - Paginated results with a "load more" action
 *   - Keyboard navigation (ArrowDown/Up = highlight, Enter = open, Escape = close)
 *   - When `isMyThreads` is true, results are scoped to the current user's posts
 *   - When `activeCategoryId` is set, results are scoped to that category
 *
 * @param {object}   options
 * @param {object}   options.user             - Authenticated user (or null for guests)
 * @param {boolean}  options.isMyThreads      - Whether to scope search to the user's own threads
 * @param {string}   options.activeCategoryId - Category to restrict search to (or null for global)
 * @param {Function} options.onClose          - Callback invoked when the dropdown is dismissed
 */
export function useThreadSearch({ user, isMyThreads, activeCategoryId, onClose }) {
  const navigate = useNavigate();
  const [searchQuery,          setSearchQuery]          = useState('');
  const [searchResults,        setSearchResults]        = useState([]);
  const [isSearching,          setIsSearching]          = useState(false);
  const [showSearchDropdown,   setShowSearchDropdown]   = useState(false);
  const [activeIndex,          setActiveIndex]          = useState(-1);
  const [searchPage,           setSearchPage]           = useState(1);
  const [hasMoreSearch,        setHasMoreSearch]        = useState(false);
  const [isFetchingMoreSearch, setIsFetchingMoreSearch] = useState(false);

  const searchRef      = useRef(null);
  const searchInputRef = useRef(null);
  const debounceTimer  = useRef(null);

  // NOTE: `searchPage` is intentionally excluded from performSearch's deps array.
  // Including it would cause the callback to be recreated on every page increment,
  // which would reconnect the debounce timer. Instead, `isLoadMore` drives which
  // page number is used at call time.
  const performSearch = useCallback(async (query, isLoadMore = false) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      setSearchPage(1);
      setHasMoreSearch(false);
      return;
    }

    const currentPage = isLoadMore ? searchPage + 1 : 1;
    if (isLoadMore) setIsFetchingMoreSearch(true);
    else            setIsSearching(true);

    try {
      const authorId = isMyThreads ? user?._id : null;
      const data = await searchThreads(query.trim(), activeCategoryId, authorId, currentPage);

      if (isLoadMore) {
        setSearchResults(prev => [...prev, ...(data.threads || [])]);
      } else {
        setSearchResults(data.threads || []);
      }

      setSearchPage(currentPage);
      setHasMoreSearch(data.currentPage < data.totalPages);
      setShowSearchDropdown(true);
      if (!isLoadMore) setActiveIndex(-1);
    } catch (err) {
      console.error('Search failed:', err);
      if (!isLoadMore) setSearchResults([]);
    } finally {
      setIsSearching(false);
      setIsFetchingMoreSearch(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategoryId, isMyThreads, user?._id, searchPage]);

  const loadMoreSearch = useCallback(() => {
    if (hasMoreSearch && !isFetchingMoreSearch && !isSearching) {
      performSearch(searchQuery, true);
    }
  }, [hasMoreSearch, isFetchingMoreSearch, isSearching, performSearch, searchQuery]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }

    // Show a loading indicator immediately so the UI feels responsive
    setIsSearching(true);
    setShowSearchDropdown(true);
    debounceTimer.current = setTimeout(() => performSearch(value), 300);
  };

  const navigateToThread = (threadId) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
    setActiveIndex(-1);
    if (onClose) onClose();
    navigate(`/t/${threadId}`);
  };

  const handleSearchKeyDown = (e) => {
    if (!showSearchDropdown || searchResults.length === 0) {
      // When the dropdown is not open, Enter re-triggers the search
      if (e.key === 'Enter' && searchQuery.trim()) {
        performSearch(searchQuery);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && searchResults[activeIndex]) {
          navigateToThread(searchResults[activeIndex]._id);
        }
        break;
      case 'Escape':
        setShowSearchDropdown(false);
        setActiveIndex(-1);
        searchInputRef.current?.blur();
        if (onClose) onClose();
        break;
      default:
        break;
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  // Cancel any pending debounced search on unmount to avoid state updates on
  // an unmounted component (which React 18 handles gracefully but is still bad form)
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    showSearchDropdown,
    setShowSearchDropdown,
    activeIndex,
    setActiveIndex,
    hasMoreSearch,
    isFetchingMoreSearch,
    searchRef,
    searchInputRef,
    handleSearchChange,
    handleSearchKeyDown,
    loadMoreSearch,
    navigateToThread,
    clearSearch
  };
}
