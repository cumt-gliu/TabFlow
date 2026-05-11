import './SearchBar.css';

export default function SearchBar({ value, onChange, onKeyDown }) {
  return (
    <div className="search-bar">
      <span className="search-icon">&#128269;</span>
      <input
        type="text"
        className="search-input"
        placeholder="搜索标题或 URL..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
      />
    </div>
  );
}
