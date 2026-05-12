import { useState, useEffect, useRef } from 'react';
import { getRecentSearches, clearRecentSearches } from '../../shared/storage';
import './SearchSuggest.css';

export default function SearchSuggest({ onSelect, focused }) {
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (focused) {
      getRecentSearches().then(setItems);
    }
  }, [focused]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        // handled by parent via focused prop
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!focused || items.length === 0) return null;

  return (
    <div className="search-suggest" ref={ref}>
      <div className="search-suggest-header">最近搜索</div>
      {items.slice(0, 10).map((item, i) => (
        <div
          key={`${item}-${i}`}
          className="search-suggest-item"
          onClick={() => onSelect(item)}
        >
          <span className="search-suggest-icon">&#128337;</span>
          <span className="search-suggest-text">{item}</span>
        </div>
      ))}
      <div
        className="search-suggest-clear"
        onClick={async () => {
          await clearRecentSearches();
          setItems([]);
        }}
      >
        清除搜索历史
      </div>
    </div>
  );
}
