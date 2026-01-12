# 🎨 ReMixr

**The Ultimate Meta-Extension Builder & Web Analysis Suite**

ReMixr is a powerful browser extension that lets you **build other browser extensions** directly in your browser. It combines an AI-powered development environment (IDE) with a suite of sophisticated analysis and hacking ("MacGyver") tools, effectively giving you "Developer Superpowers" on any website.

## ✨ Features

### 🛠️ Extension Builder IDE
- **Extension Wizard**: Configure and generate fully bespoke Chrome extensions with a comprehensive wizard interface
  - Choose extension type (Content Script, Popup, Side Panel, Page Action)
  - Select from 10+ features (Background Worker, Storage, Tabs, Notifications, etc.)
  - Configure permissions and behaviors
  - Support for multiple UI frameworks (Vanilla JS, React, Vue, Svelte)
- **Feature Injector**: Add features to any project with one click
  - Inject 26 features from the wizard into any extension
  - **Core Features**: Storage, Tabs, Notifications, Context Menu, Background, Bookmarks, History, Downloads, Cookies, Web Request
  - **UI Components**: Side Panel, Theme Toggle, Keyboard Shortcuts, Badge Counter
  - **Behaviors**: Sync Storage, Auto-Open, Persist State, Match Site Style, Auto-Run, Analytics, Hot Reload, Error Tracking
  - Works with templates, wizard-generated, or AI-generated projects
  - Automatically updates manifest and adds working code
- **13 Quick Templates**: Start with professional, working templates:
  - 🚀 Starter, 🎨 Content Modifier, 📊 Data Extractor, ⏱️ Productivity Timer, 🔧 Popup Tool
  - 📑 Tab Manager, 🔖 Bookmark Organizer, 📝 Form Filler
  - 🌙 Universal Dark Mode, 🛡️ Ad Blocker, 📸 Screenshot Tool
  - 🔐 Password Generator, 📝 Quick Notes
- **AI-Powered Generation**: Describe your idea ("Make all backgrounds pink", "Extract emails"), and ReMixr builds the code
- **Professional Editor**: Integrated **CodeMirror** editor with Dracula theme, syntax highlighting, and live preview
- **One-Click Export**: Generates unique, ready-to-install `.zip` packages with custom icons

### 🔍 Deep Analysis Suite
- **Interactive Inspector**: Point-and-click to identify unique CSS selectors
- **Visualizer**: View the DOM as a stunning **D3.js Force-Directed Graph**
- **Tech Stack Detector**: Identify frameworks (React, Vue, Next.js) used on the page
- **Performance**: Metrics on load times, asset counts, and storage usage
- **Psychological Analysis**: Detect dark patterns, persuasion techniques, and emotional design
- **SEO & Accessibility**: Comprehensive health checks

### 🧰 MacGyver Tools (Operations)
- **Reality Distortion**: Edit text on any page, Zap elements instantly, View Wireframes
- **Lock Picking**: Unmask passwords, Force-enable disabled inputs, Remove sticky headers
- **Exfiltration**: One-click export of all Links, Colors, or specialized Data

## 🚀 Installation

### From Source (Developer Mode)

1.  **Build the Project**:
    ```bash
    npm install
    npm run build
    ```
    This creates a clean `build/` directory.

2.  **Load into Chrome**:
    *   Open `chrome://extensions/`
    *   Enable **Developer mode** (top right)
    *   Click **Load unpacked**
    *   Select the `ReMixr/build` folder

## 📖 Usage Guide

### Quick Start with Templates

1. **Browse Templates**: Go to the Templates tab
2. **Select a Template**: Click any template card (e.g., "Tab Manager", "Dark Mode")
3. **Customize**: Template loads in Builder - edit as needed
4. **Export**: Click "Download ZIP" and load into Chrome

### Create Bespoke Extension with Wizard

1. **Open Wizard**: Go to Templates tab, scroll to "Extension Wizard"
2. **Configure**:
   - Enter name and description
   - Select extension type
   - Check desired features
   - Configure permissions and behaviors
3. **Generate**: Click "Generate Extension"
4. **Customize**: Extension loads in Builder ready for editing
5. **Export**: Download and install

### Analysis Workflow

1. **Analysis Phase**: Before building, understand your target
   - Use the **Inspector** tab to scan the site
   - Use `Inspector` toggle to find CSS selectors
   - Check `Visualize` to see the site complexity

2. **Operational Phase**: Test your theories
   - Use **Tools → Edit Mode** to rewrite page copy live
   - Use **Tools → Zap** to clear clutter

3. **Build Phase**:
   - Go to **Builder**
   - Use AI prompt or wizard to generate code
   - **Preview** your changes live
   - **Export** your new extension

## 📚 Documentation

- **[Quick Reference Guide](QUICK_REFERENCE.md)**: Complete guide to templates and wizard
- **[Feature Injector Guide](FEATURE_INJECTOR_GUIDE.md)**: How to inject features into any project
- **[Enhancement Summary](ENHANCEMENT_SUMMARY.md)**: Details on new features
- **[Examples](EXAMPLES.md)**: Real-world extension examples
- **[Development Guide](DEVELOPMENT.md)**: For contributors

## 🗺️ Roadmap

*   **Phase 1**: ✅ Extension Wizard & Expanded Templates (Complete)
*   **Phase 2**: LLM API Integration (GPT-4/Claude) for advanced logic generation
*   **Phase 3**: Cloud Gallery for sharing user-created Remixes
*   **Phase 4**: Automated Chrome Web Store publishing

## 🎯 Key Capabilities

### What You Can Build
- **Content Modifiers**: Change how websites look and behave
- **Data Extractors**: Scrape and export data from pages
- **Productivity Tools**: Tab managers, timers, note-takers
- **Privacy Tools**: Ad blockers, password generators
- **Utility Extensions**: Screenshot tools, form fillers
- **Custom Solutions**: Anything you can imagine!

### Supported Features
- ✅ Content Scripts
- ✅ Background Service Workers
- ✅ Browser Actions (Popups)
- ✅ Side Panels
- ✅ Context Menus
- ✅ Keyboard Shortcuts
- ✅ Storage (Local & Sync)
- ✅ Tab Management
- ✅ Notifications
- ✅ And much more!

## 📄 License

Licensed under the Apache License, Version 2.0. Copyright 2026 John Kost.
See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with:
- [CodeMirror](https://codemirror.net/) - Code editor
- [D3.js](https://d3js.org/) - Visualizations
- [JSZip](https://stuk.github.io/jszip/) - ZIP generation

---

**Ready to build?** Install ReMixr and start creating Chrome extensions in minutes!
