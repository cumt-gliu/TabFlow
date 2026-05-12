import { useState, useMemo } from 'react';
import './FilterBar.css';

const DATE_PRESETS = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
  { value: 'thisWeek', label: '本周' },
  { value: 'thisMonth', label: '本月' },
  { value: 'custom', label: '自定义' },
];

const VISIT_OPTIONS = [
  { value: 0, label: '不限' },
  { value: 1, label: '≥ 1 次' },
  { value: 5, label: '≥ 5 次' },
  { value: 10, label: '≥ 10 次' },
  { value: 50, label: '≥ 50 次' },
];

export default function FilterBar({ results, onApply, onReset }) {
  const [expanded, setExpanded] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [domain, setDomain] = useState('');
  const [domainFocused, setDomainFocused] = useState(false);
  const [minVisits, setMinVisits] = useState(0);

  const domains = useMemo(() => {
    const set = new Set();
    results.forEach(r => {
      try { set.add(new URL(r.url).hostname); } catch { /* skip */ }
    });
    return [...set].sort();
  }, [results]);

  const dateError = datePreset === 'custom' && customStart && customEnd && customStart > customEnd;

  function handleApply() {
    let startTime, endTime;
    const now = Date.now();
    switch (datePreset) {
      case 'today': {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        startTime = todayStart.getTime(); endTime = now; break;
      }
      case 'yesterday': {
        const yStart = new Date(Date.now() - 86400000); yStart.setHours(0, 0, 0, 0);
        const yEnd = new Date(); yEnd.setHours(0, 0, 0, 0);
        startTime = yStart.getTime(); endTime = yEnd.getTime(); break;
      }
      case 'thisWeek': {
        const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startTime = weekStart.getTime(); endTime = now; break;
      }
      case 'thisMonth': {
        const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        startTime = monthStart.getTime(); endTime = now; break;
      }
      case 'custom': {
        if (dateError) return;
        if (customStart) startTime = new Date(customStart).getTime();
        if (customEnd) endTime = new Date(customEnd).getTime() + 86400000;
        break;
      }
    }

    onApply({
      startTime,
      endTime,
      domain: domain.trim() || null,
      minVisits: minVisits || null,
    });
  }

  function handleReset() {
    setDatePreset('all');
    setCustomStart('');
    setCustomEnd('');
    setDomain('');
    setMinVisits(0);
    onReset();
  }

  return (
    <div className="filter-bar">
      <button
        className="filter-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="filter-toggle-icon">{expanded ? '▼' : '▶'}</span>
        筛选
      </button>

      {expanded && (
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">日期</label>
              <div className="filter-presets">
                {DATE_PRESETS.map(p => (
                  <button
                    key={p.value}
                    className={`filter-chip ${datePreset === p.value ? 'active' : ''}`}
                    onClick={() => setDatePreset(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {datePreset === 'custom' && (
                <div className="filter-date-range">
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="filter-date-input"
                  />
                  <span className="filter-date-sep">至</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="filter-date-input"
                  />
                  {dateError && <span className="filter-date-error">开始日期不能晚于结束日期</span>}
                </div>
              )}
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">域名</label>
              <div className="filter-domain-wrapper">
                <input
                  type="text"
                  placeholder="输入域名过滤..."
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  onFocus={() => setDomainFocused(true)}
                  onBlur={() => setTimeout(() => setDomainFocused(false), 200)}
                  className="filter-domain-input"
                />
                {domainFocused && domains.length > 0 && (
                  <div className="filter-domain-suggest">
                    {domains
                      .filter(d => d.includes(domain.toLowerCase()))
                      .slice(0, 8)
                      .map(d => (
                        <div key={d} className="filter-domain-item" onClick={() => setDomain(d)}>
                          {d}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">访问次数</label>
              <select
                value={minVisits}
                onChange={e => setMinVisits(Number(e.target.value))}
                className="filter-select"
              >
                {VISIT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button className="filter-btn filter-btn-primary" onClick={handleApply} disabled={dateError}>
              应用筛选
            </button>
            <button className="filter-btn" onClick={handleReset}>
              重置
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
