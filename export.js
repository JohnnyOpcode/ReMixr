// Extension Export & Packaging System
// Uses JSZip library loaded from CDN

async function exportExtension() {
  if (!currentProject) {
    showStatus('No project to export', 'error');
    return;
  }
  
  showStatus('Creating extension package...', 'info');
  
  try {
    // Load JSZip if not already loaded
    if (typeof JSZip === 'undefined') {
      await loadJSZip();
    }
    
    const zip = new JSZip();
    
    // Add all project files to zip
    for (const [filename, content] of Object.entries(currentProject.files)) {
      zip.file(filename, content);
    }
    
    // Generate the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    
    // Download the zip file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.replace(/\s+/g, '_')}_extension.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('Extension exported successfully!', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('Export failed: ' + error.message, 'error');
  }
}

// Load JSZip from CDN
function loadJSZip() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Export individual file
function exportFile(filename) {
  if (!currentProject || !currentProject.files[filename]) {
    showStatus('File not found', 'error');
    return;
  }
  
  const content = currentProject.files[filename];
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showStatus(`${filename} downloaded`, 'success');
}

// Create manifest for Chrome Web Store
function generateWebStoreManifest() {
  if (!currentProject) return null;
  
  const manifest = JSON.parse(currentProject.files['manifest.json'] || '{}');
  
  // Ensure required fields for Chrome Web Store
  return {
    ...manifest,
    icons: manifest.icons || {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    version: manifest.version || "1.0.0",
    description: manifest.description || "Extension description"
  };
}
