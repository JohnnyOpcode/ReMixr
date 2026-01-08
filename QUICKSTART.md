# 🚀 ReMixr Quick Start Guide

Welcome to ReMixr - your AI-powered browser extension builder!

## What is ReMixr?

ReMixr is a browser extension that helps you **build other browser extensions** using natural language and AI assistance. Think of it as "Lovable.dev for browser extensions" - a complete development environment in your browser.

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the ReMixr folder
6. Click the ReMixr icon in your toolbar

## Your First Extension in 2 Minutes

### Method 1: Use a Template

1. Click the ReMixr icon
2. Go to the **Templates** tab
3. Choose a template (e.g., "Content Modifier")
4. Click **Use Template**
5. Review the code in the Builder tab
6. Click **Save** then **Export**
7. Extract the .zip file
8. Load your new extension in `chrome://extensions/`

### Method 2: AI Generation

1. Click the ReMixr icon
2. Stay on the **Projects** tab
3. Click **+ New Extension Project**
4. In the AI Assistant box, describe your extension:
   ```
   Create an extension that highlights all external links in yellow
   ```
5. Click **Generate Extension Code**
6. ReMixr creates all the files automatically!
7. Click **Export** to download
8. Load your extension in Chrome

## Available Templates

### 🎨 Content Modifier
Perfect for: Changing webpage appearance, highlighting elements, custom styles
**Use case**: Make all images grayscale, highlight links, hide elements

### ⏱️ Productivity Tool
Perfect for: Time tracking, focus tools, productivity metrics
**Use case**: Track time on websites, block distractions

### 📊 Data Extractor
Perfect for: Scraping data, exporting information
**Use case**: Extract all links, download images, gather data

### 👁️ Page Monitor
Perfect for: Tracking changes, notifications
**Use case**: Monitor price changes, track updates

### 🔧 Popup Tool
Perfect for: Simple utilities with UI
**Use case**: Quick calculators, notes, shortcuts

### 📝 Blank Project
Perfect for: Starting from scratch
**Use case**: Complete custom extensions

## Example AI Prompts

Try these prompts in the AI Assistant:

```
Create an extension that highlights all external links
```

```
Build a timer that tracks time spent on each website
```

```
Make a tool that extracts all images from the current page
```

```
Create an extension that adds a dark mode toggle to any website
```

```
Build a productivity tracker that blocks social media sites
```

## The Builder Interface

### Projects Tab
- View all your extension projects
- Create new projects
- Open existing projects
- Delete projects

### Builder Tab
- **Project Name**: Set your extension name
- **AI Assistant**: Generate code from descriptions
- **File Tree**: Navigate between files
- **Code Editor**: Edit your extension code
- **Actions**:
  - **Save**: Save your project locally
  - **Test**: Get instructions for testing
  - **Export**: Download as .zip file

### Templates Tab
- Browse pre-built extension templates
- Click any template to start building

## Testing Your Extension

1. Click **Export** in the Builder
2. Save the .zip file
3. Extract it to a folder
4. Open `chrome://extensions/`
5. Enable **Developer mode**
6. Click **Load unpacked**
7. Select your extension folder
8. Your extension is now installed!

## File Structure

Every extension has these files:

- **manifest.json**: Extension configuration
- **popup.html**: User interface (if applicable)
- **popup.js**: UI logic
- **content.js**: Runs on web pages (if needed)
- **background.js**: Background tasks (if needed)
- **styles.css**: Styling

## Tips & Best Practices

### 🎯 Be Specific in Prompts
❌ "Make a good extension"
✅ "Create an extension that highlights all broken images on a page"

### 📝 Start with Templates
Templates provide solid foundations. Customize them instead of starting blank.

### 🔧 Test Often
Export and test your extension frequently to catch issues early.

### 💾 Save Your Work
Click Save regularly - projects are stored locally in the extension.

### 📚 Learn from Examples
Check the generated code to learn extension development patterns.

## Common Use Cases

### Modify Websites
- Custom themes
- Hide elements
- Change layouts
- Add features

### Productivity
- Time tracking
- Website blockers
- Focus modes
- Task managers

### Data Collection
- Web scraping
- Data extraction
- Content archiving
- Research tools

### Automation
- Auto-fill forms
- Keyboard shortcuts
- Batch operations
- Workflow tools

## Next Steps

1. **Experiment**: Try different prompts and templates
2. **Customize**: Edit the generated code to fit your needs
3. **Share**: Export and share your extensions
4. **Learn**: Study the code to understand extension development

## Troubleshooting

### Extension Won't Load
- Check manifest.json for errors
- Ensure all required files exist
- Verify permissions in manifest

### Code Not Working
- Check browser console for errors
- Test with simple examples first
- Review generated code logic

### Can't Export
- Ensure you have a project loaded
- Check browser's download permissions
- Try a different browser

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Extension Examples](https://github.com/GoogleChrome/chrome-extensions-samples)

## Get Help

- Check the DEVELOPMENT.md file for technical details
- Review EXAMPLES.md for more use cases
- Study the templates in the Templates tab

---

**Ready to build?** Open ReMixr and create your first extension! 🚀
