// ReMixr Extension Builder - Background Service Worker
// Manages extension builder state and operations

chrome.runtime.onInstalled.addListener(() => {
  console.log('ReMixr Extension Builder installed!');
  
  // Initialize storage if needed
  chrome.storage.local.get(['extensionProjects'], (result) => {
    if (!result.extensionProjects) {
      chrome.storage.local.set({ extensionProjects: [] });
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateExtension') {
    // Handle extension generation requests
    sendResponse({ success: true });
  }
  
  if (request.action === 'testExtension') {
    // Open extensions page for testing
    chrome.tabs.create({ url: 'chrome://extensions/' });
    sendResponse({ success: true });
  }
  
  return true;
});

// Helper to manage project storage
async function saveProject(project) {
  const { extensionProjects } = await chrome.storage.local.get(['extensionProjects']);
  const projects = extensionProjects || [];
  projects.push(project);
  await chrome.storage.local.set({ extensionProjects: projects });
}

async function loadProjects() {
  const { extensionProjects } = await chrome.storage.local.get(['extensionProjects']);
  return extensionProjects || [];
}
