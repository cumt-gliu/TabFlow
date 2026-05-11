import { useState, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import SearchSuggestions from './components/SearchSuggestions';
import SearchResults from './components/SearchResults';
import { searchHistory } from '../shared/chromeApi';
import { getRecentSearches } from '../shared/storage';
import './App.css';

export default function App() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const debounceRef = useRef(null);

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

  function handleInputChange(value) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setStatus('idle');
      setResults([]);
      getRecentSearches().then(setRecentSearches);
      return;
    }

    setStatus('loading');
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchHistory({ query: value });
        setResults(res);
        setStatus(res.length > 0 ? 'results' : 'empty');
      } catch {
        setStatus('error');
      }
    }, 300);
  }

  function handleSuggestionSelect(value) {
    if (!value.trim()) return;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setStatus('loading');
    searchHistory({ query: value }).then(res => {
      setResults(res);
      setStatus(res.length > 0 ? 'results' : 'empty');
    }).catch(() => setStatus('error'));
  }

  function handleViewAll() {
    const url = chrome.runtime.getURL('management/index.html')
      + `?q=${encodeURIComponent(query)}`;
    chrome.tabs.create({ url });
  }

  return (
    <div className="popup-container">
      <SearchBar
        value={query}
        onChange={handleInputChange}
      />
      {status === 'idle' && !query && (
        <SearchSuggestions
          items={recentSearches}
          label="最近搜索"
          onSelect={handleSuggestionSelect}
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
