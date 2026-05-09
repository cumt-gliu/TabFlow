import './SearchBar.css';

export default function SearchBar({ value, onChange, onSearch }) {
  function handleKeyDown(e) {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  }

  return (
    <div className="search-bar">
      <span className="search-icon">&#128269;</span>
      <input
        type="text"
        className="search-input"
        placeholder="搜索标题或 URL..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    </div>
  );
}
