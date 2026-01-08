# 🎨 ReMixr

**The Ultimate Meta-Extension Builder & Web Analysis Suite**

ReMixr is a powerful browser extension that lets you **build other browser extensions** directly in your browser. It combines an AI-powered development environment (IDE) with a suite of sophisticated analysis and hacking ("MacGyver") tools, effectively giving you "Developer Superpowers" on any website.

## ✨ Features

### 🛠️ Extension Builder IDE
- **AI-Powered Generation**: Describe your idea ("Make all backgrounds pink", "Extract emails"), and ReMixr builds the code.
- **Professional Editor**: Integrated **CodeMirror** editor with Dracula theme, syntax highlighting, and live preview.
- **Templates**: Start with strong foundations (Content Modifiers, Data Extractors, Productivity Timers).
- **One-Click Export**: Generates unique, ready-to-install `.zip` packages with custom icons.

### 🔍 Deep Analysis Suite
- **Interactive Inspector**: Point-and-click to identify unique CSS selectors.
- **Visualizer**: View the DOM as a stunning **D3.js Force-Directed Graph**.
- **Tech Stack Detector**: Identify frameworks (React, Vue, Next.js) used on the page.
- **Performance**: Metrics on load times, asset counts, and storage usage.

### 🧰 MacGyver Tools (Operations)
- **Reality Distortion**: Edit text on any page, Zap elements instantly, View Wireframes.
- **Lock Picking**: Unmask passwords, Force-enable disabled inputs, Remove sticky headers.
- **Exfiltration**: One-click export of all Links, Colors, or specialized Data.

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

### 1. Analysis Phase
Before building, understand your target:
*   Use the **Analyze** tab to scan the site.
*   Use `Inspector` to find the CSS selector for the element you want to change (e.g., `.nav-bar`).
*   Check `Visualize` to see the site complexity.

### 2. Operational Phase
Test your theories:
*   Use **Tools -> Edit Mode** to rewrite page copy live.
*   Use **Tools -> Zap** to clear clutter.

### 3. Build Phase
*   Go to **Builder**.
*   Prompt the AI: *"Create an extension that hides `.nav-bar` and makes the background dark grey."* (Use selectors from step 1).
*   **Preview** your changes live.
*   **Export** your new extension.

## 🗺️ Roadmap

*   **Phase 1**: LLM API Integration (GPT-4/Claude) for advanced logic generation.
*   **Phase 2**: Cloud Gallery for sharing user-created Remixes.
*   **Phase 3**: Automated Chrome Web Store publishing.

## 📄 License

Licensed under the Apache License, Version 2.0. Copyright 2026 John Kost.
See [LICENSE](LICENSE) for details.
