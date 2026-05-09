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
