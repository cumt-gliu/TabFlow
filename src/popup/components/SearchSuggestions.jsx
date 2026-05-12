import './SearchSuggestions.css';

export default function SearchSuggestions({ items, label, onSelect }) {
  function handleViewAllHistory() {
    const url = chrome.runtime.getURL('management/index.html');
    chrome.tabs.create({ url });
  }

  return (
    <div className="suggestions">
      {items && items.length > 0 && (
        <>
          <div className="suggestions-label">{label}</div>
          {items.map((item, i) => (
            <div
              key={i}
              className="suggestion-item"
              onClick={() => onSelect(item)}
            >
              {item}
            </div>
          ))}
        </>
      )}
      <div className="suggestions-divider" />
      <div className="suggestion-item suggestion-all-history" onClick={handleViewAllHistory}>
        全部历史 →
      </div>
    </div>
  );
}
