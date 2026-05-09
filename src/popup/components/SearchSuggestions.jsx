import './SearchSuggestions.css';

export default function SearchSuggestions({ items, label, onSelect }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="suggestions">
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
    </div>
  );
}
