# ReMixr Inspector - Quick Reference

## 🚀 Quick Start

1. Open target website
2. Click ReMixr icon → **Inspector** tab
3. Click **💎 Complete Extraction**
4. Click **🤖 Download AI Context (Markdown)**
5. Paste into your AI assistant

## 📊 What Gets Extracted

| Category | Data Captured |
|----------|---------------|
| **Frameworks** | React, Vue, Angular, jQuery, Svelte, Next.js, Nuxt.js + versions |
| **State** | Redux, Vuex, MobX stores |
| **DOM** | Complete tree with styles, attributes, bounding boxes |
| **APIs** | Endpoints, GraphQL, method signatures |
| **Storage** | localStorage, sessionStorage, cookies, IndexedDB |
| **Events** | All DOM event listeners |
| **Globals** | Custom window properties |
| **Components** | React/Vue component trees with props/state |

## 🎯 Common Use Cases

### Extension Development
```
Extract → Identify APIs → Build integration → Test
```

### Web Scraping
```
Extract → Map DOM → Find selectors → Automate
```

### Reverse Engineering
```
Extract → Analyze stack → Study patterns → Document
```

### Security Audit
```
Extract → Review globals → Check storage → Assess risk
```

## 🤖 AI Integration

### ChatGPT/Claude/Gemini
1. Download Markdown context
2. Upload to AI chat
3. Ask: "Help me build a Chrome extension for this site"

### Example Prompts
- "What frameworks is this using?"
- "How can I integrate with their API?"
- "Generate extension code to interact with this site"
- "Identify security vulnerabilities"

## 📥 Export Options

| Button | Output | Use For |
|--------|--------|---------|
| **📥 Download JSON** | Complete extraction | Programmatic analysis |
| **🤖 Download Markdown** | AI-ready context | AI assistants |
| **📋 Copy Clipboard** | JSON data | Quick paste |
| **🔮 Transform** | Auto-download MD | One-click AI context |

## 🔍 Extraction Depth

- **Window Object**: 3 levels
- **DOM Tree**: 10 levels
- **Components**: 5 levels
- **API Objects**: 2 levels

## ⚡ Performance

- **Typical**: 1-3 seconds
- **Large sites**: Up to 5 seconds
- **Cached**: Instant re-export

## 🛡️ Privacy

- ✅ All local (no external servers)
- ⚠️ Review sensitive data before sharing
- ⚠️ Storage may contain personal info

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Extraction failed" | Refresh page, try again |
| Missing framework data | Check if production build |
| Empty results | Wait for page load |
| Slow extraction | Normal for large sites |

## 📚 Documentation

- **Full Guide**: `INSPECTOR_EXTRACTION_GUIDE.md`
- **Summary**: `INSPECTOR_ENHANCEMENT_SUMMARY.md`
- **Code**: `extraction-engine.js`

## 🎨 Customization

Edit depth limits in `extraction-engine.js`:
```javascript
extractWindowObject(maxDepth = 3)  // Window depth
extractDOMTree(maxDepth = 10)      // DOM depth
extractReactTree(depth, maxDepth = 5)  // Component depth
```

## 🔑 Key Functions

| Function | Purpose |
|----------|---------|
| `extractCompleteObjectModel()` | Main extraction |
| `extractWindowObject()` | Window introspection |
| `extractDOMTree()` | DOM serialization |
| `detectFrameworks()` | Framework detection |
| `extractStateManagement()` | State extraction |
| `extractAPISurface()` | API mapping |

## 💡 Pro Tips

1. **Extract early**: Capture state before user interactions
2. **Compare extractions**: Run before/after to see changes
3. **Use JSON for code**: Programmatic access to data
4. **Use Markdown for AI**: Better context for assistants
5. **Review before sharing**: Check for sensitive data

## 🚧 Limitations

- ❌ Cross-origin iframes
- ❌ Obfuscated code readability
- ❌ Dynamic content (snapshot only)
- ❌ Some private framework internals
- ❌ Event listeners (needs DevTools API)

## 🔮 Coming Soon

- Network request recording
- WebSocket monitoring
- Performance metrics
- Screenshot integration
- Diff mode
- Custom export templates

---

**ReMixr v1.1.0** | *Unravel. Flatten. Remix.*
