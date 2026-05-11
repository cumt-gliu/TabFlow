import { useState, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import SearchSuggestions from './components/SearchSuggestions';
import SearchResults from './components/SearchResults';
import SuggestionsDropdown from './components/SuggestionsDropdown';
import { searchHistory } from '../shared/chromeApi';
import { getRecentSearches, addRecentSearch } from '../shared/storage';
import './App.css';

export default function App() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsStatus, setSuggestionsStatus] = useState('idle');
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const activeIndexRef = useRef(activeIndex);

  useEffect(() => {
    getRecentSearches().then(setRecentSearches);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') window.close();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  function handleInputChange(value) {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setStatus('idle');
      setSuggestions([]);
      setSuggestionsStatus('idle');
      getRecentSearches().then(setRecentSearches);
      return;
    }

    setStatus('idle');

    debounceRef.current = setTimeout(async () => {
      setSuggestionsStatus('loading');
      try {
        const res = await searchHistory({ query: value, maxResults: 5 });
        setSuggestions(res);
        setSuggestionsStatus('results');
      } catch {
        setSuggestions([]);
        setSuggestionsStatus('results');
      }
    }, 300);
  }

  async function handleSearch(value) {
    if (!value.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setStatus('loading');
    try {
      const res = await searchHistory({ query: value });
      setResults(res);
      setStatus(res.length > 0 ? 'results' : 'empty');
      addRecentSearch(value);
      setRecentSearches([]);
    } catch {
      setStatus('error');
    }
  }

  function handleKeyDown(e) {
    const totalItems = recentSearches.length + suggestions.length + 1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => prev < totalItems - 1 ? prev + 1 : -1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => prev > -1 ? prev - 1 : totalItems - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndexRef.current >= 0 && activeIndexRef.current < recentSearches.length + suggestions.length) {
        const items = [...recentSearches, ...suggestions];
        const selected = items[activeIndexRef.current];
        if (typeof selected === 'string') {
          handleSearch(selected);
        } else {
          chrome.tabs.create({ url: selected.url });
          window.close();
        }
      } else {
        handleSearch(query);
      }
    }
  }

  function handleViewAll() {
    const url = chrome.runtime.getURL('management/index.html')
      + `?q=${encodeURIComponent(query)}`;
    chrome.tabs.create({ url });
  }

  function handleSuggestionSelect(item) {
    if (typeof item === 'string') {
      handleSearch(item);
    } else {
      chrome.tabs.create({ url: item.url });
      window.close();
    }
  }

  const showSuggestions = status === 'idle' && query.trim().length > 0;

  return (
    <div className="popup-container">
      <SearchBar
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      {status === 'idle' && !query && (
        <SearchSuggestions
          items={recentSearches}
          label="最近搜索"
          onSelect={handleSearch}
        />
      )}
      {showSuggestions && (
        <SuggestionsDropdown
          query={query}
          suggestions={suggestions}
          recentSearches={recentSearches.slice(0, 3)}
          activeIndex={activeIndex}
          status={suggestionsStatus}
          onSelect={handleSuggestionSelect}
          onSearchAll={() => handleSearch(query)}
        />
      )}
      {(status === 'loading' || status === 'results' || status === 'empty' || status === 'error') && (
        <SearchResults
          status={status}
          results={results}
          query={query}
          onViewAll={handleViewAll}
          totalCount={results.length}
        />
      )}
    </div>
  );
}
