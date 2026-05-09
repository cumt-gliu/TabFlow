# TabFlow

Chrome 浏览历史高效管理与搜索扩展。基于 Manifest V3 构建，提供快速的浏览历史检索、分组浏览和批量管理能力。

## 功能

- **快速搜索** — 通过快捷键（`Ctrl+Shift+T` / `Cmd+Shift+T`）唤起搜索弹窗，实时搜索标题和 URL
- **历史记录管理** — 独立管理页面，支持全部列表、按域名分组、按时间分组三种视图
- **批量操作** — 批量删除选定记录、按域名/时间段一键清理
- **数据导出** — 将历史记录导出为 CSV 或 JSON 格式
- **键盘快捷键** — `Ctrl+Shift+T` 打开搜索弹窗，`Ctrl+Shift+L`（Mac: `Cmd+Shift+L`）打开管理页

## 截图

| Popup 搜索 | 管理页面 |
|---|---|
| ![Popup](screenshots/popup.png) | ![Management](screenshots/management.png) |

## 技术栈

| 层 | 技术 |
|---|---|
| UI 框架 | React 18 |
| 样式 | 纯 CSS |
| 构建工具 | Webpack 5 + Babel |
| 扩展模型 | Manifest V3 (Service Worker) |
| 存储 | chrome.storage.local |
| 数据源 | chrome.history API |

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化自动重新构建）
npm run dev

# 生产构建
npm run build
```

构建产物在 `dist/` 目录。

### 加载到 Chrome

1. **构建项目** — 运行 `npm run build`，确保 `dist/` 目录已生成
2. 打开 Chrome，地址栏输入 `chrome://extensions`
3. 开启右上角的 **"开发者模式"**
4. 点击左上角 **"加载已解压的扩展程序"**
5. 选择项目的 `dist/` 目录
6. 加载成功后，地址栏右侧会出现 TabFlow 图标，点击即可使用

> **提示：** 代码修改后需要重新 `npm run build`，然后在 `chrome://extensions` 中点击 TabFlow 卡片上的 ↻ 刷新按钮。

## 项目结构

```
tabflow/
├── src/
│   ├── popup/              # 快速搜索弹窗
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── SearchSuggestions.jsx
│   │   │   └── SearchResults.jsx
│   │   └── index.html
│   ├── management/         # 完整历史管理页面
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── HistoryList.jsx
│   │   │   ├── DomainGroup.jsx
│   │   │   ├── TimeGroup.jsx
│   │   │   ├── BatchActions.jsx
│   │   │   └── ExportDialog.jsx
│   │   └── index.html
│   ├── background/         # Service Worker
│   │   └── background.js
│   └── shared/             # 共享模块
│       ├── chromeApi.js    # Chrome API 封装
│       └── storage.js      # chrome.storage 封装
├── public/                 # 静态资源
├── manifest.json
├── webpack.config.js
└── babel.config.js
```

## 快捷键

| 快捷键 | 操作 |
|---|---|
| `Ctrl+Shift+T` / `Cmd+Shift+T` | 打开搜索弹窗 |
| `Ctrl+Shift+L` / `Cmd+Shift+L` | 打开历史管理页 |
| `Esc` | 关闭搜索弹窗 |

## 开发

### 脚本

```bash
npm run dev    # 开发模式，监听文件变更
npm run build  # 生产构建
```

## 权限说明

扩展使用以下 Chrome API 权限：

- `history` — 读取和操作浏览器历史记录
- `storage` — 缓存搜索记录和用户设置
- `tabs` — 从弹窗打开管理页面

所有数据直接来自 Chrome 原生历史引擎，扩展不自建数据库，不存储用户浏览记录。

## License

MIT
