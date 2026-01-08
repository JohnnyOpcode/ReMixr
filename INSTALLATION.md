# Installation Guide

## Installing ReMixr in Chrome

### Step 1: Download the Extension

You can either:
- Clone the repository: `git clone https://github.com/JohnnyOpcode/ReMixr.git`
- Download as ZIP from GitHub and extract it

### Step 2: Open Chrome Extensions

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Or click the three dots menu → More Tools → Extensions

### Step 3: Enable Developer Mode

1. Look for the "Developer mode" toggle in the top-right corner
2. Click to enable it

### Step 4: Load the Extension

1. Click the "Load unpacked" button (appears after enabling Developer mode)
2. Navigate to the ReMixr folder
3. Select the folder containing `manifest.json`
4. Click "Select Folder" or "Open"

### Step 5: Verify Installation

1. You should see the ReMixr extension appear in your extensions list
2. The ReMixr icon (🎨) should appear in your Chrome toolbar
3. If you don't see it in the toolbar, click the puzzle piece icon and pin ReMixr

## Testing the Extension

### Test 1: Basic Functionality

1. Navigate to any website (e.g., `https://www.linkedin.com`)
2. Click the ReMixr icon in your toolbar
3. The popup should open showing:
   - The current site hostname
   - A text area for AI prompts
   - LinkedIn preset buttons (if on LinkedIn)
   - Active remixes section

### Test 2: Apply a Simple Remix

1. On any website, click the ReMixr icon
2. Enter a prompt: "Add a purple border to the page"
3. Click "Generate & Apply Remix"
4. You should see a success message
5. The page should now have a purple border
6. Reload the page - the border should persist

### Test 3: LinkedIn Presets

1. Navigate to `https://www.linkedin.com` (you may need to be logged in)
2. Click the ReMixr icon
3. Click "Dark Theme" preset
4. The page should invert colors to create a dark mode effect
5. The remix appears in "Active Remixes" section

### Test 4: Multiple Remixes

1. Apply a remix (e.g., "Dark Theme")
2. Apply another remix (e.g., "Minimal UI")
3. Both should work together
4. Both should appear in "Active Remixes"

### Test 5: Remove a Remix

1. Apply one or more remixes
2. Click "Remove" on one of them
3. The page should reload without that remix
4. Other remixes should still be active

### Test 6: Clear All Remixes

1. Apply multiple remixes
2. Click "Clear All Remixes"
3. The page should reload to its original state
4. "Active Remixes" should show "No active remixes"

## Common Issues

### Extension Not Loading

**Problem**: Error when loading unpacked extension

**Solutions**:
- Make sure you selected the correct folder (containing manifest.json)
- Check Chrome console for error messages
- Verify all files are present (manifest.json, popup.html, etc.)
- Try closing and reopening Chrome

### Popup Not Opening

**Problem**: Nothing happens when clicking the extension icon

**Solutions**:
- Check if Developer mode is still enabled
- Try reloading the extension (click reload icon in chrome://extensions/)
- Check browser console for errors
- Verify popup.html and popup.js exist

### Remixes Not Applying

**Problem**: Clicking "Generate & Apply Remix" doesn't change the page

**Solutions**:
- Check if the content script loaded (open DevTools console and look for "ReMixr content script loaded")
- Try reloading the page
- Verify you have the necessary permissions
- Check if the site blocks content scripts

### Remixes Not Persisting

**Problem**: Remixes disappear after closing the browser

**Solutions**:
- Check if Chrome has permission to store data
- Verify storage permissions in manifest.json
- Check Chrome's storage settings

### Icons Not Showing

**Problem**: Extension icon appears as default puzzle piece

**Solutions**:
- Verify icon files exist in the `icons/` folder
- Check icon paths in manifest.json
- Reload the extension

## Updating the Extension

When you make changes to the code:

1. Go to `chrome://extensions/`
2. Find ReMixr
3. Click the reload icon (circular arrow)
4. Your changes will now be active

## Uninstalling

1. Go to `chrome://extensions/`
2. Find ReMixr
3. Click "Remove"
4. Confirm the removal

## Browser Compatibility

- ✅ Google Chrome (version 88+)
- ✅ Microsoft Edge (Chromium-based)
- ✅ Brave Browser
- ✅ Opera (Chromium-based)
- ❌ Firefox (different extension format)
- ❌ Safari (different extension format)

## Security & Privacy

- ReMixr runs entirely in your browser
- No data is sent to external servers
- All remixes are stored locally in Chrome's storage
- The extension only modifies pages you explicitly choose to remix
- Source code is open and auditable

## Getting Help

If you encounter issues:

1. Check the browser console for errors
2. Review the DEVELOPMENT.md file
3. Open an issue on GitHub
4. Include:
   - Chrome version
   - Error messages
   - Steps to reproduce
   - Screenshots if relevant

## Next Steps

Once installed, check out:
- [README.md](README.md) - User guide and examples
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide and architecture
