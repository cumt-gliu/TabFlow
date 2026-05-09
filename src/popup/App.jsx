import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import SearchSuggestions from './components/SearchSuggestions';
import SearchResults from './components/SearchResults';
import { searchHistory } from '../shared/chromeApi';
import { getRecentSearches, addRecentSearch } from '../shared/storage';
import './App.css';

export default function App() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

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

  async function handleInputChange(value) {
    setQuery(value);
    if (!value.trim()) {
      setStatus('idle');
      getRecentSearches().then(setRecentSearches);
    }
  }

  async function handleSearch(value) {
    if (!value.trim()) return;
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
        onSearch={handleSearch}
      />
      {status === 'idle' && !query && (
        <SearchSuggestions
          items={recentSearches}
          label="最近搜索"
          onSelect={handleSearch}
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
