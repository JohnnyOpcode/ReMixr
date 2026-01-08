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

// ReMixr Analysis Content Script
// Handles interactive inspection of the target page

let inspectorActive = false;
let overlay = null;
let lastHighlighted = null;

// Initialize Overlay
function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'remixr-inspector-overlay';
    overlay.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(15, 23, 42, 0.95);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 999999;
    pointer-events: none;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.2);
    min-width: 250px;
    display: none;
    backdrop-filter: blur(10px);
  `;
    document.body.appendChild(overlay);
}

// Generate unique CSS selector
function getSelector(el) {
    if (el.id) return '#' + el.id;
    if (el.className && typeof el.className === 'string') {
        const classes = el.className.split(' ').filter(c => c.trim() && !c.includes('hover') && !c.includes('active'));
        if (classes.length > 0) return '.' + classes.join('.');
    }
    let tagName = el.tagName.toLowerCase();
    let siblingIndex = 1;
    let sibling = el;
    while (sibling = sibling.previousElementSibling) {
        if (sibling.tagName.toLowerCase() === tagName) siblingIndex++;
    }
    if (siblingIndex > 1) tagName += `:nth-of-type(${siblingIndex})`;

    return tagName;
}

// Highlight element
function highlightElement(e) {
    if (!inspectorActive) return;

    const target = e.target;
    if (target === overlay || target === lastHighlighted) return;

    // Remove old highlight
    if (lastHighlighted) {
        lastHighlighted.style.outline = '';
        lastHighlighted.style.cursor = '';
    }

    // Apply new highlight
    target.style.outline = '2px solid #667eea';
    target.style.cursor = 'crosshair';
    lastHighlighted = target;

    // Update Overlay
    const rect = target.getBoundingClientRect();
    const selector = getSelector(target);
    const color = window.getComputedStyle(target).color;
    const bg = window.getComputedStyle(target).backgroundColor;
    const font = window.getComputedStyle(target).fontFamily;

    overlay.style.display = 'block';
    overlay.innerHTML = `
    <div style="color: #a5b4fc; font-weight: bold; margin-bottom: 5px;">${target.tagName.toLowerCase()}</div>
    <div style="margin-bottom: 5px; word-break: break-all;">${selector}</div>
    <div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 5px 0; padding-top: 5px;">
      Size: ${Math.round(rect.width)} x ${Math.round(rect.height)} px<br>
      Color: <span style="display:inline-block;width:10px;height:10px;background:${color};"></span> ${color}<br>
      Bg: <span style="display:inline-block;width:10px;height:10px;background:${bg};border:1px solid #fff;"></span> ${bg}<br>
      Font: ${font.split(',')[0]}
    </div>
    <div style="color: #fbbf24; font-size: 10px;">Click to copy selector</div>
  `;
}

// Click to copy
function handleClick(e) {
    if (!inspectorActive) return;
    e.preventDefault();
    e.stopPropagation();

    const selector = getSelector(e.target);
    navigator.clipboard.writeText(selector).then(() => {
        // Visual feedback
        const originalText = overlay.innerHTML;
        overlay.innerHTML = `<div style="color:#4ade80; text-align:center; padding: 10px;">Selector Copied!</div>`;
        setTimeout(() => {
            overlay.innerHTML = originalText;
        }, 1000);
    });
}

// Toggle Inspector
function toggleInspector(active) {
    inspectorActive = active;
    createOverlay();

    if (active) {
        document.addEventListener('mouseover', highlightElement);
        document.addEventListener('click', handleClick, true);
        overlay.style.display = 'none'; // Hidden until hover
        console.log('ReMixr Inspector: Active');
    } else {
        document.removeEventListener('mouseover', highlightElement);
        document.removeEventListener('click', handleClick, true);
        if (overlay) overlay.style.display = 'none';
        if (lastHighlighted) lastHighlighted.style.outline = '';
        console.log('ReMixr Inspector: Inactive');
    }
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleInspector') {
        toggleInspector(request.state);
        sendResponse({ active: request.state });
    }
    return true;
});
