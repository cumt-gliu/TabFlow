import { useState } from 'react';
import './ExportDialog.css';

export default function ExportDialog({ open, onClose, results }) {
  const [format, setFormat] = useState('csv');

  if (!open) return null;

  function generateCSV() {
    const header = 'Title,URL,Visit Count,Last Visit Time\n';
    const rows = results.map(r => {
      const title = `"${(r.title || '').replace(/"/g, '""')}"`;
      const time = r.lastVisitTime ? new Date(r.lastVisitTime).toISOString() : '';
      return `${title},${r.url},${r.visitCount || 0},${time}`;
    }).join('\n');
    return header + rows;
  }

  function generateJSON() {
    return JSON.stringify(results.map(r => ({
      title: r.title,
      url: r.url,
      visitCount: r.visitCount,
      lastVisitTime: r.lastVisitTime,
    })), null, 2);
  }

  function handleDownload() {
    const content = format === 'csv' ? generateCSV() : generateJSON();
    const mime = format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabflow-history-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  return (
    <div className="ed-overlay" onClick={onClose}>
      <div className="ed-dialog" onClick={e => e.stopPropagation()}>
        <h3 className="ed-title">导出历史记录</h3>
        <div className="ed-count">共 {results.length} 条记录</div>
        <div className="ed-formats">
          <label className="ed-radio">
            <input type="radio" checked={format === 'csv'} onChange={() => setFormat('csv')} />
            CSV（兼容 Excel）
          </label>
          <label className="ed-radio">
            <input type="radio" checked={format === 'json'} onChange={() => setFormat('json')} />
            JSON
          </label>
        </div>
        <div className="ed-footer">
          <button className="ed-btn" onClick={onClose}>取消</button>
          <button className="ed-btn ed-btn-primary" onClick={handleDownload}>下载</button>
        </div>
      </div>
    </div>
  );
}
