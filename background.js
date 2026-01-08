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

// ReMixr Extension Builder - Background Service Worker
// Manages extension builder state and operations

chrome.runtime.onInstalled.addListener(() => {
  console.log('ReMixr Extension Builder installed!');

  // Initialize storage if needed
  chrome.storage.local.get(['extensionProjects'], (result) => {
    if (!result.extensionProjects) {
      chrome.storage.local.set({ extensionProjects: [] });
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateExtension') {
    // Handle extension generation requests
    sendResponse({ success: true });
  }

  if (request.action === 'testExtension') {
    // Open extensions page for testing
    chrome.tabs.create({ url: 'chrome://extensions/' });
    sendResponse({ success: true });
  }

  return true;
});

// Helper to manage project storage
async function saveProject(project) {
  const { extensionProjects } = await chrome.storage.local.get(['extensionProjects']);
  const projects = extensionProjects || [];
  projects.push(project);
  await chrome.storage.local.set({ extensionProjects: projects });
}

async function loadProjects() {
  const { extensionProjects } = await chrome.storage.local.get(['extensionProjects']);
  return extensionProjects || [];
}
