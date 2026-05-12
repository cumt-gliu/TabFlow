const KEYS = {
  RECENT_SEARCHES: 'recentSearches',
  SETTINGS: 'settings',
  BOOKMARKS: 'bookmarks',
  BOOKMARK_GROUPS: 'bookmark_groups',
};

export async function getRecentSearches() {
  const { recentSearches } = await chrome.storage.local.get(KEYS.RECENT_SEARCHES);
  return recentSearches || [];
}

export async function addRecentSearch(query) {
  const searches = await getRecentSearches();
  const updated = [query, ...searches.filter(s => s !== query)].slice(0, 20);
  await chrome.storage.local.set({ [KEYS.RECENT_SEARCHES]: updated });
  return updated;
}

export async function clearRecentSearches() {
  await chrome.storage.local.remove(KEYS.RECENT_SEARCHES);
}

export async function getSettings() {
  const { settings } = await chrome.storage.local.get(KEYS.SETTINGS);
  return settings || { maxResults: 50, defaultView: 'list' };
}

export async function updateSettings(partial) {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await chrome.storage.local.set({ [KEYS.SETTINGS]: updated });
  return updated;
}

/** Bookmarks */
export async function getBookmarks() {
  const { [KEYS.BOOKMARKS]: data } = await chrome.storage.local.get(KEYS.BOOKMARKS);
  return data || [];
}

export async function addBookmark(item) {
  const list = await getBookmarks();
  const bookmark = { id: Date.now().toString(), ...item, createdAt: Date.now() };
  const updated = [...list, bookmark];
  await chrome.storage.local.set({ [KEYS.BOOKMARKS]: updated });
  return bookmark;
}

export async function updateBookmark(id, data) {
  const list = await getBookmarks();
  const updated = list.map(b => (b.id === id ? { ...b, ...data } : b));
  await chrome.storage.local.set({ [KEYS.BOOKMARKS]: updated });
}

export async function deleteBookmark(id) {
  const list = await getBookmarks();
  const updated = list.filter(b => b.id !== id);
  await chrome.storage.local.set({ [KEYS.BOOKMARKS]: updated });
}

export async function getBookmarkGroups() {
  const { [KEYS.BOOKMARK_GROUPS]: data } = await chrome.storage.local.get(KEYS.BOOKMARK_GROUPS);
  return data || [];
}

export async function addBookmarkGroup(name) {
  const list = await getBookmarkGroups();
  if (list.includes(name)) return list;
  const updated = [...list, name];
  await chrome.storage.local.set({ [KEYS.BOOKMARK_GROUPS]: updated });
  return updated;
}

export async function renameBookmarkGroup(oldName, newName) {
  const groups = await getBookmarkGroups();
  const updatedGroups = groups.map(g => (g === oldName ? newName : g));
  await chrome.storage.local.set({ [KEYS.BOOKMARK_GROUPS]: updatedGroups });
  const bookmarks = await getBookmarks();
  const updatedBookmarks = bookmarks.map(b =>
    b.group === oldName ? { ...b, group: newName } : b
  );
  await chrome.storage.local.set({ [KEYS.BOOKMARKS]: updatedBookmarks });
}

export async function deleteBookmarkGroup(name) {
  const groups = await getBookmarkGroups();
  const updated = groups.filter(g => g !== name);
  await chrome.storage.local.set({ [KEYS.BOOKMARK_GROUPS]: updated });
  const bookmarks = await getBookmarks();
  const updatedBookmarks = bookmarks.map(b =>
    b.group === name ? { ...b, group: '' } : b
  );
  await chrome.storage.local.set({ [KEYS.BOOKMARKS]: updatedBookmarks });
}
