/*
 * Copyright 2026 John Kost
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

    // Generate and add icons (Premium feature)
    const icon16 = await generateIconBlob(currentProject.name, 16);
    const icon48 = await generateIconBlob(currentProject.name, 48);
    const icon128 = await generateIconBlob(currentProject.name, 128);

    zip.folder("icons");
    zip.file("icons/icon16.png", icon16);
    zip.file("icons/icon48.png", icon48);
    zip.file("icons/icon128.png", icon128);

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

// Generate Icon Blob
function generateIconBlob(name, size) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Professional Gradient
    const grd = ctx.createLinearGradient(0, 0, size, size);
    grd.addColorStop(0, "#667eea");
    grd.addColorStop(1, "#764ba2");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);

    // Letter
    ctx.fillStyle = "white";
    ctx.font = `bold ${Math.round(size * 0.6)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.charAt(0).toUpperCase(), size / 2, size / 2);

    canvas.toBlob(resolve);
  });
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
