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
  setupSidePanel();

  // Create context menu item
  chrome.contextMenus.create({
    id: "remixr-toggle",
    title: "ReMixr IDE",
    contexts: ["all"]
  });

  // Initialize storage if needed
  chrome.storage.local.get(['extensionProjects'], (result) => {
    if (!result.extensionProjects) {
      chrome.storage.local.set({ extensionProjects: [] });
    }
  });
});

// Also run on startup to ensure state handles restarts
chrome.runtime.onStartup.addListener(() => {
  setupSidePanel();
});

function setupSidePanel() {
  // Set side panel to open on click
  // This persists across sessions
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
}

// Fallback: If for some reason the above doesn't work, manual trigger
// Note: setPanelBehavior {openPanelOnActionClick: true} is usually sufficient.
// However, adding a direct listener provides double assurance if the API allows it.
// The doc says: "The onClicked event will not be dispatched if the extension has an active popup."
// We removed default_popup, so this should fire if setPanelBehavior fails or isn't supported.
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "remixr-toggle") {
    // Open the side panel first
    chrome.sidePanel.open({ windowId: tab.windowId });

    // Then toggle the inspector in the current tab
    chrome.tabs.sendMessage(tab.id, { action: "toggleInspector" });
  }
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
