# Chrome Web Store Listing

---

## Short Description (132 characters max)

Fast browsing history search and management. Search, filter, organize, and export your Chrome history with an intuitive popup and full management dashboard.

---

## Detailed Description

### English

TabFlow is a fast, lightweight browsing history management extension for Chrome. It replaces Chrome's built-in history page with a more powerful, search-driven experience.

**Why TabFlow?**

Chrome's built-in history is basic — you have to navigate away from what you're doing, wait for pages to load, and scroll through endless lists. TabFlow puts history search right in a popup: open it, type, and instantly find what you need. For deeper management, the full dashboard gives you domain grouping, time-based views, bulk operations, and data export.

**Popup Search**

- Open the popup with a keyboard shortcut (Ctrl+Shift+T / Cmd+Shift+T) and start typing immediately — no extra clicks
- Real-time search across page titles and URLs as you type
- Shows recent searches when idle, letting you quickly revisit past queries
- Clean, focused interface that stays out of your way

**Management Dashboard**

- **Full history list** — Chronological view with search and filtering
- **Domain view** — History grouped by website domain for site-level browsing
- **Time view** — History organized by time periods (today, yesterday, this week, older)
- **Bookmarks view** — Quick access to your bookmarked sites within the management interface
- **Statistics dashboard** — Visual overview of your browsing patterns

**Bulk Operations**

- Select multiple records and delete them in one action
- Clean all history for a specific domain or time period
- Clear all history directly from the management page

**Data Export**

- Export selected or all history to CSV format for spreadsheet analysis
- Export to JSON format for programmatic use

**Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+T / Cmd+Shift+T | Open search popup |
| Ctrl+Shift+L / Cmd+Shift+L | Open management dashboard |
| Esc | Close popup |

**Privacy & Permissions**

TabFlow uses Chrome's native history API directly — no external servers, no data collection, no tracking. Your history stays on your device:
- `history` — Read and manage browsing history (core functionality)
- `storage` — Cache recent searches and preferences locally
- `tabs` — Open the management page when triggered by keyboard shortcut

The source code is open for review. Your privacy is built in, not bolted on.

---

### 中文

TabFlow 是一款快速、轻量的 Chrome 浏览历史管理扩展。它用更强大的搜索驱动体验，替代 Chrome 自带的浏览历史页面。

**为什么选择 TabFlow？**

Chrome 自带的历史页面功能基础——你需要离开当前页面、等待页面加载、在长长的列表中翻找。TabFlow 将历史搜索直接放在弹窗中：打开弹窗、输入关键词、立即找到你需要的内容。对于更深层的管理需求，完整的管理面板提供域名分组、时间视图、批量操作和数据导出功能。

**弹窗搜索**

- 使用快捷键（Ctrl+Shift+T / Cmd+Shift+T）打开弹窗，立即输入搜索——无需额外点击
- 实时搜索页面标题和 URL，输入即得结果
- 空闲时展示最近搜索记录，方便快速回溯
- 简洁专注的界面，不干扰你的工作流

**管理面板**

- **全部历史** — 按时间排序的完整历史列表，支持搜索和过滤
- **按域名** — 按网站域名分组浏览历史
- **按时间** — 按时间段分组（今天、昨天、本周、更早）
- **收藏** — 在管理界面中快速访问收藏网站
- **统计** — 浏览模式的可视化概览

**批量操作**

- 选择多条记录一键删除
- 按域名或时间段清理历史
- 从管理页面直接清空全部历史

**数据导出**

- 导出为 CSV 格式，可在电子表格中分析
- 导出为 JSON 格式，便于程序化处理

**快捷键**

| 快捷键 | 操作 |
|--------|------|
| Ctrl+Shift+T / Cmd+Shift+T | 打开搜索弹窗 |
| Ctrl+Shift+L / Cmd+Shift+L | 打开管理面板 |
| Esc | 关闭弹窗 |

**隐私与权限**

TabFlow 直接使用 Chrome 原生历史 API——无外部服务器、无数据收集、无追踪。你的历史数据只留在本地设备：
- `history` — 读取和管理浏览历史（核心功能）
- `storage` — 在本地缓存最近搜索和偏好设置
- `tabs` — 通过快捷键打开管理页面

代码完全开源，接受审查。隐私保护是内建特性，而非附加功能。

---

## Permission Justifications (for Chrome Web Store dashboard)

### history
TabFlow uses the `history` permission to read and manage Chrome browsing history. This is the core functionality of the extension — allowing users to search, filter, view, and delete their browsing history. All operations use Chrome's native `chrome.history` API and data never leaves the device.

### storage
TabFlow uses `storage` to cache recent search queries and user preferences locally via `chrome.storage.local`. This allows features like "recent searches" to work without requiring repeated API calls. No data is synced or transmitted.

### tabs
TabFlow uses the `tabs` permission solely to open the management dashboard page when the user triggers it via keyboard shortcut (Ctrl+Shift+L / Cmd+Shift+L) or from the popup. It does not read or modify tab content.

---

## Category

Productivity

---

## Language

English, Chinese (Simplified) / 英语, 简体中文
