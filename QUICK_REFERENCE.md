# ReMixr Quick Reference Guide

## 🚀 Quick Templates (13 Total)

### Getting Started Templates
| Template | Icon | Use Case | Key Features |
|----------|------|----------|--------------|
| **Starter** | 🚀 | Empty boilerplate | Basic popup structure |
| **Content Modifier** | 🎨 | Inject CSS/JS | Content scripts, page styling |
| **Data Extractor** | 📊 | Scrape data | Extract links, images, text |
| **Productivity Timer** | ⏱️ | Track time | Background worker, storage |
| **Popup Tool** | 🔧 | Browser utilities | Multiple tools in one |

### Advanced Templates
| Template | Icon | Use Case | Key Features |
|----------|------|----------|--------------|
| **Tab Manager** | 📑 | Organize tabs | Close duplicates, group by domain, save sessions |
| **Bookmark Organizer** | 🔖 | Manage bookmarks | Search, add current page |
| **Form Filler** | 📝 | Auto-fill forms | Save profile, auto-populate fields |
| **Universal Dark Mode** | 🌙 | Dark theme | Toggle dark mode, adjustable intensity |
| **Ad Blocker** | 🛡️ | Block ads | Content script, mutation observer |
| **Screenshot Tool** | 📸 | Capture pages | Screenshot visible area |
| **Password Generator** | 🔐 | Secure passwords | Customizable, copy to clipboard |
| **Quick Notes** | 📝 | Take notes | Auto-save, persistent storage |

## 🧙 Extension Wizard

### Step-by-Step Guide

#### 1. Basic Information
```
Name: [Your Extension Name]
Description: [Brief description of what it does]
```

#### 2. Extension Type
- **Content Script**: Modifies web pages directly
- **Browser Action (Popup)**: Shows a popup when clicked
- **Side Panel**: Opens a persistent side panel
- **Page Action**: Contextual, appears on specific pages

#### 3. Features Selection

**Core Features:**
- ☐ Background Service Worker - Run code in background
- ☐ Local Storage - Save data locally
- ☐ Tab Management - Control browser tabs
- ☐ Context Menu Items - Add right-click menu options
- ☐ Notifications - Show system notifications

**Advanced Features:**
- ☐ Bookmarks Access - Read/write bookmarks
- ☐ History Access - Access browsing history
- ☐ Download Management - Control downloads
- ☐ Cookie Access - Read/write cookies
- ☐ Network Interception - Monitor/modify requests

#### 4. Host Permissions
- **Active Tab Only**: Only access current tab (recommended)
- **All Websites**: Access all sites (requires user approval)
- **Custom Domains**: Specify domains (e.g., `https://example.com/*`)

#### 5. UI Framework
- Vanilla JavaScript (default)
- React
- Vue
- Svelte

#### 6. Behaviors

**User Experience:**
- ☐ Match Parent Site Style - Adapt to site's design
- ☐ Auto-Open Side Panel - Open automatically
- ☐ Persist State - Remember settings
- ☐ Keyboard Shortcuts - Add hotkeys
- ☐ Badge Notifications - Show badge on icon

**Functionality:**
- ☐ Auto-Run on Load - Execute immediately
- ☐ Sync Across Devices - Use Chrome sync
- ☐ Theme Support - Light/dark theme toggle

**Development:**
- ☐ Usage Analytics - Track usage
- ☐ Hot Reload Dev Mode - Auto-reload on changes
- ☐ Error Tracking - Log errors

## 📝 Workflow Examples

### Example 1: Simple Page Highlighter
**Using Quick Template:**
1. Click "Content Modifier" template
2. Edit `content.js` to highlight text
3. Save and export

**Using Wizard:**
1. Name: "Text Highlighter"
2. Type: Content Script
3. Features: None needed
4. Host Permissions: All Websites
5. Generate → Edit content.js

### Example 2: Productivity Dashboard
**Using Wizard:**
1. Name: "Productivity Dashboard"
2. Type: Browser Action (Popup)
3. Features: ✓ Background Service Worker, ✓ Local Storage, ✓ Tab Management
4. Behaviors: ✓ Persist State, ✓ Theme Support
5. Generate → Customize in Builder

### Example 3: Custom Tab Organizer
**Using Quick Template:**
1. Start with "Tab Manager" template
2. Modify `popup.js` to add custom grouping logic
3. Update `styles.css` for custom UI
4. Test and export

## 🛠️ Builder Features

### File Management
- **manifest.json**: Extension configuration
- **popup.html**: UI structure
- **popup.js**: Main logic
- **styles.css**: Styling
- **content.js**: Page modification (if applicable)
- **background.js**: Background tasks (if applicable)

### Actions
- **Save**: Save project to local storage
- **Load**: Test in Chrome
- **Download ZIP**: Export for distribution
- **Preview UI**: See popup/sidepanel preview

## 🔍 Testing Your Extension

1. Click "Load" button in Builder
2. Follow the deployment guide:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select extracted ZIP folder
3. Test functionality
4. Make changes in Builder
5. Re-export and reload in Chrome

## 💡 Tips & Best Practices

### Performance
- Use content scripts sparingly
- Minimize permissions requested
- Lazy-load features when possible

### Security
- Validate all user input
- Use HTTPS for external resources
- Follow principle of least privilege

### User Experience
- Keep popups under 600px wide
- Provide clear feedback for actions
- Use icons and visual cues
- Support keyboard navigation

### Development
- Test on multiple websites
- Handle errors gracefully
- Log important events
- Version your extensions

## 🐛 Common Issues

### Extension Won't Load
- Check manifest.json syntax
- Verify all file paths are correct
- Ensure permissions are properly declared

### Content Script Not Working
- Check `matches` pattern in manifest
- Verify `run_at` timing
- Check browser console for errors

### Storage Not Persisting
- Ensure `storage` permission is declared
- Use `chrome.storage.local` or `chrome.storage.sync`
- Check for quota limits

## 📚 Resources

### Chrome Extension Documentation
- [Getting Started](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [API Reference](https://developer.chrome.com/docs/extensions/reference/)

### ReMixr Features
- **Inspector**: Analyze web pages
- **Tools**: Quick utilities for development
- **AI Generate**: Describe functionality in natural language

## 🎯 Quick Command Reference

### Keyboard Shortcuts (in Builder)
- `Ctrl+S`: Save project
- `Ctrl+E`: Export extension
- `Ctrl+P`: Preview UI

### Common Permissions
```json
"permissions": [
  "activeTab",      // Access current tab
  "storage",        // Local storage
  "tabs",           // Tab management
  "contextMenus",   // Right-click menus
  "notifications",  // System notifications
  "bookmarks",      // Bookmark access
  "history",        // History access
  "downloads",      // Download management
  "cookies",        // Cookie access
  "webRequest"      // Network interception
]
```

### Host Permissions Examples
```json
"host_permissions": [
  "https://example.com/*",     // Specific domain
  "https://*.google.com/*",    // All Google subdomains
  "<all_urls>"                 // All websites
]
```

---

**Need Help?** Check the Templates tab for working examples or use the Wizard to generate a starting point!
