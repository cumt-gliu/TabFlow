import { useState } from 'react';
import { deleteUrls, deleteAllByDomain } from '../../shared/chromeApi';
import './BatchActions.css';

export default function BatchActions({ selected, results, onDeleted, onClearSelection }) {
  const [busy, setBusy] = useState(false);

  if (selected.size === 0) return null;

  async function handleDeleteSelected() {
    if (!confirm(`确定删除选中的 ${selected.size} 条记录？`)) return;
    setBusy(true);
    try {
      await deleteUrls([...selected]);
      onDeleted();
      onClearSelection();
    } catch (e) {
      alert('删除失败，请重试');
    }
    setBusy(false);
  }

  function getDomains() {
    const domains = new Set();
    for (const item of results) {
      if (selected.has(item.url)) {
        try { domains.add(new URL(item.url).hostname); } catch {}
      }
    }
    return [...domains];
  }

  return (
    <div className="ba-bar">
      <span className="ba-count">已选 {selected.size} 条</span>
      <button className="ba-btn ba-btn-danger" onClick={handleDeleteSelected} disabled={busy}>
        {busy ? '删除中...' : '删除选中'}
      </button>
      {getDomains().map(d => (
        <button
          key={d}
          className="ba-btn"
          onClick={async () => {
            if (!confirm(`确定删除 ${d} 的所有记录？`)) return;
            setBusy(true);
            await deleteAllByDomain(d);
            onDeleted();
            onClearSelection();
            setBusy(false);
          }}
          disabled={busy}
        >
          清理 {d}
        </button>
      ))}
    </div>
  );
}
