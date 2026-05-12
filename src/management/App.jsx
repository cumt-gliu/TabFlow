import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import HistoryList from './components/HistoryList';
import DomainGroup from './components/DomainGroup';
import TimeGroup from './components/TimeGroup';
import BatchActions from './components/BatchActions';
import ExportDialog from './components/ExportDialog';
import FilterBar from './components/FilterBar';
import SearchSuggest from './components/SearchSuggest';
import BookmarkList from './components/BookmarkList';
import StatsDashboard from './components/StatsDashboard';
import { searchHistory, deleteUrls } from '../shared/chromeApi';
import { getSettings, addRecentSearch } from '../shared/storage';
import './App.css';

const VIEWS = {
  list: '全部历史',
  domain: '按域名',
  time: '按时间',
  bookmarks: '收藏',
  manage: '管理',
  stats: '统计',
};

export default function App() {
  const [activeView, setActiveView] = useState('list');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [selected, setSelected] = useState(new Set());
  const [sortBy, setSortBy] = useState('lastVisitTime');
  const [showExport, setShowExport] = useState(false);
  const [filters, setFilters] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    getSettings().then(s => setActiveView(s.defaultView || 'list'));
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setQuery(q);
      executeSearch(q);
    } else {
      loadAll();
    }
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  async function executeSearch(value, extraFilters) {
    if (!value.trim() && !extraFilters) { loadAll(); return; }
    setStatus('loading');
    try {
      const opts = { query: value, maxResults: 200, ...extraFilters };
      const res = await searchHistory(opts);
      setResults(res);
      setStatus(res.length > 0 ? 'results' : 'empty');
      if (value.trim()) addRecentSearch(value);
    } catch {
      setStatus('error');
    }
  }

  function handleSearch(value) {
    setQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      executeSearch(value, filters || undefined);
    }, 300);
  }

  function handleSuggestionSelect(value) {
    setQuery(value);
    addRecentSearch(value);
    executeSearch(value, filters || undefined);
    searchInputRef.current?.blur();
  }

  async function loadAll() {
    setStatus('loading');
    try {
      const opts = { query: '', maxResults: 200 };
      if (filters) Object.assign(opts, filters);
      const res = await searchHistory(opts);
      setResults(res);
      setStatus(res.length > 0 ? 'results' : 'empty');
    } catch {
      setStatus('error');
    }
  }

  function handleApplyFilters(filterData) {
    setFilters(filterData);
    executeSearch(query, filterData);
  }

  function handleResetFilters() {
    setFilters(null);
    if (query.trim()) {
      executeSearch(query);
    } else {
      loadAll();
    }
  }

  async function deleteRange(startTime, endTime, label) {
    if (!confirm(`确定清理${label}的历史记录？此操作不可撤销。`)) return;
    try {
      const items = await searchHistory({ query: '', maxResults: 10000, startTime, endTime });
      const urls = items.map(r => r.url);
      if (urls.length === 0) { alert(`${label}没有记录`); return; }
      await deleteUrls(urls);
      alert(`已清理 ${urls.length} 条记录`);
      loadAll();
    } catch {
      alert('清理失败，请重试');
    }
  }

  function handleCleanToday() {
    const now = Date.now();
    deleteRange(now - 86400000, now, '今天');
  }

  function handleCleanYesterday() {
    const now = Date.now();
    deleteRange(now - 2 * 86400000, now - 86400000, '昨天');
  }

  function handleCleanWeek() {
    const now = Date.now();
    deleteRange(now - 7 * 86400000, now, '本周');
  }

  function handleCleanAll() {
    if (!confirm('确定清理全部历史记录？此操作不可撤销。')) return;
    deleteRange(0, Date.now(), '全部');
  }

  function renderContent() {
    switch (activeView) {
      case 'list':
        return (
          <>
            <BatchActions
              selected={selected}
              results={results}
              onDeleted={loadAll}
              onClearSelection={() => setSelected(new Set())}
            />
            <HistoryList
              results={results}
              query={query}
              selected={selected}
              onToggle={url => {
                const next = new Set(selected);
                next.has(url) ? next.delete(url) : next.add(url);
                setSelected(next);
              }}
              onSelectAll={all => setSelected(all ? new Set(results.map(r => r.url)) : new Set())}
              sortBy={sortBy}
              onSortChange={setSortBy}
              status={status}
              onDeleted={loadAll}
            />
          </>
        );
      case 'domain':
        return <DomainGroup results={results} query={query} />;
      case 'time':
        return <TimeGroup results={results} query={query} />;
      case 'bookmarks':
        return <BookmarkList />;
      case 'manage':
        return (
          <div className="manage-view">
            <h3 className="manage-title">管理</h3>
            <div className="manage-section">
              <h4 className="manage-section-title">导出</h4>
              <div className="manage-actions">
                <button className="manage-btn" onClick={() => setShowExport(true)}>
                  导出历史记录（共 {results.length} 条）
                </button>
              </div>
            </div>
            <div className="manage-section">
              <h4 className="manage-section-title">清理</h4>
              <div className="manage-actions">
                <button className="manage-btn manage-btn-danger" onClick={handleCleanToday}>
                  清理今天的历史记录
                </button>
                <button className="manage-btn manage-btn-danger" onClick={handleCleanYesterday}>
                  清理昨天的历史记录
                </button>
                <button className="manage-btn manage-btn-danger" onClick={handleCleanWeek}>
                  清理本周的历史记录
                </button>
                <button className="manage-btn manage-btn-danger" onClick={handleCleanAll}>
                  清理全部历史记录
                </button>
              </div>
            </div>
            <ExportDialog
              open={showExport}
              onClose={() => setShowExport(false)}
              results={results}
            />
          </div>
        );
      case 'stats':
        return <StatsDashboard results={results} />;
      default:
        return null;
    }
  }

  const showSearch = activeView !== 'bookmarks' && activeView !== 'stats';

  return (
    <div className="management-layout">
      <Sidebar
        activeView={activeView}
        onViewChange={v => { setActiveView(v); setSelected(new Set()); }}
      />
      <div className="main-area">
        <div className="top-bar">
          {showSearch ? (
            <>
              <div className="top-bar-row">
                <div className="top-bar-search">
                  <span className="search-icon">&#128269;</span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="搜索标题或 URL..."
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                    className="top-search-input"
                  />
                </div>
                <SearchSuggest
                  focused={searchFocused && !query}
                  onSelect={handleSuggestionSelect}
                />
              </div>
              <FilterBar
                results={results}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />
            </>
          ) : (
            <div className="top-bar-view-title">
              {VIEWS[activeView]}
            </div>
          )}
        </div>
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
