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
    return (
      <div className="hl-status error">
        加载失败
        <button className="retry-btn" onClick={() => window.location.reload()}>重试</button>
      </div>
    );
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
