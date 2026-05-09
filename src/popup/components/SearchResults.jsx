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
