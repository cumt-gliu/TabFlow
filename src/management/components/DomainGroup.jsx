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
