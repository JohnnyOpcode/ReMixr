# Feature Injector Guide

## Overview

The **Feature Injector** is a powerful tool integrated directly into the Builder tab that allows you to add features to any extension project - whether it started from a template, AI generation, or the wizard.

## Location

**Builder Tab** → Collapsible "🔧 Feature Injector" panel (below AI Generate section)

## How It Works

1. **Load or Create a Project**: Start with any template, use the wizard, or create a blank project
2. **Open Feature Injector**: Click the "🔧 Feature Injector" header to expand the panel
3. **Select Features**: Check the features you want to add
4. **Inject**: Click "⚡ Inject Selected Features"
5. **Review**: The injector automatically updates your manifest.json and adds working code

### Available Features

### 🆔 Identity & Type
| Feature | What It Adds |
|---------|-------------|
| **Rename/Describe** | Updates metadata in `manifest.json` and project records |
| **Content Script** | Configures extension to modify web pages; adds `content.js` |
| **Popup** | Configures a standard browser action popup (`popup.html`) |
| **Side Panel** | Configures the Chrome side panel API support |
| **Page Action** | Configures a contextual browser action |

### 🔒 Host Permissions
| Feature | What It Adds |
|---------|-------------|
| **Active Tab** | Limits host access to the current active tab only |
| **All Websites** | Grants permissions for `<all_urls>` |
| **Custom Domains** | Grants permissions for specific domain patterns you provide |

### 🏗️ UI Frameworks
| Feature | What It Adds |
|---------|-------------|
| **Vanilla JS** | Standard HTML/JS boilerplate |
| **React** | React 18+ boilerplate with `root` element and boilerplate `popup.js` |
| **Vue** | Vue 3 boilerplate with composition/options style app |
| **Svelte** | Svelte 4+ boilerplate with `.svelte` component support |

### ⚙️ Core Features
| Feature | What It Adds |
|---------|-------------|
| **💾 Storage** | Local storage functions (`saveData`, `loadData`) + `storage` permission |
| **📑 Tabs** | Tab query functions (`getCurrentTab`, `getAllTabs`) + `tabs` permission |
| **📜 History** | Browse history search (`searchHistory`) + `history` permission |
| **⬇️ Downloads** | Trigger downloads (`downloadFile`) + `downloads` permission |
| **🔔 Notifications** | Notification function (`showNotification`) + `notifications` permission |
| **📋 Context Menu** | Right-click menu integration + background.js code + `contextMenus` permission |
| **⚙️ Background** | Creates/updates background.js with service worker setup |
| **🔖 Bookmarks** | Bookmark tree access (`getAllBookmarks`) + `bookmarks` permission |
| **🌐 Web Request** | Network interception logic in `background.js` |
| **🍪 Cookies** | Adds `cookies` permission for cookie access |

### 🎭 UI/UX & Behaviors
| Feature | What It Adds |
|---------|-------------|
| **🌓 Theme Toggle** | Dark/light theme toggle function + CSS styles |
| **⌨️ Keyboard** | Keyboard command configuration in manifest |
| **🔴 Badge** | Badge update function in background.js |
| **☁️ Sync Storage** | Switches storage injection to use `chrome.storage.sync` |
| **🚀 Auto-Open** | Logic in `background.js` to open sidepanel on tab update |
| **💿 Persist State** | Pattern for saving/restoring extension state via storage |
| **🎨 Match Site** | Function to copy parent site's CSS styles into the extension |
| **⚡ Auto-Run** | Configures content scripts to run immediately |
| **📊 Analytics** | Basic event tracking boilerplate |
| **🔥 Hot Reload** | Development utility to auto-reload extension on file change |
| **🐛 Errors** | Promise rejection and error handling listeners |

## What Gets Modified

### manifest.json
- Adds required permissions
- Adds background service worker (if needed)
- Adds keyboard commands (if selected)

### popup.js
- Adds helper functions for selected features
- Includes working example code
- Maintains existing code (doesn't overwrite)

### background.js
- Created if doesn't exist
- Adds context menu handlers
- Adds badge update functions
- Adds service worker setup

### styles.css
- Adds dark theme styles (if theme toggle selected)

## Smart Injection

The injector is intelligent:
- ✅ **No Duplicates**: Won't add code if it already exists
- ✅ **Preserves Existing Code**: Appends to files, doesn't overwrite
- ✅ **Auto-Updates Manifest**: Adds only necessary permissions
- ✅ **Creates Missing Files**: Automatically creates background.js or other files if needed

## Example Workflows

### Example 1: Add Storage to Existing Template

1. Load "Starter" template
2. Open Feature Injector
3. Check "💾 Storage"
4. Click "Inject"
5. Result: `saveData()` and `loadData()` functions added to popup.js

### Example 2: Add Multiple Features

1. Create new project or load template
2. Select multiple features:
   - ✓ Storage
   - ✓ Notifications  
   - ✓ Theme Toggle
3. Click "Inject"
4. Result: All three features added with proper permissions and code

### Example 3: Enhance AI-Generated Extension

1. Use AI Generate to create extension
2. Review generated code
3. Use Feature Injector to add:
   - ✓ Error Tracking
   - ✓ Storage
4. Extension now has better error handling and data persistence

## Code Examples

### Storage Feature
```javascript
// Storage
async function saveData(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

async function loadData(key) {
  const result = await chrome.storage.local.get([key]);
  return result[key];
}
```

### Notifications Feature
```javascript
// Notifications
function showNotification(title, message) {
  chrome.notifications.create({ 
    type: 'basic', 
    iconUrl: 'icon48.png', 
    title, 
    message 
  });
}
```

### Theme Toggle Feature
```javascript
// Theme
function toggleTheme() {
  const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
```

### Context Menu Feature (background.js)
```javascript
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ 
    id: 'action', 
    title: 'Extension Action', 
    contexts: ['selection', 'page'] 
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Menu clicked:', info);
});
```

## Tips & Best Practices

### When to Use Feature Injector

✅ **Good Use Cases:**
- Adding features to templates
- Enhancing AI-generated code
- Quick prototyping
- Learning Chrome extension APIs
- Adding common functionality

❌ **When Not to Use:**
- Complex custom logic (write manually)
- Highly specific implementations
- When you need full control over code structure

### Workflow Tips

1. **Start Simple**: Begin with a template, then inject features as needed
2. **Review Code**: Always review injected code in the editor
3. **Test Incrementally**: Inject one feature at a time and test
4. **Customize**: Use injected code as a starting point, then customize
5. **Combine with AI**: Use AI Generate for custom logic, Feature Injector for standard features

### Common Patterns

**Pattern 1: Template + Features**
```
1. Load "Starter" template
2. Inject: Storage + Notifications
3. Customize in editor
4. Export
```

**Pattern 2: Wizard + Features**
```
1. Use wizard to generate base structure
2. Inject additional features not in wizard
3. Refine in editor
4. Export
```

**Pattern 3: AI + Features**
```
1. Use AI Generate for custom functionality
2. Inject standard features (storage, notifications)
3. Combine AI logic with injected helpers
4. Export
```

## Troubleshooting

### Feature Not Working?
- Check manifest.json for permissions
- Verify code was added to correct file
- Check browser console for errors
- Reload extension in Chrome

### Code Appears Twice?
- Injector checks for duplicates
- If you see duplicates, you may have manually added similar code
- Safe to remove duplicate manually

### Permission Denied?
- Ensure manifest.json has required permissions
- Reload extension in Chrome after changes
- Check Chrome's extension permissions page

## Integration with Other Tools

### Works With:
- ✅ All 13 Quick Templates
- ✅ Extension Wizard
- ✅ AI Generate
- ✅ Manual projects

### Complements:
- **AI Generate**: Use AI for custom logic, injector for standard features
- **Templates**: Start with template, inject additional features
- **Wizard**: Generate base, inject features not in wizard options

## Future Enhancements

Planned features for Feature Injector:
- More features (web requests, alarms, omnibox)
- Custom code snippets
- Feature presets (common combinations)
- Undo/remove injected features
- Preview before injection

---

**The Feature Injector makes ReMixr truly modular - start with any base and add exactly the features you need!**
