# Development Guide

## Project Structure

```
ReMixr/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup UI
├── popup.css           # Popup styling
├── popup.js            # Popup logic and AI generation
├── content.js          # Content script (runs on all pages)
├── background.js       # Background service worker
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md           # User documentation
├── DEVELOPMENT.md      # This file
└── .gitignore          # Git ignore rules
```

## Technologies Used

- **Manifest V3**: Latest Chrome Extension API
- **Vanilla JavaScript**: No frameworks for minimal overhead
- **CSS3**: Modern styling with gradients and animations
- **Chrome Storage API**: Persistent storage for remixes
- **Chrome Scripting API**: Dynamic code injection

## Development Setup

1. Clone the repository
2. Make your changes
3. Load the extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory
4. Test your changes
5. Reload the extension after making changes

## Key Components

### popup.js
- Handles user interactions in the popup
- Generates CSS based on natural language prompts
- Manages remix storage
- Communicates with content scripts

### content.js
- Runs on every webpage
- Automatically applies saved remixes
- Listens for messages from popup

### background.js
- Handles extension lifecycle events
- Manages tab updates
- Future: Will handle AI API calls

## Adding New Features

### Adding a New Preset

1. Open `popup.html`
2. Add a new button in the `.preset-buttons` section:
```html
<button class="btn btn-preset" data-preset="new-preset-name">New Preset</button>
```

3. Open `popup.js`
4. Add a new case in the `applyPreset` function:
```javascript
case 'new-preset-name':
  prompt = 'Description of what this preset does';
  break;
```

### Improving AI Generation

The `generateRemixScript` function in `popup.js` contains the AI logic. Currently it uses keyword matching. To integrate a real AI API:

1. Get an API key from your AI provider
2. Store it securely (consider using Chrome's identity API for OAuth)
3. Replace the `generateRemixScript` function with API calls
4. Parse the AI response and convert to CSS

Example structure:
```javascript
async function generateRemixScript(prompt) {
  const response = await fetch('https://api.example.com/generate', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ prompt })
  });
  const data = await response.json();
  return {
    type: 'custom',
    css: data.generatedCSS
  };
}
```

## Testing

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup opens and displays current site
- [ ] AI remix generates and applies CSS
- [ ] LinkedIn presets work correctly
- [ ] Remixes persist across page reloads
- [ ] Multiple remixes can be applied
- [ ] Individual remixes can be removed
- [ ] Clear all remixes works
- [ ] Status messages display correctly
- [ ] Extension works on different websites

### Testing on Different Sites

1. LinkedIn: `https://www.linkedin.com`
2. Twitter: `https://twitter.com`
3. GitHub: `https://github.com`
4. Wikipedia: `https://wikipedia.org`

## Debugging

### View Console Logs

- **Popup**: Right-click the popup → Inspect
- **Background Script**: Go to `chrome://extensions/` → Click "service worker"
- **Content Script**: Open DevTools on any webpage → Console

### Common Issues

**Remix not applying:**
- Check if content script loaded (look for console message)
- Verify CSS syntax in generated remix
- Check storage to see if remix was saved

**Extension not loading:**
- Validate manifest.json syntax
- Check for JavaScript errors in background script
- Ensure all files are present

## Code Style

- Use semicolons
- Use single quotes for strings
- Use async/await for asynchronous operations
- Add comments for complex logic
- Keep functions small and focused

## Performance Considerations

- CSS injection is fast but be mindful of selector complexity
- Storage operations are asynchronous
- Content scripts run on every page - keep them lightweight
- Avoid DOM manipulation unless necessary

## Security

- Never inject user input directly as JavaScript
- Sanitize all CSS before injection
- Use Content Security Policy (CSP)
- Don't store sensitive data in local storage
- Validate all messages between scripts

## Future Enhancements

### High Priority
- Real AI API integration
- Visual CSS editor
- Export/import remixes

### Medium Priority
- Remix templates library
- User accounts and sync
- Advanced CSS selectors UI

### Low Priority
- JavaScript remixing (currently only CSS)
- Team sharing features
- Analytics dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [CSS Selectors Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
