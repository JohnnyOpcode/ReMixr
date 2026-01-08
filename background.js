// Background service worker for ReMixr extension

console.log('ReMixr background service worker started');

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ReMixr installed successfully');
    
    // Initialize storage
    chrome.storage.local.set({
      remixes: {},
      settings: {
        autoApply: true,
        showNotifications: true
      }
    });
    
    // Open welcome page (optional)
    // chrome.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    console.log('ReMixr updated');
  }
});

// Listen for tab updates to reapply remixes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // When page finishes loading, send message to content script
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.tabs.sendMessage(tabId, { action: 'applyRemix' }).catch(() => {
      // Ignore errors (content script might not be ready)
    });
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateAIRemix') {
    // In the future, this could call an actual AI API
    // For now, we'll delegate to the popup's logic
    sendResponse({ success: true, message: 'AI generation delegated to popup' });
  }
  return true;
});

// Handle extension icon click (already handled by popup.html)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
});
