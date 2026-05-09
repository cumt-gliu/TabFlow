const KEYS = {
  RECENT_SEARCHES: 'recentSearches',
  SETTINGS: 'settings',
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
