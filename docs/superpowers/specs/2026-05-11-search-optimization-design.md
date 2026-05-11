# TabFlow 搜索体验优化 设计文档

## 概述

优化 TabFlow 的搜索体验，核心改进集中在两个场景：

1. **Popup 快速搜索**：支持输入时实时显示历史记录建议（地址栏风格），保留回车查看完整结果的流程
2. **管理页面搜索**：添加 debounce 避免每次按键触发 API 调用

## 搜索流程（Popup）

### 状态机

```
无输入 ──→ [空闲] 显示最近搜索
              │ 输入关键词
              ↓
[输入中] 显示实时建议下拉 (debounce 300ms)
  │                            │
  │ 点击建议                    │ 按 Enter (无选中)
  │ 或 Enter (有选中)           │
  ↓                            ↓
打开 URL                  [搜索结果] / [空] / [错误]
                              │ 修改关键词
                              ↓
                          回到 [输入中]
```

### 新/改组件

#### SuggestionsDropdown（新增）

**路径**: `src/popup/components/SuggestionsDropdown.jsx`

| Prop | 类型 | 说明 |
|------|------|------|
| `query` | string | 当前输入值 |
| `activeIndex` | number | 键盘选中项索引，-1 表示无选中 |
| `onSelect` | (url: string) => void | 选中建议项，打开 URL |
| `onSearchAll` | () => void | 触发完整搜索 |

**渲染结构**:

```
┌──────────────────────────────────┐
│ 最近搜索（最多 3 条）            │
│   item 1                         │
│   item 2                         │
├──────────────────────────────────┤
│ 历史记录（最多 5 条）            │
│ 📄 title – host                  │
│ 📄 title – host                  │
├──────────────────────────────────┤
│ 搜索全部 "xxx" →                 │
└──────────────────────────────────┘
```

**边界状态**:

| 场景 | 表现 |
|------|------|
| 无输入 | 不渲染（由 App.jsx 控制显示 SearchSuggestions） |
| loading | 保留上次结果，添加浅色加载指示 |
| 无匹配 | 只渲染 "搜索全部 xxx →" |
| API 错误 | 静默失败，不显示错误（已有 SearchResults 处理） |

#### SearchBar（改动）

- 新增 `onKeyDown` prop，将键盘事件 (↑ ↓ Enter) 冒泡给 App 层
- 不再自身处理 Enter 搜索，由 App 层决策（打开 URL vs 完整搜索）

#### App.jsx（改动）

新增状态:
- `suggestions: any[]` — 建议列表
- `suggestionsStatus: 'idle' \| 'loading' \| 'results'`
- `activeIndex: number` — 键盘导航索引
- `debounceRef = useRef(null)` — debounce timer

新增逻辑:

```
onInputChange:
  setQuery
  清除 debounce
  if 输入为空 → setStatus('idle'), 显示最近搜索
  else → 300ms 后 searchHistory({ query, maxResults: 5 })

onKeyDown (↑):
  if activeIndex === -1 → 选中最后一项 (搜索全部行)
  else → 上移一位

onKeyDown (↓):
  if activeIndex === lastIndex → 回到 -1 (无选中)
  else → 下移一位

onKeyDown (Enter):
  if activeIndex >= 0 → 打开 URL
  else → 触发完整搜索 handleSearch(query)
```

#### 管理页面 debounce（改动）

`src/management/App.jsx`: `handleSearch` 中添加 300ms debounce，避免每次按键触发 API。

## 键盘导航

| 按键 | 行为 |
|------|------|
| ↑ | 上移选中项，到顶后回到无选中 |
| ↓ | 下移选中项，到底后回到无选中 |
| Enter | 有选中项 → 打开 URL；无选中项 → 完整搜索 |
| Escape | 关闭 Popup（已有，不变） |

选中项索引计算: `[-1, 0, 1, ..., N-1, N]`，其中 N 为最后一行（"搜索全部"），-1 为无选中。

## 数据流

```
SearchBar keyboard events
    ↓ (冒泡)
App.jsx onKeyDown handler
    ↓
App.jsx 更新 activeIndex, 或触发 handleSearch/openUrl
    ↓
SuggestionsDropdown 接收 activeIndex, 渲染选中态高亮
```

建议数据流：
```
Input change
    ↓ (300ms debounce)
App.jsx 调用 searchHistory({ query, maxResults: 5 })
    ↓
chrome.runtime.sendMessage → Service Worker → chrome.history API
    ↓
App.jsx 更新 suggestions + suggestionsStatus
    ↓
SuggestionsDropdown 重新渲染
```

## 改动文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/popup/components/SearchBar.jsx` | 修改 | 新增 onKeyDown prop |
| `src/popup/components/SearchBar.css` | 无需改 | — |
| `src/popup/components/SuggestionsDropdown.jsx` | 新增 | 实时建议组件 |
| `src/popup/components/SuggestionsDropdown.css` | 新增 | 下拉浮层样式 |
| `src/popup/App.jsx` | 修改 | 搜索状态机扩展 |
| `src/popup/App.css` | 修改 | 新增下拉相关样式 |
| `src/management/App.jsx` | 修改 | 搜索 debounce |
