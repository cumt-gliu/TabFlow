# TabFlow 输入即搜 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务执行。步骤使用 checkbox（`- [ ]`）语法跟踪进度。

**目标:** 简化 Popup 搜索流程，去掉建议下拉，输入时 debounce 后直接显示完整搜索结果。

**架构:** 删除 SuggestionsDropdown 组件和相关状态/逻辑，SearchBar 恢复为纯 input，App.jsx 状态机从"建议→结果"两阶段简化为"输入→直接搜索"单阶段。

**技术栈:** React 18, chrome.history API

---

## 文件改动清单

```
src/popup/
├── components/
│   ├── SuggestionsDropdown.jsx    # 删除
│   ├── SuggestionsDropdown.css    # 删除
│   └── SearchBar.jsx              # 简化：去掉 onKeyDown prop
└── App.jsx                        # 大幅简化：去掉所有建议/键盘导航逻辑
```

---

### Task 1: 删除 SuggestionsDropdown，简化 SearchBar

**Files:**
- Delete: `src/popup/components/SuggestionsDropdown.jsx`
- Delete: `src/popup/components/SuggestionsDropdown.css`
- Modify: `src/popup/components/SearchBar.jsx`

- [ ] **Step 1: 删除 SuggestionsDropdown 文件**

```bash
rm src/popup/components/SuggestionsDropdown.jsx src/popup/components/SuggestionsDropdown.css
```

- [ ] **Step 2: 简化 SearchBar**

替换 `src/popup/components/SearchBar.jsx` 为纯输入框：

```jsx
import './SearchBar.css';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <span className="search-icon">&#128269;</span>
      <input
        type="text"
        className="search-input"
        placeholder="搜索标题或 URL..."
        value={value}
        onChange={e => onChange(e.target.value)}
        autoFocus
      />
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git rm src/popup/components/SuggestionsDropdown.jsx src/popup/components/SuggestionsDropdown.css
git add src/popup/components/SearchBar.jsx
git commit -m "refactor: remove SuggestionsDropdown, simplify SearchBar"
```

---

### Task 2: 简化 App.jsx 状态机

**Files:**
- Modify: `src/popup/App.jsx`

- [ ] **Step 1: 替换 App.jsx**

替换为简化后的版本：

```jsx
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
          onSelect={handleInputChange}
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

**主要变化**:
- 移除 import: `SuggestionsDropdown`, `addRecentSearch`
- 移除 state: `suggestions`, `suggestionsStatus`, `activeIndex`, `activeIndexRef`
- 移除函数: `handleKeyDown`（键盘导航）, `handleSuggestionSelect`, `showSuggestions`
- `handleInputChange`: 输入变化 → 直接调 `searchHistory` 全量搜索（300ms debounce），不再查建议
- 不保存 `addRecentSearch` — 避免每次按键都污染最近搜索
- 最近搜索 `onSelect` → `handleInputChange`（复用一个路径）
- 渲染只剩两个分支: idle → SearchSuggestions / 其他 → SearchResults

- [ ] **Step 2: 验证构建**

```bash
npx webpack --mode production
```
Expected: 构建成功。

- [ ] **Step 3: 提交**

```bash
git add src/popup/App.jsx
git commit -m "feat: simplify popup search to input-triggered direct search"
```

---

### Task 3: 最终验证

- [ ] **Step 1: 确认构建成功**

```bash
npx webpack --mode production
```
Expected: 构建成功，无错误。

- [ ] **Step 2: 查看 git 状态确认无遗留**

```bash
git status
```
Expected: 只有 `.claude/settings.local.json` 的预存改动（与本功能无关）。

- [ ] **Step 3: 提交最终状态**

```bash
git add .
git commit -m "chore: final build after input-search simplification"
```
