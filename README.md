# 🎨 ReMixr

A Chrome Browser Extension to Remix Sites (like LinkedIn) using AI-generated browser extension scripts.

## Features

- 🤖 **AI-Powered Remixing**: Describe how you want to change any website, and ReMixr generates the code to make it happen
- 💾 **Persistent Remixes**: Your customizations are saved and automatically applied when you visit the site again
- 🎯 **LinkedIn Presets**: Quick-apply popular LinkedIn modifications (Minimal UI, Focus Mode, Dark Theme)
- 🔧 **Custom Modifications**: Create any visual modification you can imagine with natural language prompts
- 🌐 **Universal Support**: Works on any website

## Installation

### From Source

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the ReMixr directory

## Usage

### Using AI Prompts

1. Click the ReMixr icon in your browser toolbar
2. Enter a description of how you want to modify the page:
   - "Hide all ads"
   - "Make all profile photos round"
   - "Apply dark mode"
   - "Make the interface minimal and clean"
3. Click "Generate & Apply Remix"
4. The remix is applied instantly and saved for future visits

### LinkedIn Presets

For LinkedIn users, we provide quick-apply presets:

- **Minimal UI**: Reduces visual clutter by dimming sidebar elements
- **Focus Mode**: Hides ads and distractions
- **Dark Theme**: Inverts colors for a dark mode experience

### Managing Remixes

- View all active remixes for the current site in the "Active Remixes" section
- Remove individual remixes with the "Remove" button
- Clear all remixes for a site with "Clear All Remixes"

## How It Works

ReMixr uses a combination of:

1. **Natural Language Processing**: Your prompts are analyzed to understand the desired changes
2. **CSS Generation**: Dynamic CSS is generated to implement your modifications
3. **Content Scripts**: The generated styles are injected into the target webpage
4. **Persistent Storage**: Remixes are saved locally and automatically reapplied on future visits

### Architecture

```
┌─────────────┐
│   Popup UI  │ ← User interacts here
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  popup.js   │ ← Generates CSS based on prompts
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Storage    │ ← Saves remixes
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ content.js  │ ← Injects styles into pages
└─────────────┘
```

## Examples

### Hide Advertisements
Prompt: "Hide all ads"
```css
[class*="ad-"], [id*="ad-"], .sponsored {
  display: none !important;
}
```

### Dark Mode
Prompt: "Apply dark mode"
```css
body, html {
  filter: invert(1) hue-rotate(180deg);
  background: #1a1a1a !important;
}
```

### Round Profile Photos
Prompt: "Make profile photos round"
```css
img[alt*="photo"], img[alt*="profile"], .profile-photo {
  border-radius: 50% !important;
}
```

## Future Enhancements

- 🔌 Integration with real AI APIs (GPT-4, Claude, etc.)
- 🎨 Visual editor for fine-tuning remixes
- 📤 Share remixes with other users
- 🌍 Community remix library
- 📊 Analytics on most popular remixes
- 🔄 Sync remixes across devices

## Privacy

- All remixes are stored locally in your browser
- No data is sent to external servers
- No tracking or analytics

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

See LICENSE file for details.

## Support

If you encounter any issues or have suggestions, please open an issue on GitHub.
