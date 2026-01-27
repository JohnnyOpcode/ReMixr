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

    const target = e.target;
    const selector = getSelector(target);
    const styles = window.getComputedStyle(target);

    // Collect specific styles for editing
    const styleData = {
        selector: selector,
        tagName: target.tagName.toLowerCase(),
        attributes: Array.from(target.attributes).map(attr => ({ name: attr.name, value: attr.value })),
        styles: {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
            padding: styles.padding,
            margin: styles.margin,
            border: styles.border,
            borderRadius: styles.borderRadius,
            display: styles.display,
            flexDirection: styles.flexDirection,
            justifyContent: styles.justifyContent,
            alignItems: styles.alignItems,
            gap: styles.gap,
            width: styles.width,
            height: styles.height,
            opacity: styles.opacity,
            boxShadow: styles.boxShadow,
            fontFamily: styles.fontFamily,
            fontWeight: styles.fontWeight,
            visibility: styles.visibility
        }
    };

    chrome.runtime.sendMessage({
        action: 'elementSelected',
        data: styleData
    });

    // Still copy to clipboard for convenience
    navigator.clipboard.writeText(selector).then(() => {
        // Visual feedback
        const originalText = overlay.innerHTML;
        overlay.innerHTML = `<div style="color:#4ade80; text-align:center; padding: 10px;">Inspector Tracking Element...</div>`;
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
        const newState = request.state !== undefined ? request.state : !inspectorActive;
        toggleInspector(newState);
        sendResponse({ active: newState });
    } else if (request.action === 'analyzePsyche') {
        try {
            const result = analyzePsychologicalPatterns();
            sendResponse(result);
        } catch (error) {
            console.error('analyzePsyche error:', error);
            sendResponse(null);
        }
    } else if (request.action === 'analyzeArchetype') {
        try {
            const result = analyzeBrandArchetype();
            sendResponse(result);
        } catch (error) {
            console.error('analyzeArchetype error:', error);
            sendResponse(null);
        }
    } else if (request.action === 'analyzeSoul') {
        try {
            const result = analyzeSoul();
            sendResponse(result);
        } catch (error) {
            console.error('analyzeSoul error:', error);
            sendResponse(null);
        }
    } else if (request.action === 'analyzeShadow') {
        try {
            const result = analyzeShadow();
            sendResponse(result);
        } catch (error) {
            console.error('analyzeShadow error:', error);
            sendResponse(null);
        }
    } else if (request.action === 'analyzeRhetoric') {
        try {
            const result = analyzeRhetoric();
            sendResponse(result);
        } catch (error) {
            console.error('analyzeRhetoric error:', error);
            sendResponse(null);
        }
    } else if (request.action === 'analyzeEmotion') {
        try {
            const result = analyzeEmotionalDesign();
            sendResponse(result);
        } catch (error) {
            console.error('analyzeEmotion error:', error);
            sendResponse(null);
        }
    } else if (request.action === 'updateStyle') {
        try {
            const el = document.querySelector(request.selector);
            if (el) {
                el.style[request.property] = request.value;
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: 'Element not found' });
            }
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    } else if (request.action === 'analyzeStrategy') {
        try {
            const result = analyzeStrategicArchitecture();
            sendResponse(result);
        } catch (error) {
            console.error('analyzeStrategy error:', error);
            sendResponse(null);
        }
    } else if (request.action === 'visualizeStrategy') {
        try {
            visualizeStrategicMapping();
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    } else if (request.action === 'analyzeOmniscience') {
        // THE OMNISCIENT BLUEPRINT: Aggregates ALL intelligence layers
        const intelligence = {
            strategy: analyzeStrategicArchitecture(),
            psyche: analyzePsychologicalPatterns(),
            specimen: analyzeSpecimen(),
            soul: analyzeSoul(),
            archetype: analyzeBrandArchetype(),
            rhetoric: analyzeRhetoric(),
            domain: window.location.hostname,
            timestamp: new Date().toISOString()
        };
        sendResponse(intelligence);
    } else if (request.action === 'toggleXRay') {
        try {
            const active = toggleXRayMode();
            sendResponse({ active });
        } catch (error) {
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'toggleHeatmap') {
        try {
            const active = toggleHeatmap();
            sendResponse({ active });
        } catch (error) {
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'analyzeSpecimen') {
        try {
            const result = analyzeSpecimen();
            sendResponse(result);
        } catch (error) {
            sendResponse(null);
        }
    } else if (request.action === 'extractCompleteModel') {
        // NEW: Complete object model extraction
        try {
            const result = extractCompleteObjectModel();
            sendResponse(result);
        } catch (error) {
            console.error('extractCompleteModel error:', error);
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'extractFrameworkState') {
        // NEW: Framework-specific state extraction
        try {
            const result = extractFrameworkState();
            sendResponse(result);
        } catch (error) {
            console.error('extractFrameworkState error:', error);
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'extractAPISurface') {
        // NEW: API surface mapping
        try {
            const result = extractAPISurface();
            sendResponse(result);
        } catch (error) {
            console.error('extractAPISurface error:', error);
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'toggleContrastMap') {
        try {
            const active = toggleContrastMap();
            sendResponse({ active });
        } catch (error) {
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'toggleEventSniffer') {
        try {
            const active = toggleEventSniffer();
            sendResponse({ active });
        } catch (error) {
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'applyReality') {
        try {
            const result = applyReality(request.style);
            sendResponse({ success: true, style: result });
        } catch (error) {
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'toggleGodMode') {
        try {
            const active = toggleGodMode();
            sendResponse({ active });
        } catch (error) {
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'toggleWireframe') {
        document.body.classList.toggle('remixr-wireframe');
        if (!document.getElementById('remixr-wireframe-style')) {
            const style = document.createElement('style');
            style.id = 'remixr-wireframe-style';
            style.textContent = `
                 .remixr-wireframe * {
                     background: none !important;
                     color: #0f0 !important;
                     border: 1px solid #0f0 !important;
                     box-shadow: none !important;
                 }
                 .remixr-wireframe img, .remixr-wireframe video {
                     display: none !important;
                 }
                 .remixr-wireframe {
                     background-color: #000 !important;
                 }
             `;
            document.head.appendChild(style);
            sendResponse({ status: 'active' });
        } else {
            document.getElementById('remixr-wireframe-style').remove();
            sendResponse({ status: 'inactive' });
        }
    } else if (request.action === 'toggleImages') {
        const images = document.querySelectorAll('img');
        if (document.body.getAttribute('data-remixr-images') === 'hidden') {
            images.forEach(img => img.style.opacity = '1');
            document.body.removeAttribute('data-remixr-images');
            sendResponse({ status: 'visible' });
        } else {
            images.forEach(img => img.style.opacity = '0');
            document.body.setAttribute('data-remixr-images', 'hidden');
            sendResponse({ status: 'hidden' });
        }
    } else if (request.action === 'enableInputs') {
        const disabled = document.querySelectorAll('input[disabled], button[disabled], textarea[disabled]');
        disabled.forEach(el => {
            el.removeAttribute('disabled');
            el.style.border = '2px solid #4ade80';
        });
        sendResponse({ count: disabled.length });
    } else if (request.action === 'showPasswords') {
        const pwds = document.querySelectorAll('input[type="password"]');
        pwds.forEach(el => {
            el.type = 'text';
            el.style.border = '2px solid #ef4444';
        });
        sendResponse({ count: pwds.length });
    } else if (request.action === 'killStickies') {
        const stickies = document.querySelectorAll('*');
        let count = 0;
        stickies.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'sticky') {
                el.style.position = 'static';
                count++;
            }
        });
        sendResponse({ count });
    } else if (request.action === 'toggleEditMode') {
        document.designMode = document.designMode === 'on' ? 'off' : 'on';
        sendResponse({ active: document.designMode === 'on' });
    } else if (request.action === 'toggleGravity') {
        try {
            const active = toggleGravityMode();
            sendResponse({ active });
        } catch (error) {
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'toggleNeural') {
        try {
            const active = toggleNeuralLink();
            sendResponse({ active });
        } catch (error) {
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'toggleGhost') {
        try {
            const active = toggleGhostTrace();
            sendResponse({ active });
        } catch (error) {
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'zapElement') {


        // Enable Zap Mode (click to delete)
        if (window.remixrZapHandler) {
            document.removeEventListener('click', window.remixrZapHandler, true);
            window.remixrZapHandler = null;
            document.body.style.cursor = 'default';
            sendResponse({ active: false });
        } else {
            window.remixrZapHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.target.remove();
            };
            document.addEventListener('click', window.remixrZapHandler, true);
            document.body.style.cursor = 'crosshair';
            sendResponse({ active: true });
        }
    }
    return true;
});

// ============================================
// BRAND SPECIMEN ANALYSIS
// ============================================

function analyzeSpecimen() {
    const specimen = {
        fonts: [],
        colors: {
            brand: [],
            text: [],
            bg: []
        },
        buttons: [],
        spacing: new Set()
    };

    // Fonts
    const fontSet = new Set();
    document.querySelectorAll('h1, h2, h3, p, span, a, button').forEach(el => {
        const style = window.getComputedStyle(el);
        const font = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        if (font) fontSet.add(font);

        // Spacing
        specimen.spacing.add(style.paddingTop);
        specimen.spacing.add(style.gap);
    });
    specimen.fonts = Array.from(fontSet).slice(0, 10);
    specimen.spacing = Array.from(specimen.spacing).filter(s => s !== '0px' && s !== 'normal').slice(0, 10);

    // Colors
    const colors = extractDominantColors();
    specimen.colors.brand = colors.slice(0, 12);

    // UI Specimens
    const mainButtons = Array.from(document.querySelectorAll('button, .btn, .button')).slice(0, 5);
    specimen.buttons = mainButtons.map(btn => {
        const style = window.getComputedStyle(btn);
        return {
            text: btn.innerText.trim().slice(0, 20) || 'Action',
            bg: style.backgroundColor,
            color: style.color,
            radius: style.borderRadius,
            padding: style.padding,
            font: style.fontFamily.split(',')[0]
        };
    });

    return specimen;
}

// ============================================
// VISUAL WEALTH: 3D X-RAY (DOM EXPLODER)
// ============================================

let xrayActive = false;
function toggleXRayMode() {
    xrayActive = !xrayActive;
    const body = document.body;

    if (xrayActive) {
        body.style.transition = 'transform 1s ease-in-out';
        body.style.transformStyle = 'preserve-3d';
        body.style.perspective = '2000px';
        body.style.transform = 'rotateY(20deg) rotateX(10deg) scale(0.8)';

        const all = document.querySelectorAll('*');
        all.forEach((el, i) => {
            if (el.tagName === 'BODY' || el.tagName === 'HTML' || el.id?.startsWith('remixr')) return;
            const depth = getDepth(el) * 20;
            el.style.transition = 'transform 0.5s ease-out';
            el.style.transform = `translateZ(${depth}px)`;
            el.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.2)';
            el.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        });
    } else {
        body.style.transform = '';
        const all = document.querySelectorAll('*');
        all.forEach(el => {
            el.style.transform = '';
            el.style.boxShadow = '';
            el.style.backgroundColor = '';
        });
    }
    return xrayActive;
}

function getDepth(el) {
    let d = 0;
    while (el.parentElement) {
        el = el.parentElement;
        d++;
    }
    return d;
}

// ============================================
// VISUAL WEALTH: ATTENTION HEATMAP
// ============================================

let heatmapActive = false;
let heatmapCanvas = null;

function toggleHeatmap() {
    heatmapActive = !heatmapActive;
    if (heatmapActive) {
        heatmapCanvas = document.createElement('canvas');
        heatmapCanvas.id = 'remixr-heatmap';
        heatmapCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999997;
            opacity: 0.6;
            mix-blend-mode: multiply;
        `;
        document.body.appendChild(heatmapCanvas);
        renderHeatmap();
    } else {
        if (heatmapCanvas) heatmapCanvas.remove();
    }
    return heatmapActive;
}

function renderHeatmap() {
    if (!heatmapCanvas) return;
    const ctx = heatmapCanvas.getContext('2d');
    const w = window.innerWidth;
    const h = window.innerHeight;
    heatmapCanvas.width = w;
    heatmapCanvas.height = h;

    const elements = Array.from(document.querySelectorAll('h1, h2, h3, button, img, a, [role="button"]'));

    // Draw base
    ctx.fillStyle = 'rgba(0, 50, 100, 0.1)';
    ctx.fillRect(0, 0, w, h);

    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top > h || rect.bottom < 0) return;

        const weight = (rect.width * rect.height) / 1000 + 20;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, weight * 3);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.2)');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, weight * 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ============================================
// ENHANCED ELEMENT DATA (CSS VARIABLES)
// ============================================

function getCssVariables(el) {
    const vars = {};
    const styles = window.getComputedStyle(el);
    for (const prop of styles) {
        if (prop.startsWith('--')) {
            vars[prop] = styles.getPropertyValue(prop);
        }
    }
    // Also check parent variables that might be inherited
    let parent = el.parentElement;
    while (parent && Object.keys(vars).length < 20) {
        const pStyles = window.getComputedStyle(parent);
        for (const prop of pStyles) {
            if (prop.startsWith('--') && !vars[prop]) {
                vars[prop] = pStyles.getPropertyValue(prop);
            }
        }
        parent = parent.parentElement;
    }
    return vars;
}

// Redefine handleClick to include variables
const originalHandleClick = handleClick;
function handleClick(e) {
    if (!inspectorActive) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    const selector = getSelector(target);
    const styles = window.getComputedStyle(target);
    const cssVars = getCssVariables(target);

    const styleData = {
        selector: selector,
        tagName: target.tagName.toLowerCase(),
        attributes: Array.from(target.attributes).map(attr => ({ name: attr.name, value: attr.value })),
        variables: cssVars,
        styles: {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
            padding: styles.padding,
            margin: styles.margin,
            border: styles.border,
            borderRadius: styles.borderRadius,
            display: styles.display,
            flexDirection: styles.flexDirection,
            justifyContent: styles.justifyContent,
            alignItems: styles.alignItems,
            gap: styles.gap,
            width: styles.width,
            height: styles.height,
            opacity: styles.opacity,
            boxShadow: styles.boxShadow,
            fontFamily: styles.fontFamily,
            fontWeight: styles.fontWeight,
            visibility: styles.visibility
        }
    };

    chrome.runtime.sendMessage({
        action: 'elementSelected',
        data: styleData
    });

    // Provide visual feedback
    const overlay = document.getElementById('remixr-inspector-overlay');
    if (overlay) {
        const originalText = overlay.innerHTML;
        overlay.innerHTML = `<div style="color:#4ade80; text-align:center; padding: 10px;">Deep Trace Complete...</div>`;
        setTimeout(() => {
            overlay.innerHTML = originalText;
        }, 1000);
    }
}

// ============================================
// VISUAL WEALTH: GRAVITY MODE (DOM PHYSICS)
// ============================================

let gravityActive = false;
let gravityInterval = null;
let physicsElements = [];

function toggleGravityMode() {
    gravityActive = !gravityActive;
    if (gravityActive) {
        const all = document.querySelectorAll('div, p, span, h1, h2, h3, button, img, a');
        physicsElements = Array.from(all).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 &&
                window.getComputedStyle(el).position !== 'fixed' &&
                !el.id?.startsWith('remixr');
        }).map(el => {
            const rect = el.getBoundingClientRect();
            el.style.position = 'fixed';
            el.style.top = rect.top + 'px';
            el.style.left = rect.left + 'px';
            el.style.width = rect.width + 'px';
            el.style.height = rect.height + 'px';
            el.style.margin = '0';
            el.style.zIndex = '999990';

            return {
                el,
                y: rect.top,
                x: rect.left,
                vy: 0,
                vx: (Math.random() - 0.5) * 5,
                w: rect.width,
                h: rect.height
            };
        });

        const gravity = 0.5;
        const friction = 0.98;
        const bounce = 0.7;

        gravityInterval = setInterval(() => {
            const floor = window.innerHeight;
            const wall = window.innerWidth;

            physicsElements.forEach(p => {
                p.vy += gravity;
                p.y += p.vy;
                p.x += p.vx;

                if (p.y + p.h > floor) {
                    p.y = floor - p.h;
                    p.vy *= -bounce;
                    p.vx *= friction;
                }

                if (p.x + p.w > wall || p.x < 0) {
                    p.vx *= -bounce;
                }

                p.el.style.top = p.y + 'px';
                p.el.style.left = p.x + 'px';
            });
        }, 16);
    } else {
        clearInterval(gravityInterval);
        physicsElements.forEach(p => {
            p.el.style.position = '';
            p.el.style.top = '';
            p.el.style.left = '';
            p.el.style.width = '';
            p.el.style.height = '';
        });
        physicsElements = [];
    }
    return gravityActive;
}

// ============================================
// VISUAL WEALTH: NEURAL LINK (LOGIC CONNECTIONS)
// ============================================

let neuralActive = false;
let neuralCanvas = null;

function toggleNeuralLink() {
    neuralActive = !neuralActive;
    if (neuralActive) {
        neuralCanvas = document.createElement('canvas');
        neuralCanvas.id = 'remixr-neural-canvas';
        neuralCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999995;
            opacity: 0.8;
        `;
        document.body.appendChild(neuralCanvas);
        renderNeuralLink();
        window.addEventListener('resize', renderNeuralLink);
    } else {
        if (neuralCanvas) neuralCanvas.remove();
        window.removeEventListener('resize', renderNeuralLink);
    }
    return neuralActive;
}

function renderNeuralLink() {
    if (!neuralCanvas) return;
    const ctx = neuralCanvas.getContext('2d');
    const w = window.innerWidth;
    const h = window.innerHeight;
    neuralCanvas.width = w;
    neuralCanvas.height = h;

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#6366f1';

    // Link interactive elements to their conceptual targets
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(a => {
        const targetId = a.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        if (target) {
            drawLine(ctx, a, target, '#6366f1');
        }
    });

    // Link labels to inputs
    const labels = document.querySelectorAll('label[for]');
    labels.forEach(l => {
        const target = document.getElementById(l.getAttribute('for'));
        if (target) {
            drawLine(ctx, l, target, '#4ade80');
        }
    });

    // Link buttons to forms
    const buttons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
    buttons.forEach(b => {
        const form = b.closest('form');
        if (form) {
            drawLine(ctx, b, form, '#f87171');
        }
    });
}

function drawLine(ctx, el1, el2, color) {
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();

    if (r1.width === 0 || r2.width === 0) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(r1.left + r1.width / 2, r1.top + r1.height / 2);

    // Curved line
    const cp1x = r1.left + r1.width / 2;
    const cp1y = r2.top + r2.height / 2;
    ctx.quadraticCurveTo(cp1x, cp1y, r2.left + r2.width / 2, r2.top + r2.height / 2);

    ctx.stroke();

    // Draw particles along line
    const dotPos = (Date.now() / 1000) % 1;
    const px = Math.pow(1 - dotPos, 2) * (r1.left + r1.width / 2) + 2 * (1 - dotPos) * dotPos * cp1x + Math.pow(dotPos, 2) * (r2.left + r2.width / 2);
    const py = Math.pow(1 - dotPos, 2) * (r1.top + r1.height / 2) + 2 * (1 - dotPos) * dotPos * cp1y + Math.pow(dotPos, 2) * (r2.top + r2.height / 2);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
}

// ============================================
// VISUAL WEALTH: GHOST TRACE (INTERACTION REPLAY)
// ============================================

let ghostActive = false;
let mouseTrace = [];
const MAX_TRACE = 100;

function toggleGhostTrace() {
    ghostActive = !ghostActive;
    if (ghostActive) {
        document.addEventListener('mousemove', recordTrace);
        document.addEventListener('click', recordClick);
        animateGhost();
    } else {
        document.removeEventListener('mousemove', recordTrace);
        document.removeEventListener('click', recordClick);
    }
    return ghostActive;
}

function recordTrace(e) {
    mouseTrace.push({ x: e.clientX, y: e.clientY, type: 'move', time: Date.now() });
    if (mouseTrace.length > MAX_TRACE) mouseTrace.shift();
}

function recordClick(e) {
    mouseTrace.push({ x: e.clientX, y: e.clientY, type: 'click', time: Date.now() });
    if (mouseTrace.length > MAX_TRACE) mouseTrace.shift();
}

function animateGhost() {
    if (!ghostActive) {
        const existing = document.querySelectorAll('.remixr-ghost-dot');
        existing.forEach(d => d.remove());
        return;
    }

    const existing = document.querySelectorAll('.remixr-ghost-dot');
    existing.forEach(d => d.remove());

    const now = Date.now();
    mouseTrace.forEach((point, i) => {
        const age = now - point.time;
        if (age > 5000) return; // Only show last 5 seconds

        const dot = document.createElement('div');
        dot.className = 'remixr-ghost-dot';
        dot.style.cssText = `
            position: fixed;
            top: ${point.y}px;
            left: ${point.x}px;
            width: ${point.type === 'click' ? '20px' : '4px'}px;
            height: ${point.type === 'click' ? '20px' : '4px'}px;
            background: ${point.type === 'click' ? '#f87171' : '#6366f1'};
            border-radius: 50%;
            pointer-events: none;
            z-index: 999999;
            opacity: ${1 - age / 5000};
            transform: translate(-50%, -50%);
            box-shadow: 0 0 10px ${point.type === 'click' ? '#f87171' : '#6366f1'};
        `;
        document.body.appendChild(dot);
    });

    requestAnimationFrame(animateGhost);
}

// ============================================
// COMPLETE OBJECT MODEL EXTRACTION
// ============================================

function extractCompleteObjectModel() {
    return {
        metadata: {
            url: window.location.href,
            domain: window.location.hostname,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        },
        frameworks: extractFrameworks(),
        stateManagement: extractStateInfo(),
        globalVariables: extractGlobals(),
        storage: {
            localStorage: { ...localStorage },
            sessionStorage: { ...sessionStorage },
            cookies: extractCookies()
        },
        customElements: Array.from(new Set(
            Array.from(document.querySelectorAll('*'))
                .map(el => el.tagName.toLowerCase())
                .filter(tag => tag.includes('-'))
        )),
        apiEndpoints: extractAPIHints(),
        domTree: buildDOMSummary(document.body, 3), // Depth current limited to 3
        computedStyles: extractKeyStyles(),
        prototypes: extractPrototypeChain()
    };
}

function extractFrameworks() {
    const detected = [];
    const versions = {};

    if (window.React || document.querySelector('[data-reactroot], [data-reactid]')) detected.push('React');
    if (window.angular || document.querySelector('.ng-app, [ng-app]')) detected.push('Angular');
    if (window.Vue) detected.push('Vue');
    if (window.jQuery) {
        detected.push('jQuery');
        versions['jQuery'] = window.jQuery.fn.jquery;
    }
    if (window.bootstrap) detected.push('Bootstrap');
    if (document.querySelector('meta[name="next-head-count"]')) detected.push('Next.js');

    return { detected, versions };
}

function extractStateInfo() {
    return {
        redux: !!(window.__REDUX_DEVTOOLS_EXTENSION__ || window.__REDUX_STORE__),
        vuex: !!window.__VUE_DEVTOOLS_GLOBAL_HOOK__,
        mobx: !!window.__mobxGlobal && !!window.__mobxGlobal.version
    };
}

function extractGlobals() {
    const globals = {};
    const skip = ['window', 'self', 'document', 'name', 'location', 'history', 'customElements', 'history', 'location', 'top', 'parent', 'frames'];

    // Simple heuristic for "custom" globals
    for (const key in window) {
        if (!skip.includes(key) && isNaN(key) && window[key] !== null) {
            try {
                const type = typeof window[key];
                if (type !== 'function') {
                    globals[key] = { type, value: String(window[key]).slice(0, 100) };
                }
            } catch (e) { }
        }
    }
    return globals;
}

function extractCookies() {
    const cookies = {};
    if (document.cookie) {
        document.cookie.split(';').forEach(c => {
            const [key, val] = c.trim().split('=');
            cookies[key] = val;
        });
    }
    return cookies;
}

function extractAPIHints() {
    const detected = [];
    // Catch API URLs from links and scripts
    const attrSelectors = ['a[href*="/api/"]', 'script[src*="/api/"]', 'link[href*="/api/"]'];
    document.querySelectorAll(attrSelectors.join(',')).forEach(el => {
        const url = el.href || el.src;
        if (url) detected.push(url);
    });

    return {
        detected: [...new Set(detected)],
        baseUrl: window.location.origin,
        graphql: !!document.querySelector('link[rel*="graphql"]') || document.body.innerText.includes('graphql')
    };
}

function buildDOMSummary(el, maxDepth, currentDepth = 0) {
    if (!el || currentDepth > maxDepth) return null;

    return {
        name: el.tagName.toLowerCase(),
        class: el.className,
        id: el.id,
        value: el.children.length, // use length as a proxy for value/weight
        children: Array.from(el.children)
            .map(child => buildDOMSummary(child, maxDepth, currentDepth + 1))
            .filter(Boolean)
    };
}

function extractKeyStyles() {
    const styles = {};
    const keySelectors = ['body', 'header', 'footer', 'main', 'h1', 'button.primary'];
    keySelectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) {
            const comp = window.getComputedStyle(el);
            styles[sel] = {
                color: comp.color,
                bg: comp.backgroundColor,
                font: comp.fontFamily,
                spacing: comp.padding
            };
        }
    });
    return styles;
}

function extractPrototypeChain() {
    // Introspect common prototypes if modified
    const chains = {};
    const targets = ['Array', 'Object', 'Function', 'String'];
    targets.forEach(t => {
        const proto = window[t].prototype;
        const methods = Object.getOwnPropertyNames(proto).filter(p => !['constructor', 'toString', 'valueOf'].includes(p));
        chains[t] = methods.slice(0, 10);
    });
    return chains;
}

// ============================================
// UI FORENSICS & REALITY DISTORTION
// ============================================

let contrastActive = false;
function toggleContrastMap() {
    contrastActive = !contrastActive;
    if (contrastActive) {
        const style = document.createElement('style');
        style.id = 'remixr-contrast-style';
        style.textContent = `
            * { background: #000 !important; color: #fff !important; outline: 1px solid #333 !important; }
            img, video, iframe { filter: grayscale(1) contrast(200%) !important; }
        `;
        document.head.appendChild(style);
    } else {
        document.getElementById('remixr-contrast-style')?.remove();
    }
    return contrastActive;
}

let snifferActive = false;
function toggleEventSniffer() {
    snifferActive = !snifferActive;
    const events = ['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'submit', 'change'];

    const handler = (e) => {
        console.log(`%c[ReMixr Sniffer] %c${e.type} on %o`, 'color:#6366f1; font-weight:bold', 'color:white', e.target);
    };

    if (snifferActive) {
        events.forEach(type => document.addEventListener(type, handler, true));
        console.log('ReMixr event sniffer active. Watch console for interaction live-feed.');
    } else {
        events.forEach(type => document.removeEventListener(type, handler, true));
    }
    return snifferActive;
}

function applyReality(style) {
    if (!style) return 'Reseting reality...';
    document.body.style.filter = style.filter || '';
    document.body.style.transform = style.transform || '';
    return 'Reality Shifted.';
}