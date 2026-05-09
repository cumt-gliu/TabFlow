import './Sidebar.css';

const VIEW_CONFIG = [
  { key: 'list', label: '全部历史', icon: '📋' },
  { key: 'domain', label: '按域名', icon: '📁' },
  { key: 'time', label: '按时间', icon: '📅' },
  { key: 'manage', label: '管理', icon: '🗑️', divider: true },
];

export default function Sidebar({ activeView, onViewChange }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">TabFlow</span>
      </div>
      <nav className="sidebar-nav">
        {VIEW_CONFIG.map(item => (
          <div key={item.key}>
            {item.divider && <div className="sidebar-divider" />}
            <div
              className={`sidebar-item ${activeView === item.key ? 'active' : ''}`}
              onClick={() => onViewChange(item.key)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
