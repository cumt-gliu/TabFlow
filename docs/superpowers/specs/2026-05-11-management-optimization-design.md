# TabFlow 历史管理页面优化设计

## 概述

在现有管理页面基础上增强功能：高级筛选、搜索历史/书签、统计洞察。采用方案 A——新增视图 + 筛选栏改造。

## 1. 侧边栏结构

新增"收藏"和"统计"两个视图入口：

```
全部历史 (list)
按域名 (domain)
按时间 (time)
收藏 (bookmarks)         ← 新增
────────────────
管理 (manage)
统计 (stats)             ← 新增
```

## 2. 高级筛选栏 (FilterBar)

位置：顶栏搜索框下方，点击搜索框右侧"筛选"按钮展开/收起。

筛选条件：
- **日期预设**：全部 / 今天 / 昨天 / 本周 / 本月 / 自定义（弹出日期范围选择器）
- **域名**：文本输入框，输入时自动补全已有结果中的域名
- **访问次数**：下拉选择 ≥1 / ≥5 / ≥10 / ≥50

数据流：
- FilterBar 内部维护筛选状态，点击"应用筛选"后回调到 App.jsx
- App.jsx 将筛选条件合并到 searchHistory 调用（startTime, endTime 参数）
- 重置时清除筛选条件，重新加载

状态覆盖：
- 收起态：筛选栏不显示，按钮显示"筛选"
- 展开态：显示所有筛选条件
- 自定义日期范围：校验开始日期 ≤ 结束日期
- 筛选条件改变未点"应用"：不影响当前结果

## 3. 搜索历史下拉 (SearchSuggest)

位置：搜索框获得焦点且有搜索历史时，下方弹出下拉列表。

交互：
- 点击搜索词 → 填充到搜索框并执行搜索
- 按时间倒序排列，最多 10 条
- 底部"清除搜索历史" → 清空存储，关闭下拉
- 失焦或 Esc → 关闭下拉

存储格式（chrome.storage.local）：
```json
{
  "search_history": ["react 路由", "webpack 配置", ...]
}
```

- 每次执行搜索时记录搜索词
- 去重：同一搜索词只保留最新一次
- 上限 20 条，超出移除最旧
- 与 Popup 弹窗共享 storage（同一 key `search_history`），即弹窗的最近搜索和管理页面互通

## 4. 收藏视图 (BookmarkList)

侧边栏新增"收藏"入口，独立页面视图。

布局：左侧分组列表 + 右侧收藏条目列表。
- 默认"全部"分组
- 用户可创建自定义分组
- 每条收藏可编辑标题、移动分组、删除

存储格式（chrome.storage.local）：
```json
{
  "bookmarks": [
    { "id": "1", "title": "GitHub", "url": "https://github.com", "group": "常用工具", "createdAt": 1234567890 }
  ],
  "bookmark_groups": ["常用工具", "学习资料", "社交"]
}
```

收藏入口：全部历史列表、域名视图、时间视图中，通过右键菜单或悬停按钮"收藏"。

状态覆盖：
- 无收藏：空态提示
- 无分组：全部在"全部"下
- 收藏后分组为空：不显示空分组

## 5. 统计视图 (StatsDashboard)

侧边栏新增"统计"入口。

统计内容：
- **总览卡片**：总记录数、今日记录数、日均访问量
- **浏览趋势**：按天聚合的柱状图（纯 CSS 实现，展示近 14 天）
- **Top 域名**：按域名分组统计，展示前 5 名及占比

数据来源：基于当前搜索结果（results 数组），底部标注来源范围。

Edge cases：
- results 为空：显示"暂无数据"
- 结果不足 14 天：按实际天数展示
- URL 解析失败：跳过不计

## 6. 新增/修改文件清单

```
src/management/
├── components/
│   ├── FilterBar.jsx           ← 新增
│   ├── FilterBar.css
│   ├── SearchSuggest.jsx       ← 新增
│   ├── SearchSuggest.css
│   ├── StatsDashboard.jsx      ← 新增
│   ├── StatsDashboard.css
│   ├── BookmarkList.jsx        ← 新增
│   ├── BookmarkList.css
├── App.jsx                     ← 修改：新增视图路由、筛选逻辑
├── App.css                     ← 修改：新增布局样式
src/shared/
│   └── storage.js              ← 修改：新增 bookmarks、search_history 存取
src/popup/
│   └── components/
│       └── SearchBar.jsx       ← 修改：搜索历史与此共享 storage 接口
```

## 7. 测试要点

- FilterBar 各筛选项组合的正确性
- 搜索历史去重和上限
- 收藏的 CRUD
- 统计计算的正确性（空数据、满数据、边界值）
- 各组件状态覆盖（loading、empty、error）
