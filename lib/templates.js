const TEMPLATES = {
  'starter': {
    name: 'Starter Extension',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Starter Extension',
        version: '1.0.0',
        description: 'A basic starter extension',
        permissions: ['activeTab'],
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Starter Extension</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Starter Project</h1>
  <p>Modify this template to build your extension.</p>
  <button id="click-me">Click Me!</button>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `// Initial logic
document.getElementById('click-me').addEventListener('click', () => {
  alert('Hello from your new extension!');
});`,
      'styles.css': `body {
  width: 250px;
  padding: 15px;
  font-family: sans-serif;
  text-align: center;
}
button {
  padding: 8px 16px;
  cursor: pointer;
}`
    }
  },
  'content-modifier': {
    name: 'Content Modifier',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'My Content Modifier',
        version: '1.0.0',
        description: 'Modifies webpage content',
        permissions: ['activeTab', 'scripting'],
        content_scripts: [{
          matches: ['<all_urls>'],
          js: ['content.js'],
          run_at: 'document_idle'
        }],
        action: {
          default_popup: 'popup.html'
        }
      },
      'content.js': `// Content script - Runs on all pages
console.log('Content modifier loaded!');

// Example: Highlight all links
document.querySelectorAll('a').forEach(link => {
  link.style.backgroundColor = 'yellow';
});`,
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Content Modifier</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Content Modifier</h1>
  <p>Extension is active!</p>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `// Popup logic
console.log('Popup loaded!');`,
      'styles.css': `body {
  width: 300px;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  font-size: 18px;
  color: #333;
}`
    }
  },
  'productivity': {
    name: 'Productivity Timer',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Productivity Timer',
        version: '1.0.0',
        description: 'Track time spent on websites',
        permissions: ['storage', 'tabs'],
        background: {
          service_worker: 'background.js'
        },
        action: {
          default_popup: 'popup.html'
        }
      },
      'background.js': `// Background service worker
let activeTabId = null;
let startTime = null;

chrome.tabs.onActivated.addListener((activeInfo) => {
  saveTimeForCurrentTab();
  activeTabId = activeInfo.tabId;
  startTime = Date.now();
});

/**
 * Saves the time spent on the currently active tab to Chrome storage.
 * Updates the timeData object with accumulated time for the active tab.
 */
function saveTimeForCurrentTab() {
  if (activeTabId && startTime) {
    const timeSpent = Date.now() - startTime;
    chrome.storage.local.get(['timeData'], (result) => {
      const timeData = result.timeData || {};
      timeData[activeTabId] = (timeData[activeTabId] || 0) + timeSpent;
      chrome.storage.local.set({ timeData });
    });
  }
}`,
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Productivity Timer</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>⏱️ Time Tracker</h1>
  <div id="stats">Loading...</div>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `// Display time statistics
chrome.storage.local.get(['timeData'], (result) => {
  const stats = document.getElementById('stats');
  const timeData = result.timeData || {};
  
  if (Object.keys(timeData).length === 0) {
    stats.textContent = 'No data yet';
  } else {
    const totalTime = Object.values(timeData).reduce((a, b) => a + b, 0);
    const minutes = Math.floor(totalTime / 60000);
    stats.textContent = \`Total: \${minutes} minutes\`;
  }
});`,
      'styles.css': `body {
  width: 300px;
  padding: 20px;
  font-family: Arial, sans-serif;
}`
    }
  },
  'data-extractor': {
    name: 'Data Extractor',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Data Extractor',
        version: '1.0.0',
        description: 'Extract data from webpages',
        permissions: ['activeTab', 'scripting'],
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Data Extractor</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>📊 Data Extractor</h1>
  <button id="extract-links">Extract All Links</button>
  <button id="extract-images">Extract All Images</button>
  <div id="results"></div>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `document.getElementById('extract-links').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const links = Array.from(document.querySelectorAll('a'))
        .map(a => a.href)
        .filter(href => href);
      return links;
    }
  }, (results) => {
    displayResults(results[0].result);
  });
});

document.getElementById('extract-images').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const images = Array.from(document.querySelectorAll('img'))
        .map(img => img.src)
        .filter(src => src);
      return images;
    }
  }, (results) => {
    displayResults(results[0].result);
  });
});

function displayResults(data) {
  const resultsDiv = document.getElementById('results');
  if (!data || data.length === 0) {
      resultsDiv.innerHTML = '<div>No results found</div>';
      return;
  }
  resultsDiv.innerHTML = data.map(item => \`<div>\${item}</div>\`).join('');
}`,
      'styles.css': `body {
  width: 400px;
  padding: 20px;
  font-family: Arial, sans-serif;
}

button {
  width: 100%;
  padding: 10px;
  margin: 5px 0;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

#results {
  margin-top: 10px;
  max-height: 300px;
  overflow-y: auto;
  word-break: break-all;
}`
    }
  },
  'page-monitor': {
    name: 'Page Monitor',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Page Monitor',
        version: '1.0.0',
        description: 'Track changes on websites',
        permissions: ['activeTab', 'storage', 'notifications'],
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Page Monitor</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>👁️ Page Monitor</h1>
  <div class="status-box">
    <p id="monitor-status">Not monitoring</p>
  </div>
  <button id="save-snapshot">Save Snapshot</button>
  <button id="check-change">Check for Changes</button>
  <div id="result"></div>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `// Simple Page Monitor
document.getElementById('save-snapshot').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText.length
  }, (results) => {
    const length = results[0].result;
    chrome.storage.local.set({ [url]: length }, () => {
      document.getElementById('monitor-status').textContent = 'Snapshot saved! Size: ' + length;
    });
  });
});

document.getElementById('check-change').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;
  
  chrome.storage.local.get([url], (result) => {
    const savedLength = result[url];
    if (!savedLength) {
      document.getElementById('result').textContent = 'No snapshot found for this page.';
      return;
    }
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText.length
    }, (results) => {
      const currentLength = results[0].result;
      const diff = Math.abs(currentLength - savedLength);
      
      if (diff === 0) {
        document.getElementById('result').textContent = 'No changes detected.';
        document.getElementById('result').className = 'no-change';
      } else {
        document.getElementById('result').textContent = \`Changes detected! Size difference: \${diff} chars\`;
        document.getElementById('result').className = 'changed';
      }
    });
  });
});`,
      'styles.css': `body {
  width: 300px;
  padding: 20px;
  font-family: Arial, sans-serif;
}
.status-box {
  background: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}
button {
  width: 100%;
  padding: 10px;
  margin: 5px 0;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.changed { color: red; font-weight: bold; }
.no-change { color: green; }`
    }
  },
  'popup-tool': {
    name: 'Popup Toolbox',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Popup Toolbox',
        version: '1.0.0',
        description: 'Useful browser utilities',
        permissions: ['activeTab', 'scripting'],
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Toolbox</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>🔧 Toolbox</h1>
  <div class="tool-grid">
    <button id="dark-mode">Toggle Dark Mode</button>
    <button id="remove-images">Hide Images</button>
    <button id="outline">Outline Elements</button>
    <button id="edit-mode">Edit Text</button>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `// Toolbox Utilities
/**
 * Executes a function in the context of the active tab.
 * @param {Function} func - The function to execute in the tab context
 */
function execute(func) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: func
    });
  });
}

document.getElementById('dark-mode').addEventListener('click', () => {
  execute(() => {
    document.querySelector('html').style.filter = 
      document.querySelector('html').style.filter === 'invert(1) hue-rotate(180deg)' 
        ? '' 
        : 'invert(1) hue-rotate(180deg)';
  });
});

document.getElementById('remove-images').addEventListener('click', () => {
  execute(() => {
    document.querySelectorAll('img').forEach(img => {
      img.style.display = img.style.display === 'none' ? '' : 'none';
    });
  });
});

document.getElementById('outline').addEventListener('click', () => {
  execute(() => {
    document.querySelectorAll('*').forEach(el => {
      el.style.outline = '1px solid red';
    });
  });
});

document.getElementById('edit-mode').addEventListener('click', () => {
  execute(() => {
    document.body.contentEditable = 
      document.body.contentEditable === 'true' ? 'false' : 'true';
    alert('Edit mode: ' + document.body.contentEditable);
  });
});`,
      'styles.css': `body {
  width: 300px;
  padding: 15px;
  font-family: 'Segoe UI', sans-serif;
}
h1 { margin-top: 0; }
.tool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
button {
  padding: 15px 5px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
button:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}`
    }
  },
  'blank': {
    name: 'Blank Project',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'My Extension',
        version: '1.0.0',
        description: 'Description of my extension',
        permissions: ['activeTab'],
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>My Extension</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>My Extension</h1>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `// Your code here
console.log('Extension loaded!');`,
      'styles.css': `body {
  width: 300px;
  padding: 20px;
  font-family: Arial, sans-serif;
}`
    }
  },
  'tab-manager': {
    name: 'Tab Manager',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Tab Manager',
        version: '1.0.0',
        description: 'Organize and manage your browser tabs',
        permissions: ['tabs', 'storage'],
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Tab Manager</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>📑 Tab Manager</h1>
  <div class="actions">
    <button id="close-duplicates">Close Duplicates</button>
    <button id="group-by-domain">Group by Domain</button>
    <button id="save-session">Save Session</button>
  </div>
  <div id="tab-list"></div>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `// Tab Manager Logic
async function loadTabs() {
  const tabs = await chrome.tabs.query({});
  const tabList = document.getElementById('tab-list');
  
  tabList.innerHTML = tabs.map(tab => \`
    <div class="tab-item" data-id="\${tab.id}">
      <img src="\${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'}" width="16" height="16">
      <span>\${tab.title}</span>
      <button class="close-tab" data-id="\${tab.id}">×</button>
    </div>
  \`).join('');
  
  // Add close handlers
  document.querySelectorAll('.close-tab').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const tabId = parseInt(btn.dataset.id);
      await chrome.tabs.remove(tabId);
      loadTabs();
    });
  });
}

document.getElementById('close-duplicates').addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({});
  const urls = new Set();
  const toClose = [];
  
  tabs.forEach(tab => {
    if (urls.has(tab.url)) {
      toClose.push(tab.id);
    } else {
      urls.add(tab.url);
    }
  });
  
  if (toClose.length > 0) {
    await chrome.tabs.remove(toClose);
    loadTabs();
  }
});

document.getElementById('group-by-domain').addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({});
  const groups = {};
  
  tabs.forEach(tab => {
    const domain = new URL(tab.url).hostname;
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(tab);
  });
  
  console.log('Tab groups:', groups);
  alert('Check console for grouped tabs');
});

document.getElementById('save-session').addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({});
  const session = tabs.map(t => ({ url: t.url, title: t.title }));
  
  await chrome.storage.local.set({ 
    savedSession: session,
    savedAt: new Date().toISOString()
  });
  
  alert('Session saved!');
});

loadTabs();`,
      'styles.css': `body {
  width: 400px;
  max-height: 600px;
  padding: 15px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

h1 {
  font-size: 18px;
  margin: 0 0 15px 0;
}

.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
}

button {
  flex: 1;
  padding: 8px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

button:hover {
  background: #45a049;
}

#tab-list {
  max-height: 400px;
  overflow-y: auto;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.tab-item:hover {
  background: #f5f5f5;
}

.tab-item span {
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-tab {
  flex: none;
  width: 20px;
  height: 20px;
  padding: 0;
  background: #f44336;
  font-size: 16px;
  line-height: 1;
}`
    }
  },
  'bookmark-organizer': {
    name: 'Bookmark Organizer',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Bookmark Organizer',
        version: '1.0.0',
        description: 'Organize and search bookmarks efficiently',
        permissions: ['bookmarks', 'storage'],
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Bookmark Organizer</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>🔖 Bookmarks</h1>
  <input type="text" id="search" placeholder="Search bookmarks...">
  <div id="bookmark-list"></div>
  <button id="add-current">+ Add Current Page</button>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `// Bookmark Organizer
let allBookmarks = [];

async function loadBookmarks() {
  const tree = await chrome.bookmarks.getTree();
  allBookmarks = [];
  
  function traverse(nodes) {
    nodes.forEach(node => {
      if (node.url) {
        allBookmarks.push(node);
      }
      if (node.children) {
        traverse(node.children);
      }
    });
  }
  
  traverse(tree);
  displayBookmarks(allBookmarks);
}

function displayBookmarks(bookmarks) {
  const list = document.getElementById('bookmark-list');
  list.innerHTML = bookmarks.slice(0, 50).map(b => \`
    <div class="bookmark-item">
      <a href="\${b.url}" target="_blank">\${b.title || b.url}</a>
    </div>
  \`).join('');
}

document.getElementById('search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allBookmarks.filter(b => 
    (b.title && b.title.toLowerCase().includes(query)) ||
    (b.url && b.url.toLowerCase().includes(query))
  );
  displayBookmarks(filtered);
});

document.getElementById('add-current').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.bookmarks.create({
    title: tab.title,
    url: tab.url
  });
  alert('Bookmark added!');
  loadBookmarks();
});

loadBookmarks();`,
      'styles.css': `body {
  width: 400px;
  max-height: 500px;
  padding: 15px;
  font-family: Arial, sans-serif;
}

h1 {
  font-size: 18px;
  margin: 0 0 10px 0;
}

#search {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

#bookmark-list {
  max-height: 350px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.bookmark-item {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.bookmark-item a {
  color: #1a73e8;
  text-decoration: none;
  font-size: 13px;
}

.bookmark-item a:hover {
  text-decoration: underline;
}

#add-current {
  width: 100%;
  padding: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}`
    }
  },
  'form-filler': {
    name: 'Form Filler',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Smart Form Filler',
        version: '1.0.0',
        description: 'Auto-fill forms with saved data',
        permissions: ['activeTab', 'scripting', 'storage'],
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Form Filler</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>📝 Form Filler</h1>
  <div class="profile">
    <input type="text" id="name" placeholder="Full Name">
    <input type="email" id="email" placeholder="Email">
    <input type="tel" id="phone" placeholder="Phone">
    <button id="save-profile">Save Profile</button>
    <button id="fill-form">Fill Current Form</button>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `// Form Filler Logic
async function loadProfile() {
  const data = await chrome.storage.local.get(['profile']);
  if (data.profile) {
    document.getElementById('name').value = data.profile.name || '';
    document.getElementById('email').value = data.profile.email || '';
    document.getElementById('phone').value = data.profile.phone || '';
  }
}

document.getElementById('save-profile').addEventListener('click', async () => {
  const profile = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value
  };
  
  await chrome.storage.local.set({ profile });
  alert('Profile saved!');
});

document.getElementById('fill-form').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const data = await chrome.storage.local.get(['profile']);
  
  if (!data.profile) {
    alert('Please save a profile first');
    return;
  }
  
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (profile) => {
      // Fill name fields
      document.querySelectorAll('input[name*="name"], input[id*="name"]').forEach(input => {
        if (input.type === 'text') input.value = profile.name;
      });
      
      // Fill email fields
      document.querySelectorAll('input[type="email"], input[name*="email"]').forEach(input => {
        input.value = profile.email;
      });
      
      // Fill phone fields
      document.querySelectorAll('input[type="tel"], input[name*="phone"]').forEach(input => {
        input.value = profile.phone;
      });
    },
    args: [data.profile]
  });
  
  alert('Form filled!');
});

loadProfile();`,
      'styles.css': `body {
  width: 300px;
  padding: 15px;
  font-family: Arial, sans-serif;
}

h1 {
  font-size: 16px;
  margin: 0 0 15px 0;
}

.profile input {
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.profile button {
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.profile button:hover {
  background: #0b7dda;
}

#fill-form {
  background: #4CAF50;
}

#fill-form:hover {
  background: #45a049;
}`
    }
  },
  'dark-mode': {
    name: 'Universal Dark Mode',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Universal Dark Mode',
        version: '1.0.0',
        description: 'Apply dark mode to any website',
        permissions: ['activeTab', 'scripting'],
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Dark Mode</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>🌙 Dark Mode</h1>
  <button id="toggle-dark">Toggle Dark Mode</button>
  <div class="intensity">
    <label>Intensity:</label>
    <input type="range" id="intensity" min="0" max="100" value="100">
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `document.getElementById('toggle-dark').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const intensity = document.getElementById('intensity').value / 100;
  
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (intensity) => {
      const existingFilter = document.querySelector('#dark-mode-filter');
      
      if (existingFilter) {
        existingFilter.remove();
      } else {
        const style = document.createElement('style');
        style.id = 'dark-mode-filter';
        style.textContent = \`
          html {
            filter: invert(\${intensity}) hue-rotate(180deg) !important;
          }
          img, video, [style*="background-image"] {
            filter: invert(\${intensity}) hue-rotate(180deg) !important;
          }
        \`;
        document.head.appendChild(style);
      }
    },
    args: [intensity]
  });
});`,
      'styles.css': `body {
  width: 250px;
  padding: 15px;
  font-family: Arial, sans-serif;
  background: #1a1a1a;
  color: #fff;
}

h1 {
  font-size: 16px;
  margin: 0 0 15px 0;
}

button {
  width: 100%;
  padding: 12px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #4f46e5;
}

.intensity {
  margin-top: 15px;
}

.intensity label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
}

.intensity input {
  width: 100%;
}`
    }
  },
  'ad-blocker': {
    name: 'Simple Ad Blocker',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Simple Ad Blocker',
        version: '1.0.0',
        description: 'Block common ads and trackers',
        permissions: ['activeTab', 'scripting'],
        content_scripts: [{
          matches: ['<all_urls>'],
          js: ['content.js'],
          run_at: 'document_start'
        }],
        action: {
          default_popup: 'popup.html'
        }
      },
      'content.js': `// Ad Blocker Content Script
const adSelectors = [
  '[class*="ad-"]',
  '[id*="ad-"]',
  '[class*="advertisement"]',
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]',
  '[class*="sponsored"]',
  '[data-ad-slot]'
];

function blockAds() {
  adSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.style.display = 'none';
      el.remove();
    });
  });
}

// Run on load
blockAds();

// Run on DOM changes
const observer = new MutationObserver(blockAds);
observer.observe(document.body, { childList: true, subtree: true });`,
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Ad Blocker</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>🛡️ Ad Blocker</h1>
  <div class="status">
    <p>Blocking ads on this page</p>
    <div class="indicator active"></div>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `console.log('Ad Blocker active');`,
      'styles.css': `body {
  width: 250px;
  padding: 20px;
  font-family: Arial, sans-serif;
  text-align: center;
}

h1 {
  font-size: 18px;
  margin: 0 0 15px 0;
}

.status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ccc;
}

.indicator.active {
  background: #4CAF50;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}`
    }
  },
  'screenshot-tool': {
    name: 'Screenshot Tool',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Screenshot Tool',
        version: '1.0.0',
        description: 'Capture screenshots of web pages',
        permissions: ['activeTab', 'downloads'],
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Screenshot</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>📸 Screenshot</h1>
  <button id="capture-visible">Capture Visible Area</button>
  <button id="capture-full">Capture Full Page</button>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `document.getElementById('capture-visible').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'png'
  });
  
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = \`screenshot-\${Date.now()}.png\`;
  link.click();
});

document.getElementById('capture-full').addEventListener('click', () => {
  alert('Full page capture requires additional permissions. Use "Capture Visible Area" for now.');
});`,
      'styles.css': `body {
  width: 250px;
  padding: 15px;
  font-family: Arial, sans-serif;
}

h1 {
  font-size: 16px;
  margin: 0 0 15px 0;
}

button {
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0b7dda;
}`
    }
  },
  'password-generator': {
    name: 'Password Generator',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Password Generator',
        version: '1.0.0',
        description: 'Generate secure passwords',
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Password Generator</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>🔐 Password Generator</h1>
  <div class="options">
    <label><input type="checkbox" id="uppercase" checked> Uppercase</label>
    <label><input type="checkbox" id="lowercase" checked> Lowercase</label>
    <label><input type="checkbox" id="numbers" checked> Numbers</label>
    <label><input type="checkbox" id="symbols"> Symbols</label>
    <label>Length: <input type="number" id="length" value="16" min="8" max="64"></label>
  </div>
  <button id="generate">Generate Password</button>
  <div id="password" class="password"></div>
  <button id="copy" style="display:none;">Copy to Clipboard</button>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `function generatePassword() {
  const length = parseInt(document.getElementById('length').value);
  const useUpper = document.getElementById('uppercase').checked;
  const useLower = document.getElementById('lowercase').checked;
  const useNumbers = document.getElementById('numbers').checked;
  const useSymbols = document.getElementById('symbols').checked;
  
  let chars = '';
  if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (useNumbers) chars += '0123456789';
  if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (!chars) {
    alert('Select at least one character type');
    return;
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  document.getElementById('password').textContent = password;
  document.getElementById('copy').style.display = 'block';
}

document.getElementById('generate').addEventListener('click', generatePassword);

document.getElementById('copy').addEventListener('click', () => {
  const password = document.getElementById('password').textContent;
  navigator.clipboard.writeText(password);
  alert('Password copied to clipboard!');
});

generatePassword();`,
      'styles.css': `body {
  width: 300px;
  padding: 15px;
  font-family: Arial, sans-serif;
}

h1 {
  font-size: 16px;
  margin: 0 0 15px 0;
}

.options {
  margin-bottom: 15px;
}

.options label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
}

.options input[type="number"] {
  width: 60px;
  padding: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
}

button:hover {
  background: #45a049;
}

.password {
  padding: 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
  margin-bottom: 10px;
  min-height: 20px;
}

#copy {
  background: #2196F3;
}

#copy:hover {
  background: #0b7dda;
}`
    }
  },
  'note-taker': {
    name: 'Quick Notes',
    files: {
      'manifest.json': {
        manifest_version: 3,
        name: 'Quick Notes',
        version: '1.0.0',
        description: 'Take quick notes while browsing',
        permissions: ['storage'],
        action: {
          default_popup: 'popup.html'
        }
      },
      'popup.html': `<!DOCTYPE html>
<html>
<head>
  <title>Quick Notes</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>📝 Quick Notes</h1>
  <textarea id="notes" placeholder="Type your notes here..."></textarea>
  <div class="footer">
    <span id="char-count">0 characters</span>
    <button id="clear">Clear</button>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
      'popup.js': `const textarea = document.getElementById('notes');
const charCount = document.getElementById('char-count');

// Load saved notes
chrome.storage.local.get(['notes'], (result) => {
  if (result.notes) {
    textarea.value = result.notes;
    updateCharCount();
  }
});

// Auto-save on input
textarea.addEventListener('input', () => {
  chrome.storage.local.set({ notes: textarea.value });
  updateCharCount();
});

function updateCharCount() {
  charCount.textContent = \`\${textarea.value.length} characters\`;
}

document.getElementById('clear').addEventListener('click', () => {
  if (confirm('Clear all notes?')) {
    textarea.value = '';
    chrome.storage.local.set({ notes: '' });
    updateCharCount();
  }
});`,
      'styles.css': `body {
  width: 400px;
  height: 500px;
  padding: 15px;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

h1 {
  font-size: 16px;
  margin: 0 0 10px 0;
}

#notes {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  font-family: inherit;
  font-size: 13px;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

#char-count {
  font-size: 11px;
  color: #666;
}

#clear {
  padding: 6px 12px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

#clear:hover {
  background: #da190b;
}`
    }
  }
};