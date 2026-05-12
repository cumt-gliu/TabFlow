import { useMemo } from 'react';
import './StatsDashboard.css';

export default function StatsDashboard({ results }) {
  const stats = useMemo(() => {
    if (!results || results.length === 0) return null;

    const total = results.length;
    const now = Date.now();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayCount = results.filter(r => r.lastVisitTime >= todayStart.getTime()).length;

    const dateMap = {};
    const domainMap = {};

    results.forEach(r => {
      if (r.lastVisitTime) {
        const d = new Date(r.lastVisitTime);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dateMap[key] = (dateMap[key] || 0) + 1;
      }
      try {
        const host = new URL(r.url).hostname;
        domainMap[host] = (domainMap[host] || 0) + 1;
      } catch { /* skip */ }
    });

    const sortedDays = Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b));
    const recentDays = sortedDays.slice(-14);

    const maxDayCount = Math.max(...recentDays.map(([, c]) => c), 1);

    const validDays = Object.keys(dateMap).length;
    const avgDaily = validDays > 0 ? Math.round(total / validDays) : total;

    const topDomains = Object.entries(domainMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count, pct: Math.round((count / total) * 100) }));

    return { total, todayCount, avgDaily, recentDays, maxDayCount, topDomains, totalDays: validDays };
  }, [results]);

  if (!stats) {
    return (
      <div className="stats-empty">
        <p>暂无数据</p>
        <p className="stats-empty-hint">请先搜索或加载历史记录</p>
      </div>
    );
  }

  const sourceRange = results.length > 0 ? (() => {
    const times = results.map(r => r.lastVisitTime).filter(Boolean).sort();
    if (times.length === 0) return '';
    const start = new Date(times[0]).toLocaleDateString();
    const end = new Date(times[times.length - 1]).toLocaleDateString();
    return `${start} ~ ${end}`;
  })() : '';

  return (
    <div className="stats-dashboard">
      <h3 className="stats-title">统计</h3>

      <div className="stats-cards">
        <div className="stats-card">
          <div className="stats-card-value">{stats.total}</div>
          <div className="stats-card-label">总记录数</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.todayCount}</div>
          <div className="stats-card-label">今日记录</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.avgDaily}</div>
          <div className="stats-card-label">日均访问</div>
        </div>
      </div>

      <div className="stats-section">
        <h4 className="stats-section-title">浏览趋势（近 14 天）</h4>
        <div className="stats-chart">
          {stats.recentDays.length === 0 ? (
            <div className="stats-chart-empty">暂无趋势数据</div>
          ) : (
            stats.recentDays.map(([date, count]) => {
              const pct = (count / stats.maxDayCount) * 100;
              const label = date.slice(5);
              return (
                <div key={date} className="stats-chart-col">
                  <div className="stats-chart-bar-wrapper">
                    <div
                      className="stats-chart-bar"
                      style={{ height: `${pct}%` }}
                      title={`${label}: ${count} 条`}
                    />
                  </div>
                  <div className="stats-chart-label">{label}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="stats-section">
        <h4 className="stats-section-title">Top 域名</h4>
        {stats.topDomains.length === 0 ? (
          <div className="stats-empty-small">暂无域名数据</div>
        ) : (
          <div className="stats-domain-list">
            {stats.topDomains.map(({ domain, count, pct }) => (
              <div key={domain} className="stats-domain-row">
                <div className="stats-domain-info">
                  <span className="stats-domain-name">{domain}</span>
                  <span className="stats-domain-count">{count} 次</span>
                </div>
                <div className="stats-domain-bar-wrapper">
                  <div className="stats-domain-bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="stats-domain-pct">{pct}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {sourceRange && (
        <div className="stats-source">
          数据来源：当前搜索结果（{sourceRange}）
        </div>
      )}
    </div>
  );
}
