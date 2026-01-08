// Get current tab info
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Display current site information
async function displaySiteInfo() {
  const tab = await getCurrentTab();
  const siteNameElement = document.getElementById('siteName');
  
  try {
    const url = new URL(tab.url);
    siteNameElement.textContent = url.hostname;
  } catch (e) {
    siteNameElement.textContent = 'Unable to detect site';
  }
}

// Show status message
function showStatus(message, type = 'info') {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  
  setTimeout(() => {
    statusElement.textContent = '';
    statusElement.className = 'status';
  }, 3000);
}

// Generate AI remix
async function generateRemix(prompt) {
  showStatus('Generating AI remix...', 'info');
  
  try {
    // In a real implementation, this would call an AI API
    // For now, we'll simulate AI generation with predefined transformations
    const remixScript = generateRemixScript(prompt);
    
    const tab = await getCurrentTab();
    
    // Execute the remix script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: applyRemixScript,
      args: [remixScript]
    });
    
    // Save the remix
    await saveRemix(tab.url, prompt, remixScript);
    
    showStatus('Remix applied successfully!', 'success');
    await displayActiveRemixes();
  } catch (error) {
    console.error('Error generating remix:', error);
    showStatus('Error applying remix', 'error');
  }
}

// Generate remix script based on prompt (simulated AI)
function generateRemixScript(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Simple keyword-based generation (placeholder for real AI)
  if (lowerPrompt.includes('hide') && lowerPrompt.includes('ad')) {
    return {
      type: 'hideAds',
      css: `
        [class*="ad-"], [id*="ad-"], [class*="advertisement"],
        [id*="advertisement"], .sponsored, [data-ad="true"] {
          display: none !important;
        }
      `
    };
  } else if (lowerPrompt.includes('dark')) {
    return {
      type: 'darkMode',
      css: `
        body, html {
          filter: invert(1) hue-rotate(180deg);
          background: #1a1a1a !important;
        }
        img, video, [style*="background-image"] {
          filter: invert(1) hue-rotate(180deg);
        }
      `
    };
  } else if (lowerPrompt.includes('round') && lowerPrompt.includes('photo')) {
    return {
      type: 'roundPhotos',
      css: `
        img[alt*="photo"], img[alt*="profile"], .profile-photo,
        [class*="avatar"], [class*="profile-img"] {
          border-radius: 50% !important;
        }
      `
    };
  } else if (lowerPrompt.includes('minimal') || lowerPrompt.includes('clean')) {
    return {
      type: 'minimal',
      css: `
        [class*="sidebar"], [class*="side-panel"], aside,
        [class*="recommendation"], [class*="suggested"] {
          opacity: 0.3 !important;
        }
      `
    };
  } else {
    return {
      type: 'custom',
      css: `
        /* Custom remix based on: ${prompt} */
        body { border: 3px solid #667eea !important; }
      `
    };
  }
}

// Function to be injected into the page
function applyRemixScript(remixScript) {
  // Remove previous remix styles
  const previousStyle = document.getElementById('remixr-style');
  if (previousStyle) {
    previousStyle.remove();
  }
  
  // Apply new remix
  const style = document.createElement('style');
  style.id = 'remixr-style';
  style.textContent = remixScript.css;
  document.head.appendChild(style);
}

// Save remix to storage
async function saveRemix(url, prompt, script) {
  const { remixes = {} } = await chrome.storage.local.get('remixes');
  
  if (!remixes[url]) {
    remixes[url] = [];
  }
  
  remixes[url].push({
    prompt,
    script,
    timestamp: Date.now()
  });
  
  await chrome.storage.local.set({ remixes });
}

// Display active remixes
async function displayActiveRemixes() {
  const tab = await getCurrentTab();
  const { remixes = {} } = await chrome.storage.local.get('remixes');
  const activeRemixes = remixes[tab.url] || [];
  
  const listElement = document.getElementById('activeRemixesList');
  
  if (activeRemixes.length === 0) {
    listElement.innerHTML = '<p class="empty-state">No active remixes</p>';
    return;
  }
  
  listElement.innerHTML = activeRemixes.map((remix, index) => `
    <div class="remix-item">
      <span class="remix-item-name">${remix.prompt.substring(0, 40)}${remix.prompt.length > 40 ? '...' : ''}</span>
      <button class="remix-item-remove" data-index="${index}">Remove</button>
    </div>
  `).join('');
  
  // Add event listeners to remove buttons
  listElement.querySelectorAll('.remix-item-remove').forEach(button => {
    button.addEventListener('click', async (e) => {
      const index = parseInt(e.target.dataset.index);
      await removeRemix(tab.url, index);
    });
  });
}

// Remove a specific remix
async function removeRemix(url, index) {
  const { remixes = {} } = await chrome.storage.local.get('remixes');
  
  if (remixes[url]) {
    remixes[url].splice(index, 1);
    if (remixes[url].length === 0) {
      delete remixes[url];
    }
    await chrome.storage.local.set({ remixes });
    await displayActiveRemixes();
    
    // Reload the page to remove the remix
    const tab = await getCurrentTab();
    chrome.tabs.reload(tab.id);
  }
}

// Clear all remixes for current site
async function clearAllRemixes() {
  const tab = await getCurrentTab();
  const { remixes = {} } = await chrome.storage.local.get('remixes');
  
  delete remixes[tab.url];
  await chrome.storage.local.set({ remixes });
  await displayActiveRemixes();
  
  // Reload the page to remove all remixes
  chrome.tabs.reload(tab.id);
  showStatus('All remixes cleared', 'success');
}

// Apply preset remix
async function applyPreset(presetName) {
  let prompt = '';
  
  switch (presetName) {
    case 'linkedin-minimal':
      prompt = 'Make LinkedIn minimal by reducing sidebar opacity';
      break;
    case 'linkedin-focus':
      prompt = 'Hide ads and distractions on LinkedIn';
      break;
    case 'linkedin-dark':
      prompt = 'Apply dark mode to LinkedIn';
      break;
  }
  
  if (prompt) {
    await generateRemix(prompt);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
  await displaySiteInfo();
  await displayActiveRemixes();
  
  document.getElementById('generateRemix').addEventListener('click', async () => {
    const prompt = document.getElementById('remixPrompt').value.trim();
    if (!prompt) {
      showStatus('Please enter a remix prompt', 'error');
      return;
    }
    await generateRemix(prompt);
  });
  
  document.getElementById('clearAllRemixes').addEventListener('click', clearAllRemixes);
  
  document.querySelectorAll('.btn-preset').forEach(button => {
    button.addEventListener('click', async (e) => {
      const presetName = e.target.dataset.preset;
      await applyPreset(presetName);
    });
  });
});
