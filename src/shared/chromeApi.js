function sendMessage(type, payload) {
  return chrome.runtime.sendMessage({ type, payload });
}

export function searchHistory({ query, maxResults = 100, startTime, endTime } = {}) {
  return sendMessage('SEARCH_HISTORY', { query, maxResults, startTime, endTime });
}

export function deleteUrls(urls) {
  return sendMessage('DELETE_URLS', { urls });
}

export function deleteAllByDomain(domain) {
  return sendMessage('DELETE_ALL_BY_DOMAIN', { domain });
}

export function getAllHistory(options = {}) {
  return searchHistory({ query: '', ...options });
}
