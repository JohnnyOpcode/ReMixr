// ReMixr Extension Builder - Main Logic

// State Management
let currentProject = null;
let currentFile = 'manifest.json';
let projects = [];

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

function displayResults(data) {
  const resultsDiv = document.getElementById('results');
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
  
  // Code editor auto-save
  document.getElementById('code-editor')?.addEventListener('input', () => {
    if (currentProject && currentFile) {
      currentProject.files[currentFile] = document.getElementById('code-editor').value;
    }
  });
  
  // Project name change
  document.getElementById('project-name')?.addEventListener('input', (e) => {
    if (currentProject) {
      currentProject.name = e.target.value;
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
  const editor = document.getElementById('code-editor');
  const fileHeader = document.getElementById('current-file');
  
  editor.value = currentProject.files[filename] || '';
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
  } else {
    return generateGeneric(prompt);
  }
}

function generateContentModifier(prompt) {
  const template = TEMPLATES['content-modifier'];
  const name = extractName(prompt) || 'Content Modifier';
  
  return {
    name,
    files: {
      'manifest.json': JSON.stringify({
        ...template.files['manifest.json'],
        name
      }, null, 2),
      'content.js': template.files['content.js'],
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
  
  return {
    name,
    files: {
      'manifest.json': JSON.stringify({
        ...template.files['manifest.json'],
        name
      }, null, 2),
      'popup.html': template.files['popup.html'].replace('Data Extractor', name),
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

// Show status message
function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type} show`;
  
  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
}
