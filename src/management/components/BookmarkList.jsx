import { useState, useEffect } from 'react';
import {
  getBookmarks,
  addBookmark,
  updateBookmark,
  deleteBookmark,
  getBookmarkGroups,
  addBookmarkGroup,
  renameBookmarkGroup,
  deleteBookmarkGroup,
} from '../../shared/storage';
import './BookmarkList.css';

export default function BookmarkList() {
  const [bookmarks, setBookmarks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [renamingGroup, setRenamingGroup] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [b, g] = await Promise.all([getBookmarks(), getBookmarkGroups()]);
    setBookmarks(b);
    setGroups(g);
  }

  const filtered = activeGroup
    ? bookmarks.filter(b => b.group === activeGroup)
    : bookmarks;

  async function handleDelete(id) {
    await deleteBookmark(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }

  function startEdit(b) {
    setEditingId(b.id);
    setEditTitle(b.title);
  }

  async function saveEdit(id) {
    await updateBookmark(id, { title: editTitle.trim() || '未命名' });
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, title: editTitle.trim() || '未命名' } : b));
    setEditingId(null);
  }

  async function handleMove(id, group) {
    await updateBookmark(id, { group });
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, group } : b));
  }

  async function handleAddGroup() {
    if (!newGroupName.trim()) return;
    const updated = await addBookmarkGroup(newGroupName.trim());
    setGroups(updated);
    setNewGroupName('');
  }

  async function handleRenameGroup(oldName) {
    if (!renameValue.trim() || renameValue === oldName) {
      setRenamingGroup(null);
      return;
    }
    await renameBookmarkGroup(oldName, renameValue.trim());
    setGroups(prev => prev.map(g => g === oldName ? renameValue.trim() : g));
    setBookmarks(prev => prev.map(b => b.group === oldName ? { ...b, group: renameValue.trim() } : b));
    if (activeGroup === oldName) setActiveGroup(renameValue.trim());
    setRenamingGroup(null);
  }

  async function handleDeleteGroup(name) {
    if (!confirm(`确定删除分组"${name}"？分组内的收藏将移入"全部"。`)) return;
    await deleteBookmarkGroup(name);
    setGroups(prev => prev.filter(g => g !== name));
    setBookmarks(prev => prev.map(b => b.group === name ? { ...b, group: '' } : b));
    if (activeGroup === name) setActiveGroup('');
  }

  const groupedBookmarks = activeGroup ? null : (() => {
    const map = {};
    bookmarks.forEach(b => {
      const g = b.group || '未分组';
      if (!map[g]) map[g] = [];
      map[g].push(b);
    });
    return map;
  })();

  return (
    <div className="bookmark-list">
      <div className="bookmark-groups-panel">
        <h3 className="bookmark-groups-title">分组</h3>
        <div
          className={`bookmark-group-item ${activeGroup === '' ? 'active' : ''}`}
          onClick={() => setActiveGroup('')}
        >
          全部 ({bookmarks.length})
        </div>
        {groups.map(g => {
          const count = bookmarks.filter(b => b.group === g).length;
          if (renamingGroup === g) {
            return (
              <div key={g} className="bookmark-group-rename">
                <input
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameGroup(g); if (e.key === 'Escape') setRenamingGroup(null); }}
                  autoFocus
                  className="bookmark-rename-input"
                />
              </div>
            );
          }
          return (
            <div key={g} className="bookmark-group-row">
              <div
                className={`bookmark-group-item ${activeGroup === g ? 'active' : ''}`}
                onClick={() => setActiveGroup(g)}
              >
                {g} ({count})
              </div>
              <div className="bookmark-group-actions">
                <button className="bookmark-group-btn" onClick={() => { setRenamingGroup(g); setRenameValue(g); }} title="重命名">✎</button>
                <button className="bookmark-group-btn" onClick={() => handleDeleteGroup(g)} title="删除">✕</button>
              </div>
            </div>
          );
        })}
        <div className="bookmark-add-group">
          <input
            placeholder="新分组名..."
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddGroup(); }}
            className="bookmark-add-group-input"
          />
          <button className="bookmark-add-group-btn" onClick={handleAddGroup}>+</button>
        </div>
      </div>
      <div className="bookmark-items-panel">
        {bookmarks.length === 0 ? (
          <div className="bookmark-empty">
            <p>暂无收藏</p>
            <p className="bookmark-empty-hint">在历史列表中点击"收藏"按钮添加</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bookmark-empty">
            <p>该分组暂无收藏</p>
          </div>
        ) : activeGroup ? (
          filtered.map(b => (
            <BookmarkCard
              key={b.id}
              bookmark={b}
              groups={groups}
              editing={editingId === b.id}
              editTitle={editTitle}
              onStartEdit={startEdit}
              onSaveEdit={saveEdit}
              onEditTitleChange={setEditTitle}
              onDelete={handleDelete}
              onMove={handleMove}
            />
          ))
        ) : (
          Object.entries(groupedBookmarks).map(([g, items]) => (
            <div key={g} className="bookmark-section">
              {items.length > 0 && <h4 className="bookmark-section-title">{g}</h4>}
              {items.map(b => (
                <BookmarkCard
                  key={b.id}
                  bookmark={b}
                  groups={groups}
                  editing={editingId === b.id}
                  editTitle={editTitle}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onEditTitleChange={setEditTitle}
                  onDelete={handleDelete}
                  onMove={handleMove}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BookmarkCard({ bookmark: b, groups, editing, editTitle, onStartEdit, onSaveEdit, onEditTitleChange, onDelete, onMove }) {
  return (
    <div className="bookmark-card">
      <div className="bookmark-card-main">
        {editing ? (
          <input
            value={editTitle}
            onChange={e => onEditTitleChange(e.target.value)}
            onBlur={() => onSaveEdit(b.id)}
            onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(b.id); if (e.key === 'Escape') onSaveEdit(b.id); }}
            autoFocus
            className="bookmark-edit-input"
          />
        ) : (
          <a
            className="bookmark-card-title"
            href={b.url}
            title={b.url}
            target="_blank"
            rel="noopener noreferrer"
            onDoubleClick={() => onStartEdit(b)}
          >
            {b.title}
          </a>
        )}
        <span className="bookmark-card-url">{b.url}</span>
      </div>
      <div className="bookmark-card-actions">
        <select
          value={b.group || ''}
          onChange={e => onMove(b.id, e.target.value)}
          className="bookmark-move-select"
        >
          <option value="">未分组</option>
          {groups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <button className="bookmark-card-btn" onClick={() => onStartEdit(b)} title="编辑标题">✎</button>
        <button className="bookmark-card-btn bookmark-card-btn-danger" onClick={() => onDelete(b.id)} title="删除">✕</button>
      </div>
    </div>
  );
}
