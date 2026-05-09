# TabFlow Chrome Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension (Manifest V3) for browsing history management with quick search (popup) and full management page with domain/time grouping, batch operations, and export.

**Architecture:** Popup + standalone management page, both React 18 apps bundled by Webpack. Service Worker handles chrome.history API calls. No backend — all data comes from Chrome's native history API. Shared utility module for storage and API communication.

**Tech Stack:** React 18, Webpack 5, Babel, Manifest V3, chrome.history/storage/tabs APIs

---

## File Structure

```
tabflow/
├── manifest.json                     # Extension manifest (V3)
├── package.json                      # Dependencies: react, webpack, babel
├── webpack.config.js                 # Multi-entry: popup, management, background
├── babel.config.js                   # @babel/preset-env + @babel/preset-react
├── .gitignore                        # node_modules, dist
├── public/
│   └── icons/
│       ├── icon16.png                # Toolbar icon 16x16
│       ├── icon48.png                # Extension mgmt icon 48x48
│       └── icon128.png               # Installation icon 128x128
├── src/
│   ├── popup/
│   │   ├── index.html                # Popup HTML shell
│   │   ├── index.jsx                 # Popup React root
│   │   ├── App.jsx                   # Popup state machine
│   │   ├── App.css                   # Popup styles
│   │   └── components/
│   │       ├── SearchBar.jsx         # Search input + submit
│   │       ├── SearchBar.css
│   │       ├── SearchSuggestions.jsx  # Recent searches + live suggestions
│   │       ├── SearchSuggestions.css
│   │       ├── SearchResults.jsx      # Search result list
│   │       └── SearchResults.css
│   ├── management/
│   │   ├── index.html                # Management page HTML shell
│   │   ├── index.jsx                 # Management React root
│   │   ├── App.jsx                   # View router + search state
│   │   ├── App.css                   # Management page layout styles
│   │   └── components/
│   │       ├── Sidebar.jsx           # View switcher (all/domain/time/manage)
│   │       ├── Sidebar.css
│   │       ├── SearchBar.jsx         # Global search in management page
│   │       ├── SearchBar.css
│   │       ├── HistoryList.jsx       # Flat history list with sorting
│   │       ├── HistoryList.css
│   │       ├── DomainGroup.jsx       # Domain-grouped view
│   │       ├── DomainGroup.css
│   │       ├── TimeGroup.jsx         # Time-grouped view
│   │       ├── TimeGroup.css
│   │       ├── BatchActions.jsx      # Bulk delete/clean toolbar
│   │       ├── BatchActions.css
│   │       ├── ExportDialog.jsx      # CSV/JSON export modal
│   │       └── ExportDialog.css
│   ├── background/
│   │   └── background.js             # Service Worker: history/storage API handlers
│   └── shared/
│       ├── chromeApi.js              # Message-passing wrappers for Popup/Management
│       └── storage.js                # chrome.storage.local read/write helpers
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-05-09-tabflow-chrome-extension-design.md
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `webpack.config.js`
- Create: `babel.config.js`
- Create: `.gitignore`
- Create: `manifest.json`
- Create: `public/icons/icon16.png`, `icon48.png`, `icon128.png`
- Create: `src/popup/index.html`
- Create: `src/management/index.html`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "tabflow",
  "version": "1.0.0",
  "description": "Chrome extension for browsing history management",
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@babel/preset-env": "^7.24.0",
    "@babel/preset-react": "^7.23.3",
    "babel-loader": "^9.1.3",
    "copy-webpack-plugin": "^12.0.2",
    "css-loader": "^6.10.0",
    "html-webpack-plugin": "^5.6.0",
    "mini-css-extract-plugin": "^2.8.0",
    "webpack": "^5.90.0",
    "webpack-cli": "^5.1.4"
  }
}
```

- [ ] **Step 2: Create webpack.config.js**

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/popup/index.jsx',
    management: './src/management/index.jsx',
    background: './src/background/background.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['popup'],
      filename: 'popup/index.html',
      template: './src/popup/index.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['management'],
      filename: 'management/index.html',
      template: './src/management/index.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name]/[name].css',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '.' },
        { from: 'manifest.json', to: '.' },
      ],
    }),
  ],
};
```

- [ ] **Step 3: Create babel.config.js**

```javascript
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { chrome: '120' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.superpowers/
.DS_Store
*.log
npm-debug.log*
.env
.env.local
coverage/
Thumbs.db
.vscode/
.idea/
```

- [ ] **Step 5: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "TabFlow",
  "version": "1.0.0",
  "description": "Efficient browsing history management and search",
  "permissions": ["history", "storage", "tabs"],
  "action": {
    "default_popup": "popup/index.html",
    "default_title": "TabFlow"
  },
  "background": {
    "service_worker": "background/background.js"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 6: Create placeholder icon PNGs**

Run a Node.js script to generate simple solid-color placeholder icons:

```bash
node -e "
const fs = require('fs');
const path = require('path');
const dir = path.join('public', 'icons');
fs.mkdirSync(dir, { recursive: true });
// Create minimal valid 1x1 blue PNGs for each size
[16, 48, 128].forEach(size => {
  // Minimal PNG: 1x1 blue pixel
  const buf = Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG header
    0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52, // IHDR chunk
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // 1x1 pixel
    0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // 8-bit grayscale
    0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41, // IDAT chunk
    0x54,0x08,0xD7,0x63,0x60,0x60,0x60,0x00, // compressed data
    0x00,0x00,0x04,0x00,0x01,0x2F,0x53,0x2F, // ...
    0x36,0x00,0x00,0x00,0x00,0x49,0x45,0x4E, // IEND chunk
    0x44,0xAE,0x42,0x60,0x82
  ]);
  fs.writeFileSync(path.join(dir, 'icon' + size + '.png'), buf);
  console.log('Created icon' + size + '.png');
});
"
```

- [ ] **Step 7: Create HTML entry points**

`src/popup/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TabFlow</title>
  <style>
    body { width: 420px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

`src/management/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TabFlow - History Manager</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

- [ ] **Step 8: Install dependencies and verify build**

```bash
npm install
npx webpack --mode production
```

Expected: `dist/` folder created with `popup/index.html`, `popup/popup.js`, `management/index.html`, `management/management.js`, `background.js`, `manifest.json`, `icons/`.

---

### Task 2: Shared Layer — Service Worker + Utilities

**Files:**
- Create: `src/shared/storage.js`
- Create: `src/shared/chromeApi.js`
- Create: `src/background/background.js`

- [ ] **Step 1: Create storage.js**

```javascript
const KEYS = {
  RECENT_SEARCHES: 'recentSearches',
  SETTINGS: 'settings',
};

export async function getRecentSearches() {
  const { recentSearches } = await chrome.storage.local.get(KEYS.RECENT_SEARCHES);
  return recentSearches || [];
}

export async function addRecentSearch(query) {
  const searches = await getRecentSearches();
  const updated = [query, ...searches.filter(s => s !== query)].slice(0, 20);
  await chrome.storage.local.set({ [KEYS.RECENT_SEARCHES]: updated });
  return updated;
}

export async function clearRecentSearches() {
  await chrome.storage.local.remove(KEYS.RECENT_SEARCHES);
}

export async function getSettings() {
  const { settings } = await chrome.storage.local.get(KEYS.SETTINGS);
  return settings || { maxResults: 50, defaultView: 'list' };
}

export async function updateSettings(partial) {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await chrome.storage.local.set({ [KEYS.SETTINGS]: updated });
  return updated;
}
```

- [ ] **Step 2: Create chromeApi.js**

```javascript
function sendMessage(type, payload) {
  return chrome.runtime.sendMessage({ type, payload });
}

export function searchHistory({ query, maxResults = 100, startTime, endTime } = {}) {
  return sendMessage('SEARCH_HISTORY', { query, maxResults, startTime, endTime });
}

export function deleteUrls(urls) {
  return sendMessage('DELETE_URLS', { urls });
}

export function deleteAllByDomain(domain) {
  return sendMessage('DELETE_ALL_BY_DOMAIN', { domain });
}

export function getAllHistory(options = {}) {
  return searchHistory({ query: '', ...options });
}
```

- [ ] **Step 3: Create background.js**

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SEARCH_HISTORY':
      handleSearch(message.payload).then(sendResponse);
      return true;
    case 'DELETE_URLS':
      handleDeleteUrls(message.payload).then(sendResponse);
      return true;
    case 'DELETE_ALL_BY_DOMAIN':
      handleDeleteByDomain(message.payload).then(sendResponse);
      return true;
    default:
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

async function handleSearch({ query, maxResults, startTime, endTime }) {
  return new Promise(resolve => {
    chrome.history.search({ text: query, maxResults, startTime, endTime }, resolve);
  });
}

async function handleDeleteUrls({ urls }) {
  for (const url of urls) {
    await new Promise(resolve => chrome.history.deleteUrl({ url }, resolve));
  }
  return { deleted: urls.length };
}

async function handleDeleteByDomain({ domain }) {
  return new Promise(resolve => {
    chrome.history.search({ text: domain, maxResults: 10000 }, async (results) => {
      const domainUrls = results.filter(r => {
        try { return new URL(r.url).hostname === domain; }
        catch { return false; }
      });
      for (const item of domainUrls) {
        await new Promise(res => chrome.history.deleteUrl({ url: item.url }, res));
      }
      resolve({ deleted: domainUrls.length });
    });
  });
}
```

- [ ] **Step 4: Verify build**

```bash
npx webpack --mode production
```

Expected: Build succeeds. `dist/background.js` contains the bundled service worker.

---

### Task 3: Popup — Search Bar & App Shell

**Files:**
- Create: `src/popup/index.jsx`
- Create: `src/popup/App.jsx`
- Create: `src/popup/App.css`
- Create: `src/popup/components/SearchBar.jsx`
- Create: `src/popup/components/SearchBar.css`

- [ ] **Step 1: Create popup root**

`src/popup/index.jsx`:

```jsx
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(<App />);
```

- [ ] **Step 2: Create App shell (state machine skeleton)**

`src/popup/App.jsx`:

```jsx
import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import { getRecentSearches, addRecentSearch } from '../shared/storage';
import './App.css';

export default function App() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | results | empty | error
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    getRecentSearches().then(setRecentSearches);
  }, []);

  function handleInputChange(value) {
    setQuery(value);
    if (!value.trim()) setStatus('idle');
  }

  return (
    <div className="popup-container">
      <SearchBar
        value={query}
        onChange={handleInputChange}
      />
      {status === 'idle' && !query && (
        <div className="recent-searches">
          <div className="section-label">最近搜索</div>
          {recentSearches.map((s, i) => (
            <div key={i} className="recent-item">{s}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

`src/popup/App.css`:

```css
.popup-container {
  padding: 12px;
  font-size: 14px;
}

.section-label {
  font-size: 12px;
  color: #888;
  margin: 8px 0 4px;
  padding: 0 8px;
}

.recent-item {
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #333;
}

.recent-item:hover {
  background: #f0f0f0;
}
```

- [ ] **Step 3: Create SearchBar component**

`src/popup/components/SearchBar.jsx`:

```jsx
import './SearchBar.css';

export default function SearchBar({ value, onChange, onSearch }) {
  function handleKeyDown(e) {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  }

  return (
    <div className="search-bar">
      <span className="search-icon">&#128269;</span>
      <input
        type="text"
        className="search-input"
        placeholder="搜索标题或 URL..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    </div>
  );
}
```

`src/popup/components/SearchBar.css`:

```css
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
}

.search-bar:focus-within {
  border-color: #1a73e8;
  background: #fff;
}

.search-icon {
  font-size: 14px;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
}
```

- [ ] **Step 4: Verify build**

```bash
npx webpack --mode production && ls dist/popup/
```

Expected: `dist/popup/popup.js` and `dist/popup/index.html` exist. Load in Chrome as unpacked extension — click toolbar icon to see the popup with search bar.

---

### Task 4: Popup — Suggestions & Results

**Files:**
- Create: `src/popup/components/SearchSuggestions.jsx`
- Create: `src/popup/components/SearchSuggestions.css`
- Create: `src/popup/components/SearchResults.jsx`
- Create: `src/popup/components/SearchResults.css`
- Modify: `src/popup/App.jsx` (wire up suggestions + results)

- [ ] **Step 1: Create SearchSuggestions component**

`src/popup/components/SearchSuggestions.jsx`:

```jsx
import './SearchSuggestions.css';

export default function SearchSuggestions({ items, label, onSelect }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="suggestions">
      <div className="suggestions-label">{label}</div>
      {items.map((item, i) => (
        <div
          key={i}
          className="suggestion-item"
          onClick={() => onSelect(item)}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
```

`src/popup/components/SearchSuggestions.css`:

```css
.suggestions {
  margin-top: 8px;
}

.suggestions-label {
  font-size: 12px;
  color: #999;
  padding: 4px 8px;
}

.suggestion-item {
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #333;
  font-size: 13px;
}

.suggestion-item:hover {
  background: #e8f0fe;
}
```

- [ ] **Step 2: Create SearchResults component**

`src/popup/components/SearchResults.jsx`:

```jsx
import './SearchResults.css';

function formatTime(timestamp) {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

function highlight(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="highlight">{part}</mark>
      : part
  );
}

export default function SearchResults({ status, results, query, onViewAll, totalCount }) {
  if (status === 'loading') {
    return <div className="status-text">搜索中...</div>;
  }

  if (status === 'error') {
    return <div className="status-text error">搜索失败，请重试</div>;
  }

  if (status === 'empty') {
    return <div className="status-text">未找到匹配记录，试试其他关键词</div>;
  }

  return (
    <div className="results">
      {results.slice(0, 10).map((item, i) => (
        <div
          key={item.id || i}
          className="result-item"
          onClick={() => chrome.tabs.create({ url: item.url })}
        >
          <div className="result-title">{highlight(item.title || item.url, query)}</div>
          <div className="result-url">{highlight(item.url, query)}</div>
          <div className="result-meta">
            {item.visitCount || 0} 次访问 · {formatTime(item.lastVisitTime)}
          </div>
        </div>
      ))}
      {(totalCount > 10 || results.length > 10) && (
        <div className="view-all" onClick={onViewAll}>
          查看全部 {totalCount || results.length} 条结果 →
        </div>
      )}
    </div>
  );
}
```

`src/popup/components/SearchResults.css`:

```css
.results {
  margin-top: 8px;
}

.result-item {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.result-item:hover {
  background: #f8f9fa;
}

.result-title {
  font-weight: 500;
  color: #1a73e8;
  font-size: 13px;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-url {
  font-size: 12px;
  color: #006621;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-meta {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.highlight {
  background: #fff3cd;
  padding: 0 1px;
  border-radius: 2px;
}

.status-text {
  text-align: center;
  padding: 24px 8px;
  color: #999;
  font-size: 13px;
}

.status-text.error {
  color: #d93025;
}

.view-all {
  text-align: center;
  padding: 10px;
  color: #1a73e8;
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
}

.view-all:hover {
  background: #f0f0f0;
}
```

- [ ] **Step 3: Wire up App.jsx with all states**

Replace the content of `src/popup/App.jsx`:

```jsx
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
```

- [ ] **Step 4: Verify build**

```bash
npx webpack --mode production
```

Expected: Build succeeds. Load in Chrome — search bar works, empty state shows recent searches, enter triggers search and results appear.

---

### Task 5: Management Page — Shell & Sidebar

**Files:**
- Create: `src/management/index.jsx`
- Create: `src/management/App.jsx`
- Create: `src/management/App.css`
- Create: `src/management/components/Sidebar.jsx`
- Create: `src/management/components/Sidebar.css`

- [ ] **Step 1: Create management root**

`src/management/index.jsx`:

```jsx
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(<App />);
```

- [ ] **Step 2: Create management App shell**

`src/management/App.jsx`:

```jsx
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { searchHistory } from '../shared/chromeApi';
import { getSettings } from '../shared/storage';
import './App.css';

const VIEWS = {
  list: '全部历史',
  domain: '按域名',
  time: '按时间',
  manage: '管理',
};

export default function App() {
  const [activeView, setActiveView] = useState('list');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    getSettings().then(s => setActiveView(s.defaultView || 'list'));
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setQuery(q);
      handleSearch(q);
    } else {
      loadAll();
    }
  }, []);

  async function loadAll() {
    setStatus('loading');
    try {
      const res = await searchHistory({ query: '', maxResults: 200 });
      setResults(res);
      setStatus(res.length > 0 ? 'results' : 'empty');
    } catch {
      setStatus('error');
    }
  }

  async function handleSearch(value) {
    setQuery(value);
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

  function renderContent() {
    return <div className="content-placeholder">选择左侧视图</div>;
  }

  return (
    <div className="management-layout">
      <Sidebar
        activeView={activeView}
        onViewChange={v => { setActiveView(v); setSelected(new Set()); }}
      />
      <div className="main-area">
        <div className="top-bar">
          <div className="top-bar-search">
            <span className="search-icon">&#128269;</span>
            <input
              type="text"
              placeholder="搜索标题或 URL..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
              className="top-search-input"
            />
          </div>
        </div>
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
```

`src/management/App.css`:

```css
.management-layout {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  color: #333;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  padding: 12px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.top-bar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  background: white;
  max-width: 480px;
}

.top-bar-search:focus-within {
  border-color: #1a73e8;
}

.top-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
}

.search-icon {
  font-size: 14px;
  opacity: 0.5;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.content-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}
```

- [ ] **Step 3: Create Sidebar component**

`src/management/components/Sidebar.jsx`:

```jsx
import './Sidebar.css';

const VIEW_CONFIG = [
  { key: 'list', label: '全部历史', icon: '📋' },
  { key: 'domain', label: '按域名', icon: '📁' },
  { key: 'time', label: '按时间', icon: '📅' },
  { key: 'manage', label: '管理', icon: '🗑️', divider: true },
];

export default function Sidebar({ activeView, onViewChange }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">TabFlow</span>
      </div>
      <nav className="sidebar-nav">
        {VIEW_CONFIG.map(item => (
          <div key={item.key}>
            {item.divider && <div className="sidebar-divider" />}
            <div
              className={`sidebar-item ${activeView === item.key ? 'active' : ''}`}
              onClick={() => onViewChange(item.key)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
```

`src/management/components/Sidebar.css`:

```css
.sidebar {
  width: 180px;
  border-right: 1px solid #e0e0e0;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-logo {
  font-size: 18px;
  font-weight: 600;
  color: #1a73e8;
}

.sidebar-nav {
  padding: 8px;
  flex: 1;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.sidebar-item:hover {
  background: #e8f0fe;
}

.sidebar-item.active {
  background: #e8f0fe;
  color: #1a73e8;
  font-weight: 500;
}

.sidebar-icon {
  width: 20px;
  text-align: center;
}

.sidebar-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 8px 0;
}
```

- [ ] **Step 4: Verify build**

```bash
npx webpack --mode production
```

Expected: Build succeeds. Load in Chrome, navigate to `chrome-extension://<id>/management/index.html` — sidebar and search bar visible.

---

### Task 6: Management — History List View

**Files:**
- Create: `src/management/components/HistoryList.jsx`
- Create: `src/management/components/HistoryList.css`
- Modify: `src/management/App.jsx` (wire up list view)

- [ ] **Step 1: Create HistoryList component (with single-item action menu)**

`src/management/components/HistoryList.jsx`:

```jsx
import { useState } from 'react';
import { deleteUrls } from '../../shared/chromeApi';
import './HistoryList.css';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear
    ? `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function highlight(text, query) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="hl">{part}</mark>
      : part
  );
}

export default function HistoryList({ results, query, selected, onToggle, onSelectAll, sortBy, onSortChange, status, onDeleted }) {
  const [menuUrl, setMenuUrl] = useState(null);
  const allSelected = results.length > 0 && selected.size === results.length;

  if (status === 'loading') {
    return <div className="hl-status">加载中...</div>;
  }

  if (status === 'empty') {
    return <div className="hl-status">暂无历史记录，开始浏览网页吧</div>;
  }

  if (status === 'error') {
    return <div className="hl-status error">加载失败，请重试</div>;
  }

  const sorted = [...results].sort((a, b) => {
    if (sortBy === 'visitCount') return (b.visitCount || 0) - (a.visitCount || 0);
    return (b.lastVisitTime || 0) - (a.lastVisitTime || 0);
  });

  return (
    <div className="hl">
      <div className="hl-header">
        <label className="hl-check">
          <input type="checkbox" checked={allSelected} onChange={() => onSelectAll(!allSelected)} />
        </label>
        <span className="hl-count">共 {results.length} 条结果</span>
        <div className="hl-sort">
          <span
            className={`hl-sort-btn ${sortBy === 'lastVisitTime' ? 'active' : ''}`}
            onClick={() => onSortChange('lastVisitTime')}
          >
            按时间
          </span>
          <span
            className={`hl-sort-btn ${sortBy === 'visitCount' ? 'active' : ''}`}
            onClick={() => onSortChange('visitCount')}
          >
            按次数
          </span>
        </div>
      </div>
      {sorted.map(item => (
        <div key={item.id} className="hl-item">
          <label className="hl-check">
            <input
              type="checkbox"
              checked={selected.has(item.url)}
              onChange={() => onToggle(item.url)}
            />
          </label>
          <div className="hl-content" onClick={() => chrome.tabs.create({ url: item.url })}>
            <div className="hl-title">{highlight(item.title || item.url, query)}</div>
            <div className="hl-url">{highlight(item.url, query)}</div>
            <div className="hl-meta">
              {item.visitCount || 0} 次访问 · {formatTime(item.lastVisitTime)}
            </div>
          </div>
          <div className="hl-menu" onClick={e => { e.stopPropagation(); setMenuUrl(menuUrl === item.url ? null : item.url); }}>⋯</div>
          {menuUrl === item.url && (
            <div className="hl-dropdown">
              <div className="hl-dropdown-item" onClick={e => { e.stopPropagation(); chrome.tabs.create({ url: item.url }); setMenuUrl(null); }}>在新标签页打开</div>
              <div className="hl-dropdown-item" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(item.url); setMenuUrl(null); }}>复制 URL</div>
              <div className="hl-dropdown-item danger" onClick={e => { e.stopPropagation(); handleDelete(item.url); }}>删除</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
  
  async function handleDelete(url) {
    try {
      await deleteUrls([url]);
      onDeleted();
    } catch {
      alert('删除失败');
    }
    setMenuUrl(null);
  }
}
```

`src/management/components/HistoryList.css`:

```css
.hl-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: #999;
}

.hl-status.error {
  color: #d93025;
}

.hl-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 4px;
}

.hl-count {
  flex: 1;
  font-size: 13px;
  color: #666;
}

.hl-sort {
  display: flex;
  gap: 4px;
}

.hl-sort-btn {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  color: #666;
  border: 1px solid #ddd;
}

.hl-sort-btn.active {
  background: #e8f0fe;
  color: #1a73e8;
  border-color: #1a73e8;
}

.hl-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.hl-item:hover {
  background: #f8f9fa;
}

.hl-check {
  padding-top: 2px;
}

.hl-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.hl-title {
  font-weight: 500;
  color: #1a73e8;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hl-url {
  font-size: 12px;
  color: #006621;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hl-meta {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.hl-menu {
  padding: 4px 8px;
  cursor: pointer;
  color: #999;
  font-size: 16px;
  visibility: hidden;
}

.hl-item:hover .hl-menu {
  visibility: visible;
}

.hl-item {
  position: relative;
}

.hl-dropdown {
  position: absolute;
  right: 0;
  top: 28px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 10;
  min-width: 140px;
  overflow: hidden;
}

.hl-dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
}

.hl-dropdown-item:hover {
  background: #f5f5f5;
}

.hl-dropdown-item.danger {
  color: #d93025;
}

.hl {
  background: #fff;
}

.hl mark {
  background: #fff3cd;
  padding: 0 1px;
  border-radius: 2px;
}
```

- [ ] **Step 2: Wire up HistoryList in App.jsx**

Replace the `renderContent` function and add state management in `src/management/App.jsx`:

In the App component, add these state variables after existing `useState` calls:
```jsx
const [sortBy, setSortBy] = useState('lastVisitTime');
```

Replace `renderContent`:
```jsx
function renderContent() {
  if (activeView !== 'list') {
    return <div className="content-placeholder">选择左侧视图</div>;
  }
  return (
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
    />
  );
}
```

Add import:
```jsx
import HistoryList from './components/HistoryList';
```

- [ ] **Step 3: Verify build**

```bash
npx webpack --mode production
```

Expected: Build succeeds. "全部历史" view shows history list with checkbox, sorting, and highlighting.

---

### Task 7: Management — Domain & Time Group Views

**Files:**
- Create: `src/management/components/DomainGroup.jsx`
- Create: `src/management/components/DomainGroup.css`
- Create: `src/management/components/TimeGroup.jsx`
- Create: `src/management/components/TimeGroup.css`
- Modify: `src/management/App.jsx` (wire up views)

- [ ] **Step 1: Create DomainGroup component**

`src/management/components/DomainGroup.jsx`:

```jsx
import { useState } from 'react';
import './DomainGroup.css';

function groupByDomain(results) {
  const map = {};
  for (const item of results) {
    try {
      const host = new URL(item.url).hostname;
      if (!map[host]) map[host] = [];
      map[host].push(item);
    } catch { /* skip invalid URLs */ }
  }
  return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DomainGroup({ results, query }) {
  const [expanded, setExpanded] = useState(new Set());
  const groups = groupByDomain(results);

  if (groups.length === 0) {
    return <div className="dg-status">暂无数据</div>;
  }

  function toggle(domain) {
    const next = new Set(expanded);
    next.has(domain) ? next.delete(domain) : next.add(domain);
    setExpanded(next);
  }

  return (
    <div className="dg">
      {groups.map(([domain, items]) => (
        <div key={domain} className="dg-group">
          <div className="dg-header" onClick={() => toggle(domain)}>
            <span className="dg-arrow">{expanded.has(domain) ? '▼' : '▶'}</span>
            <span className="dg-domain">{domain}</span>
            <span className="dg-count">{items.length}</span>
          </div>
          {expanded.has(domain) && items.map((item, i) => (
            <div key={i} className="dg-item" onClick={() => chrome.tabs.create({ url: item.url })}>
              <div className="dg-title">{item.title || item.url}</div>
              <div className="dg-meta">{formatTime(item.lastVisitTime)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

`src/management/components/DomainGroup.css`:

```css
.dg-status {
  padding: 48px 16px;
  text-align: center;
  color: #999;
}

.dg-group {
  border-bottom: 1px solid #f0f0f0;
}

.dg-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  cursor: pointer;
  user-select: none;
}

.dg-header:hover {
  background: #f5f5f5;
}

.dg-arrow {
  font-size: 10px;
  color: #999;
  width: 12px;
}

.dg-domain {
  font-weight: 500;
  flex: 1;
}

.dg-count {
  color: #999;
  font-size: 13px;
}

.dg-item {
  display: flex;
  align-items: center;
  padding: 6px 8px 6px 32px;
  cursor: pointer;
  font-size: 13px;
}

.dg-item:hover {
  background: #f8f9fa;
}

.dg-title {
  flex: 1;
  color: #1a73e8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dg-meta {
  color: #999;
  font-size: 12px;
  margin-left: 12px;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Create TimeGroup component**

`src/management/components/TimeGroup.jsx`:

```jsx
import { useState } from 'react';
import './TimeGroup.css';

function groupByTime(results) {
  const now = Date.now();
  const DAY = 86400000;
  const groups = { today: [], yesterday: [], week: [], earlier: [] };

  for (const item of results) {
    const t = item.lastVisitTime || 0;
    if (t > now - DAY) groups.today.push(item);
    else if (t > now - 2 * DAY) groups.yesterday.push(item);
    else if (t > now - 7 * DAY) groups.week.push(item);
    else groups.earlier.push(item);
  }

  const labels = {
    today: '今天',
    yesterday: '昨天',
    week: '本周',
    earlier: '更早',
  };

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([key, items]) => ({ key, label: labels[key], items }));
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TimeGroup({ results, query }) {
  const [expanded, setExpanded] = useState(new Set(['today', 'yesterday']));
  const groups = groupByTime(results);

  if (groups.length === 0) {
    return <div className="tg-status">暂无数据</div>;
  }

  function toggle(key) {
    const next = new Set(expanded);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpanded(next);
  }

  return (
    <div className="tg">
      {groups.map(({ key, label, items }) => (
        <div key={key} className="tg-group">
          <div className="tg-header" onClick={() => toggle(key)}>
            <span className="tg-arrow">{expanded.has(key) ? '▼' : '▶'}</span>
            <span className="tg-label">{label}</span>
            <span className="tg-count">{items.length} 条</span>
          </div>
          {expanded.has(key) && items.map((item, i) => (
            <div key={i} className="tg-item" onClick={() => chrome.tabs.create({ url: item.url })}>
              <div className="tg-title">{item.title || item.url}</div>
              <div className="tg-time">{formatTime(item.lastVisitTime)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

`src/management/components/TimeGroup.css`:

```css
.tg-status {
  padding: 48px 16px;
  text-align: center;
  color: #999;
}

.tg-group {
  border-bottom: 1px solid #f0f0f0;
}

.tg-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  cursor: pointer;
  user-select: none;
  background: #fafafa;
}

.tg-header:hover {
  background: #f0f0f0;
}

.tg-arrow {
  font-size: 10px;
  color: #999;
  width: 12px;
}

.tg-label {
  font-weight: 500;
  flex: 1;
}

.tg-count {
  color: #999;
  font-size: 13px;
}

.tg-item {
  display: flex;
  align-items: center;
  padding: 6px 8px 6px 32px;
  cursor: pointer;
  font-size: 13px;
}

.tg-item:hover {
  background: #f8f9fa;
}

.tg-title {
  flex: 1;
  color: #1a73e8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tg-time {
  color: #999;
  font-size: 12px;
  margin-left: 12px;
  flex-shrink: 0;
}
```

- [ ] **Step 3: Wire up views in App.jsx**

Replace `renderContent` in `src/management/App.jsx`:

```jsx
function renderContent() {
  switch (activeView) {
    case 'list':
      return (
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
      );
    case 'domain':
      return <DomainGroup results={results} query={query} />;
    case 'time':
      return <TimeGroup results={results} query={query} />;
    case 'manage':
      return <div className="content-placeholder">管理功能（下一步实现）</div>;
    default:
      return null;
  }
}
```

Add `sortBy` state and imports:
```jsx
import HistoryList from './components/HistoryList';
import DomainGroup from './components/DomainGroup';
import TimeGroup from './components/TimeGroup';

// Add after other useState
const [sortBy, setSortBy] = useState('lastVisitTime');
```

- [ ] **Step 4: Verify build**

```bash
npx webpack --mode production
```

Expected: Build succeeds. Click domain/time views in sidebar — groups display with expand/collapse.

---

### Task 8: Management — Batch Operations & Export

**Files:**
- Create: `src/management/components/BatchActions.jsx`
- Create: `src/management/components/BatchActions.css`
- Create: `src/management/components/ExportDialog.jsx`
- Create: `src/management/components/ExportDialog.css`
- Modify: `src/management/App.jsx` (wire up batch + manage view)

- [ ] **Step 1: Create BatchActions component**

`src/management/components/BatchActions.jsx`:

```jsx
import { useState } from 'react';
import { deleteUrls, deleteAllByDomain } from '../../shared/chromeApi';
import './BatchActions.css';

export default function BatchActions({ selected, results, onDeleted, onClearSelection }) {
  const [busy, setBusy] = useState(false);

  if (selected.size === 0) return null;

  async function handleDeleteSelected() {
    if (!confirm(`确定删除选中的 ${selected.size} 条记录？`)) return;
    setBusy(true);
    try {
      await deleteUrls([...selected]);
      onDeleted();
      onClearSelection();
    } catch (e) {
      alert('删除失败，请重试');
    }
    setBusy(false);
  }

  function getDomains() {
    const domains = new Set();
    for (const item of results) {
      if (selected.has(item.url)) {
        try { domains.add(new URL(item.url).hostname); } catch {}
      }
    }
    return [...domains];
  }

  return (
    <div className="ba-bar">
      <span className="ba-count">已选 {selected.size} 条</span>
      <button className="ba-btn ba-btn-danger" onClick={handleDeleteSelected} disabled={busy}>
        {busy ? '删除中...' : '删除选中'}
      </button>
      {getDomains().map(d => (
        <button
          key={d}
          className="ba-btn"
          onClick={async () => {
            if (!confirm(`确定删除 ${d} 的所有记录？`)) return;
            setBusy(true);
            await deleteAllByDomain(d);
            onDeleted();
            onClearSelection();
            setBusy(false);
          }}
          disabled={busy}
        >
          清理 {d}
        </button>
      ))}
    </div>
  );
}
```

`src/management/components/BatchActions.css`:

```css
.ba-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #e8f0fe;
  border-radius: 8px;
  margin-bottom: 8px;
}

.ba-count {
  font-size: 13px;
  color: #1a73e8;
  font-weight: 500;
  margin-right: 4px;
}

.ba-btn {
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}

.ba-btn:hover {
  background: #f5f5f5;
}

.ba-btn-danger {
  color: #d93025;
  border-color: #d93025;
}

.ba-btn-danger:hover {
  background: #fce8e6;
}

.ba-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

- [ ] **Step 2: Create ExportDialog component**

`src/management/components/ExportDialog.jsx`:

```jsx
import { useState } from 'react';
import './ExportDialog.css';

export default function ExportDialog({ open, onClose, results }) {
  const [format, setFormat] = useState('csv');

  if (!open) return null;

  function generateCSV() {
    const header = 'Title,URL,Visit Count,Last Visit Time\n';
    const rows = results.map(r => {
      const title = `"${(r.title || '').replace(/"/g, '""')}"`;
      const time = r.lastVisitTime ? new Date(r.lastVisitTime).toISOString() : '';
      return `${title},${r.url},${r.visitCount || 0},${time}`;
    }).join('\n');
    return header + rows;
  }

  function generateJSON() {
    return JSON.stringify(results.map(r => ({
      title: r.title,
      url: r.url,
      visitCount: r.visitCount,
      lastVisitTime: r.lastVisitTime,
    })), null, 2);
  }

  function handleDownload() {
    const content = format === 'csv' ? generateCSV() : generateJSON();
    const mime = format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabflow-history-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  return (
    <div className="ed-overlay" onClick={onClose}>
      <div className="ed-dialog" onClick={e => e.stopPropagation()}>
        <h3 className="ed-title">导出历史记录</h3>
        <div className="ed-count">共 {results.length} 条记录</div>
        <div className="ed-formats">
          <label className="ed-radio">
            <input type="radio" checked={format === 'csv'} onChange={() => setFormat('csv')} />
            CSV（兼容 Excel）
          </label>
          <label className="ed-radio">
            <input type="radio" checked={format === 'json'} onChange={() => setFormat('json')} />
            JSON
          </label>
        </div>
        <div className="ed-footer">
          <button className="ed-btn" onClick={onClose}>取消</button>
          <button className="ed-btn ed-btn-primary" onClick={handleDownload}>下载</button>
        </div>
      </div>
    </div>
  );
}
```

`src/management/components/ExportDialog.css`:

```css
.ed-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.ed-dialog {
  background: white;
  padding: 24px;
  border-radius: 12px;
  min-width: 360px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
}

.ed-title {
  margin: 0 0 8px;
  font-size: 18px;
}

.ed-count {
  color: #666;
  font-size: 13px;
  margin-bottom: 16px;
}

.ed-formats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.ed-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.ed-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.ed-btn {
  padding: 8px 20px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.ed-btn-primary {
  background: #1a73e8;
  color: white;
  border-color: #1a73e8;
}

.ed-btn-primary:hover {
  background: #1557b0;
}
```

- [ ] **Step 3: Wire up batch operations and export in App.jsx**

Update `src/management/App.jsx` imports:
```jsx
import BatchActions from './components/BatchActions';
import ExportDialog from './components/ExportDialog';
import { searchHistory, deleteUrls } from '../shared/chromeApi';
```

Add state variables:
```jsx
const [showExport, setShowExport] = useState(false);
```

In `renderContent`, update the 'manage' case:
```jsx
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
```

Add state variable and handler functions to `src/management/App.jsx`:

```jsx
const [showExport, setShowExport] = useState(false);
```

Add handler functions inside the App component:
```jsx
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
```

Add CSS to `src/management/App.css`:
```css
.manage-view {
  padding: 16px 0;
}

.manage-title {
  margin: 0 0 16px;
  font-size: 18px;
}

.manage-section {
  margin-bottom: 24px;
}

.manage-section-title {
  margin: 0 0 8px;
  font-size: 15px;
  color: #555;
}

.manage-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.manage-btn {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  max-width: 360px;
}

.manage-btn:hover {
  background: #f5f5f5;
}

.manage-btn-danger {
  color: #d93025;
  border-color: #f5c6cb;
}

.manage-btn-danger:hover {
  background: #fce8e6;
}
```

Add the BatchActions component to the render, before the HistoryList in the 'list' case:
```jsx
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
      />
    </>
  );
```

- [ ] **Step 4: Verify build**

```bash
npx webpack --mode production
```

Expected: Build succeeds. Check all views work — list, domain, time, manage (export dialog shows).

---

### Task 9: Edge Cases & Polish

**Files:**
- Modify: `src/management/App.jsx` (error handling, keyboard shortcuts)
- Modify: `src/popup/App.jsx` (error boundaries, keyboard shortcuts)
- Modify: All components (verify all states handled)

- [ ] **Step 1: Add error handling wrapper for chrome.runtime.lastError**

Create `src/shared/errors.js`:

```javascript
export function wrapChromeCall(fn) {
  return new Promise((resolve, reject) => {
    fn((...args) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(...args);
      }
    });
  });
}
```

Update `src/background/background.js` to use:
```javascript
async function handleSearch({ query, maxResults, startTime, endTime }) {
  return new Promise((resolve, reject) => {
    chrome.history.search({ text: query, maxResults, startTime, endTime }, results => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(results);
      }
    });
  });
}
```

- [ ] **Step 2: Add retry button for error states**

Update error display in HistoryList — update the `status === 'error'` block in `src/management/components/HistoryList.jsx`:

```jsx
if (status === 'error') {
  return (
    <div className="hl-status error">
      加载失败
      <button className="retry-btn" onClick={() => window.location.reload()}>重试</button>
    </div>
  );
}
```

Add to `HistoryList.css`:
```css
.retry-btn {
  margin-left: 8px;
  padding: 4px 12px;
  border: 1px solid #d93025;
  border-radius: 4px;
  background: white;
  color: #d93025;
  cursor: pointer;
  font-size: 12px;
}
```

- [ ] **Step 3: Add popup keyboard shortcut (Escape to close)**

Update `src/popup/App.jsx` — add useEffect for keyboard listener:

```jsx
useEffect(() => {
  function handleKeyDown(e) {
    if (e.key === 'Escape') window.close();
  }
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

- [ ] **Step 4: Add loading state for management page initial load**

Update the `loadAll` function call in management `App.jsx` to set loading state before fetching:

```jsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    setQuery(q);
    handleSearch(q);
  } else {
    setStatus('loading');
    searchHistory({ query: '', maxResults: 200 })
      .then(res => { setResults(res); setStatus(res.length > 0 ? 'results' : 'empty'); })
      .catch(() => setStatus('error'));
  }
  getSettings().then(s => setActiveView(s.defaultView || 'list'));
}, []);
```

- [ ] **Step 5: Final build and verify**

```bash
npx webpack --mode production
```

Expected: All builds succeed. Load extension in Chrome via `chrome://extensions` > "Load unpacked" > select `dist/` folder.

Test checklist:
- [x] Click toolbar icon → popup opens
- [x] Type in search bar → results appear with highlighting
- [x] Click result → opens in new tab
- [x] Click "查看全部" → management page opens with query
- [x] Sidebar switches between list/domain/time views
- [x] Sorting (by time / by visit count) works
- [x] Domain view groups and expands/collapses
- [x] Time view groups by today/yesterday/week/earlier
- [x] Checkbox selection works
- [x] Batch delete removes selected items
- [x] Export CSV/JSON downloads file
- [x] Error states display correctly
- [x] Escape closes popup
