/*
 * Copyright 2026 John Kost
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// ReMixr Extension Builder - Main Logic

// State Management
let currentProject = null;
let currentFile = 'manifest.json';
let projects = [];
let cmEditor = null;

// Extension Templates
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Init CodeMirror
  const textarea = document.getElementById('code-editor');
  if (textarea) {
    cmEditor = CodeMirror.fromTextArea(textarea, {
      lineNumbers: true,
      mode: 'javascript',
      theme: 'dracula',
      lineWrapping: true,
      viewportMargin: Infinity
    });

    // Code editor change handler
    cmEditor.on('change', () => {
      if (currentProject && currentFile) {
        currentProject.files[currentFile] = cmEditor.getValue();
        // Debounce preview update
        if (this.previewTimeout) clearTimeout(this.previewTimeout);
        this.previewTimeout = setTimeout(() => updatePreview(), 500);
      }
    });
  }

  loadProjects();
  setupEventListeners();
  switchTab('projects');
});

// Load projects from storage
async function loadProjects() {
  chrome.storage.local.get(['extensionProjects'], (result) => {
    projects = result.extensionProjects || [];
    renderProjectsList();
  });
}

// Save projects to storage
function saveProjects() {
  chrome.storage.local.set({ extensionProjects: projects });
}

// Render projects list
function renderProjectsList() {
  const projectsList = document.getElementById('projects-list');

  if (projects.length === 0) {
    projectsList.innerHTML = '<p class="empty-state">No projects yet. Create your first extension!</p>';
    return;
  }

  projectsList.innerHTML = projects.map((project, index) => `
    <div class="project-item" data-index="${index}">
      <button class="project-delete-btn" onclick="deleteProject(${index})" title="Delete project">×</button>
      <div class="project-icon">📦</div>
      <div class="project-name">${project.name}</div>
      <div class="project-meta">Modified: ${new Date(project.modified).toLocaleDateString()}</div>
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('btn')) {
        const index = parseInt(item.dataset.index);
        loadProject(index);
      }
    });
  });
}

// Create new project
document.getElementById('new-project-btn')?.addEventListener('click', () => {
  currentProject = {
    name: 'My Extension',
    files: {
      'manifest.json': JSON.stringify({
        manifest_version: 3,
        name: 'My Extension',
        version: '1.0.0',
        description: 'Description of my extension',
        permissions: ['activeTab'],
        action: {
          default_popup: 'popup.html'
        }
      }, null, 2)
    },
    created: Date.now(),
    modified: Date.now()
  };

  switchTab('builder');
  updateFileTree();
  loadFileIntoEditor('manifest.json');
  document.getElementById('project-name').value = currentProject.name;
  showStatus('New project created', 'success');
});

// Load project
function loadProject(index) {
  currentProject = projects[index];
  currentProject.index = index;

  switchTab('builder');
  updateFileTree();
  loadFileIntoEditor('manifest.json');
  document.getElementById('project-name').value = currentProject.name;
  showStatus('Project loaded', 'success');
}

// Delete project
function deleteProject(index) {
  if (confirm('Are you sure you want to delete this project?')) {
    projects.splice(index, 1);
    saveProjects();
    renderProjectsList();
    showStatus('Project deleted', 'success');
  }
}

// Update file tree UI
function updateFileTree() {
  const container = document.getElementById('file-tree');
  if (!container || !currentProject) return;

  container.innerHTML = '';

  Object.keys(currentProject.files).sort().forEach(filename => {
    const item = document.createElement('div');
    item.className = 'file-item';
    if (filename === currentFile) item.classList.add('active');
    item.dataset.file = filename;
    item.textContent = filename;

    item.addEventListener('click', () => {
      loadFileIntoEditor(filename);
      document.querySelectorAll('.file-item').forEach(f => f.classList.remove('active'));
      item.classList.add('active');
    });

    container.appendChild(item);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  // Generate button
  document.getElementById('generate-btn')?.addEventListener('click', generateExtension);

  // Save button
  document.getElementById('save-project-btn')?.addEventListener('click', saveCurrentProject);

  // Test button
  document.getElementById('test-extension-btn')?.addEventListener('click', testExtension);

  // Export button
  document.getElementById('export-extension-btn')?.addEventListener('click', exportExtension);

  // File tree - Now dynamic
  updateFileTree();

  // Template cards
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const template = card.dataset.template;
      loadTemplate(template);
    });
  });

  // Code editor auto-save handled by CodeMirror change event

  // Project name change
  document.getElementById('project-name')?.addEventListener('input', (e) => {
    if (currentProject) {
      currentProject.name = e.target.value;
    }
  });

  // Preview toggles
  document.getElementById('preview-btn')?.addEventListener('click', () => {
    document.getElementById('editor-container').style.display = 'none';
    const previewContainer = document.getElementById('preview-container');
    previewContainer.style.display = 'block';
    previewContainer.classList.add('active');
    updatePreview();
  });

  document.getElementById('close-preview')?.addEventListener('click', () => {
    const previewContainer = document.getElementById('preview-container');
    previewContainer.style.display = 'none';
    previewContainer.classList.remove('active');
    document.getElementById('editor-container').style.display = 'block';
  });

  // Analyzer Tools
  document.getElementById('inspector-toggle')?.addEventListener('change', (e) => {
    toggleInspector(e.target.checked);
  });

  document.getElementById('scan-visualize')?.addEventListener('click', () => runAnalysis('visualize'));
  document.getElementById('scan-sequence')?.addEventListener('click', () => runAnalysis('sequence'));
  document.getElementById('scan-structure')?.addEventListener('click', () => runAnalysis('structure'));
  document.getElementById('scan-palette')?.addEventListener('click', () => runAnalysis('palette'));
  document.getElementById('scan-assets')?.addEventListener('click', () => runAnalysis('assets'));
  document.getElementById('scan-fonts')?.addEventListener('click', () => runAnalysis('fonts'));

  document.getElementById('scan-storage')?.addEventListener('click', () => runAnalysis('storage'));
  document.getElementById('scan-workers')?.addEventListener('click', () => runAnalysis('workers'));
  document.getElementById('scan-perf')?.addEventListener('click', () => runAnalysis('perf'));
  document.getElementById('scan-stack')?.addEventListener('click', () => runAnalysis('stack'));
  document.getElementById('scan-a11y')?.addEventListener('click', () => runAnalysis('a11y'));
  document.getElementById('scan-seo')?.addEventListener('click', () => runAnalysis('seo'));
  document.getElementById('scan-code')?.addEventListener('click', () => runAnalysis('code'));
  document.getElementById('scan-net')?.addEventListener('click', () => runAnalysis('net'));
  document.getElementById('scan-psyche')?.addEventListener('click', () => runAnalysis('psyche'));
  document.getElementById('scan-archetype')?.addEventListener('click', () => runAnalysis('archetype'));
  document.getElementById('scan-soul')?.addEventListener('click', () => runAnalysis('soul'));
  document.getElementById('scan-shadow')?.addEventListener('click', () => runAnalysis('shadow'));
  document.getElementById('scan-rhetoric')?.addEventListener('click', () => runAnalysis('rhetoric'));
  document.getElementById('scan-emotion')?.addEventListener('click', () => runAnalysis('emotion'));

  document.getElementById('clear-results')?.addEventListener('click', () => {
    document.getElementById('analysis-results').style.display = 'none';
  });

  // Fullscreen toggle for visualizations
  document.getElementById('fullscreen-toggle')?.addEventListener('click', () => {
    const d3Container = document.getElementById('d3-container');
    const resultsArea = document.getElementById('analysis-results');
    const fullscreenBtn = document.getElementById('fullscreen-toggle');

    if (d3Container.classList.contains('fullscreen')) {
      d3Container.classList.remove('fullscreen');
      fullscreenBtn.textContent = '⛶';
      fullscreenBtn.title = 'Toggle Fullscreen';
    } else {
      d3Container.classList.add('fullscreen');
      fullscreenBtn.textContent = '✕';
      fullscreenBtn.title = 'Exit Fullscreen';
    }
  });

  // MacGyver Tools
  document.getElementById('tool-edit')?.addEventListener('click', () => runMacGyver('toggleEditMode'));
  document.getElementById('tool-zap')?.addEventListener('click', () => runMacGyver('zapElement'));
  document.getElementById('tool-wireframe')?.addEventListener('click', () => runMacGyver('toggleWireframe'));
  document.getElementById('tool-images')?.addEventListener('click', () => runMacGyver('toggleImages'));

  // Extension Wizard
  document.querySelectorAll('input[name="host-perms"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const customInput = document.getElementById('wizard-custom-hosts');
      if (e.target.value === 'custom') {
        customInput.style.display = 'block';
      } else {
        customInput.style.display = 'none';
      }
    });
  });

  document.querySelectorAll('input[name="inject-host-perms"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const customInput = document.getElementById('inject-custom-hosts');
      if (e.target.value === 'custom') {
        customInput.style.display = 'block';
      } else {
        customInput.style.display = 'none';
      }
    });
  });

  document.getElementById('generate-extension-btn')?.addEventListener('click', generateExtensionFromWizard);

  document.getElementById('tool-unmask')?.addEventListener('click', () => runMacGyver('showPasswords'));
  document.getElementById('tool-enable')?.addEventListener('click', () => runMacGyver('enableInputs'));
  document.getElementById('tool-kill-sticky')?.addEventListener('click', () => runMacGyver('killStickies'));
  document.getElementById('tool-pii')?.addEventListener('click', () => runMacGyver('findEmails'));

  document.getElementById('tool-export-links')?.addEventListener('click', () => runMacGyver('exportLinks'));
  document.getElementById('tool-export-colors')?.addEventListener('click', () => runMacGyver('exportColors'));
  document.getElementById('tool-screenshot')?.addEventListener('click', () => runMacGyver('takeScreenshot'));
  document.getElementById('tool-console')?.addEventListener('click', () => runMacGyver('injectConsole'));

  // VS Code Section Toggles
  document.querySelectorAll('.vscode-section-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.vscode-section');
      section.classList.toggle('collapsed');

      const content = section.querySelector('.vscode-section-content');
      if (content) {
        content.style.display = section.classList.contains('collapsed') ? 'none' : 'block';
      }
    });
  });

  // Feature Injector inject button
  document.getElementById('inject-features-btn')?.addEventListener('click', injectFeatures);

  // Shiny Tab Listeners
  document.getElementById('shiny-generate-btn')?.addEventListener('click', handleShinyGenerate);
  document.getElementById('shiny-prompt')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleShinyGenerate();
    }
  });

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const wrapper = document.getElementById('canvas-wrapper');
      wrapper.className = `canvas-wrapper ${btn.dataset.view}`;
    });
  });

  document.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      updateShinyTheme(swatch.dataset.theme);
    });
  });

  document.getElementById('shiny-accent-picker')?.addEventListener('input', (e) => {
    updateShinyAccent(e.target.value);
  });

  document.getElementById('shiny-magic-polish')?.addEventListener('click', () => {
    addChatMessage('ai', 'Polishing your design with modern aesthetics...', '🪄');
    handleShinyGenerate('Make the design more premium with better spacing, refined typography, and subtle shadows.');
  });

  document.getElementById('shiny-publish-btn')?.addEventListener('click', publishShinyProject);
  document.getElementById('shiny-code-toggle')?.addEventListener('click', () => {
    if (currentProject) {
      switchTab('code');
    }
  });
}

// Switch tabs
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });

  if (tabName === 'ui') {
    initShinyTab();
  }
}

// Load template
function loadTemplate(templateName) {
  const template = TEMPLATES[templateName];
  if (!template) return;

  currentProject = {
    name: template.name,
    files: {},
    created: Date.now(),
    modified: Date.now()
  };

  // Convert template files to strings
  for (const [filename, content] of Object.entries(template.files)) {
    if (typeof content === 'object') {
      currentProject.files[filename] = JSON.stringify(content, null, 2);
    } else {
      currentProject.files[filename] = content;
    }
  }

  switchTab('code');
  document.getElementById('project-name').value = currentProject.name;
  currentFile = 'manifest.json';
  updateFileTree();
  loadFileIntoEditor('manifest.json');
  showStatus(`Template "${template.name}" loaded`, 'success');
}

// Load file into editor
function loadFileIntoEditor(filename) {
  if (!currentProject) return;

  currentFile = filename;
  const fileHeader = document.getElementById('current-file');

  const content = currentProject.files[filename] || '';

  if (cmEditor) {
    let mode = 'javascript';
    if (filename.endsWith('.html')) mode = 'htmlmixed';
    else if (filename.endsWith('.css')) mode = 'css';
    else if (filename.endsWith('.json')) mode = { name: 'javascript', json: true };

    cmEditor.setOption('mode', mode);
    cmEditor.setValue(content);
    setTimeout(() => cmEditor.refresh(), 10);
  }

  fileHeader.textContent = filename;
}

// SHINY LOGIC
let shinyProject = null;
let shinyHistory = [];

function initShinyTab() {
  if (!shinyProject) {
    // Initial state
    shinyProject = {
      name: 'shiny_project_1',
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; }
    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
    h1 { color: #333; margin-bottom: 0.5rem; }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello Shiny!</h1>
    <p>Describe your ideas to start designing.</p>
  </div>
</body>
</html>`,
      theme: 'light',
      accent: '#6366f1'
    };
    updateShinyPreview();
  }
}

async function handleShinyGenerate(overridePrompt) {
  const promptInput = document.getElementById('shiny-prompt');
  const prompt = overridePrompt || promptInput.value.trim();

  if (!prompt) return;

  if (!overridePrompt) promptInput.value = '';

  addChatMessage('user', prompt);

  // Show loading
  const wrapper = document.getElementById('canvas-wrapper');
  const loader = document.querySelector('.loader-container');
  wrapper.classList.add('loading');
  loader.style.display = 'block';

  // AI Delay
  await new Promise(r => setTimeout(r, 1500));

  try {
    const response = await generateVisualUI(prompt);
    shinyProject.html = response.html;
    updateShinyPreview();
    addChatMessage('ai', response.analysis, '✨');
  } catch (error) {
    addChatMessage('ai', 'Sorry, I encountered an error while generating your design.', '⚠️');
  } finally {
    wrapper.classList.remove('loading');
    loader.style.display = 'none';
  }
}

function addChatMessage(role, text, icon = null) {
  const history = document.getElementById('shiny-chat-history');
  const msg = document.createElement('div');
  msg.className = `chat-message ${role}`;

  const iconHtml = role === 'ai' ? `<div class="chat-icon">${icon || '✨'}</div>` : '';

  msg.innerHTML = `
    ${iconHtml}
    <div class="chat-bubble">${text}</div>
  `;

  history.appendChild(msg);
  history.scrollTop = history.scrollHeight;
}

function updateShinyPreview() {
  const frame = document.getElementById('shiny-preview-frame');
  if (frame && shinyProject) {
    const blob = new Blob([shinyProject.html], { type: 'text/html' });
    frame.src = URL.createObjectURL(blob);
  }
}

function updateShinyTheme(theme) {
  if (!shinyProject) return;
  shinyProject.theme = theme;

  // Patch HTML with theme
  let bg = '#ffffff', fg = '#333333';
  if (theme === 'dark') { bg = '#121212'; fg = '#f1f1f1'; }
  else if (theme === 'glass') { bg = 'rgba(255,255,255,0.7)'; fg = '#111'; }

  // Simple replacement or addition of styles
  const stylePatch = `\n<style id="shiny-theme-patch">body { background: ${bg} !important; color: ${fg} !important; }</style>`;
  if (shinyProject.html.includes('id="shiny-theme-patch"')) {
    shinyProject.html = shinyProject.html.replace(/<style id="shiny-theme-patch">.*?<\/style>/s, stylePatch);
  } else {
    shinyProject.html = shinyProject.html.replace('</head>', `${stylePatch}\n</head>`);
  }
  updateShinyPreview();
}

function updateShinyAccent(color) {
  if (!shinyProject) return;
  shinyProject.accent = color;

  const stylePatch = `\n<style id="shiny-accent-patch">.accent-bg { background-color: ${color} !important; } .accent-text { color: ${color} !important; } button, .btn-primary { background: ${color} !important; }</style>`;
  if (shinyProject.html.includes('id="shiny-accent-patch"')) {
    shinyProject.html = shinyProject.html.replace(/<style id="shiny-accent-patch">.*?<\/style>/s, stylePatch);
  } else {
    shinyProject.html = shinyProject.html.replace('</head>', `${stylePatch}\n</head>`);
  }
  updateShinyPreview();
}

async function generateVisualUI(prompt) {
  // This uses the existing generation heuristics but returns a more visual template
  const lowerPrompt = prompt.toLowerCase();
  let themeColor = shinyProject?.accent || '#6366f1';

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root { --accent: ${themeColor}; --bg: #ffffff; --text: #1a1a1a; }
        body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); padding: 20px; margin: 0; transition: all 0.3s ease; }
        .container { max-width: 600px; margin: 0 auto; }
        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        h1 { font-size: 1.5rem; font-weight: 700; margin: 0; }
        .btn { padding: 10px 20px; border-radius: 8px; border: none; background: var(--accent); color: white; cursor: pointer; font-weight: 600; transition: opacity 0.2s; }
        .btn:hover { opacity: 0.9; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .card { background: rgba(0,0,0,0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.1); }
        .card h3 { margin-top: 0; font-size: 1rem; }
        .input-group { margin-bottom: 1rem; }
        input { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ddd; box-sizing: border-box; }
        .footer { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; font-size: 0.8rem; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${extractName(prompt) || 'My App'}</h1>
            <button class="btn">Action</button>
        </header>
        
        <div class="content">
            ${generateContentHtml(prompt)}
        </div>

        <div class="footer">
            Built with ReMixr Shiny
        </div>
    </div>
</body>
</html>`;

  return {
    html: html,
    analysis: `I've designed a layout for "${extractName(prompt) || 'your app'}" with a clean, modern aesthetic. I added a responsive grid and matching components based on your request.`
  };
}

function generateContentHtml(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('list') || p.includes('tasks')) {
    return `
            <div class="input-group">
                <input type="text" placeholder="Add new item...">
            </div>
            <div class="card-grid">
                <div class="card"><h3>Task 1</h3><p>Complete documentation</p></div>
                <div class="card"><h3>Task 2</h3><p>Review design system</p></div>
                <div class="card"><h3>Task 3</h3><p>Deploy to production</p></div>
            </div>`;
  } else if (p.includes('form') || p.includes('contact')) {
    return `
            <div class="card">
                <div class="input-group"><label>Name</label><input type="text"></div>
                <div class="input-group"><label>Email</label><input type="email"></div>
                <div class="input-group"><label>Message</label><textarea style="width:100%; min-height:100px; padding:10px; border-radius:6px; border:1px solid #ddd;"></textarea></div>
                <button class="btn" style="width:100%">Submit</button>
            </div>`;
  } else {
    return `
            <div class="card" style="text-align:center; padding: 3rem 1rem;">
                <h2>Welcome to ${extractName(prompt) || 'App'}</h2>
                <p>Start by describing more features you want to add.</p>
                <div style="display:flex; gap:10px; justify-content:center; margin-top:1.5rem;">
                    <button class="btn">Get Started</button>
                    <button class="btn" style="background:#eee; color:#333;">Learn More</button>
                </div>
            </div>`;
  }
}

function publishShinyProject() {
  if (!shinyProject) return;

  currentProject = {
    name: document.getElementById('shiny-project-title').textContent,
    files: {
      'manifest.json': JSON.stringify({
        manifest_version: 3,
        name: document.getElementById('shiny-project-title').textContent,
        version: '1.0.0',
        action: { default_popup: 'popup.html' }
      }, null, 2),
      'popup.html': shinyProject.html,
      'popup.js': '// Generated by Shiny Designer\nconsole.log("Ready.");',
      'styles.css': '/* Embedded in HTML */'
    },
    created: Date.now(),
    modified: Date.now()
  };

  switchTab('code');
  updateFileTree();
  loadFileIntoEditor('popup.html');
  showStatus('Project published to Builder!', 'success');
}

// Builder AI logic removed as per user request to streamline Builder UI/UX


function generateContentModifier(prompt) {
  const template = TEMPLATES['content-modifier'];
  const name = extractName(prompt) || 'Content Modifier';

  let contentJs = template.files['content.js'];

  // Smart Heuristic: Detect color and element
  const colorMatch = prompt.match(/\b(red|blue|green|yellow|purple|orange|pink|black|white|#[0-9a-fA-F]{3,6})\b/i);
  const elementMatch = prompt.match(/\b(links?|paragraphs?|images?|headers?|divs?|spans?|buttons?)\b/i);

  if (colorMatch || elementMatch) {
    const color = colorMatch ? colorMatch[0].toLowerCase() : 'yellow';
    const element = elementMatch ? elementMatch[0].toLowerCase() : 'link';

    let selector = 'a';
    if (element.includes('paragraph')) selector = 'p';
    if (element.includes('image')) selector = 'img';
    if (element.includes('header')) selector = 'h1, h2, h3';
    if (element.includes('div')) selector = 'div';
    if (element.includes('span')) selector = 'span';
    if (element.includes('button')) selector = 'button';

    contentJs = `// Content script - Generated by ReMixr for "${name}"
console.log('${name} active!');

// Logic: Highlight ${element} with ${color}
const elements = document.querySelectorAll('${selector}');
elements.forEach(el => {
  // Apply visual changes
  el.style.backgroundColor = '${color}';
  el.style.transition = 'all 0.3s';
  el.style.boxShadow = '0 0 5px ${color}';
});`;
  }

  return {
    name,
    files: {
      'manifest.json': JSON.stringify({
        ...template.files['manifest.json'],
        name
      }, null, 2),
      'content.js': contentJs,
      'popup.html': template.files['popup.html'].replace('Content Modifier', name),
      'popup.js': template.files['popup.js'],
      'styles.css': template.files['styles.css']
    }
  };
}

function generateTimer(prompt) {
  const template = TEMPLATES['productivity'];
  const name = extractName(prompt) || 'Productivity Timer';

  return {
    name,
    files: {
      'manifest.json': JSON.stringify({
        ...template.files['manifest.json'],
        name
      }, null, 2),
      'background.js': template.files['background.js'],
      'popup.html': template.files['popup.html'].replace('Productivity Timer', name),
      'popup.js': template.files['popup.js'],
      'styles.css': template.files['styles.css']
    }
  };
}

function generateExtractor(prompt) {
  const template = TEMPLATES['data-extractor'];
  const name = extractName(prompt) || 'Data Extractor';

  let popupJs = template.files['popup.js'];

  // Smart Heuristic: Custom extraction target
  const typeMatch = prompt.match(/\b(emails?|prices?|phones?|numbers?)\b/i);

  if (typeMatch) {
    const type = typeMatch[1].toLowerCase();

    // Create custom extraction logic
    let extractionLogic = `
      // Extraction logic for ${type}
      // This is a placeholder for ${type} regex
      const text = document.body.innerText;
      return [text.length + ' chars scanned']; 
    `;

    if (type.includes('email')) {
      extractionLogic = `
      const regex = /[\\w.-]+@[\\w.-]+\\.[\\w.-]+/g;
      const text = document.body.innerText;
      return [...new Set(text.match(regex) || [])];`;
    } else if (type.includes('price')) {
      extractionLogic = `
      const regex = /\\$\\d+(?:\\.\\d{2})?/g;
      const text = document.body.innerText;
      return [...new Set(text.match(regex) || [])];`;
    }

    popupJs = `document.getElementById('extract-links').textContent = 'Extract ${type}';
document.getElementById('extract-links').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      ${extractionLogic}
    }
  }, (results) => {
    displayResults(results[0].result);
  });
});

document.getElementById('extract-images').style.display = 'none';

function displayResults(data) {
  const resultsDiv = document.getElementById('results');
  if (!data || data.length === 0) {
      resultsDiv.innerHTML = '<div>No results found</div>';
      return;
  }
  resultsDiv.innerHTML = data.map(item => \`<div>\${item}</div>\`).join('');
}`;
  }

  return {
    name,
    files: {
      'manifest.json': JSON.stringify({
        ...template.files['manifest.json'],
        name
      }, null, 2),
      'popup.html': template.files['popup.html'].replace('Data Extractor', name),
      'popup.js': popupJs,
      'styles.css': template.files['styles.css']
    }
  };
}

function generatePageMonitor(prompt) {
  const template = TEMPLATES['page-monitor'];
  const name = extractName(prompt) || 'Page Monitor';

  return {
    name,
    files: {
      'manifest.json': JSON.stringify({
        ...template.files['manifest.json'],
        name
      }, null, 2),
      'popup.html': template.files['popup.html'].replace('Page Monitor', name),
      'popup.js': template.files['popup.js'],
      'styles.css': template.files['styles.css']
    }
  };
}

function generatePopupTool(prompt) {
  const template = TEMPLATES['popup-tool'];
  const name = extractName(prompt) || 'Popup Toolbox';

  return {
    name,
    files: {
      'manifest.json': JSON.stringify({
        ...template.files['manifest.json'],
        name
      }, null, 2),
      'popup.html': template.files['popup.html'].replace('Toolbox', name),
      'popup.js': template.files['popup.js'],
      'styles.css': template.files['styles.css']
    }
  };
}

function generateGeneric(prompt) {
  const template = TEMPLATES['blank'];
  const name = extractName(prompt) || 'My Extension';

  return {
    name,
    files: {
      'manifest.json': JSON.stringify({
        ...template.files['manifest.json'],
        name,
        description: prompt.slice(0, 100)
      }, null, 2),
      'popup.html': template.files['popup.html'].replace('My Extension', name),
      'popup.js': template.files['popup.js'],
      'styles.css': template.files['styles.css']
    }
  };
}

function extractName(prompt) {
  // Try to extract a name from the prompt
  const match = prompt.match(/(?:create|build|make)\s+(?:an?\s+)?(?:extension\s+)?(?:that\s+)?(.+)/i);
  if (match) {
    return match[1].split(/\b(?:to|that)\b/)[0].trim()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .slice(0, 30);
  }
  return null;
}

// Generate Extension from Wizard
function generateExtensionFromWizard() {
  // Collect all wizard inputs
  const name = document.getElementById('wizard-name').value.trim() || 'My Extension';
  const description = document.getElementById('wizard-description').value.trim() || 'A custom Chrome extension';

  // Get extension type
  const extType = document.querySelector('input[name="ext-type"]:checked')?.value || 'popup';

  // Get selected features
  const features = {
    background: document.getElementById('feat-background')?.checked || false,
    storage: document.getElementById('feat-storage')?.checked || false,
    tabs: document.getElementById('feat-tabs')?.checked || false,
    contextMenu: document.getElementById('feat-context-menu')?.checked || false,
    notifications: document.getElementById('feat-notifications')?.checked || false,
    bookmarks: document.getElementById('feat-bookmarks')?.checked || false,
    history: document.getElementById('feat-history')?.checked || false,
    downloads: document.getElementById('feat-downloads')?.checked || false,
    cookies: document.getElementById('feat-cookies')?.checked || false,
    webRequest: document.getElementById('feat-web-request')?.checked || false
  };

  // Get host permissions
  const hostPerms = document.querySelector('input[name="host-perms"]:checked')?.value || 'active-tab';
  const customHosts = document.getElementById('wizard-custom-hosts')?.value.trim();

  // Get framework
  const framework = document.getElementById('wizard-framework')?.value || 'vanilla';

  // Get behaviors
  const behaviors = {
    matchSite: document.getElementById('behavior-match-site')?.checked || false,
    autoOpen: document.getElementById('behavior-auto-open')?.checked || false,
    persistState: document.getElementById('behavior-persist-state')?.checked || false,
    keyboard: document.getElementById('behavior-keyboard')?.checked || false,
    badge: document.getElementById('behavior-badge')?.checked || false,
    autoRun: document.getElementById('behavior-auto-run')?.checked || false,
    sync: document.getElementById('behavior-sync')?.checked || false,
    theme: document.getElementById('behavior-theme')?.checked || false,
    analytics: document.getElementById('behavior-analytics')?.checked || false,
    hotreload: document.getElementById('behavior-hotreload')?.checked || false,
    errorTracking: document.getElementById('behavior-error-tracking')?.checked || false
  };

  // Build permissions array
  const permissions = [];
  if (hostPerms === 'active-tab') permissions.push('activeTab');
  if (features.storage || behaviors.persistState || behaviors.sync) permissions.push('storage');
  if (features.tabs) permissions.push('tabs');
  if (features.contextMenu) permissions.push('contextMenus');
  if (features.notifications) permissions.push('notifications');
  if (features.bookmarks) permissions.push('bookmarks');
  if (features.history) permissions.push('history');
  if (features.downloads) permissions.push('downloads');
  if (features.cookies) permissions.push('cookies');
  if (features.webRequest) permissions.push('webRequest', 'webRequestBlocking');
  if (extType === 'content-script') permissions.push('scripting');

  // Build host permissions
  const host_permissions = [];
  if (hostPerms === 'all-urls') {
    host_permissions.push('<all_urls>');
  } else if (hostPerms === 'custom' && customHosts) {
    host_permissions.push(...customHosts.split(',').map(h => h.trim()).filter(Boolean));
  }

  // Build manifest
  const manifest = {
    manifest_version: 3,
    name: name,
    version: '1.0.0',
    description: description,
    permissions: permissions
  };

  if (host_permissions.length > 0) {
    manifest.host_permissions = host_permissions;
  }

  // Add action or side panel based on type
  if (extType === 'popup' || extType === 'page-action') {
    manifest.action = {
      default_popup: 'popup.html',
      default_icon: {
        '16': 'icon16.png',
        '48': 'icon48.png',
        '128': 'icon128.png'
      }
    };
  } else if (extType === 'side-panel') {
    manifest.side_panel = {
      default_path: 'sidepanel.html'
    };
  }

  // Add content scripts if needed
  if (extType === 'content-script') {
    manifest.content_scripts = [{
      matches: host_permissions.length > 0 ? host_permissions : ['<all_urls>'],
      js: ['content.js'],
      run_at: behaviors.autoRun ? 'document_start' : 'document_idle'
    }];
  }

  // Add background service worker if needed
  if (features.background || features.contextMenu || behaviors.badge) {
    manifest.background = {
      service_worker: 'background.js'
    };
  }

  // Add keyboard shortcuts if needed
  if (behaviors.keyboard) {
    manifest.commands = {
      "_execute_action": {
        "suggested_key": {
          "default": "Ctrl+Shift+Y",
          "mac": "Command+Shift+Y"
        }
      }
    };
  }

  // Generate files
  const files = {
    'manifest.json': JSON.stringify(manifest, null, 2)
  };

  // Generate HTML based on type
  const htmlFile = extType === 'side-panel' ? 'sidepanel.html' : 'popup.html';
  files[htmlFile] = generateHTML(name, framework, behaviors);

  // Generate JavaScript
  const jsFile = extType === 'side-panel' ? 'sidepanel.js' : 'popup.js';
  files[jsFile] = generateJS(features, behaviors, framework);

  // Generate CSS
  files['styles.css'] = generateCSS(behaviors);

  // Generate content script if needed
  if (extType === 'content-script') {
    files['content.js'] = generateContentScript(behaviors);
  }

  // Generate background script if needed
  if (features.background || features.contextMenu || behaviors.badge) {
    files['background.js'] = generateBackgroundScript(features, behaviors);
  }

  // Create project
  currentProject = {
    name: name,
    files: files,
    created: Date.now(),
    modified: Date.now()
  };

  // Switch to builder and load
  switchTab('builder');
  updateFileTree();
  loadFileIntoEditor('manifest.json');
  document.getElementById('project-name').value = currentProject.name;
  showStatus('Extension generated from wizard!', 'success');
}

// Helper: Generate HTML
function generateHTML(name, framework, behaviors) {
  const themeSupport = behaviors.theme ? `
  <script>
    // Theme support
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  </script>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>${name}</h1>
    <p>Your extension is ready to customize!</p>
    <button id="action-btn">Click Me</button>
    <div id="output"></div>
  </div>
  ${themeSupport}
  <script src="${framework === 'vanilla' ? 'popup.js' : 'sidepanel.js'}"></script>
</body>
</html>`;
}

// Helper: Generate JavaScript
function generateJS(features, behaviors, framework) {
  let code = `// ${framework === 'vanilla' ? 'Vanilla JavaScript' : framework.charAt(0).toUpperCase() + framework.slice(1)} Extension\n\n`;

  code += `document.addEventListener('DOMContentLoaded', () => {\n`;
  code += `  const actionBtn = document.getElementById('action-btn');\n`;
  code += `  const output = document.getElementById('output');\n\n`;

  code += `  actionBtn.addEventListener('click', async () => {\n`;
  code += `    output.textContent = 'Button clicked!';\n`;

  if (features.storage || behaviors.persistState) {
    code += `\n    // Save to storage\n`;
    code += `    await chrome.storage.${behaviors.sync ? 'sync' : 'local'}.set({ lastClick: Date.now() });\n`;
  }

  if (features.tabs) {
    code += `\n    // Get current tab\n`;
    code += `    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });\n`;
    code += `    console.log('Current tab:', tab);\n`;
  }

  if (features.notifications) {
    code += `\n    // Show notification\n`;
    code += `    chrome.notifications.create({\n`;
    code += `      type: 'basic',\n`;
    code += `      iconUrl: 'icon48.png',\n`;
    code += `      title: 'Extension Action',\n`;
    code += `      message: 'Action completed!'\n`;
    code += `    });\n`;
  }

  code += `  });\n`;

  if (behaviors.theme) {
    code += `\n  // Theme toggle\n`;
    code += `  const themeToggle = document.createElement('button');\n`;
    code += `  themeToggle.textContent = '🌓 Toggle Theme';\n`;
    code += `  themeToggle.addEventListener('click', () => {\n`;
    code += `    const current = document.documentElement.getAttribute('data-theme');\n`;
    code += `    const newTheme = current === 'dark' ? 'light' : 'dark';\n`;
    code += `    document.documentElement.setAttribute('data-theme', newTheme);\n`;
    code += `    localStorage.setItem('theme', newTheme);\n`;
    code += `  });\n`;
    code += `  document.querySelector('.container').appendChild(themeToggle);\n`;
  }

  if (behaviors.errorTracking) {
    code += `\n  // Error tracking\n`;
    code += `  window.addEventListener('error', (e) => {\n`;
    code += `    console.error('Extension error:', e.message);\n`;
    code += `  });\n`;
  }

  code += `});\n`;

  return code;
}

// Helper: Generate CSS
function generateCSS(behaviors) {
  let css = `/* Extension Styles */\n\n`;

  css += `body {\n`;
  css += `  width: 400px;\n`;
  css += `  min-height: 300px;\n`;
  css += `  margin: 0;\n`;
  css += `  padding: 0;\n`;
  css += `  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n`;
  css += `  background: #ffffff;\n`;
  css += `  color: #333333;\n`;
  css += `}\n\n`;

  css += `.container {\n`;
  css += `  padding: 20px;\n`;
  css += `}\n\n`;

  css += `h1 {\n`;
  css += `  font-size: 20px;\n`;
  css += `  margin: 0 0 15px 0;\n`;
  css += `  color: #1a73e8;\n`;
  css += `}\n\n`;

  css += `button {\n`;
  css += `  padding: 10px 20px;\n`;
  css += `  background: #1a73e8;\n`;
  css += `  color: white;\n`;
  css += `  border: none;\n`;
  css += `  border-radius: 4px;\n`;
  css += `  cursor: pointer;\n`;
  css += `  font-size: 14px;\n`;
  css += `  margin: 5px 0;\n`;
  css += `}\n\n`;

  css += `button:hover {\n`;
  css += `  background: #1557b0;\n`;
  css += `}\n\n`;

  css += `#output {\n`;
  css += `  margin-top: 15px;\n`;
  css += `  padding: 10px;\n`;
  css += `  background: #f5f5f5;\n`;
  css += `  border-radius: 4px;\n`;
  css += `  min-height: 20px;\n`;
  css += `}\n`;

  if (behaviors.theme) {
    css += `\n/* Theme Support */\n`;
    css += `[data-theme="dark"] body {\n`;
    css += `  background: #1a1a1a;\n`;
    css += `  color: #e0e0e0;\n`;
    css += `}\n\n`;
    css += `[data-theme="dark"] #output {\n`;
    css += `  background: #2a2a2a;\n`;
    css += `}\n`;
  }

  return css;
}

// Helper: Generate Content Script
function generateContentScript(behaviors) {
  let code = `// Content Script\n`;
  code += `console.log('Content script loaded');\n\n`;

  if (behaviors.matchSite) {
    code += `// Match site styles\n`;
    code += `const bodyStyles = window.getComputedStyle(document.body);\n`;
    code += `console.log('Site background:', bodyStyles.backgroundColor);\n`;
    code += `console.log('Site font:', bodyStyles.fontFamily);\n\n`;
  }

  code += `// Your content script logic here\n`;
  code += `document.addEventListener('DOMContentLoaded', () => {\n`;
  code += `  console.log('Page loaded, extension active');\n`;
  code += `});\n`;

  return code;
}

// Helper: Generate Background Script
function generateBackgroundScript(features, behaviors) {
  let code = `// Background Service Worker\n\n`;

  code += `chrome.runtime.onInstalled.addListener(() => {\n`;
  code += `  console.log('Extension installed');\n`;

  if (features.contextMenu) {
    code += `\n  // Create context menu\n`;
    code += `  chrome.contextMenus.create({\n`;
    code += `    id: 'extension-action',\n`;
    code += `    title: 'Extension Action',\n`;
    code += `    contexts: ['selection']\n`;
    code += `  });\n`;
  }

  code += `});\n\n`;

  if (features.contextMenu) {
    code += `chrome.contextMenus.onClicked.addListener((info, tab) => {\n`;
    code += `  if (info.menuItemId === 'extension-action') {\n`;
    code += `    console.log('Context menu clicked:', info.selectionText);\n`;
    code += `  }\n`;
    code += `});\n\n`;
  }

  if (behaviors.badge) {
    code += `// Update badge\n`;
    code += `chrome.action.setBadgeText({ text: '1' });\n`;
    code += `chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });\n\n`;
  }

  if (behaviors.autoOpen) {
    code += `// Auto-open side panel\n`;
    code += `chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {\n`;
    code += `  if (changeInfo.status === 'complete') {\n`;
    code += `    chrome.sidePanel.open({ tabId });\n`;
    code += `  }\n`;
    code += `});\n`;
  }

  return code;
}

// Feature Injector - Inject features into current project
function injectFeatures() {
  if (!currentProject) {
    showStatus('No project loaded. Create or load a project first.', 'error');
    return;
  }

  const selectedFeatures = {
    // Core Features
    storage: document.getElementById('inject-storage')?.checked || false,
    tabs: document.getElementById('inject-tabs')?.checked || false,
    notifications: document.getElementById('inject-notifications')?.checked || false,
    contextMenu: document.getElementById('inject-context-menu')?.checked || false,
    background: document.getElementById('inject-background')?.checked || false,
    bookmarks: document.getElementById('inject-bookmarks')?.checked || false,
    history: document.getElementById('inject-history')?.checked || false,
    downloads: document.getElementById('inject-downloads')?.checked || false,
    cookies: document.getElementById('inject-cookies')?.checked || false,
    webRequest: document.getElementById('inject-web-request')?.checked || false,
    // UI Components
    sidePanel: document.getElementById('inject-side-panel')?.checked || false,
    theme: document.getElementById('inject-theme')?.checked || false,
    keyboard: document.getElementById('inject-keyboard')?.checked || false,
    badge: document.getElementById('inject-badge')?.checked || false,
    // Behaviors
    syncStorage: document.getElementById('inject-sync-storage')?.checked || false,
    autoOpen: document.getElementById('inject-auto-open')?.checked || false,
    persistState: document.getElementById('inject-persist-state')?.checked || false,
    matchSite: document.getElementById('inject-match-site')?.checked || false,
    autoRun: document.getElementById('inject-auto-run')?.checked || false,
    analytics: document.getElementById('inject-analytics')?.checked || false,
    hotReload: document.getElementById('inject-hot-reload')?.checked || false,
    errorTracking: document.getElementById('inject-error-tracking')?.checked || false,
    // Host Permissions
    hostPerms: document.querySelector('input[name="inject-host-perms"]:checked')?.value || 'active-tab',
    customHosts: document.getElementById('inject-custom-hosts')?.value.trim() || '',
    // Framework
    framework: document.getElementById('inject-framework')?.value || 'none',
    // Identity & Type
    name: document.getElementById('inject-name')?.value.trim() || '',
    description: document.getElementById('inject-description')?.value.trim() || '',
    extType: document.querySelector('input[name="inject-ext-type"]:checked')?.value || 'none'
  };

  const hasSelection = Object.values(selectedFeatures).some(v => v);
  if (!hasSelection) {
    showStatus('Please select at least one feature to inject', 'error');
    return;
  }

  try {
    let manifest = JSON.parse(currentProject.files['manifest.json']);
    if (!manifest.permissions) manifest.permissions = [];

    // Identity update
    if (selectedFeatures.name) {
      manifest.name = selectedFeatures.name;
      currentProject.name = selectedFeatures.name;
    }
    if (selectedFeatures.description) {
      manifest.description = selectedFeatures.description;
    }

    // Type switching
    if (selectedFeatures.extType !== 'none') {
      if (selectedFeatures.extType === 'content-script') {
        if (!manifest.content_scripts) {
          manifest.content_scripts = [{
            "matches": ["<all_urls>"],
            "js": ["content.js"]
          }];
          if (!currentProject.files['content.js']) {
            currentProject.files['content.js'] = '// Content Script\nconsole.log("Content script loaded");\n';
          }
        }
      } else if (selectedFeatures.extType === 'popup') {
        manifest.action = {
          "default_popup": "popup.html",
          "default_icon": "icon48.png"
        };
      } else if (selectedFeatures.extType === 'side-panel') {
        manifest.side_panel = { "default_path": "sidepanel.html" };
        if (!manifest.permissions.includes('sidePanel')) manifest.permissions.push('sidePanel');
      } else if (selectedFeatures.extType === 'page-action') {
        manifest.action = {
          "default_popup": "popup.html"
        };
        // In MV3, Page Action is merged into Action, but we can trigger it conditionally in logic
      }
    }

    const permissionsToAdd = [];
    if (selectedFeatures.storage || selectedFeatures.persistState) permissionsToAdd.push('storage');
    if (selectedFeatures.tabs) permissionsToAdd.push('tabs');
    if (selectedFeatures.notifications) permissionsToAdd.push('notifications');
    if (selectedFeatures.contextMenu) permissionsToAdd.push('contextMenus');
    if (selectedFeatures.bookmarks) permissionsToAdd.push('bookmarks');
    if (selectedFeatures.history) permissionsToAdd.push('history');
    if (selectedFeatures.downloads) permissionsToAdd.push('downloads');
    if (selectedFeatures.cookies) permissionsToAdd.push('cookies');
    if (selectedFeatures.webRequest) {
      permissionsToAdd.push('webRequest');
      permissionsToAdd.push('webRequestBlocking');
    }

    permissionsToAdd.forEach(perm => {
      if (!manifest.permissions.includes(perm)) manifest.permissions.push(perm);
    });

    // Host Permissions
    if (!manifest.host_permissions) manifest.host_permissions = [];
    if (selectedFeatures.hostPerms === 'all-urls') {
      if (!manifest.host_permissions.includes('<all_urls>')) manifest.host_permissions.push('<all_urls>');
    } else if (selectedFeatures.hostPerms === 'custom' && selectedFeatures.customHosts) {
      const hosts = selectedFeatures.customHosts.split(',').map(h => h.trim());
      hosts.forEach(host => {
        if (!manifest.host_permissions.includes(host)) manifest.host_permissions.push(host);
      });
    }

    if (selectedFeatures.background || selectedFeatures.contextMenu || selectedFeatures.badge || selectedFeatures.autoOpen) {
      if (!manifest.background) manifest.background = { service_worker: 'background.js' };
    }

    if (selectedFeatures.sidePanel && !manifest.side_panel) {
      manifest.side_panel = { default_path: 'sidepanel.html' };
    }

    if (selectedFeatures.keyboard && !manifest.commands) {
      manifest.commands = {
        "_execute_action": {
          "suggested_key": { "default": "Ctrl+Shift+Y", "mac": "Command+Shift+Y" },
          "description": "Activate extension"
        }
      };
    }

    currentProject.files['manifest.json'] = JSON.stringify(manifest, null, 2);

    // Framework Boilerplate
    if (selectedFeatures.framework !== 'none') {
      if (selectedFeatures.framework === 'react') {
        currentProject.files['popup.html'] = `<!DOCTYPE html>\n<html>\n<head>\n  <title>React Popup</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div id="root"></div>\n  <script src="popup.js"></script>\n</body>\n</html>`;
        currentProject.files['popup.js'] = `// React Popup\nimport React from 'react';\nimport ReactDOM from 'react-dom/client';\n\nconst App = () => (\n  <div className="container">\n    <h1>React Extension</h1>\n    <p>Build your React extension here.</p>\n  </div>\n);\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(<App />);`;
      } else if (selectedFeatures.framework === 'vue') {
        currentProject.files['popup.html'] = `<!DOCTYPE html>\n<html>\n<head>\n  <title>Vue Popup</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div id="app">{{ message }}</div>\n  <script src="popup.js"></script>\n</body>\n</html>`;
        currentProject.files['popup.js'] = `// Vue Popup\nimport { createApp } from 'vue';\n\nconst app = createApp({\n  data() {\n    return {\n      message: 'Hello from Vue!'\n    }\n  }\n});\n\napp.mount('#app');`;
      } else if (selectedFeatures.framework === 'svelte') {
        currentProject.files['popup.html'] = `<!DOCTYPE html>\n<html>\n<head>\n  <title>Svelte Popup</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <script src="popup.js"></script>\n</body>\n</html>`;
        currentProject.files['popup.js'] = `// Svelte Popup\nimport App from './App.svelte';\n\nconst app = new App({\n  target: document.body,\n  props: {\n    name: 'Svelte'\n  }\n});\n\nexport default app;`;
        currentProject.files['App.svelte'] = `<script>\n  export let name;\n</script>\n\n<main>\n  <h1>Hello {name}!</h1>\n  <p>Svelte extension components.</p>\n</main>\n\n<style>\n  main {\n    text-align: center;\n    padding: 1em;\n  }\n</style>`;
      } else if (selectedFeatures.framework === 'vanilla') {
        // Basic vanilla structure if it doesn't already exist or if they want to reset
        currentProject.files['popup.html'] = `<!DOCTYPE html>\n<html>\n<head>\n  <title>Extension Popup</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <h1>Extension</h1>\n  <script src="popup.js"></script>\n</body>\n</html>`;
      }
    }

    let popupJs = currentProject.files['popup.js'] || '// Extension Logic\n\n';

    if ((selectedFeatures.storage || selectedFeatures.persistState) && !popupJs.includes('chrome.storage')) {
      const storageType = selectedFeatures.syncStorage ? 'sync' : 'local';
      popupJs += `\n// Storage (${storageType})\nasync function saveData(key, value) {\n  await chrome.storage.${storageType}.set({ [key]: value });\n}\n\nasync function loadData(key) {\n  const result = await chrome.storage.${storageType}.get([key]);\n  return result[key];\n}\n`;
    }

    if (selectedFeatures.tabs && !popupJs.includes('chrome.tabs')) {
      popupJs += `\n// Tabs\nasync function getCurrentTab() {\n  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });\n  return tab;\n}\n\nasync function getAllTabs() {\n  const tabs = await chrome.tabs.query({});\n  return tabs;\n}\n`;
    }

    if (selectedFeatures.history && !popupJs.includes('chrome.history')) {
      popupJs += `\n// History\nasync function searchHistory(query, maxResults = 100) {\n  const results = await chrome.history.search({ text: query, maxResults });\n  return results;\n}\n\nasync function getVisits(url) {\n  const visits = await chrome.history.getVisits({ url });\n  return visits;\n}\n`;
    }

    if (selectedFeatures.bookmarks && !popupJs.includes('chrome.bookmarks')) {
      popupJs += `\n// Bookmarks\nasync function getAllBookmarks() {\n  const tree = await chrome.bookmarks.getTree();\n  return tree;\n}\n\nasync function createBookmark(title, url) {\n  await chrome.bookmarks.create({ title, url });\n}\n`;
    }

    if (selectedFeatures.downloads && !popupJs.includes('chrome.downloads')) {
      popupJs += `\n// Downloads\nfunction downloadFile(url, filename) {\n  chrome.downloads.download({ url, filename });\n}\n`;
    }

    if (selectedFeatures.notifications && !popupJs.includes('chrome.notifications')) {
      popupJs += `\n// Notifications\nfunction showNotification(title, message) {\n  chrome.notifications.create({ type: 'basic', iconUrl: 'icon48.png', title, message });\n}\n`;
    }

    if (selectedFeatures.theme && !popupJs.includes('toggleTheme')) {
      popupJs += `\n// Theme\nfunction toggleTheme() {\n  const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';\n  document.documentElement.setAttribute('data-theme', theme);\n  localStorage.setItem('theme', theme);\n}\n\n// Load saved theme\nconst savedTheme = localStorage.getItem('theme') || 'light';\ndocument.documentElement.setAttribute('data-theme', savedTheme);\n`;
    }

    if (selectedFeatures.matchSite && !popupJs.includes('matchSiteStyles')) {
      popupJs += `\n// Match site styles\nfunction matchSiteStyles() {\n  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {\n    chrome.scripting.executeScript({\n      target: { tabId: tab.id },\n      func: () => {\n        const styles = window.getComputedStyle(document.body);\n        return {\n          bg: styles.backgroundColor,\n          color: styles.color,\n          font: styles.fontFamily\n        };\n      }\n    }, (results) => {\n      if (results && results[0]) {\n        const { bg, color, font } = results[0].result;\n        document.body.style.backgroundColor = bg;\n        document.body.style.color = color;\n        document.body.style.fontFamily = font;\n      }\n    });\n  });\n}\n`;
    }

    if (selectedFeatures.analytics && !popupJs.includes('trackEvent')) {
      popupJs += `\n// Analytics\nfunction trackEvent(category, action, label) {\n  console.log('Analytics:', { category, action, label, timestamp: Date.now() });\n  // Add your analytics service here\n}\n`;
    }

    if (selectedFeatures.errorTracking && !popupJs.includes('error tracking')) {
      popupJs += `\n// Error tracking\nwindow.addEventListener('error', (e) => console.error('Error:', e.message));\nwindow.addEventListener('unhandledrejection', (e) => console.error('Promise rejection:', e.reason));\n`;
    }

    currentProject.files['popup.js'] = popupJs;

    if (selectedFeatures.background || selectedFeatures.contextMenu || selectedFeatures.badge || selectedFeatures.autoOpen || selectedFeatures.webRequest || selectedFeatures.hotReload) {
      let backgroundJs = currentProject.files['background.js'] || '// Background\n\n';

      if (selectedFeatures.contextMenu && !backgroundJs.includes('contextMenus')) {
        backgroundJs += `\nchrome.runtime.onInstalled.addListener(() => {\n  chrome.contextMenus.create({ id: 'action', title: 'Extension Action', contexts: ['selection', 'page'] });\n});\n\nchrome.contextMenus.onClicked.addListener((info, tab) => {\n  console.log('Menu clicked:', info);\n});\n`;
      }

      if (selectedFeatures.badge && !backgroundJs.includes('setBadgeText')) {
        backgroundJs += `\nfunction updateBadge(count) {\n  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });\n  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });\n}\n`;
      }

      if (selectedFeatures.autoOpen && !backgroundJs.includes('auto-open')) {
        backgroundJs += `\n// Auto-open side panel\nchrome.tabs.onUpdated.addListener((tabId, changeInfo) => {\n  if (changeInfo.status === 'complete') {\n    chrome.sidePanel.open({ tabId });\n  }\n});\n`;
      }

      if (selectedFeatures.webRequest && !backgroundJs.includes('webRequest')) {
        backgroundJs += `\n// Web request interception\nchrome.webRequest.onBeforeRequest.addListener(\n  (details) => {\n    console.log('Request:', details.url);\n    return {};\n  },\n  { urls: ['<all_urls>'] },\n  ['blocking']\n);\n`;
      }

      if (selectedFeatures.hotReload && !backgroundJs.includes('hot reload')) {
        backgroundJs += `\n// Hot reload for development\nconst filesInDirectory = dir => new Promise(resolve => {\n  dir.createReader().readEntries(entries => {\n    Promise.all(entries.filter(e => e.name[0] !== '.').map(e =>\n      e.isDirectory ? filesInDirectory(e) : new Promise(resolve => e.file(resolve))\n    )).then(files => [].concat(...files)).then(resolve);\n  });\n});\n\nconst timestampForFilesInDirectory = dir =>\n  filesInDirectory(dir).then(files =>\n    files.map(f => f.name + f.lastModifiedDate).join());\n\nconst reload = () => {\n  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {\n    if (tabs[0]) chrome.tabs.reload(tabs[0].id);\n    chrome.runtime.reload();\n  });\n};\n\nconst watchChanges = (dir, lastTimestamp) => {\n  timestampForFilesInDirectory(dir).then(timestamp => {\n    if (!lastTimestamp || (lastTimestamp === timestamp)) {\n      setTimeout(() => watchChanges(dir, timestamp), 1000);\n    } else {\n      reload();\n    }\n  });\n};\n\nchrome.management.getSelf(self => {\n  if (self.installType === 'development') {\n    chrome.runtime.getPackageDirectoryEntry(dir => watchChanges(dir));\n  }\n});\n`;
      }

      currentProject.files['background.js'] = backgroundJs;
    }

    if (selectedFeatures.sidePanel && !currentProject.files['sidepanel.html']) {
      currentProject.files['sidepanel.html'] = `<!DOCTYPE html>
<html>
<head>
  <title>Side Panel</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Side Panel</h1>
  <p>Your side panel content here</p>
  <script src="sidepanel.js"></script>
</body>
</html>`;

      currentProject.files['sidepanel.js'] = `// Side panel logic\nconsole.log('Side panel loaded');\n`;
    }

    if (selectedFeatures.theme) {
      let css = currentProject.files['styles.css'] || '';
      if (!css.includes('[data-theme="dark"]')) {
        css += `\n[data-theme="dark"] body { background: #1a1a1a; color: #e0e0e0; }\n[data-theme="dark"] button { background: #6366f1; }\n`;
        currentProject.files['styles.css'] = css;
      }
    }

    updateFileTree();
    if (currentFile) loadFileIntoEditor(currentFile);
    currentProject.modified = Date.now();

    const injected = Object.entries(selectedFeatures).filter(([_, v]) => v).map(([k, _]) => k).join(', ');
    showStatus(`Features injected: ${injected}`, 'success');

    Object.keys(selectedFeatures).forEach(f => {
      const id = `inject-${f.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      const el = document.getElementById(id);
      if (el) {
        if (el.type === 'checkbox') el.checked = false;
        else if (el.type === 'text' || el.tagName === 'SELECT') el.value = '';
      }
    });
    // Clear radios
    document.querySelectorAll('input[name="inject-host-perms"][value="active-tab"]').forEach(r => r.checked = true);
    document.querySelectorAll('input[name="inject-ext-type"][value="none"]').forEach(r => r.checked = true);
    document.getElementById('inject-framework').value = 'none';
    document.getElementById('inject-custom-hosts').style.display = 'none';

    // Auto-shrink/collapse the injector for better UI flow
    const injectorContent = document.getElementById('feature-injector-content');
    const injectorHeader = document.getElementById('feature-injector-toggle');
    if (injectorContent) injectorContent.style.display = 'none';
    if (injectorHeader) injectorHeader.classList.remove('active');
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

// Save current project
function saveCurrentProject() {
  if (!currentProject) {
    showStatus('No project to save', 'error');
    return;
  }

  currentProject.modified = Date.now();

  if (currentProject.index !== undefined) {
    projects[currentProject.index] = currentProject;
  } else {
    projects.push(currentProject);
  }

  saveProjects();
  renderProjectsList();
  showStatus('Project saved!', 'success');
}

// Test extension
function testExtension() {
  if (!currentProject) {
    showStatus('No project to test', 'error');
    return;
  }

  showStatus('Loading test guide...', 'info');
  switchTab('analyzer');

  const container = document.getElementById('analysis-results');
  const content = document.getElementById('result-content');
  const title = document.getElementById('result-title');

  container.style.display = 'block';
  document.getElementById('d3-container').style.display = 'none';
  content.style.display = 'block';
  title.textContent = 'Deployment Guide';

  content.innerHTML = `
    <div class="analysis-item">
      <h4>How to Load Your Extension</h4>
      <div style="margin-top:10px; border-left: 2px solid var(--accent-color); padding-left:12px; font-size:12px; line-height:1.6; color:var(--text-secondary);">
        1. Open <code style="color:var(--text-primary); background:var(--bg-tertiary); padding:2px 4px;">chrome://extensions/</code> in a new tab.<br>
        2. Enable <strong>Developer mode</strong> in the top right.<br>
        3. Click <strong>Load unpacked</strong>.<br>
        4. Select the directory you exported from ReMixr (Extract the ZIP first).
      </div>
    </div>
    <div class="analysis-item">
      <h4>Iterating</h4>
      <p style="font-size:11px; color:var(--text-dim);">After making changes here, re-export and click the "Reload" icon on the extension card in the Chrome Extensions page.</p>
    </div>
    <button class="btn btn-secondary btn-small" style="margin-top:20px; width:100%;" onclick="document.getElementById('analysis-results').style.display='none'">Dismiss Guide</button>
  `;
}

// Export extension - now handled by export.js
// (function is defined in export.js)

// Update Live Preview (Simple implementation)
function updatePreview() {
  if (!currentProject) return;

  const previewContainer = document.getElementById('preview-container');
  if (!previewContainer || !previewContainer.classList.contains('active')) return;

  const previewFrame = document.getElementById('preview-frame');
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;

  const html = currentProject.files['popup.html'] || '';
  const css = currentProject.files['styles.css'] || '';

  // Inject CSS into HTML for preview
  const styledHtml = html.replace('</head>', `<style>${css}</style></head>`);

  doc.open();
  doc.write(styledHtml);
  doc.close();
}

// ANALYSIS TOOLS
async function toggleInspector(active) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  chrome.tabs.sendMessage(tab.id, {
    action: 'toggleInspector',
    state: active
  });
}

async function runAnalysis(type) {
  showStatus(`Running ${type} scan...`, 'info');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // New psychological analyses use message-based communication with content.js
  const messageBasedAnalyses = ['psyche', 'archetype', 'soul', 'shadow', 'rhetoric', 'emotion'];

  if (messageBasedAnalyses.includes(type)) {
    const actionMap = {
      'psyche': 'analyzePsyche',
      'archetype': 'analyzeArchetype',
      'soul': 'analyzeSoul',
      'shadow': 'analyzeShadow',
      'rhetoric': 'analyzeRhetoric',
      'emotion': 'analyzeEmotion'
    };

    try {
      // First, ensure content script is injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (e) {
        // Content script may already be injected, continue
      }

      // Small delay to ensure content script is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await chrome.tabs.sendMessage(tab.id, { action: actionMap[type] });
      if (response) {
        showStatus(`${type} scan complete`, 'success');
        displayAnalysisResults(type, response);
      } else {
        showStatus(`${type} scan returned no data`, 'error');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      showStatus('Error: ' + error.message, 'error');
    }
    return;
  }

  // Original analyses use script injection
  let func;
  switch (type) {
    case 'structure': func = analyzeStructure; break;
    case 'palette': func = analyzePalette; break;
    case 'assets': func = analyzeAssets; break;
    case 'fonts': func = analyzeFonts; break;
    case 'storage': func = analyzeStorage; break;
    case 'workers': func = analyzeWorkers; break;
    case 'perf': func = analyzePerf; break;
    case 'stack': func = analyzeStack; break;
    case 'visualize': func = analyzeDomTree; break;
    case 'sequence': func = analyzeSequence; break;
    case 'a11y': func = analyzeA11y; break;
    case 'seo': func = analyzeSEO; break;
    case 'code': func = analyzeCode; break;
    case 'net': func = analyzeNetwork; break;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: func
  }, (results) => {
    if (results && results[0]) {
      displayAnalysisResults(type, results[0].result);
    }
  });
}

// Analysis Functions (Injected)
function analyzeStructure() {
  const all = document.querySelectorAll('*');
  const depth = (n) => n.parentNode ? depth(n.parentNode) + 1 : 0;
  let maxDepth = 0;
  all.forEach(el => maxDepth = Math.max(maxDepth, depth(el)));

  // Count tags
  const tags = {};
  all.forEach(el => {
    const tag = el.tagName.toLowerCase();
    tags[tag] = (tags[tag] || 0) + 1;
  });

  // Sort tags
  const sortedTags = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    totalElements: all.length,
    maxDepth,
    topTags: sortedTags,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || 'None'
  };
}

function analyzePalette() {
  const all = document.querySelectorAll('*');
  const colors = {};
  const backgrounds = {};

  all.forEach(el => {
    const style = window.getComputedStyle(el);
    const color = style.color;
    const bg = style.backgroundColor;

    if (color && color !== 'rgba(0, 0, 0, 0)') colors[color] = (colors[color] || 0) + 1;
    if (bg && bg !== 'rgba(0, 0, 0, 0)') backgrounds[bg] = (backgrounds[bg] || 0) + 1;
  });

  const process = (obj) => Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([c]) => c);

  return {
    text: process(colors),
    backgrounds: process(backgrounds)
  };
}

function analyzeAssets() {
  const imageElements = Array.from(document.querySelectorAll('img'));
  const images = imageElements.map(img => ({
    src: img.src,
    width: img.naturalWidth || img.clientWidth,
    height: img.naturalHeight || img.clientHeight,
    alt: img.alt || 'No alt text',
    type: img.src.split('.').pop().split(/[?#]/)[0].toUpperCase() || 'IMG',
    broken: img.naturalWidth === 0 && img.src !== ''
  })).filter(img => img.src);

  // Add SVGs
  const svgs = document.querySelectorAll('svg').length;

  // Background images
  const bgImages = [];
  document.querySelectorAll('*').forEach(el => {
    const bg = window.getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none' && bg.includes('url')) {
      const url = bg.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
      if (url) bgImages.push(url);
    }
  });

  const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(Boolean);
  const css = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href).filter(Boolean);

  return {
    images,
    svgs,
    bgImages: [...new Set(bgImages)],
    imageCount: images.length,
    scriptCount: scripts.length,
    cssCount: css.length,
    brokenCount: images.filter(i => i.broken).length
  };
}

function analyzeFonts() {
  const fonts = {};
  document.querySelectorAll('*').forEach(el => {
    const font = window.getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g, '');
    if (font) fonts[font] = (fonts[font] || 0) + 1;
  });

  return Object.entries(fonts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([f, c]) => ({ font: f, count: c }));
}

function analyzeStorage() {
  const getStorageSize = (storage) => {
    let t = 0;
    for (let x in storage) t += (storage[x].length + x.length) * 2;
    return (t / 1024).toFixed(2);
  };

  return {
    lsCount: localStorage.length,
    lsSize: getStorageSize(localStorage),
    ssCount: sessionStorage.length,
    ssSize: getStorageSize(sessionStorage),
    cookies: document.cookie.split(';').filter(c => c.trim()).length,
    lsItems: Object.entries(localStorage).map(([k, v]) => ({ k, v: v.slice(0, 50) })),
    ssItems: Object.entries(sessionStorage).map(([k, v]) => ({ k, v: v.slice(0, 50) }))
  };
}

async function analyzeWorkers() {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    return {
      count: regs.length,
      active: regs.map(r => ({
        scope: r.scope,
        state: r.active ? r.active.state : 'installing'
      }))
    };
  }
  return { count: 0, notSupported: true };
}

function analyzePerf() {
  const perf = window.performance;
  const nav = perf.getEntriesByType('navigation')[0] || {};
  const res = perf.getEntriesByType('resource');

  const totalJS = res.filter(r => r.initiatorType === 'script').length;
  const totalImg = res.filter(r => r.initiatorType === 'img').length;
  const totalXHR = res.filter(r => r.initiatorType === 'xmlhttprequest' || r.initiatorType === 'fetch').length;

  return {
    loadTime: (nav.loadEventEnd - nav.startTime).toFixed(0),
    domReady: (nav.domContentLoadedEventEnd - nav.startTime).toFixed(0),
    resources: { js: totalJS, img: totalImg, xhr: totalXHR }
  };
}

function analyzeStack() {
  const stack = [];
  if (window.React || document.querySelector('[data-reactroot], [id^="react-"]')) stack.push('React');
  if (window.Vue || document.querySelector('[data-v-]')) stack.push('Vue');
  if (window.angular || document.querySelector('.ng-binding, [ng-app], [data-ng-app]')) stack.push('Angular');
  if (window.jQuery || window.$) stack.push('jQuery');
  if (document.querySelector('meta[name="generator"][content*="WordPress"]')) stack.push('WordPress');
  if (window.Shopify) stack.push('Shopify');
  if (window.next) stack.push('Next.js');
  if (document.getElementById('__nuxt')) stack.push('Nuxt');

  return stack.length ? stack : ['Unknown / Custom'];
}

function analyzeDomTree() {
  // Simplified DOM Tree Extractor for D3
  const traverse = (node, depth = 0) => {
    if (depth > 4) return null; // Limit depth for perf

    // Ignore text nodes, comments, scripts
    if (node.nodeType !== 1) return null;
    const tag = node.tagName.toLowerCase();
    if (['script', 'style', 'svg', 'path', 'g'].includes(tag)) return null;

    const children = [];
    node.childNodes.forEach(child => {
      const c = traverse(child, depth + 1);
      if (c) children.push(c);
    });

    return {
      name: tag,
      id: node.id || '',
      class: node.className && typeof node.className === 'string' ? node.className.split(' ')[0] : '',
      value: children.length + 1,
      children: children.length ? children : null
    };
  };

  return traverse(document.body);
}

function analyzeA11y() {
  const images = Array.from(document.querySelectorAll('img'));
  const missingAlt = images.filter(img => !img.alt).map(img => ({ src: img.src.split('/').pop() || 'Inline', full: img.src }));

  const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
  const smallButtons = buttons.filter(btn => {
    const r = btn.getBoundingClientRect();
    return r.width < 24 || r.height < 24;
  }).map(btn => ({ text: btn.innerText.trim().slice(0, 20) || 'Icon Button', tag: btn.tagName }));

  const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
  const unlabelled = inputs.filter(input => {
    if (input.id && document.querySelector(`label[for="${input.id}"]`)) return false;
    if (input.closest('label')) return false;
    if (input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')) return false;
    return true;
  }).map(input => ({ placeholder: input.placeholder || 'No Placeholder', name: input.name || input.id || 'Unnamed' }));

  return {
    images: { total: images.length, missingAlt },
    buttons: { total: buttons.length, tooSmall: smallButtons },
    inputs: { total: inputs.length, unlabelled },
    ariaElements: document.querySelectorAll('[aria-label], [aria-labelledby], [role]').length
  };
}

function analyzeSEO() {
  const meta = (name) => document.querySelector(`meta[name="${name}"], meta[property="og:${name}"]`)?.content;
  const headings = {};
  ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].forEach(h => {
    headings[h] = document.querySelectorAll(h).length;
  });

  const links = Array.from(document.querySelectorAll('a'));
  const internal = links.filter(a => a.href.includes(window.location.hostname)).length;
  const external = links.length - internal;

  return {
    title: document.title,
    description: meta('description') || 'Missing',
    ogTitle: meta('title') || 'Missing',
    headings,
    links: {
      total: links.length,
      internal,
      external,
      list: links.slice(0, 20).map(a => ({ text: a.innerText.trim().slice(0, 30) || 'Unnamed', href: a.href }))
    },
    lang: document.documentElement.lang || 'Not set',
    meta: Array.from(document.querySelectorAll('meta')).map(m => ({
      name: m.name || m.getAttribute('property') || 'Unknown',
      content: m.content
    })).filter(m => m.content).slice(0, 10)
  };
}

function analyzeSequence() {
  const steps = [];
  const actors = ['User', 'DOM', 'Logic', 'API'];

  // 1. Initial Load
  steps.push({ from: 'User', to: 'DOM', label: 'HTTP GET /', type: 'request' });
  steps.push({ from: 'DOM', to: 'Logic', label: 'Parse HTML & Scripts', type: 'call' });

  // 2. State Detection
  if (window.React || document.querySelector('[data-reactroot]')) {
    steps.push({ from: 'Logic', to: 'DOM', label: 'Mount VirtualDOM', type: 'response' });
  }

  // 3. Data Fetching (Reconstructed from performance entries)
  const resources = window.performance.getEntriesByType('resource');
  const fetches = resources.filter(r => r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest').slice(0, 3);

  fetches.forEach(req => {
    const name = req.name.split('/').pop().split('?')[0] || 'API';
    steps.push({ from: 'Logic', to: 'API', label: `fetch(${name})`, type: 'request' });
    steps.push({ from: 'API', to: 'Logic', label: 'JSON Data', type: 'response' });
    steps.push({ from: 'Logic', to: 'DOM', label: 'Update View', type: 'response' });
  });

  // 4. Interaction Points
  const buttons = document.querySelectorAll('button').length;
  if (buttons > 0) {
    steps.push({ from: 'User', to: 'DOM', label: `Click Interaction (${buttons} entry pts)`, type: 'call' });
    steps.push({ from: 'DOM', to: 'Logic', label: 'Event Handler', type: 'call' });
  }

  return { actors, steps };
}

function analyzeCode() {
  const scripts = Array.from(document.querySelectorAll('script'));
  const data = {
    total: scripts.length,
    external: scripts.filter(s => s.src).length,
    inline: scripts.filter(s => !s.src).length,
    modules: scripts.filter(s => s.type === 'module').length,
    async: scripts.filter(s => s.async).length,
    defer: scripts.filter(s => s.defer).length,
    sources: scripts.filter(s => s.src).map(s => {
      try {
        const url = new URL(s.src);
        return {
          host: url.hostname,
          path: url.pathname.split('/').pop() || 'index',
          size: '?' // Browser doesn't expose script size easily without Fetch
        };
      } catch (e) { return { host: 'unknown', path: s.src }; }
    })
  };
  return data;
}

function analyzeNetwork() {
  const resources = window.performance.getEntriesByType('resource');
  const apiCalls = resources.filter(r => r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest');

  return apiCalls.map(r => ({
    name: r.name ? r.name.split('/').pop().split('?')[0] : 'Unknown',
    url: r.name,
    type: r.initiatorType.toUpperCase(),
    duration: Math.round(r.duration),
    size: r.transferSize ? (r.transferSize / 1024).toFixed(1) + ' KB' : 'Cached',
    status: r.responseStatus || '200?'
  }));
}

// Render Results
function displayAnalysisResults(type, data) {
  const container = document.getElementById('analysis-results');
  const content = document.getElementById('result-content');
  const d3Container = document.getElementById('d3-container');
  const title = document.getElementById('result-title');

  container.style.display = 'flex';
  d3Container.style.display = type === 'visualize' ? 'flex' : 'none';
  content.style.display = type === 'visualize' ? 'none' : 'block';
  title.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Audit`;

  window.SITE_CONTEXT = window.SITE_CONTEXT || {};
  window.SITE_CONTEXT[type] = data;

  if (type === 'sequence') { renderSequenceDiagram(data); return; }
  if (type === 'visualize') { setTimeout(() => renderD3Graph(data), 100); return; }

  let html = '';

  const createDeepDive = (id, statsHtml, detailHtml, options = {}) => {
    const hasSearch = options.search !== false;
    const hasExport = options.export !== false;

    return `
    <div class="analysis-item">
      <div class="analysis-header">
        <div class="header-metrics">${statsHtml}</div>
        ${hasSearch || hasExport ? `
          <div class="dive-actions">
            ${hasSearch ? '<input type="text" class="search-box-inline" placeholder="Search..." data-search="' + id + '">' : ''}
            ${hasExport ? '<button class="dive-btn" data-action="export" data-dive="' + id + '">Export</button>' : ''}
            <button class="dive-btn" data-action="copy" data-dive="${id}">Copy</button>
          </div>
        ` : ''}
      </div>
      ${options.title ? '<div class="section-title">' + options.title + '</div>' : ''}
      <div class="dive-content" data-content="${id}">
        ${detailHtml}
      </div>
    </div>
  `;
  };

  if (type === 'structure') {
    const detailHtml = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">${data.totalElements}</span>
          <span class="stat-label">Total Nodes</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.maxDepth}</span>
          <span class="stat-label">Max Depth</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.topTags.length}</span>
          <span class="stat-label">Tag Types</span>
        </div>
      </div>
      <div class="chart-container">
        <div class="bar-chart">
          ${data.topTags.slice(0, 10).map(([tag, count]) => {
      const pct = (count / data.totalElements * 100).toFixed(1);
      return `
              <div class="bar-chart-item">
                <div class="bar-chart-label">&lt;${tag}&gt;</div>
                <div class="bar-chart-bar">
                  <div class="bar-chart-fill" style="width: ${pct}%">${count}</div>
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Element</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${data.topTags.map(([tag, count]) => `
              <tr>
                <td>&lt;${tag}&gt;</td>
                <td>${count}</td>
                <td>${(count / data.totalElements * 100).toFixed(2)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    html = createDeepDive('struct',
      `<strong>${data.totalElements}</strong> Nodes · <strong>${data.maxDepth}</strong> Depth · <strong>${data.topTags.length}</strong> Types`,
      detailHtml,
      { title: 'DOM Structure Analysis', search: true, export: true }
    );
  } else if (type === 'palette') {
    const detailHtml = `
      <div class="dive-section">
        <div class="palette-group">
          <strong>Text Colors (${data.text.length})</strong>
          <div class="swatches">
            ${data.text.map(c => `<div class="swatch" style="background:${c}" title="${c}" data-color="${c}"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="dive-section">
        <div class="palette-group">
          <strong>Background Colors (${data.backgrounds.length})</strong>
          <div class="swatches">
            ${data.backgrounds.map(c => `<div class="swatch" style="background:${c}" title="${c}" data-color="${c}"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Color Distribution</h5>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">${data.text.length + data.backgrounds.length}</span>
            <span class="stat-label">Total Colors</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.text.length}</span>
            <span class="stat-label">Text</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.backgrounds.length}</span>
            <span class="stat-label">Backgrounds</span>
          </div>
        </div>
      </div>
    `;

    html = createDeepDive('palette-dive',
      `<strong>${data.text.length}</strong> Text · <strong>${data.backgrounds.length}</strong> Background · <strong>${data.text.length + data.backgrounds.length}</strong> Total`,
      detailHtml,
      { title: 'Color Palette', search: false, export: true }
    );
  } else if (type === 'assets') {
    const detailHtml = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">${data.imageCount}</span>
          <span class="stat-label">Images</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.svgs}</span>
          <span class="stat-label">SVG</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.cssCount}</span>
          <span class="stat-label">Stylesheets</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.jsCount || 0}</span>
          <span class="stat-label">Scripts</span>
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Resource Inventory</h5>
        </div>
        <div class="data-table-wrapper" style="max-height: 350px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Resource</th>
                <th>Dimensions</th>
              </tr>
            </thead>
            <tbody>
              ${data.images.slice(0, 50).map(img => `
                <tr>
                  <td><span class="metric-badge"><span class="icon">🖼️</span> IMG</span></td>
                  <td style="font-size:10px; font-family: var(--mono-font);">${img.src.split('/').pop().slice(0, 40)}</td>
                  <td><span class="metric-badge">${img.width}×${img.height}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    html = createDeepDive('assets-overview',
      `<strong>${data.imageCount + data.svgs}</strong> Images · <strong>${data.cssCount}</strong> CSS · <strong>${data.jsCount || 0}</strong> JS`,
      detailHtml,
      { title: 'Asset Analysis', search: true, export: true }
    );
  } else if (type === 'storage') {
    const detailHtml = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">${data.lsSize} KB</span>
          <span class="stat-label">LocalStorage</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.cookies}</span>
          <span class="stat-label">Cookies</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.lsItems.length}</span>
          <span class="stat-label">LS Items</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.ssItems.length}</span>
          <span class="stat-label">SS Items</span>
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>LocalStorage</h5>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${data.lsItems.length > 0 ? data.lsItems.map(i => `
                <tr>
                  <td>${i.k}</td>
                  <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${i.v}</td>
                </tr>
              `).join('') : '<tr><td colspan="2" style="text-align: center; opacity: 0.5;">Empty</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>SessionStorage</h5>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${data.ssItems.length > 0 ? data.ssItems.map(i => `
                <tr>
                  <td>${i.k}</td>
                  <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${i.v}</td>
                </tr>
              `).join('') : '<tr><td colspan="2" style="text-align: center; opacity: 0.5;">Empty</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    html = createDeepDive('storage-dive',
      `<span>LS: <strong>${data.lsSize} KB</strong></span> · <span>Cookies: <strong>${data.cookies}</strong></span> · <span>Items: <strong>${data.lsItems.length + data.ssItems.length}</strong></span>`,
      detailHtml,
      { title: 'Storage Analysis', search: true, export: true }
    );
  } else if (type === 'perf') {
    const getLoadTimeColor = (ms) => {
      if (ms < 1000) return 'severity-low';
      if (ms < 3000) return 'severity-med';
      return 'severity-high';
    };

    const detailHtml = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value ${getLoadTimeColor(data.loadTime)}">${data.loadTime}ms</span>
          <span class="stat-label">Load Time</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.domReady}ms</span>
          <span class="stat-label">DOM Ready</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.resources.js}</span>
          <span class="stat-label">JS Files</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.resources.img}</span>
          <span class="stat-label">Images</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.resources.xhr}</span>
          <span class="stat-label">XHR</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.resources.css || 0}</span>
          <span class="stat-label">CSS</span>
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Performance Timeline</h5>
        </div>
        <div class="chart-container">
          <div class="bar-chart">
            <div class="bar-chart-item">
              <div class="bar-chart-label">DNS</div>
              <div class="bar-chart-bar">
                <div class="bar-chart-fill" style="width: ${Math.min((data.dns || 100) / 10, 100)}%">${data.dns || 'N/A'}</div>
              </div>
            </div>
            <div class="bar-chart-item">
              <div class="bar-chart-label">Connect</div>
              <div class="bar-chart-bar">
                <div class="bar-chart-fill" style="width: ${Math.min((data.connect || 200) / 10, 100)}%">${data.connect || 'N/A'}</div>
              </div>
            </div>
            <div class="bar-chart-item">
              <div class="bar-chart-label">DOM Ready</div>
              <div class="bar-chart-bar">
                <div class="bar-chart-fill" style="width: ${Math.min(data.domReady / 50, 100)}%">${data.domReady}ms</div>
              </div>
            </div>
            <div class="bar-chart-item">
              <div class="bar-chart-label">Load</div>
              <div class="bar-chart-bar">
                <div class="bar-chart-fill" style="width: ${Math.min(data.loadTime / 50, 100)}%; background: ${data.loadTime < 1000 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}">${data.loadTime}ms</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    html = createDeepDive('perf-metrics',
      `<span>Load: <span class="${getLoadTimeColor(data.loadTime)}">${data.loadTime}ms</span></span> · <span>DOM: <strong>${data.domReady}ms</strong></span> · <span>Resources: <strong>${data.resources.js + data.resources.img + data.resources.xhr}</strong></span>`,
      detailHtml,
      { title: 'Performance Metrics', search: false, export: true }
    );
  } else if (type === 'a11y') {
    const totalFlaws = data.images.missingAlt.length + data.buttons.tooSmall.length + data.inputs.unlabelled.length;
    const score = Math.max(0, 100 - (totalFlaws * 5));
    const getScoreColor = (score) => {
      if (score >= 80) return 'severity-low';
      if (score >= 50) return 'severity-med';
      return 'severity-high';
    };

    const detailHtml = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value ${getScoreColor(score)}">${score}</span>
          <span class="stat-label">A11y Score</span>
        </div>
        <div class="stat-card">
          <span class="stat-value ${totalFlaws > 0 ? 'severity-high' : 'severity-low'}">${totalFlaws}</span>
          <span class="stat-label">Issues</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.images.missingAlt.length}</span>
          <span class="stat-label">Missing Alt</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.buttons.tooSmall.length}</span>
          <span class="stat-label">Small Buttons</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.inputs.unlabelled.length}</span>
          <span class="stat-label">Unlabelled</span>
        </div>
      </div>
      ${totalFlaws > 0 ? `
        <div class="dive-section">
          <div class="dive-section-header">
            <h5>Accessibility Issues</h5>
          </div>
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Issue</th>
                  <th>Element</th>
                </tr>
              </thead>
              <tbody>
                ${data.images.missingAlt.map(img => `
                  <tr>
                    <td><span class="severity-high">HIGH</span></td>
                    <td>Missing Alt Text</td>
                    <td style="font-size:10px; font-family: var(--mono-font);">${img.src.split('/').pop().slice(0, 30)}</td>
                  </tr>
                `).join('')}
                ${data.buttons.tooSmall.map(btn => `
                  <tr>
                    <td><span class="severity-med">MEDIUM</span></td>
                    <td>Button Too Small</td>
                    <td style="font-size:10px;">${btn.text || '(no text)'}</td>
                  </tr>
                `).join('')}
                ${data.inputs.unlabelled.map(inp => `
                  <tr>
                    <td><span class="severity-med">MEDIUM</span></td>
                    <td>Input Not Labelled</td>
                    <td style="font-size:10px;">${inp.name || inp.type || 'input'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <div class="dive-section" style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
          <div style="color: var(--success-color); font-size: 16px; font-weight: 700;">Accessibility Compliant</div>
          <div style="color: var(--text-dim); margin-top: 8px;">No major issues detected</div>
        </div>
      `}
    `;

    html = createDeepDive('a11y-audit',
      `<span>Score: <span class="${getScoreColor(score)}">${score}/100</span></span> · <span>Issues: <span class="${totalFlaws > 0 ? 'severity-high' : 'severity-low'}">${totalFlaws}</span></span>`,
      detailHtml,
      { title: 'Accessibility Audit', search: true, export: true }
    );
  } else if (type === 'seo') {
    html = createDeepDive('seo-meta',
      `<span>Title: <span style="font-size:9px; color:var(--accent-color)">${data.title}</span></span>`,
      `<div class="stat-row"><span>Description</span> <span style="font-size:9px; color:var(--text-dim)">${data.description}</span></div>
        <h5 style="margin-top:12px; font-size:10px; color:var(--accent-color)">Meta & Link Profile</h5>
        <table class="data-table">
          ${data.meta.map(m => `<tr><td>${m.name}</td><td>${m.content}</td></tr>`).join('')}
          ${data.links.list.map(l => `<tr><td>LINK</td><td>${l.text}</td></tr>`).join('')}
        </table>`
    );
  } else if (type === 'code') {
    const extPct = Math.round((data.external / data.total) * 100) || 0;
    html = createDeepDive('code-trace',
      `<span>Total Scripts: <strong>${data.total}</strong></span> · <span>External: <strong>${extPct}%</strong></span>`,
      `<div style="height:6px; display:flex; border-radius:2px; overflow:hidden; margin:8px 0; background:#333;">
          <div style="width:${extPct}%; background:var(--accent-color);"></div>
          <div style="width:${100 - extPct}%; background:orange;"></div>
        </div>
        <div style="flex:1; overflow-y:auto; background:rgba(0,0,0,0.2); border-radius:var(--radius); padding:10px;">
          ${data.sources.map(s => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:6px;">
              <div>
                <div style="color:var(--accent-color); font-weight:bold; font-size:11px;">${s.host}</div>
                <div style="opacity:0.5; font-size:9px;">${s.path}</div>
              </div>
              <span class="tag-badge" style="background:#222; margin:0;">JS</span>
            </div>
          `).join('')}
        </div>`
    );
  } else if (type === 'net' || type === 'network') {
    if (data.length === 0) {
      html = '<div class="empty-state">No API traffic detected since page load.</div>';
    } else {
      html = createDeepDive('net-log',
        `<span>Active Traffic: <strong>${data.length} Requests</strong></span>`,
        `<div style="flex:1; overflow-y:auto; padding-right:4px;">
            ${data.map(req => `
              <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:var(--radius); margin-bottom:8px; border-left:3px solid ${req.type === 'FETCH' ? '#10b981' : '#6366f1'};">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                  <strong style="font-size:12px; color:#fff;">${req.name}</strong>
                  <span class="tag-badge" style="background:#222; font-size:9px; border-color:#444;">${req.type}</span>
                </div>
                <div style="font-size:10px; opacity:0.6; word-break:break-all; margin-bottom:8px; font-family:var(--mono-font);">${req.url}</div>
                <div style="display:flex; gap:12px; font-size:11px;">
                  <span title="Duration">⏱️ ${req.duration}ms</span>
                  <span title="Size">📦 ${req.size}</span>
                  <span style="color:#4ade80" title="Status">✓ ${req.status}</span>
                </div>
              </div>
            `).join('')}
          </div>`
      );
    }
  } else if (type === 'stack') {
    html = createDeepDive('stack-tech',
      `<strong>Detected Technologies:</strong>`,
      `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">
          ${data.map(tech => `
            <div class="tag-badge" style="background:var(--accent-color); color: white; padding: 4px 10px; font-size: 11px;">
              ${tech}
            </div>
          `).join('')}
        </div>`,
      { title: 'Technology Stack', search: false, export: true }
    );
  } else if (type === 'psyche') {
    const totalPatterns = data.darkPatterns.length + data.persuasionTechniques.length;
    const loadScore = Math.max(0, 100 - Math.floor(data.cognitiveLoad / 10));

    const detailHtml = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value severity-${data.darkPatterns.length > 5 ? 'high' : data.darkPatterns.length > 2 ? 'med' : 'low'}">${data.darkPatterns.length}</span>
          <span class="stat-label">Dark Patterns</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.persuasionTechniques.length}</span>
          <span class="stat-label">Persuasion Tech.</span>
        </div>
        <div class="stat-card">
          <span class="stat-value severity-${loadScore < 50 ? 'high' : loadScore < 75 ? 'med' : 'low'}">${data.cognitiveLoad}</span>
          <span class="stat-label">Cognitive Load</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.urgencySignals}</span>
          <span class="stat-label">Urgency Signals</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.scarcity}</span>
          <span class="stat-label">Scarcity</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.socialProof}</span>
          <span class="stat-label">Social Proof</span>
        </div>
      </div>
      ${data.darkPatterns.length > 0 ? `
        <div class="dive-section">
          <div class="dive-section-header">
            <h5>⚠️ Dark Patterns Detected</h5>
          </div>
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Pattern Type</th>
                  <th>Trigger</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                ${data.darkPatterns.map(p => `
                  <tr>
                    <td style="font-weight: 600; text-transform: capitalize;">${p.type.replace(/-/g, ' ')}</td>
                    <td style="font-size: 11px;">"${p.trigger}"</td>
                    <td><span class="severity-${p.severity}">${p.severity.toUpperCase()}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Persuasion Techniques</h5>
        </div>
        ${data.persuasionTechniques.map(tech => `
          <div class="data-row">
            <span class="label">${tech.type.replace(/-/g, ' ')}</span>
            <span class="value">${tech.instances} instances</span>
          </div>
        `).join('')}
      </div>
      ${data.attentionEngineering.length > 0 ? `
        <div class="dive-section">
          <div class="dive-section-header">
            <h5>Attention Engineering</h5>
          </div>
          ${data.attentionEngineering.map(item => `
            <div class="metric-badge">
              <span class="icon">⚡</span>
              ${item.type.replace(/-/g, ' ')}: ${item.count}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    html = createDeepDive('psyche-analysis',
      `<span>Patterns: <strong class="severity-${totalPatterns > 10 ? 'high' : totalPatterns > 5 ? 'med' : 'low'}">${totalPatterns}</strong></span> · <span>Load: <strong>${data.cognitiveLoad}</strong></span> · <span>Dark: <strong class="severity-${data.darkPatterns.length > 5 ? 'high' : data.darkPatterns.length > 2 ? 'med' : 'low'}">${data.darkPatterns.length}</strong></span>`,
      detailHtml,
      { title: 'Psychological Pattern Analysis', search: true, export: true }
    );
  } else if (type === 'archetype') {
    const detailHtml = `
      <div class="stats-grid">
        ${data.primary ? `
          <div class="stat-card">
            <span class="stat-value">${data.primary.type.toUpperCase()}</span>
            <span class="stat-label">Primary Archetype</span>
          </div>
        ` : ''}
        ${data.secondary ? `
          <div class="stat-card">
            <span class="stat-value" style="font-size: 24px;">${data.secondary.type.toUpperCase()}</span>
            <span class="stat-label">Secondary</span>
          </div>
        ` : ''}
        ${data.tertiary ? `
          <div class="stat-card">
            <span class="stat-value" style="font-size: 20px;">${data.tertiary.type.toUpperCase()}</span>
            <span class="stat-label">Tertiary</span>
          </div>
        ` : ''}
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Brand Personality</h5>
        </div>
        <div style="padding: 20px; background: rgba(99, 102, 241, 0.1); border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.3); margin-bottom: 20px;">
          <div style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
            ${data.personality}
          </div>
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Archetype Scores</h5>
        </div>
        <div class="bar-chart">
          ${Object.entries(data.allScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([archetype, score]) => {
          const maxScore = Math.max(...Object.values(data.allScores));
          const pct = (score / maxScore * 100).toFixed(1);
          return `
                <div class="bar-chart-item">
                  <div class="bar-chart-label">${archetype.charAt(0).toUpperCase() + archetype.slice(1)}</div>
                  <div class="bar-chart-bar">
                    <div class="bar-chart-fill" style="width: ${pct}%">${score}</div>
                  </div>
                </div>
              `;
        }).join('')}
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Dominant Colors</h5>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <strong style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 8px;">Backgrounds</strong>
            <div class="swatches">
              ${data.dominantColors.backgrounds.map(([color]) => `
                <div class="swatch" style="background: ${color}" title="${color}" data-color="${color}"></div>
              `).join('')}
            </div>
          </div>
          <div>
            <strong style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 8px;">Text</strong>
            <div class="swatches">
              ${data.dominantColors.text.map(([color]) => `
                <div class="swatch" style="background: ${color}" title="${color}" data-color="${color}"></div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    html = createDeepDive('archetype-analysis',
      `<span>Primary: <strong>${data.primary ? data.primary.type.toUpperCase() : 'N/A'}</strong></span> · <span>Score: <strong>${data.primary ? data.primary.score : 0}</strong></span>`,
      detailHtml,
      { title: 'Brand Archetype Analysis', search: false, export: true }
    );
  } else if (type === 'soul') {
    const authenticityScore = Math.max(0, Math.min(100, data.authenticity));
    const humanScore = Math.round((data.humanCentered / Math.max(data.corporateness, 1)) * 100);

    const detailHtml = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value severity-${authenticityScore > 70 ? 'low' : authenticityScore > 40 ? 'med' : 'high'}">${authenticityScore}</span>
          <span class="stat-label">Authenticity</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.transparencyScore}</span>
          <span class="stat-label">Transparency</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.coherence}</span>
          <span class="stat-label">Coherence</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.trustSignals}</span>
          <span class="stat-label">Trust Signals</span>
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Core Identity</h5>
        </div>
        <div class="data-row">
          <span class="label">Primary Intention</span>
          <span class="value">${data.intention}</span>
        </div>
        <div class="data-row">
          <span class="label">Purpose</span>
          <span class="value">${data.purpose}</span>
        </div>
        <div class="data-row">
          <span class="label">Orientation</span>
          <span class="value">${data.humanCentered > data.corporateness ? 'Human-Centered' : 'Corporate-Centered'}</span>
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Human vs Corporate Balance</h5>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${humanScore}%; background: ${humanScore > 60 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'}"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: var(--text-dim);">
          <span>Corporate: ${data.corporateness}</span>
          <span>Human: ${data.humanCentered}</span>
        </div>
      </div>
    `;

    html = createDeepDive('soul-analysis',
      `<span>Authenticity: <strong class="severity-${authenticityScore > 70 ? 'low' : authenticityScore > 40 ? 'med' : 'high'}">${authenticityScore}</strong></span> · <span>Intent: <strong>${data.intention}</strong></span> · <span>Trust: <strong>${data.trustSignals}</strong></span>`,
      detailHtml,
      { title: 'Soul Analysis', search: false, export: true }
    );
  } else if (type === 'shadow') {
    const shadowScore = data.deceptivePatterns.length + data.manipulativeDesign.length + (data.hiddenCosts ? 5 : 0);

    const detailHtml = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value severity-${shadowScore > 10 ? 'high' : shadowScore > 5 ? 'med' : 'low'}">${shadowScore}</span>
          <span class="stat-label">Shadow Score</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.invisibleTrackers}</span>
          <span class="stat-label">Trackers</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.deceptivePatterns.length}</span>
          <span class="stat-label">Deceptive Patterns</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.hiddenElements.length}</span>
          <span class="stat-label">Hidden Elements</span>
        </div>
      </div>
      ${data.manipulativeDesign.length > 0 ? `
        <div class="dive-section">
          <div class="dive-section-header">
            <h5>🎭 Manipulative Design</h5>
          </div>
          ${data.manipulativeDesign.map(design => `
            <div class="metric-badge">
              <span class="icon">⚠️</span>
              ${design}
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${data.deceptivePatterns.length > 0 ? `
        <div class="dive-section">
          <div class="dive-section-header">
            <h5>Deceptive Patterns</h5>
          </div>
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Pattern</th>
                  <th>Element</th>
                </tr>
              </thead>
              <tbody>
                ${data.deceptivePatterns.map(pattern => `
                  <tr>
                    <td>${pattern.type}</td>
                    <td>${pattern.element}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Data Collection</h5>
        </div>
        ${data.dataCollection.length > 0 ?
        data.dataCollection.map(type => `
            <div class="metric-badge">
              ${type}
            </div>
          `).join('') :
        '<div style="color: var(--text-dim); text-align: center; padding: 20px;">No explicit data collection detected</div>'
      }
      </div>
      ${data.hiddenCosts ? `
        <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3); margin-top: 16px;">
          <div style="font-weight: 600; color: var(--danger-color); margin-bottom: 4px;">⚠️ Hidden Costs Detected</div>
          <div style="font-size: 12px; color: var(--text-secondary);">This site may contain hidden pricing or fees</div>
        </div>
      ` : ''}
    `;

    html = createDeepDive('shadow-analysis',
      `<span>Shadow: <strong class="severity-${shadowScore > 10 ? 'high' : shadowScore > 5 ? 'med' : 'low'}">${shadowScore}</strong></span> · <span>Trackers: <strong>${data.invisibleTrackers}</strong></span> · <span>Deceptive: <strong>${data.deceptivePatterns.length}</strong></span>`,
      detailHtml,
      { title: 'Shadow Analysis', search: true, export: true }
    );
  } else if (type === 'rhetoric') {
    const detailHtml = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">${data.readingLevel}</span>
          <span class="stat-label">Reading Ease</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.wordCount}</span>
          <span class="stat-label">Words</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${Math.round(data.avgSentenceLength)}</span>
          <span class="stat-label">Avg Sentence</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.imperatives}</span>
          <span class="stat-label">Commands</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.questions}</span>
          <span class="stat-label">Questions</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${data.emotionalWords}</span>
          <span class="stat-label">Emotional Words</span>
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Linguistic Profile</h5>
        </div>
        <div class="data-row">
          <span class="label">Tone</span>
          <span class="value">${data.tone}</span>
        </div>
        <div class="data-row">
          <span class="label">Command Density</span>
          <span class="value">${((data.imperatives / data.wordCount) * 100).toFixed(2)}%</span>
        </div>
        <div class="data-row">
          <span class="label">Question Density</span>
          <span class="value">${((data.questions / data.wordCount) * 100).toFixed(2)}%</span>
        </div>
      </div>
      ${data.rhetoricalDevices.length > 0 ? `
        <div class="dive-section">
          <div class="dive-section-header">
            <h5>Rhetorical Devices</h5>
          </div>
          ${data.rhetoricalDevices.map(device => `
            <div class="metric-badge">
              ${device}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    html = createDeepDive('rhetoric-analysis',
      `<span>Tone: <strong>${data.tone}</strong></span> · <span>Reading: <strong>${data.readingLevel}</strong></span> · <span>Commands: <strong>${data.imperatives}</strong></span>`,
      detailHtml,
      { title: 'Rhetorical Analysis', search: false, export: true }
    );
  } else if (type === 'emotion') {
    const detailHtml = `
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Emotional Design Profile</h5>
        </div>
        <div class="data-row">
          <span class="label">Typography Mood</span>
          <span class="value">${data.typographyMood}</span>
        </div>
        <div class="data-row">
          <span class="label">Visual Weight</span>
          <span class="value">${data.visualWeight}</span>
        </div>
        <div class="data-row">
          <span class="label">Emotional Intent</span>
          <span class="value">${data.emotionalIntent}</span>
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Spacing Psychology</h5>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">${data.spacingAnalysis.avgPadding}px</span>
            <span class="stat-label">Avg Padding</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.spacingAnalysis.avgMargin}px</span>
            <span class="stat-label">Avg Margin</span>
          </div>
        </div>
        <div style="padding: 16px; background: rgba(99, 102, 241, 0.1); border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.3); margin-top: 12px;">
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Feeling</div>
          <div style="font-size: 13px; color: var(--text-secondary);">${data.spacingAnalysis.feeling}</div>
        </div>
      </div>
      <div class="dive-section">
        <div class="dive-section-header">
          <h5>Color Psychology</h5>
        </div>
        ${Object.entries(data.colorPsychology).map(([color, emotion]) => `
          <div class="data-row">
            <span class="label" style="text-transform: capitalize;">${color}</span>
            <span class="value">${emotion}</span>
          </div>
        `).join('')}
      </div>
      ${data.designPersonality.length > 0 ? `
        <div class="dive-section">
          <div class="dive-section-header">
            <h5>Design Personality</h5>
          </div>
          ${data.designPersonality.map(trait => `
            <div class="metric-badge">
              ${trait}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    html = createDeepDive('emotion-analysis',
      `<span>Mood: <strong>${data.typographyMood}</strong></span> · <span>Intent: <strong>${data.emotionalIntent}</strong></span> · <span>Space: <strong>${data.spacingAnalysis.feeling}</strong></span>`,
      detailHtml,
      { title: 'Emotional Design Analysis', search: false, export: true }
    );
  }

  content.innerHTML = html;

  // Add search functionality
  content.querySelectorAll('.search-box-inline').forEach(input => {
    input.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const diveId = e.target.dataset.search;
      const diveContent = document.querySelector(`[data-content="${diveId}"]`);

      if (diveContent) {
        const items = diveContent.querySelectorAll('tr, .data-row, .bar-chart-item');
        items.forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
      }
    });
  });

  // Add copy functionality
  content.querySelectorAll('[data-action="copy"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const diveId = btn.dataset.dive;
      const diveContent = document.querySelector(`[data-content="${diveId}"]`);
      if (diveContent) {
        const text = diveContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
          showStatus('Copied to clipboard!', 'success');
          btn.innerHTML = '✓ Copied';
          setTimeout(() => {
            btn.innerHTML = '📋 Copy';
          }, 2000);
        });
      }
    });
  });

  // Add export functionality
  content.querySelectorAll('[data-action="export"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const diveId = btn.dataset.dive;
      const diveContent = document.querySelector(`[data-content="${diveId}"]`);
      if (diveContent) {
        const text = diveContent.innerText;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${diveId}-data-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showStatus('Exported successfully!', 'success');
      }
    });
  });

  // Add color swatch click to copy
  content.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color || swatch.style.background;
      navigator.clipboard.writeText(color).then(() => {
        showStatus(`Copied ${color}`, 'success');
      });
    });
  });

  // Add table sorting
  content.querySelectorAll('.data-table th').forEach((th, index) => {
    th.addEventListener('click', () => {
      const table = th.closest('table');
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const isNumeric = rows[0]?.cells[index]?.textContent.match(/^\\d+/);

      rows.sort((a, b) => {
        const aVal = a.cells[index]?.textContent || '';
        const bVal = b.cells[index]?.textContent || '';

        if (isNumeric) {
          return parseFloat(bVal) - parseFloat(aVal);
        }
        return aVal.localeCompare(bVal);
      });

      rows.forEach(row => tbody.appendChild(row));
      showStatus('Table sorted', 'info');
    });
  });
}

function renderD3Graph(rootData) {
  const container = document.getElementById('d3-container');

  const draw = () => {
    container.innerHTML = '';
    const rect = container.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) { setTimeout(draw, 50); return; }

    const width = rect.width;
    const height = rect.height;
    const nodes = [];
    const links = [];

    function flatten(node, parentIndex = null) {
      const i = nodes.length;
      nodes.push({ id: i, name: node.name, class: node.class, r: Math.min(node.value * 2 + 5, 25) });
      if (parentIndex !== null) links.push({ source: parentIndex, target: i });
      if (node.children) node.children.forEach(c => flatten(c, i));
    }
    flatten(rootData);

    const maxNodes = 600;
    if (nodes.length > maxNodes) { nodes.length = maxNodes; links.length = maxNodes; }

    const svg = d3.select("#d3-container").append("svg")
      .attr("width", "100%").attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`).style("cursor", "move");

    const g = svg.append("g");
    svg.call(d3.zoom().on("zoom", ({ transform }) => g.attr("transform", transform)));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(50))
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => d.r + 5));

    const link = g.append("g").attr("stroke", "#475569").attr("stroke-opacity", 0.6)
      .selectAll("line").data(links).join("line");

    const node = g.append("g").selectAll("circle").data(nodes).join("circle")
      .attr("r", d => d.r)
      .attr("fill", d => d.name === 'div' ? '#667eea' : d.name === 'a' ? '#10b981' : d.name === 'img' ? '#f43f5e' : '#cbd5e1')
      .call(d3.drag()
        .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    const label = g.append("g").selectAll("text").data(nodes).join("text")
      .text(d => d.name).attr("font-size", "8px").attr("fill", "#fff")
      .attr("text-anchor", "middle").style("pointer-events", "none");

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("cx", d => d.x).attr("cy", d => d.y);
      label.attr("x", d => d.x).attr("y", d => d.y + 3);
    });
  };
  draw();
}

// MACGYVER TOOLS (OPERATIONS)
async function runMacGyver(action) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  showStatus(`Running ${action}...`, 'info');

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: MacGyverTools[action]
  }, (results) => {
    if (results && results[0] && results[0].result) {
      const result = results[0].result;

      // Handle special command prefixes from tab
      if (typeof result === 'string') {
        if (result.startsWith('COPIED:')) {
          showStatus(result.replace('COPIED:', ''), 'success');
        } else if (result.startsWith('COPY_ME:')) {
          const textToCopy = result.replace('COPY_ME:', '');
          navigator.clipboard.writeText(textToCopy).then(() => {
            showStatus('Copied to clipboard!', 'success');
          }).catch(err => {
            console.error('Clipboard error:', err);
            showStatus('Copy failed - use console', 'error');
          });
        } else if (result === 'SCREENSHOT') {
          chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `screenshot_${Date.now()}.png`;
            a.click();
            showStatus('Screenshot saved', 'success');
          });
        } else {
          showStatus('Operation complete', 'success');
        }
      } else {
        showStatus('Operation complete', 'success');
      }
    }
  });
}

const MacGyverTools = {
  // Reality Distortion
  toggleEditMode: () => {
    document.designMode = document.designMode === 'on' ? 'off' : 'on';
    return document.designMode === 'on' ? 'COPIED:Edit Mode ON' : 'COPIED:Edit Mode OFF';
  },

  zapElement: () => {
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.target.remove();
      document.removeEventListener('click', handler, true);
      document.removeEventListener('mouseover', hoverHandler, true);
      if (window.zapHoverEl) window.zapHoverEl.style.outline = '';
    };
    const hoverHandler = (e) => {
      if (window.zapHoverEl) window.zapHoverEl.style.outline = '';
      window.zapHoverEl = e.target;
      e.target.style.outline = '2px solid red';
    };
    document.addEventListener('click', handler, true);
    document.addEventListener('mouseover', hoverHandler, true);
    return 'COPIED:Click element to ZAP';
  },

  toggleWireframe: () => {
    if (window.wireframeActive) {
      const style = document.getElementById('remixr-wireframe');
      if (style) style.remove();
      window.wireframeActive = false;
    } else {
      const style = document.createElement('style');
      style.id = 'remixr-wireframe';
      style.textContent = `* { outline: 1px solid rgba(100, 100, 255, 0.5) !important; background: rgba(0, 0, 0, 0.02)!important; color: black!important; }`;
      document.head.appendChild(style);
      window.wireframeActive = true;
    }
  },

  toggleImages: () => {
    document.querySelectorAll('img, video, canvas, svg').forEach(el => {
      el.style.opacity = el.style.opacity === '0' ? '1' : '0';
    });
  },

  // Lock Picking
  showPasswords: () => {
    let count = 0;
    document.querySelectorAll('input[type="password"]').forEach(el => {
      el.type = 'text';
      el.style.backgroundColor = '#fee2e2';
      count++;
    });
    return `COPIED:Unmasked ${count} fields`;
  },

  enableInputs: () => {
    let count = 0;
    document.querySelectorAll('input, button, select, textarea').forEach(el => {
      if (el.disabled || el.readOnly) {
        el.disabled = false;
        el.readOnly = false;
        el.style.border = '2px solid #4ade80';
        count++;
      }
    });
    return `COPIED:Enabled ${count} content controls`;
  },

  killStickies: () => {
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') {
        el.style.position = 'relative';
        el.style.zIndex = 'auto';
      }
    });
    document.body.style.overflow = 'auto';
    return 'COPIED:Stickies flattened';
  },

  findEmails: () => {
    const regex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
    const emails = [...new Set(document.body.innerText.match(regex) || [])];
    if (emails.length > 0) {
      return `COPY_ME:${emails.join('\n')} `;
    }
    return 'COPIED:No emails found';
  },

  // Exfiltration
  exportLinks: () => {
    const links = Array.from(document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(h => h && h.startsWith('http'));
    const unique = [...new Set(links)];
    if (unique.length > 0) {
      return `COPY_ME:${unique.join('\n')} `;
    }
    return 'COPIED:No links found';
  },

  exportColors: () => {
    const colors = new Set();
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el);
      colors.add(s.color);
      colors.add(s.backgroundColor);
    });
    const list = [...colors].filter(c => c !== 'rgba(0, 0, 0, 0)' && c !== 'rgb(0, 0, 0)');
    if (list.length > 0) {
      return `COPY_ME:${list.join('\n')} `;
    }
    return 'COPIED:No colors found';
  },

  takeScreenshot: () => {
    return 'SCREENSHOT';
  },

  injectConsole: () => {
    const script = document.createElement('script');
    script.textContent = `
console.clear();
console.log('%c ReMixr Console Injected ', 'background: #667eea; color: white; font-size: 14px; padding: 5px; border-radius: 4px;');
console.log('You now have full access to the window object.');
alert('Check your Developer Tools Console (F12) for the injected access.');
`;
    document.body.appendChild(script);
    return 'COPIED:Console access enabled';
  }
};

function renderSequenceDiagram(data) {
  const content = document.getElementById('result-content');
  const { actors, steps } = data;

  let html = `<div class="sequence-viz">
    <div class="sequence-actors">
      ${actors.map(a => `<div class="actor"><span>${a}</span></div>`).join('')}
    </div>
    <div class="sequence-flow">`;

  steps.forEach(step => {
    const fromIdx = actors.indexOf(step.from);
    const toIdx = actors.indexOf(step.to);
    const left = Math.min(fromIdx, toIdx) * (100 / (actors.length - 1));
    const width = Math.abs(toIdx - fromIdx) * (100 / (actors.length - 1));
    const isReverse = toIdx < fromIdx;

    html += `
      <div class="sequence-step ${step.type}" style="left:${left}%; width:${width}%">
        <div class="step-line ${isReverse ? 'reverse' : ''}"></div>
        <div class="step-label" style="text-align:${isReverse ? 'right' : 'left'}">${step.label}</div>
      </div>
    `;
  });

  html += `</div></div>`;
  content.innerHTML = html;
}

// Show status message in the professional status bar
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status-message');
  if (!statusEl) return;

  const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  statusEl.textContent = `[${timestamp}] ${message.toUpperCase()} `;

  // Color the text based on type for instant recognition
  if (type === 'error') statusEl.style.color = 'var(--danger-color)';
  else if (type === 'success') statusEl.style.color = 'var(--success-color)';
  else if (type === 'info') statusEl.style.color = 'var(--accent-color)';
  else statusEl.style.color = 'var(--text-dim)';

  // Reset after 4s
  setTimeout(() => {
    statusEl.textContent = `ReMixr IDE // Build 1.0.4 Ready`;
    statusEl.style.color = 'var(--text-dim)';
  }, 4000);
}

// ============================================
// EXTENSION WIZARD
// ============================================

function generateExtensionFromWizard() {
  const name = document.getElementById('wizard-name').value || 'My Extension';
  const description = document.getElementById('wizard-description').value || 'A Chrome Extension';
  const extType = document.querySelector('input[name="ext-type"]:checked').value;
  const framework = document.getElementById('wizard-framework').value;
  const hostPerms = document.querySelector('input[name="host-perms"]:checked').value;
  const customHosts = document.getElementById('wizard-custom-hosts').value;

  // Collect enabled features
  const features = {
    background: document.getElementById('feat-background').checked,
    storage: document.getElementById('feat-storage').checked,
    tabs: document.getElementById('feat-tabs').checked,
    contextMenu: document.getElementById('feat-context-menu').checked,
    notifications: document.getElementById('feat-notifications').checked,
    bookmarks: document.getElementById('feat-bookmarks').checked,
    history: document.getElementById('feat-history').checked,
    downloads: document.getElementById('feat-downloads').checked,
    cookies: document.getElementById('feat-cookies').checked,
    webRequest: document.getElementById('feat-web-request').checked
  };

  // Collect enabled behaviors
  const behaviors = {
    matchSite: document.getElementById('behavior-match-site').checked,
    autoOpen: document.getElementById('behavior-auto-open').checked,
    persistState: document.getElementById('behavior-persist-state').checked,
    keyboard: document.getElementById('behavior-keyboard').checked,
    badge: document.getElementById('behavior-badge').checked,
    autoRun: document.getElementById('behavior-auto-run').checked,
    sync: document.getElementById('behavior-sync').checked,
    theme: document.getElementById('behavior-theme').checked,
    analytics: document.getElementById('behavior-analytics').checked,
    hotReload: document.getElementById('behavior-hotreload').checked,
    errorTracking: document.getElementById('behavior-error-tracking').checked
  };

  showStatus('Generating extension...', 'info');

  // Generate manifest
  const manifest = generateManifest(name, description, extType, features, hostPerms, customHosts, behaviors);

  // Generate files based on extension type, features, and behaviors
  const files = generateExtensionFiles(extType, features, framework, behaviors);

  // Create project
  const projectId = `wizard-${Date.now()}`;
  const project = {
    id: projectId,
    name: name,
    manifest: manifest,
    files: files,
    created: new Date().toISOString()
  };

  // Save to storage
  chrome.storage.local.get({ projects: [] }, (result) => {
    const projects = result.projects;
    projects.push(project);
    chrome.storage.local.set({ projects }, () => {
      showStatus('Extension generated successfully!', 'success');
      loadProjects();

      // Switch to Builder tab and load the project
      document.querySelector('[data-tab="builder"]').click();
      loadProjectIntoBuilder(project);
    });
  });
}

function generateManifest(name, description, extType, features, hostPerms, customHosts, behaviors) {
  const manifest = {
    manifest_version: 3,
    name: name,
    version: '1.0.0',
    description: description,
    permissions: []
  };

  // Add icon placeholders
  manifest.icons = {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  };

  // Configure based on extension type
  if (extType === 'content-script') {
    manifest.content_scripts = [{
      matches: hostPerms === 'custom' ? customHosts.split(',').map(h => h.trim()) : ['<all_urls>'],
      js: ['content.js'],
      run_at: 'document_idle'
    }];
  } else if (extType === 'popup') {
    manifest.action = {
      default_popup: 'popup.html',
      default_title: name
    };
  } else if (extType === 'side-panel') {
    manifest.action = {
      default_title: name
    };
    manifest.side_panel = {
      default_path: 'panel.html'
    };
  } else if (extType === 'page-action') {
    manifest.action = {
      default_title: name
    };
  }

  // Add permissions based on features
  if (features.storage) manifest.permissions.push('storage');
  if (features.tabs) manifest.permissions.push('tabs');
  if (features.contextMenu) manifest.permissions.push('contextMenus');
  if (features.notifications) manifest.permissions.push('notifications');
  if (features.bookmarks) manifest.permissions.push('bookmarks');
  if (features.history) manifest.permissions.push('history');
  if (features.downloads) manifest.permissions.push('downloads');
  if (features.cookies) manifest.permissions.push('cookies');
  if (features.webRequest) {
    manifest.permissions.push('webRequest');
    manifest.permissions.push('webRequestBlocking');
  }

  // Add permissions for behaviors
  if (behaviors.sync) manifest.permissions.push('storage');
  if (behaviors.keyboard) {
    manifest.commands = {
      "_execute_action": {
        "suggested_key": {
          "default": "Ctrl+Shift+Y",
          "mac": "Command+Shift+Y"
        },
        "description": "Open extension"
      },
      "toggle": {
        "suggested_key": {
          "default": "Ctrl+Shift+K",
          "mac": "Command+Shift+K"
        },
        "description": "Toggle extension"
      }
    };
  }

  // Add background service worker if needed
  if (features.background || features.contextMenu || features.webRequest || behaviors.autoOpen || behaviors.badge || behaviors.errorTracking) {
    manifest.background = {
      service_worker: 'background.js'
    };
  }

  // Add host permissions
  if (hostPerms === 'all-urls') {
    manifest.host_permissions = ['<all_urls>'];
  } else if (hostPerms === 'custom') {
    manifest.host_permissions = customHosts.split(',').map(h => h.trim());
  } else {
    manifest.permissions.push('activeTab');
  }

  return JSON.stringify(manifest, null, 2);
}

function generateExtensionFiles(extType, features, framework, behaviors) {
  const files = [];

  // Generate appropriate UI file based on type
  if (extType === 'popup') {
    files.push({
      name: 'popup.html',
      content: generateHTML('popup', framework, behaviors)
    });
    files.push({
      name: 'popup.js',
      content: generateJS('popup', features, framework, behaviors)
    });
    files.push({
      name: 'popup.css',
      content: generateCSS(behaviors)
    });
  } else if (extType === 'side-panel') {
    files.push({
      name: 'panel.html',
      content: generateHTML('panel', framework, behaviors)
    });
    files.push({
      name: 'panel.js',
      content: generateJS('panel', features, framework, behaviors)
    });
    files.push({
      name: 'panel.css',
      content: generateCSS(behaviors)
    });
  } else if (extType === 'content-script') {
    files.push({
      name: 'content.js',
      content: generateContentScript(features, behaviors)
    });
  }

  // Generate background script if needed
  if (features.background || features.contextMenu || features.webRequest || behaviors.autoOpen || behaviors.badge || behaviors.errorTracking) {
    files.push({
      name: 'background.js',
      content: generateBackgroundScript(features, behaviors)
    });
  }

  // Add README
  files.push({
    name: 'README.md',
    content: generateReadme()
  });

  return files;
}

function generateHTML(type, framework, behaviors) {
  const title = type === 'popup' ? 'Extension Popup' : 'Extension Panel';
  const themeAttr = behaviors.theme ? ' data-theme="light"' : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="${type}.css">
</head>
<body${themeAttr}>
  <div class="container">
    <h1>Welcome!</h1>
    <p>Your extension is ready to customize.</p>
    ${framework === 'vanilla' ? '<div id="app"></div>' : '<div id="root"></div>'}
    <button id="action-btn" class="btn">Click Me</button>
    ${behaviors.theme ? '<button id="theme-toggle" class="btn-icon">🌓</button>' : ''}
  </div>
  <script src="${type}.js"></script>
</body>
</html>`;
}

function generateJS(type, features, framework, behaviors) {
  let code = `// ${type.charAt(0).toUpperCase() + type.slice(1)} Script\n\n`;

  if (behaviors.persistState) {
    code += `// State Management\n`;
    code += `let state = {};\n\n`;
    code += `async function loadState() {\n`;
    code += `  const result = await chrome.storage.${behaviors.sync ? 'sync' : 'local'}.get('state');\n`;
    code += `  state = result.state || {};\n`;
    code += `  console.log('State loaded:', state);\n`;
    code += `}\n\n`;
    code += `async function saveState() {\n`;
    code += `  await chrome.storage.${behaviors.sync ? 'sync' : 'local'}.set({ state });\n`;
    code += `  console.log('State saved:', state);\n`;
    code += `}\n\n`;
  }

  if (behaviors.errorTracking) {
    code += `// Error Tracking\n`;
    code += `window.addEventListener('error', (event) => {\n`;
    code += `  console.error('Error tracked:', event.error);\n`;
    code += `  // Send to analytics or error reporting service\n`;
    code += `});\n\n`;
  }

  if (behaviors.matchSite) {
    code += `// Match Parent Site Style\n`;
    code += `async function matchParentSiteStyle() {\n`;
    code += `  try {\n`;
    code += `    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });\n`;
    code += `    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractStyles' });\n`;
    code += `    \n`;
    code += `    if (response && response.styles) {\n`;
    code += `      // Apply extracted styles to extension UI\n`;
    code += `      const root = document.documentElement;\n`;
    code += `      root.style.setProperty('--site-bg', response.styles.backgroundColor);\n`;
    code += `      root.style.setProperty('--site-text', response.styles.textColor);\n`;
    code += `      root.style.setProperty('--site-accent', response.styles.accentColor);\n`;
    code += `      root.style.setProperty('--site-font', response.styles.fontFamily);\n`;
    code += `      \n`;
    code += `      // Update UI with site colors\n`;
    code += `      document.body.style.background = response.styles.backgroundColor;\n`;
    code += `      document.body.style.color = response.styles.textColor;\n`;
    code += `      document.body.style.fontFamily = response.styles.fontFamily;\n`;
    code += `      \n`;
    code += `      console.log('Matched parent site style:', response.styles);\n`;
    code += `    }\n`;
    code += `  } catch (error) {\n`;
    code += `    console.log('Could not extract parent site styles:', error);\n`;
    code += `  }\n`;
    code += `}\n\n`;
  }

  code += `document.addEventListener('DOMContentLoaded', async () => {\n`;

  if (behaviors.persistState) {
    code += `  await loadState();\n\n`;
  }

  if (behaviors.matchSite) {
    code += `  await matchParentSiteStyle();\n\n`;
  }

  if (behaviors.theme) {
    code += `  // Theme Support\n`;
    code += `  const themeToggle = document.getElementById('theme-toggle');\n`;
    code += `  const savedTheme = localStorage.getItem('theme') || 'light';\n`;
    code += `  document.body.setAttribute('data-theme', savedTheme);\n\n`;
    code += `  themeToggle?.addEventListener('click', () => {\n`;
    code += `    const currentTheme = document.body.getAttribute('data-theme');\n`;
    code += `    const newTheme = currentTheme === 'light' ? 'dark' : 'light';\n`;
    code += `    document.body.setAttribute('data-theme', newTheme);\n`;
    code += `    localStorage.setItem('theme', newTheme);\n`;
    code += `  });\n\n`;
  }

  code += `  const btn = document.getElementById('action-btn');\n`;
  code += `  \n`;
  code += `  btn.addEventListener('click', async () => {\n`;
  code += `    console.log('Button clicked!');\n`;

  if (features.storage) {
    code += `    \n    // Example: Save to storage\n`;
    code += `    await chrome.storage.local.set({ lastClick: new Date().toISOString() });\n`;
    code += `    console.log('Saved to storage');\n`;
  }

  if (features.tabs) {
    code += `    \n    // Example: Get active tab\n`;
    code += `    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });\n`;
    code += `    console.log('Active tab:', tab.url);\n`;
  }

  if (features.notifications) {
    code += `    \n    // Example: Show notification\n`;
    code += `    chrome.notifications.create({\n`;
    code += `      type: 'basic',\n`;
    code += `      iconUrl: 'icons/icon48.png',\n`;
    code += `      title: 'Extension Notification',\n`;
    code += `      message: 'Button was clicked!'\n`;
    code += `    });\n`;
  }

  if (behaviors.analytics) {
    code += `    \n    // Track usage\n`;
    code += `    chrome.runtime.sendMessage({ action: 'track', event: 'button_click' });\n`;
  }

  if (behaviors.persistState) {
    code += `    \n    // Update and save state\n`;
    code += `    state.clicks = (state.clicks || 0) + 1;\n`;
    code += `    await saveState();\n`;
    code += `    });\n`;
  }

  code += `  });\n`;
  code += `});\n`;

  if (behaviors.keyboard) {
    code += `\n// Keyboard Shortcuts\n`;
    code += `chrome.commands.onCommand.addListener((command) => {\n`;
    code += `  console.log('Command received:', command);\n`;
    code += `  if (command === 'toggle') {\n`;
    code += `    // Handle toggle action\n`;
    code += `  }\n`;
    code += `});\n`;
  }

  if (behaviors.hotReload) {
    code += `\n// Hot Reload for Development\n`;
    code += `if (process.env.NODE_ENV === 'development') {\n`;
    code += `  chrome.runtime.onMessage.addListener((msg) => {\n`;
    code += `    if (msg.type === 'reload') location.reload();\n`;
    code += `  });\n`;
    code += `}\n`;
  }

  return code;
}

function generateCSS(behaviors) {
  let css = `/* Extension Styles */

:root {
  --site-bg: #667eea;
  --site-text: #ffffff;
  --site-accent: #764ba2;
  --site-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--site-font);
  background: ${behaviors.matchSite ? 'var(--site-bg)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  ${behaviors.matchSite ? 'color: var(--site-text);' : ''}
  min-width: 300px;
  min-height: 200px;
  transition: background 0.3s ease, color 0.3s ease;
}
`;

  if (behaviors.theme) {
    css += `
body[data-theme="dark"] {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #ffffff;
}

body[data-theme="dark"] .btn {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}
`;
  }

  if (behaviors.matchSite) {
    css += `
/* Adaptive styling that matches parent site */
.btn {
  background: var(--site-accent);
  border-color: var(--site-accent);
  color: var(--site-text);
}

.btn:hover {
  opacity: 0.9;
  filter: brightness(1.1);
}
`;
  }

  css += `
.container {
  padding: 32px 28px;
  color: ${behaviors.matchSite ? 'var(--site-text)' : 'white'};
}

h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
  color: ${behaviors.matchSite ? 'var(--site-text)' : 'white'};
}

p {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 24px;
  color: ${behaviors.matchSite ? 'var(--site-text)' : 'white'};
}
`;

  if (!behaviors.matchSite) {
    css += `
.btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px 24px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}`;
  } else {
    css += `
.btn {
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}`;
  }

  return css;
}

function generateContentScript(features, behaviors) {
  let code = `// Content Script - Runs on web pages\n\n`;
  code += `console.log('Extension content script loaded!');\n\n`;

  if (behaviors.matchSite) {
    code += `// Extract parent site styles for extension to match\n`;
    code += `function extractParentSiteStyles() {\n`;
    code += `  const bodyStyles = window.getComputedStyle(document.body);\n`;
    code += `  const bgColor = bodyStyles.backgroundColor;\n`;
    code += `  const textColor = bodyStyles.color;\n`;
    code += `  const fontFamily = bodyStyles.fontFamily;\n`;
    code += `  \n`;
    code += `  // Find accent color from links or buttons\n`;
    code += `  let accentColor = '#6366f1'; // fallback\n`;
    code += `  const links = document.querySelectorAll('a, button');\n`;
    code += `  if (links.length > 0) {\n`;
    code += `    const linkStyle = window.getComputedStyle(links[0]);\n`;
    code += `    accentColor = linkStyle.color || accentColor;\n`;
    code += `  }\n`;
    code += `  \n`;
    code += `  return {\n`;
    code += `    backgroundColor: bgColor,\n`;
    code += `    textColor: textColor,\n`;
    code += `    accentColor: accentColor,\n`;
    code += `    fontFamily: fontFamily\n`;
    code += `  };\n`;
    code += `}\n\n`;
  }

  if (behaviors.autoRun) {
    code += `// Auto-run enhancement\n`;
    code += `let hasRun = false;\n\n`;
  }

  code += `// Example: Modify page content\n`;
  code += `function enhancePage() {\n`;

  if (behaviors.autoRun) {
    code += `  if (hasRun) return;\n`;
    code += `  hasRun = true;\n\n`;
  }

  code += `  // Add your page modifications here\n`;
  code += `  console.log('Enhancing page:', window.location.href);\n`;

  if (behaviors.analytics) {
    code += `  \n  // Track page enhancement\n`;
    code += `  chrome.runtime.sendMessage({ action: 'track', event: 'page_enhanced', url: window.location.href });\n`;
  }

  code += `}\n\n`;

  if (behaviors.autoRun) {
    code += `// Auto-run on page load\n`;
  } else {
    code += `// Run when page is ready\n`;
  }

  code += `if (document.readyState === 'loading') {\n`;
  code += `  document.addEventListener('DOMContentLoaded', enhancePage);\n`;
  code += `} else {\n`;
  code += `  enhancePage();\n`;
  code += `}\n\n`;

  if (features.storage) {
    code += `// Example: Listen for storage changes\n`;
    code += `chrome.storage.onChanged.addListener((changes, area) => {\n`;
    code += `  console.log('Storage changed:', changes);\n`;
    code += `});\n\n`;
  }

  code += `// Listen for messages from extension\n`;
  code += `chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {\n`;
  code += `  console.log('Message received:', request);\n`;

  if (behaviors.matchSite) {
    code += `  \n  // Handle style extraction request\n`;
    code += `  if (request.action === 'extractStyles') {\n`;
    code += `    const styles = extractParentSiteStyles();\n`;
    code += `    sendResponse({ styles });\n`;
    code += `    return true;\n`;
    code += `  }\n`;
  }

  code += `  \n  sendResponse({ status: 'ok' });\n`;
  code += `  return true;\n`;
  code += `});\n`;

  if (behaviors.errorTracking) {
    code += `\n// Error tracking\n`;
    code += `window.addEventListener('error', (event) => {\n`;
    code += `  chrome.runtime.sendMessage({ \n`;
    code += `    action: 'error', \n`;
    code += `    error: event.error.message,\n`;
    code += `    url: window.location.href\n`;
    code += `  });\n`;
    code += `});\n`;
  }

  return code;
}

function generateBackgroundScript(features, behaviors) {
  let code = `// Background Service Worker\n\n`;
  code += `console.log('Background service worker loaded!');\n\n`;

  if (behaviors.autoOpen) {
    code += `// Auto-open side panel on install\n`;
    code += `chrome.runtime.onInstalled.addListener(async () => {\n`;
    code += `  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });\n`;
    code += `  if (tabs[0]?.id) {\n`;
    code += `    try {\n`;
    code += `      await chrome.sidePanel.open({ tabId: tabs[0].id });\n`;
    code += `      console.log('Side panel opened automatically');\n`;
    code += `    } catch (e) {\n`;
    code += `      console.log('Side panel not available:', e);\n`;
    code += `    }\n`;
    code += `  }\n`;
    code += `});\n\n`;
  }

  if (behaviors.badge) {
    code += `// Badge notification system\n`;
    code += `let badgeCount = 0;\n\n`;
    code += `function updateBadge(count) {\n`;
    code += `  badgeCount = count;\n`;
    code += `  chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });\n`;
    code += `  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });\n`;
    code += `}\n\n`;
  }

  if (behaviors.analytics) {
    code += `// Analytics tracking\n`;
    code += `const analytics = {\n`;
    code += `  events: [],\n`;
    code += `  track(event, data) {\n`;
    code += `    this.events.push({ event, data, timestamp: Date.now() });\n`;
    code += `    console.log('Tracked:', event, data);\n`;
    code += `    // Send to your analytics service\n`;
    code += `  }\n`;
    code += `};\n\n`;
  }

  if (behaviors.errorTracking) {
    code += `// Error tracking\n`;
    code += `const errors = [];\n\n`;
    code += `function logError(error) {\n`;
    code += `  errors.push({ error, timestamp: Date.now() });\n`;
    code += `  console.error('Error logged:', error);\n`;
    code += `  // Send to error reporting service\n`;
    code += `}\n\n`;
  }

  if (features.contextMenu) {
    code += `// Create context menu\n`;
    code += `chrome.runtime.onInstalled.addListener(() => {\n`;
    code += `  chrome.contextMenus.create({\n`;
    code += `    id: 'main-action',\n`;
    code += `    title: 'Extension Action',\n`;
    code += `    contexts: ['selection', 'page']\n`;
    code += `  });\n`;
    code += `});\n\n`;
    code += `chrome.contextMenus.onClicked.addListener((info, tab) => {\n`;
    code += `  console.log('Context menu clicked:', info);\n`;

    if (behaviors.analytics) {
      code += `  analytics.track('context_menu_click', { selection: info.selectionText });\n`;
    }

    code += `});\n\n`;
  }

  if (features.webRequest) {
    code += `// Network request interception\n`;
    code += `chrome.webRequest.onBeforeRequest.addListener(\n`;
    code += `  (details) => {\n`;
    code += `    console.log('Request:', details.url);\n`;
    code += `    return {}; // Can modify or block request\n`;
    code += `  },\n`;
    code += `  { urls: ['<all_urls>'] },\n`;
    code += `  ['blocking']\n`;
    code += `);\n\n`;
  }

  code += `// Listen for messages\n`;
  code += `chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {\n`;
  code += `  console.log('Message received:', request);\n`;

  if (behaviors.analytics) {
    code += `  \n  // Track incoming messages\n`;
    code += `  if (request.action === 'track') {\n`;
    code += `    analytics.track(request.event, request.data || {});\n`;
    code += `  }\n`;
  }

  if (behaviors.errorTracking) {
    code += `  \n  // Log errors\n`;
    code += `  if (request.action === 'error') {\n`;
    code += `    logError(request.error);\n`;
    code += `  }\n`;
  }

  if (behaviors.badge) {
    code += `  \n  // Update badge\n`;
    code += `  if (request.action === 'updateBadge') {\n`;
    code += `    updateBadge(request.count);\n`;
    code += `  }\n`;
  }

  code += `  \n  sendResponse({ status: 'ok' });\n`;
  code += `  return true;\n`;
  code += `});\n`;

  if (behaviors.hotReload) {
    code += `\n// Hot reload for development\n`;
    code += `const filesInDirectory = dir => new Promise(resolve => {\n`;
    code += `  // Watch for file changes and reload extension\n`;
    code += `  // Note: This is a placeholder - full implementation requires file watching\n`;
    code += `  console.log('Hot reload enabled for development');\n`;
    code += `});\n`;
  }

  return code;
}

function generateReadme() {
  return `# Chrome Extension

## Installation

1. Open Chrome and navigate to \`chrome://extensions\`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this extension directory

## Development

Modify the files to customize your extension:
- \`manifest.json\` - Extension configuration
- \`popup.html/js/css\` - Popup interface (if applicable)
- \`content.js\` - Content script for page modifications
- \`background.js\` - Background service worker

## Features

Built with ReMixr IDE - A meta-extension development environment.
`;
}
