// Content script that runs on all pages
// This script automatically applies saved remixes when pages load

console.log('ReMixr content script loaded');

// Apply saved remixes for this page
async function applySavedRemixes() {
  try {
    const currentUrl = window.location.href;
    
    // Get saved remixes from storage
    chrome.storage.local.get('remixes', (data) => {
      const remixes = data.remixes || {};
      const pageRemixes = remixes[currentUrl] || [];
      
      if (pageRemixes.length > 0) {
        console.log(`ReMixr: Applying ${pageRemixes.length} saved remix(es)`);
        
        // Remove any existing remix styles
        const existingStyle = document.getElementById('remixr-style');
        if (existingStyle) {
          existingStyle.remove();
        }
        
        // Combine all remix CSS with basic validation
        const combinedCSS = pageRemixes
          .map(remix => remix.script.css)
          .filter(css => typeof css === 'string' && css.trim().length > 0)
          .join('\n');
        
        // Create and inject style element
        if (combinedCSS.length > 0) {
          const style = document.createElement('style');
          style.id = 'remixr-style';
          style.textContent = combinedCSS;
          document.head.appendChild(style);
        }
      }
    });
  } catch (error) {
    console.error('ReMixr error:', error);
  }
}

// Apply remixes when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applySavedRemixes);
} else {
  applySavedRemixes();
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'applyRemix') {
    applySavedRemixes();
    sendResponse({ success: true });
    return true; // Keep message channel open for async response
  }
});
