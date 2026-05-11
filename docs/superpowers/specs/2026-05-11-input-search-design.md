# TabFlow 输入即搜 设计文档

## 概述

简化 Popup 搜索流程，去掉刚实现的建议下拉中间层，改为输入时直接触发完整搜索。清空输入则回到最近搜索。

## 当前问题

刚实现的搜索体验有两个阶段：先看建议下拉 → 按 Enter 才出完整结果。用户期望输入时直接看到完整结果，减少一次按键操作。

## 搜索流程

```
[空闲] 最近搜索列表
  │ 输入关键词 (debounce 300ms)
  ↓
[搜索中] → [结果] / [空] / [错误]
  │ 继续输入 (debounce 300ms 重新触发)
  ↓
[搜索中] → [结果] / [空] / [错误]
  │ 清空输入
  ↓
回到 [空闲] 最近搜索列表
```

## 改动文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/popup/components/SuggestionsDropdown.jsx` | 删除 | 不再需要 |
| `src/popup/components/SuggestionsDropdown.css` | 删除 | 不再需要 |
| `src/popup/components/SearchBar.jsx` | 恢复 | 恢复为 onChange + onSearch 模式 |
| `src/popup/App.jsx` | 简化 | 移除所有建议/键盘导航相关逻辑 |

## 组件状态

### App.jsx 状态裁减

**移除**:
- `suggestions` state
- `suggestionsStatus` state
- `activeIndex` / `activeIndexRef` state
- `handleKeyDown` 键盘导航函数
- `handleSuggestionSelect` 函数
- `SuggestionsDropdown` 渲染
- `showSuggestions` 变量

**简化**:
- `handleInputChange`: 清除 debounce → 空输入回 idle → 非空 300ms 后直接 `searchHistory({ query: value })`，结果写入 `results`，`status` 切换到 loading/results/empty/error
- `handleSearch`: 保留作为"最近搜索"点击时的入口
- 渲染: `idle && !query` → SearchSuggestions；其余状态 → SearchResults

### SearchBar 恢复

去掉 `onKeyDown` prop，恢复为 `onChange` + `onSearch` 模式（Enter 搜索）。

## 边界状态

| 场景 | 表现 |
|------|------|
| 无输入 | 最近搜索列表 (SearchSuggestions) |
| 输入中等待 debounce | 显示上次结果（如果有）+ 简短加载指示 |
| 搜索结果为空 | "未找到匹配记录" |
| API 错误 | "搜索失败，请重试" |
| 清空输入 | 回到最近搜索 |
