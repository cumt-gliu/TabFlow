import './SuggestionsDropdown.css';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

export default function SuggestionsDropdown({
  query,
  suggestions,
  recentSearches,
  activeIndex,
  status,
  onSelect,
  onSearchAll,
}) {
  const recentCount = recentSearches.length;
  const suggestionCount = suggestions.length;
  const hasRecent = recentCount > 0;
  const hasResults = suggestionCount > 0;

  if (!hasRecent && !hasResults && status !== 'loading') {
    return (
      <div className="sd">
        <div className="sd-footer sd-footer-active" onClick={onSearchAll}>
          <span className="sd-search-all">搜索全部 &ldquo;{query}&rdquo; →</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sd">
      {hasRecent && (
        <>
          <div className="sd-section-label">最近搜索</div>
          {recentSearches.map((item, i) => (
            <div
              key={`rs-${i}`}
              className={`sd-item ${activeIndex === i ? 'sd-item-active' : ''}`}
              onClick={() => onSelect(item)}
            >
              <span className="sd-icon">🕐</span>
              <span className="sd-text">{item}</span>
            </div>
          ))}
        </>
      )}

      {hasResults && (
        <>
          {hasRecent && <div className="sd-divider" />}
          <div className="sd-section-label">历史记录</div>
          {suggestions.map((item, i) => {
            const idx = recentCount + i;
            let host = '';
            try { host = new URL(item.url).hostname; } catch {}
            return (
              <div
                key={item.id || item.url}
                className={`sd-item ${activeIndex === idx ? 'sd-item-active' : ''}`}
                onClick={() => onSelect(item)}
              >
                <span className="sd-icon">📄</span>
                <span className="sd-text">
                  <span className="sd-title">{item.title || item.url}</span>
                  <span className="sd-meta">{host} · {formatTime(item.lastVisitTime)}</span>
                </span>
              </div>
            );
          })}
        </>
      )}

      {status === 'loading' && !hasResults && (
        <div className="sd-loading">搜索中...</div>
      )}
      {status === 'loading' && hasResults && (
        <div className="sd-loading-inline">
          <span className="sd-dot" />
          <span className="sd-dot" />
          <span className="sd-dot" />
        </div>
      )}

      {(hasRecent || hasResults) && <div className="sd-divider" />}
      <div
        className={`sd-footer ${activeIndex === recentCount + suggestionCount ? 'sd-footer-active' : ''}`}
        onClick={onSearchAll}
      >
        <span className="sd-search-all">搜索全部 &ldquo;{query}&rdquo; →</span>
      </div>
    </div>
  );
}
