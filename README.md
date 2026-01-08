# 🎨 ReMixr

**Build Browser Extensions with AI - Right in Your Browser**

ReMixr is a meta-extension that helps you create browser extensions using natural language. Like Lovable.dev for browser extensions, ReMixr provides an AI-powered development environment directly in your browser.

## Features

- 🤖 **AI-Powered Generation**: Describe your extension idea, and ReMixr generates the complete code structure
- 📦 **Template Library**: Start from proven templates (content modifiers, page scrapers, productivity tools, etc.)
- 💻 **Built-in Code Editor**: Edit manifest, JavaScript, HTML, and CSS files in a live preview environment
- 🔄 **Instant Testing**: Test your extension in real-time without leaving the builder
- 📤 **Export & Package**: Download your completed extension ready to load or publish
- 🎓 **Learning Mode**: Understand browser extension concepts as you build

## Installation

### From Source

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the ReMixr directory

## Usage

### Quick Start: Build Your First Extension

1. Click the ReMixr icon in your browser toolbar
2. Choose "New Extension" or select a template:
   - **Content Modifier**: Change how websites look or behave
   - **Productivity Tool**: Add features to boost productivity
   - **Data Extractor**: Scrape and export webpage data
   - **Page Monitor**: Track changes on websites
3. Describe your extension idea in natural language:
   - "Create an extension that highlights all links on a page"
   - "Build a timer that tracks time spent on each website"
   - "Make a tool that saves all images from a page"
4. Click "Generate Extension"
5. Review and edit the generated code in the built-in editor
6. Test instantly with "Load & Test"
7. Export when ready with "Download Extension"

### Advanced Features

- **Code Editor**: Full-featured editor with syntax highlighting
- **File Manager**: Organize manifest, scripts, styles, and assets
- **Live Preview**: See your extension in action as you build
- **AI Assistant**: Get help debugging or adding features

## How It Works

ReMixr provides a complete browser-based IDE for extension development:

1. **AI Generation Engine**: Converts natural language into complete extension structures
2. **Template System**: Pre-built extension patterns for common use cases
3. **Code Editor**: Monaco-based editor with IntelliSense and validation
4. **Project Manager**: Handles manifest.json, scripts, styles, and assets
5. **Testing Environment**: Dynamically loads your extension for instant testing
6. **Export System**: Packages everything into a downloadable .zip

### Architecture

```
┌─────────────────────┐
│   Builder UI        │ ← AI prompts & templates
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Generator Engine   │ ← Creates extension structure
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Project Storage    │ ← IndexedDB for projects
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Code Editor        │ ← Edit & preview files
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Test & Export      │ ← Load dynamically & download
└─────────────────────┘
```

## Examples

### Example 1: Link Highlighter
Prompt: "Create an extension that highlights all external links in yellow"

Generates:
- manifest.json with permissions
- content.js to find and highlight links
- Optional: popup for toggle controls

### Example 2: Page Timer
Prompt: "Build a productivity tracker that shows time spent on each website"

Generates:
- manifest.json with storage permissions
- background.js for time tracking
- popup.html/js for statistics display
- Timer logic and data persistence

### Example 3: Image Downloader
Prompt: "Make a tool that finds and downloads all images from the current page"

Generates:
- manifest.json with download permissions
- content.js to extract images
- popup.html/js for UI and download controls

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
