# TabFlow 搜索体验优化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务执行。步骤使用 checkbox（`- [ ]`）语法跟踪进度。

**目标:** Popup 搜索增加实时建议下拉 + 键盘导航，管理页面搜索增加 debounce。

**架构:** Popup 状态机扩展，新增 SuggestionsDropdown 组件。输入变化 300ms debounce 后查询 chrome.history API 返回顶部 5 条匹配。键盘事件从 SearchBar 冒泡到 App.jsx 统一处理。管理页面在 input onChange 中加 debounce 包装。

**技术栈:** React 18, chrome.history API, chrome.runtime message passing

---

## 文件改动清单

```
src/popup/
├── App.jsx                           # 修改: 建议状态机 + debounce + 键盘导航
├── App.css                           # 修改: 下拉区域 z-index 等
├── components/
│   ├── SearchBar.jsx                 # 修改: onSearch → onKeyDown prop
│   ├── SuggestionsDropdown.jsx       # 新增: 实时建议下拉组件
│   └── SuggestionsDropdown.css       # 新增: 下拉浮层样式
src/management/
└── App.jsx                           # 修改: 搜索 input 加 300ms debounce
```

---

### Task 1: 创建 SuggestionsDropdown 组件

**Files:**
- Create: `src/popup/components/SuggestionsDropdown.jsx`
- Create: `src/popup/components/SuggestionsDropdown.css`

- [ ] **Step 1: 创建 SuggestionsDropdown.jsx**

```jsx
import './SuggestionsDropdown.css';

function formatTime(timestamp) {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

export default function SuggestionsDropdown({
  query,
  suggestions,
  recentSearches,
  activeIndex,
  status,
  onSelect,
  onSearchAll,
}) {
  const recentCount = recentSearches.length;
  const suggestionCount = suggestions.length;
  const hasRecent = recentCount > 0;
  const hasResults = suggestionCount > 0;

  if (!hasRecent && !hasResults && status !== 'loading') {
    return (
      <div className="sd">
        <div className="sd-footer sd-footer-active" onClick={onSearchAll}>
          <span className="sd-search-all">搜索全部 &ldquo;{query}&rdquo; →</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sd">
      {hasRecent && (
        <>
          <div className="sd-section-label">最近搜索</div>
          {recentSearches.map((item, i) => (
            <div
              key={`rs-${i}`}
              className={`sd-item ${activeIndex === i ? 'sd-item-active' : ''}`}
              onClick={() => onSelect(item)}
            >
              <span className="sd-icon">🕐</span>
              <span className="sd-text">{item}</span>
            </div>
          ))}
        </>
      )}

      {hasResults && (
        <>
          {hasRecent && <div className="sd-divider" />}
          <div className="sd-section-label">历史记录</div>
          {suggestions.map((item, i) => {
            const idx = recentCount + i;
            let host = '';
            try { host = new URL(item.url).hostname; } catch {}
            return (
              <div
                key={`sg-${i}`}
                className={`sd-item ${activeIndex === idx ? 'sd-item-active' : ''}`}
                onClick={() => onSelect(item)}
              >
                <span className="sd-icon">📄</span>
                <span className="sd-text">
                  <span className="sd-title">{item.title || item.url}</span>
                  <span className="sd-meta">{host} · {formatTime(item.lastVisitTime)}</span>
                </span>
              </div>
            );
          })}
        </>
      )}

      {status === 'loading' && !hasResults && (
        <div className="sd-loading">搜索中...</div>
      )}

      {(hasRecent || hasResults) && <div className="sd-divider" />}
      <div
        className={`sd-footer ${activeIndex === recentCount + suggestionCount ? 'sd-footer-active' : ''}`}
        onClick={onSearchAll}
      >
        <span className="sd-search-all">搜索全部 &ldquo;{query}&rdquo; →</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 SuggestionsDropdown.css**

```css
.sd {
  margin-top: 4px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

.sd-section-label {
  font-size: 11px;
  color: #999;
  padding: 6px 12px 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sd-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
}

.sd-item-active {
  background: #e8f0fe;
}

.sd-item:hover {
  background: #f5f5f5;
}

.sd-item-active:hover {
  background: #d2e3fc;
}

.sd-icon {
  flex-shrink: 0;
  font-size: 12px;
  width: 16px;
  text-align: center;
}

.sd-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.sd-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
}

.sd-meta {
  font-size: 11px;
  color: #999;
}

.sd-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}

.sd-loading {
  padding: 12px;
  text-align: center;
  color: #999;
  font-size: 12px;
}

.sd-footer {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
}

.sd-footer-active {
  background: #e8f0fe;
}

.sd-footer:hover {
  background: #f5f5f5;
}

.sd-search-all {
  color: #1a73e8;
  font-weight: 500;
}
```

- [ ] **Step 3: 验证构建**

Run: `npx webpack --mode production`
Expected: 构建成功，无错误。

- [ ] **Step 4: 提交**

```bash
git add src/popup/components/SuggestionsDropdown.jsx src/popup/components/SuggestionsDropdown.css
git commit -m "feat: add SuggestionsDropdown component for live search suggestions"
```

---

### Task 2: 改造 SearchBar 转发键盘事件

**Files:**
- Modify: `src/popup/components/SearchBar.jsx`（onSearch → onKeyDown）

- [ ] **Step 1: 替换 SearchBar prop**

将 `src/popup/components/SearchBar.jsx` 替换为：

```jsx
import './SearchBar.css';

export default function SearchBar({ value, onChange, onKeyDown }) {
  return (
    <div className="search-bar">
      <span className="search-icon">&#128269;</span>
      <input
        type="text"
        className="search-input"
        placeholder="搜索标题或 URL..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
      />
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/popup/components/SearchBar.jsx
git commit -m "refactor: replace onSearch prop with onKeyDown in SearchBar"
```

---

### Task 3: 扩展 App.jsx 状态机

**Files:**
- Modify: `src/popup/App.jsx`

- [ ] **Step 1: 更新 App.jsx**

替换为完整的新实现：

```jsx
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

  async function handleInputChange(value) {
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

    if (status !== 'idle') {
      setStatus('idle');
    }

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
      if (activeIndex >= 0 && activeIndex < recentSearches.length + suggestions.length) {
        const items = [...recentSearches, ...suggestions];
        const selected = items[activeIndex];
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
          recentSearches={recentSearches}
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
```

- [ ] **Step 2: 验证构建**

Run: `npx webpack --mode production`
Expected: 构建成功。

- [ ] **Step 3: 提交**

```bash
git add src/popup/App.jsx
git commit -m "feat: add suggestion state machine with debounce and keyboard navigation"
```

---

### Task 4: 管理页面搜索 debounce

**Files:**
- Modify: `src/management/App.jsx`

- [ ] **Step 1: 添加 useRef 导入**

在文件顶部修改 React 导入（line 1）:
```jsx
import { useState, useEffect, useRef } from 'react';
```

- [ ] **Step 2: 添加 debounce ref（其他 state 声明之后）**

```jsx
const searchDebounceRef = useRef(null);
```

- [ ] **Step 3: 添加带 debounce 的搜索处理函数**

将 `handleSearch` 函数替换为 debounce 版本。另外添加 `executeSearch` 作为内部立即执行函数，供初始 URL 参数加载使用：

```jsx
async function executeSearch(value) {
  if (!value.trim()) { loadAll(); return; }
  setStatus('loading');
  try {
    const res = await searchHistory({ query: value, maxResults: 200 });
    setResults(res);
    setStatus(res.length > 0 ? 'results' : 'empty');
  } catch {
    setStatus('error');
  }
}

function handleSearch(value) {
  setQuery(value);
  if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  searchDebounceRef.current = setTimeout(() => {
    executeSearch(value);
  }, 300);
}
```

- [ ] **Step 4: 更新 useEffect（初始 URL 参数使用立即搜索）**

将 useEffect 中的 `handleSearch(q)` 替换为 `executeSearch(q)`，同时添加 cleanup：

```jsx
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
```

Note: `executeSearch` 需要声明在 useEffect 之前，如果要在 useEffect 中调用。React 的函数提升（function declaration）保证 `executeSearch` 和 `loadAll` 在 useEffect 中可以访问。

确保 `executeSearch` 和 `loadAll` 在 `useEffect` 之前定义（通过 function hoisting 或调整位置）。

- [ ] **Step 5: 更新 search input 的 onChange 使用 handleSearch**

搜索输入框的 onChange 已经调用 `handleSearch(e.target.value)`，不需要改动。

- [ ] **Step 6: 验证构建**

Run: `npx webpack --mode production`
Expected: 构建成功。

- [ ] **Step 7: 提交**

```bash
git add src/management/App.jsx
git commit -m "perf: add 300ms debounce to management page search"
```

---

### Task 5: 最终验证

- [ ] **Step 1: 确认构建成功**

```bash
npx webpack --mode production
```
Expected: 构建成功，无错误。

- [ ] **Step 2: 提交最终构建**

```bash
git add .
git commit -m "chore: production build for search optimization"
```
