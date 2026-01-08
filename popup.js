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
      <div>
        <div class="project-name">${project.name}</div>
        <div class="project-meta">Modified: ${new Date(project.modified).toLocaleDateString()}</div>
      </div>
      <button class="btn btn-small btn-danger" onclick="deleteProject(${index})">Delete</button>
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
  loadFileIntoEditor('manifest.json');
  document.getElementById('project-name').value = currentProject.name;
  showStatus('New project created', 'success');
});

// Load project
function loadProject(index) {
  currentProject = projects[index];
  currentProject.index = index;

  switchTab('builder');
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

  // File tree
  document.querySelectorAll('.file-item').forEach(item => {
    item.addEventListener('click', () => {
      const file = item.dataset.file;
      loadFileIntoEditor(file);

      document.querySelectorAll('.file-item').forEach(f => f.classList.remove('active'));
      item.classList.add('active');
    });
  });

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
  document.getElementById('scan-structure')?.addEventListener('click', () => runAnalysis('structure'));
  document.getElementById('scan-palette')?.addEventListener('click', () => runAnalysis('palette'));
  document.getElementById('scan-assets')?.addEventListener('click', () => runAnalysis('assets'));
  document.getElementById('scan-fonts')?.addEventListener('click', () => runAnalysis('fonts'));

  document.getElementById('scan-storage')?.addEventListener('click', () => runAnalysis('storage'));
  document.getElementById('scan-workers')?.addEventListener('click', () => runAnalysis('workers'));
  document.getElementById('scan-perf')?.addEventListener('click', () => runAnalysis('perf'));
  document.getElementById('scan-stack')?.addEventListener('click', () => runAnalysis('stack'));

  document.getElementById('clear-results')?.addEventListener('click', () => {
    document.getElementById('analysis-results').style.display = 'none';
  });

  // MacGyver Tools
  document.getElementById('tool-edit')?.addEventListener('click', () => runMacGyver('toggleEditMode'));
  document.getElementById('tool-zap')?.addEventListener('click', () => runMacGyver('zapElement'));
  document.getElementById('tool-wireframe')?.addEventListener('click', () => runMacGyver('toggleWireframe'));
  document.getElementById('tool-images')?.addEventListener('click', () => runMacGyver('toggleImages'));

  document.getElementById('tool-unmask')?.addEventListener('click', () => runMacGyver('showPasswords'));
  document.getElementById('tool-enable')?.addEventListener('click', () => runMacGyver('enableInputs'));
  document.getElementById('tool-kill-sticky')?.addEventListener('click', () => runMacGyver('killStickies'));
  document.getElementById('tool-pii')?.addEventListener('click', () => runMacGyver('findEmails'));

  document.getElementById('tool-export-links')?.addEventListener('click', () => runMacGyver('exportLinks'));
  document.getElementById('tool-export-colors')?.addEventListener('click', () => runMacGyver('exportColors'));
  document.getElementById('tool-screenshot')?.addEventListener('click', () => runMacGyver('takeScreenshot'));
  document.getElementById('tool-console')?.addEventListener('click', () => runMacGyver('injectConsole'));
}

// Switch tabs
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
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

  switchTab('builder');
  loadFileIntoEditor('manifest.json');
  document.getElementById('project-name').value = currentProject.name;
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

// AI Generation
async function generateExtension() {
  const prompt = document.getElementById('ai-prompt').value.trim();

  if (!prompt) {
    showStatus('Please enter a description', 'error');
    return;
  }

  showStatus('Generating extension...', 'info');

  // Simple AI simulation - keyword matching
  const generated = await generateFromPrompt(prompt);

  currentProject = {
    name: generated.name,
    files: generated.files,
    created: Date.now(),
    modified: Date.now()
  };

  switchTab('builder');
  loadFileIntoEditor('manifest.json');
  document.getElementById('project-name').value = currentProject.name;
  showStatus('Extension generated!', 'success');
}

// Simulate AI generation
async function generateFromPrompt(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  // Determine template based on keywords
  if (lowerPrompt.includes('highlight') || lowerPrompt.includes('color') || lowerPrompt.includes('style')) {
    return generateContentModifier(prompt);
  } else if (lowerPrompt.includes('timer') || lowerPrompt.includes('track') || lowerPrompt.includes('time')) {
    return generateTimer(prompt);
  } else if (lowerPrompt.includes('extract') || lowerPrompt.includes('scrape') || lowerPrompt.includes('data')) {
    return generateExtractor(prompt);
  } else if (lowerPrompt.includes('monitor') || lowerPrompt.includes('watch') || lowerPrompt.includes('change')) {
    return generatePageMonitor(prompt);
  } else if (lowerPrompt.includes('tool') || lowerPrompt.includes('util') || lowerPrompt.includes('button')) {
    return generatePopupTool(prompt);
  } else {
    return generateGeneric(prompt);
  }
}

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

  showStatus('Opening extension test guide...', 'info');

  // Show instructions for testing
  const instructions = `
To test your extension:

1. Open chrome://extensions/
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Export your extension first (click Export button)
5. Extract the .zip file
6. Select the extracted folder

Your extension will load and be ready to test!
  `;

  alert(instructions.trim());
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
  const images = Array.from(document.querySelectorAll('img')).map(i => i.src).filter(Boolean);
  const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(Boolean);
  const css = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href).filter(Boolean);

  return {
    imageCount: images.length,
    scriptCount: scripts.length,
    cssCount: css.length,
    samples: images.slice(0, 3)
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
    lsKeys: Object.keys(localStorage).slice(0, 5) // Sample
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

// Render Results
function displayAnalysisResults(type, data) {
  const container = document.getElementById('analysis-results');
  const content = document.getElementById('result-content');
  const d3Container = document.getElementById('d3-container');
  const title = document.getElementById('result-title');

  container.style.display = 'block';
  d3Container.style.display = type === 'visualize' ? 'block' : 'none';
  content.style.display = type === 'visualize' ? 'none' : 'block';
  title.textContent = type.charAt(0).toUpperCase() + type.slice(1) + ' Analysis';

  // Store for AI Context
  window.SITE_CONTEXT = window.SITE_CONTEXT || {};
  window.SITE_CONTEXT[type] = data;

  if (type === 'visualize') {
    renderD3Graph(data);
    return;
  }

  let html = '';

  if (type === 'structure') {
    html = `
      <div class="stat-row"><strong>Elements:</strong> ${data.totalElements}</div>
      <div class="stat-row"><strong>Max Depth:</strong> ${data.maxDepth}</div>
      <div class="stat-row"><strong>Title:</strong> ${data.title}</div>
      <div class="stat-group">
        <strong>Top Tags:</strong>
        ${data.topTags.map(([tag, count]) => `<span class="tag-badge">${tag} (${count})</span>`).join('')}
      </div>
    `;
  } else if (type === 'palette') {
    html = `<div class="palette-group">
       <strong>Text Colors</strong>
       <div class="swatches">
         ${data.text.map(c => `<div class="swatch" style="background:${c}" title="${c}"></div>`).join('')}
       </div>
       <strong>Backgrounds</strong>
       <div class="swatches">
         ${data.backgrounds.map(c => `<div class="swatch" style="background:${c}" title="${c}"></div>`).join('')}
       </div>
     </div>`;
  } else if (type === 'assets') {
    html = `
      <div class="stat-row"><strong>Images:</strong> ${data.imageCount}</div>
      <div class="stat-row"><strong>Scripts:</strong> ${data.scriptCount}</div>
      <div class="stat-row"><strong>Stylesheets:</strong> ${data.cssCount}</div>
    `;
  } else if (type === 'fonts') {
    html = `<div class="font-list">
      ${data.map(f => `<div class="font-item" style="font-family:${f.font}">
        ${f.font} <span class="count">${f.count}</span>
      </div>`).join('')}
    </div>`;
  } else if (type === 'storage') {
    html = `
      <div class="stat-row"><strong>Local Storage:</strong> ${data.lsCount} items (${data.lsSize} KB)</div>
      <div class="stat-row"><strong>Session Storage:</strong> ${data.ssCount} items (${data.ssSize} KB)</div>
      <div class="stat-row"><strong>Cookies:</strong> ${data.cookies} accessible</div>
      <div class="stat-group">
        <strong>LS Sample Keys:</strong>
        <div style="font-size:11px; margin-top:5px; color:#94a3b8; word-break:break-all;">
          ${data.lsKeys.join(', ') || 'None'}
        </div>
      </div>
    `;
  } else if (type === 'workers') {
    if (data.notSupported) {
      html = '<div class="stat-row">Service Workers not supported</div>';
    } else if (data.count === 0) {
      html = '<div class="stat-row">No Active Service Workers Found</div>';
    } else {
      html = `
        <div class="stat-row"><strong>Registered Workers:</strong> ${data.count}</div>
        <div class="stat-group">
          ${data.active.map(w => `
            <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:6px; margin-top:5px;">
              <div style="font-size:11px; color:#94a3b8;">Scope</div>
              <div style="word-break:break-all; margin-bottom:4px;">${w.scope}</div>
              <span class="tag-badge" style="background:#10b98120; color:#34d399;">${w.state}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
  } else if (type === 'perf') {
    html = `
      <div class="stat-row"><strong>Load Time:</strong> ${data.loadTime}ms</div>
      <div class="stat-row"><strong>DOM Ready:</strong> ${data.domReady}ms</div>
      <div class="stat-group">
        <strong>Resource Requests:</strong>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:8px; text-align:center;">
          <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:6px;">
            <div style="font-size:18px;">${data.resources.js}</div>
            <div style="font-size:10px; color:#94a3b8;">Scripts</div>
          </div>
          <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:6px;">
            <div style="font-size:18px;">${data.resources.img}</div>
            <div style="font-size:10px; color:#94a3b8;">Images</div>
          </div>
          <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:6px;">
            <div style="font-size:18px;">${data.resources.xhr}</div>
            <div style="font-size:10px; color:#94a3b8;">XHR/Fetch</div>
          </div>
        </div>
      </div>
    `;
  } else if (type === 'stack') {
    html = `
      <div class="stat-group">
        <strong>Detected Technologies:</strong>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">
          ${data.map(tech => `
            <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:8px 12px; border-radius:20px; font-weight:bold; font-size:12px;">
              ${tech}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  content.innerHTML = html;
}

function renderD3Graph(rootData) {
  const container = document.getElementById('d3-container');
  container.innerHTML = ''; // Clear prev
  const width = container.clientWidth || 600;
  const height = 400;

  // Flatten logic for Force Graph (simplified)
  const nodes = [];
  const links = [];

  function flatten(node, parentIndex = null) {
    const i = nodes.length;
    nodes.push({ id: i, name: node.name, class: node.class, r: Math.min(node.value * 2 + 3, 20) });
    if (parentIndex !== null) links.push({ source: parentIndex, target: i });
    if (node.children) {
      node.children.forEach(c => flatten(c, i));
    }
  }
  flatten(rootData);

  // Limit nodes for perf
  const maxNodes = 300;
  if (nodes.length > maxNodes) {
    nodes.length = maxNodes;
    links.length = maxNodes; // rough cut
  }

  const svg = d3.select("#d3-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

  // Simulation
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(30))
    .force("charge", d3.forceManyBody().strength(-30))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(d => d.r + 2));

  // Render Links
  const link = svg.append("g")
    .attr("stroke", "#475569")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line");

  // Render Nodes
  const node = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", d => d.r)
    .attr("fill", d => {
      if (d.name === 'div') return '#667eea';
      if (d.name === 'a') return '#10b981';
      if (d.name === 'img') return '#f43f5e';
      if (d.name === 'p' || d.name === 'span') return '#f59e0b';
      return '#cbd5e1';
    })
    .call(drag(simulation));

  node.append("title")
    .text(d => `${d.name.toUpperCase()} ${d.class ? '.' + d.class : ''}`);

  // Tick
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  });

  // Helper: Drag
  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }
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
      // Handle return values (like copied text)
      if (typeof results[0].result === 'string' && results[0].result.startsWith('COPIED:')) {
        showStatus(results[0].result.replace('COPIED:', ''), 'success');
      } else if (results[0].result === 'SCREENSHOT') {
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
      style.textContent = `* { outline: 1px solid rgba(100, 100, 255, 0.5) !important; background: rgba(0,0,0,0.02) !important; color: black !important; }`;
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
      navigator.clipboard.writeText(emails.join('\n'));
      return `COPIED:Copied ${emails.length} emails`;
    }
    return 'COPIED:No emails found';
  },

  // Exfiltration
  exportLinks: () => {
    const links = Array.from(document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(h => h && h.startsWith('http'));
    const unique = [...new Set(links)];
    navigator.clipboard.writeText(unique.join('\n'));
    return `COPIED:Copied ${unique.length} links`;
  },

  exportColors: () => {
    const colors = new Set();
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el);
      colors.add(s.color);
      colors.add(s.backgroundColor);
    });
    const list = [...colors].filter(c => c !== 'rgba(0, 0, 0, 0)' && c !== 'rgb(0, 0, 0)');
    navigator.clipboard.writeText(list.join('\n'));
    return `COPIED:Copied ${list.length} colors`;
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

// Show status message
function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type} show`;

  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
}
