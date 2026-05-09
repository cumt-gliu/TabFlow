chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-management') {
    chrome.tabs.create({ url: 'management/index.html' });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SEARCH_HISTORY':
      handleSearch(message.payload).then(sendResponse);
      return true;
    case 'DELETE_URLS':
      handleDeleteUrls(message.payload).then(sendResponse);
      return true;
    case 'DELETE_ALL_BY_DOMAIN':
      handleDeleteByDomain(message.payload).then(sendResponse);
      return true;
    default:
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

async function handleSearch({ query, maxResults, startTime, endTime }) {
  return new Promise((resolve, reject) => {
    chrome.history.search({ text: query, maxResults, startTime, endTime }, results => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(results);
      }
    });
  });
}

async function handleDeleteUrls({ urls }) {
  for (const url of urls) {
    await new Promise((resolve, reject) => {
      chrome.history.deleteUrl({ url }, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve();
      });
    });
  }
  return { deleted: urls.length };
}

async function handleDeleteByDomain({ domain }) {
  return new Promise((resolve, reject) => {
    chrome.history.search({ text: domain, maxResults: 10000 }, async (results) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      const domainUrls = results.filter(r => {
        try { return new URL(r.url).hostname === domain; }
        catch { return false; }
      });
      for (const item of domainUrls) {
        await new Promise(res => chrome.history.deleteUrl({ url: item.url }, res));
      }
      resolve({ deleted: domainUrls.length });
    });
  });
}
