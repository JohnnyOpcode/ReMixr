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

(function () {
    "use strict";

    // ReMixr Injection Versioning
    window.REMIXR_VERSION = (window.REMIXR_VERSION || 0) + 1;
    const myVersion = window.REMIXR_VERSION;

    // Lifecycle: Cleanup previous instances if they left a cleanup hook
    if (window.REMIXR_CLEANUP) {
        window.REMIXR_CLEANUP();
    }

    console.log(`[ReMixr] Content Script Injection v${myVersion} starting...`);

    // ReMixr Analysis Content Script
    // Handles interactive inspection of the target page

    // Using var for top-level to allow extension re-injection without SyntaxErrors
    var inspectorActive = window.inspectorActive || false;
    var godModeActive = window.godModeActive || false;
    var gravityActive = window.gravityActive || false;
    var xrayActive = window.xrayActive || false;
    var heatmapActive = window.heatmapActive || false;
    var ghostActive = window.ghostActive || false;

    var overlay = window.overlay || document.getElementById('remixr-inspector-overlay');
    var lastHighlighted = window.lastHighlighted || null;
    var heatmapCanvas = window.heatmapCanvas || null;
    var gravityInterval = window.gravityInterval || null;
    var physicsElements = window.physicsElements || [];
    var mouseTrace = window.mouseTrace || [];
    var godModeStyle = window.godModeStyle || null;
    var flowRecording = window.flowRecording || false;
    var sessionEvents = window.sessionEvents || [];
    const MAX_TRACE = 100;

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

    // Generate unique CSS selector (Enhanced for Robustness)
    function getSelector(el) {
        if (!el || el === document) return 'html';
        if (el.id) return '#' + el.id;
        
        // Try stable attributes first
        const stableAttrs = ['data-testid', 'data-qa', 'aria-label', 'name', 'title'];
        for (const attr of stableAttrs) {
            const val = el.getAttribute(attr);
            if (val) return `${el.tagName.toLowerCase()}[${attr}="${val}"]`;
        }

        // Try classes (filtering out common dynamic utility classes)
        const classAttr = el.getAttribute('class');
        if (classAttr && typeof classAttr === 'string') {
            const classes = classAttr.split(' ').filter(c => {
                const isDynamic = /^(css-|emotion-|react-|v-|_|js-|hover:|focus:|active:|dark:|lg:|sm:|md:|xl:)/i.test(c);
                return c.trim() && !isDynamic;
            });
            if (classes.length > 0) return '.' + classes.join('.');
        }

        // Fallback to hierarchical path
        let tagName = el.tagName.toLowerCase();
        let siblingIndex = 1;
        let sibling = el;
        while (sibling = sibling.previousElementSibling) {
            if (sibling.tagName.toLowerCase() === tagName) siblingIndex++;
        }
        
        const path = (siblingIndex > 1) ? `${tagName}:nth-of-type(${siblingIndex})` : tagName;
        
        if (el.parentElement && el.parentElement !== document.body) {
            return getSelector(el.parentElement) + ' > ' + path;
        }

        return path;
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
        window.inspectorActive = active;
        createOverlay();

        if (active) {
            document.addEventListener('mouseover', highlightElement);
            document.addEventListener('click', handleClick, true);
            overlay.style.display = 'none'; // Hidden until hover
        } else {
            document.removeEventListener('mouseover', highlightElement);
            document.removeEventListener('click', handleClick, true);
            if (overlay) overlay.style.display = 'none';
            if (lastHighlighted) lastHighlighted.style.outline = '';
        }
    }

    // Register Cleanup Hook
    window.REMIXR_CLEANUP = () => {
        log(`Cleaning up context v${myVersion}...`);
        document.removeEventListener('mouseover', highlightElement);
        document.removeEventListener('click', handleClick, true);
        if (window.remixrEditHandler) document.removeEventListener('click', window.remixrEditHandler, true);
        if (window.remixrZapHandler) document.removeEventListener('click', window.remixrZapHandler, true);

        // Remove old UI elements if they shouldn't persist
        // We keep 'overlay' IDed elements but we can reset them
        const oldOverlay = document.getElementById('remixr-inspector-overlay');
        if (oldOverlay) oldOverlay.innerHTML = '';
    };

    // --- Message Dispatcher (Robust re-injection & version locking) ---
    window.messageHandlers = window.messageHandlers || {};
    Object.assign(window.messageHandlers, {

        'ping': () => ({ pong: true, version: myVersion, inspectorActive, godModeActive }),
        'extractSiteContext': generateLLMSiteContext,
        'toggleInspector': (req) => {
            const newState = req.state !== undefined ? req.state : !inspectorActive;
            toggleInspector(newState);
            return { active: newState };
        },
        'analyzePsyche': () => analyzePsychologicalPatterns(),
        'analyzeArchetype': analyzeBrandArchetype,
        'analyzeSoul': analyzeSoul,
        'analyzeShadow': analyzeShadow,
        'analyzeRhetoric': () => analyzeRhetoric(),
        'analyzeEmotion': () => analyzeEmotionalDesign(),
        'analyzeStrategy': () => analyzeStrategicArchitecture(),

        // Inspector Kernels (Consolidated from popup.js)
        'analyzeStructure': () => InspectorKernels.analyzeStructure(),
        'analyzePalette': () => InspectorKernels.analyzePalette(),
        'analyzeAssets': () => InspectorKernels.analyzeAssets(),
        'analyzeFonts': () => InspectorKernels.analyzeFonts(),
        'analyzeStorage': () => InspectorKernels.analyzeStorage(),
        'analyzePerf': () => InspectorKernels.analyzePerf(),
        'analyzeStack': () => InspectorKernels.analyzeStack(),
        'analyzeDomTree': () => InspectorKernels.analyzeDomTree(),
        'analyzeA11y': () => InspectorKernels.analyzeA11y(),
        'analyzeSEO': () => InspectorKernels.analyzeSEO(),
        'analyzeSequence': () => InspectorKernels.analyzeSequence(),
        'analyzeWorkers': async () => {
            if ('serviceWorker' in navigator) {
                try {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    return { serviceWorkers: regs.map(r => r.active ? r.active.scriptURL : 'Registered') };
                } catch(e) { return { Math, error: e.message, serviceWorkers: [] }; }
            }
            return { serviceWorkers: [] };
        },
        'analyzeCode': () => {
            const scripts = document.querySelectorAll('script');
            const inline = Array.from(scripts).filter(s => !s.src).length;
            const external = Array.from(scripts).filter(s => s.src).length;
            return { scripts: { inline, external }, totalElements: document.querySelectorAll('*').length };
        },
        'analyzeNet': extractAPISurface,
        'visualizeStrategy': (req) => { visualizeStrategicMapping(); return { success: true }; },
        'analyzeOmniscience': async () => {
            return {
                strategy: analyzeStrategicArchitecture(),
                psyche: analyzePsychologicalPatterns(),
                specimen: analyzeSpecimen(),
                soul: analyzeSoul(),
                shadow: analyzeShadow(),
                archetype: analyzeBrandArchetype(),
                rhetoric: analyzeRhetoric(),
                emotion: analyzeEmotionalDesign(),
                objectModel: extractCompleteObjectModel(),
                frameworkState: extractFrameworkState(),
                apiSurface: extractAPISurface(),
                domain: window.location.hostname,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        },
        'startSessionRecording': () => {
            flowRecording = true;
            window.flowRecording = true;
            sessionEvents = [];
            window.sessionEvents = [];
            document.addEventListener('click', recordEvent, true);
            document.addEventListener('input', recordEvent, true);
            console.log('[ReMixr] Session Recording started...');
            return { active: true };
        },
        'stopSessionRecording': () => {
            flowRecording = false;
            window.flowRecording = false;
            document.removeEventListener('click', recordEvent, true);
            document.removeEventListener('input', recordEvent, true);
            console.log('[ReMixr] Session Recording stopped. Events:', sessionEvents.length);
            return { events: sessionEvents };
        },
        'toggleXRay': () => ({ active: toggleXRayMode() }),
        'toggleHeatmap': () => ({ active: toggleHeatmap() }),
        'analyzeSpecimen': analyzeSpecimen,
        'extractCompleteModel': extractCompleteObjectModel,
        'extractFrameworkState': extractFrameworkState,
        'extractAPISurface': extractAPISurface,
        'extractSiteDNA': generateSiteDNA,
        'generateLLMContext': () => {
            const dna = generateSiteDNA();
            const markdown = generateLLMSiteContext(dna);
            return { markdown, dna, wordCount: markdown.split(/\s+/).length };
        },
        'toggleContrastMap': () => ({ active: toggleContrastMap() }),
        'toggleEventSniffer': () => ({ active: toggleEventSniffer() }),
        'applyReality': (req) => ({ success: true, style: applyReality(req.style) }),
        'toggleGodMode': () => ({ active: toggleGodMode() }),
        'toggleWireframe': () => {
            document.body.classList.toggle('remixr-wireframe');
            if (!document.getElementById('remixr-wireframe-style')) {
                const style = document.createElement('style');
                style.id = 'remixr-wireframe-style';
                style.textContent = `
                 .remixr-wireframe * { background: none !important; color: #0f0 !important; border: 1px solid #0f0 !important; box-shadow: none !important; }
                 .remixr-wireframe img, .remixr-wireframe video { display: none !important; }
                 .remixr-wireframe { background-color: #000 !important; }
             `;
                document.head.appendChild(style);
                return { status: 'active' };
            } else {
                document.getElementById('remixr-wireframe-style').remove();
                return { status: 'inactive' };
            }
        },
        'toggleImages': () => {
            const hide = document.body.getAttribute('data-remixr-images') !== 'hidden';
            document.querySelectorAll('img').forEach(img => img.style.opacity = hide ? '0' : '1');
            if (hide) document.body.setAttribute('data-remixr-images', 'hidden');
            else document.body.removeAttribute('data-remixr-images');
            return { status: hide ? 'hidden' : 'visible' };
        },
        'enableInputs': () => {
            const els = document.querySelectorAll('input[disabled], button[disabled], textarea[disabled]');
            els.forEach(el => { el.removeAttribute('disabled'); el.style.border = '2px solid #4ade80'; });
            return { count: els.length };
        },
        'showPasswords': () => {
            const pwds = document.querySelectorAll('input[type="password"]');
            pwds.forEach(el => { el.type = 'text'; el.style.border = '2px solid #ef4444'; });
            return { count: pwds.length };
        },
        'killStickies': () => {
            const els = document.querySelectorAll('*');
            let count = 0;
            els.forEach(el => {
                const s = window.getComputedStyle(el);
                if (s.position === 'fixed' || s.position === 'sticky') { el.style.position = 'static'; count++; }
            });
            return { count };
        },
        'toggleEditMode': () => {
            if (window.remixrEditHandler) {
                document.removeEventListener('click', window.remixrEditHandler, true);
                window.remixrEditHandler = null;
                document.body.style.cursor = 'default';
                return { active: false };
            } else {
                window.remixrEditHandler = (e) => { e.preventDefault(); e.target.contentEditable = true; e.target.focus(); };
                document.addEventListener('click', window.remixrEditHandler, true);
                document.body.style.cursor = 'cell';
                return { active: true };
            }
        },
        'toggleGravity': () => ({ active: toggleGravityMode() }),
        'toggleNeural': () => ({ active: toggleNeuralLink() }),
        'toggleGhost': () => ({ active: toggleGhostTrace() }),
        'zapElement': () => {
            if (window.remixrZapHandler) {
                document.removeEventListener('click', window.remixrZapHandler, true);
                window.remixrZapHandler = null;
                document.body.style.cursor = 'default';
                return { active: false };
            } else {
                window.remixrZapHandler = (e) => { e.preventDefault(); e.stopPropagation(); e.target.remove(); };
                document.addEventListener('click', window.remixrZapHandler, true);
                document.body.style.cursor = 'crosshair';
                return { active: true };
            }
        },
        'updateStyle': (req) => {
            const el = document.querySelector(req.selector);
            if (el) { el.style[req.property] = req.value; return { success: true }; }
            return { success: false, error: 'Element lost' };
        }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Version Lock: Only the most recently injected script responds
        if (myVersion !== window.REMIXR_VERSION) {
            console.log(`[ReMixr] Context v${myVersion} ignoring message - newer context v${window.REMIXR_VERSION} exists.`);
            return false;
        }

        const handler = window.messageHandlers[request.action];
        if (handler) {
            try {
                const result = handler(request);
                if (result instanceof Promise) {
                    result.then(sendResponse).catch(err => {
                        console.error(`[ReMixr] Handler Async Error [${request.action}]:`, err);
                        sendResponse({ error: err.message });
                    });
                    return true;
                }
                sendResponse(result);
            } catch (err) {
                console.error(`[ReMixr] Handler Sync Error [${request.action}]:`, err);
                sendResponse({ error: err.message });
            }
        } else {
            console.warn(`[ReMixr] No handler for action: ${request.action}`);
            sendResponse({ error: 'Unknown action' });
        }
    });

    console.log(`[ReMixr] Content script v${myVersion} fully initialized.`);



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

    function toggleXRayMode() {
        xrayActive = !xrayActive;
        window.xrayActive = xrayActive;
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

    function toggleHeatmap() {
        heatmapActive = !heatmapActive;
        window.heatmapActive = heatmapActive;
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

    function toggleGravityMode() {
        gravityActive = !gravityActive;
        window.gravityActive = gravityActive;
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

    function toggleGhostTrace() {
        ghostActive = !ghostActive;
        window.ghostActive = ghostActive;
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
                path: window.location.pathname,
                hash: window.location.hash,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    devicePixelRatio: window.devicePixelRatio,
                    scrollHeight: document.documentElement.scrollHeight
                },
                pageTitle: document.title,
                charset: document.characterSet,
                doctype: document.doctype ? document.doctype.name : 'none'
            },
            metaTags: extractMetaTags(),
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
            dataAttributes: extractDataAttributes(),
            apiEndpoints: extractAPIHints(),
            domTree: buildDOMSummary(document.body, 6),
            computedStyles: extractKeyStyles(),
            cssVariables: extractRootCSSVariables(),
            forms: extractFormModel(),
            navigation: extractNavigationModel(),
            media: extractMediaInventory(),
            interactionPoints: extractInteractionPoints(),
            prototypes: extractPrototypeChain()
        };
    }

    function extractFrameworks() {
        const detected = [];
        const versions = {};

        if (window.React || document.querySelector('[data-reactroot], [data-reactid]')) { detected.push('React'); if (window.React?.version) versions['React'] = window.React.version; }
        if (window.angular || document.querySelector('.ng-app, [ng-app], [data-ng-app]')) { detected.push('Angular'); if (window.angular?.version) versions['Angular'] = window.angular.version.full; }
        if (window.ng) { detected.push('Angular 2+'); }
        if (window.Vue || document.querySelector('[data-v-app]')) { detected.push('Vue'); if (window.Vue?.version) versions['Vue'] = window.Vue.version; }
        if (window.jQuery || window.$) { detected.push('jQuery'); if (window.jQuery?.fn?.jquery) versions['jQuery'] = window.jQuery.fn.jquery; }
        if (window.bootstrap) detected.push('Bootstrap');
        if (document.querySelector('meta[name="next-head-count"]') || window.__NEXT_DATA__) detected.push('Next.js');
        if (document.getElementById('__nuxt') || window.__NUXT__) detected.push('Nuxt.js');
        if (window.Shopify) detected.push('Shopify');
        if (document.querySelector('meta[name="generator"][content*="WordPress"]')) detected.push('WordPress');
        if (window.Webflow) detected.push('Webflow');
        if (window.Wix) detected.push('Wix');
        if (document.querySelector('[data-gatsby]') || window.___gatsby) detected.push('Gatsby');
        if (window.Svelte || document.querySelector('[class*="svelte-"]')) detected.push('Svelte');
        if (window.Alpine || document.querySelector('[x-data]')) detected.push('Alpine.js');
        if (window.htmx || document.querySelector('[hx-get], [hx-post]')) detected.push('htmx');
        if (document.querySelector('[data-turbo]') || window.Turbo) detected.push('Hotwire/Turbo');
        if (window.tailwind || document.querySelector('link[href*="tailwind"]')) detected.push('TailwindCSS');
        if (document.querySelector('link[href*="materialize"]') || window.M) detected.push('Materialize');
        if (document.querySelector('[class*="chakra-"]')) detected.push('Chakra UI');
        if (document.querySelector('[class*="mantine-"]')) detected.push('Mantine');
        if (window.gsap || window.TweenMax) detected.push('GSAP');
        if (window.AOS) detected.push('AOS');
        if (window.THREE) detected.push('Three.js');
        if (window.d3) detected.push('D3.js');
        if (window.Chart) detected.push('Chart.js');

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
        const keySelectors = ['body', 'header', 'footer', 'main', 'nav', 'h1', 'h2', 'h3', 'p', 'a', 'button', 'button.primary', '.btn', 'input', 'select', 'textarea', 'form', 'table', 'aside', 'section'];
        keySelectors.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) {
                const comp = window.getComputedStyle(el);
                styles[sel] = {
                    color: comp.color,
                    bg: comp.backgroundColor,
                    font: comp.fontFamily,
                    fontSize: comp.fontSize,
                    fontWeight: comp.fontWeight,
                    lineHeight: comp.lineHeight,
                    spacing: comp.padding,
                    margin: comp.margin,
                    border: comp.border,
                    borderRadius: comp.borderRadius,
                    boxShadow: comp.boxShadow !== 'none' ? comp.boxShadow : undefined,
                    display: comp.display,
                    position: comp.position,
                    textTransform: comp.textTransform !== 'none' ? comp.textTransform : undefined
                };
            }
        });
        return styles;
    }

    function extractMetaTags() {
        return Array.from(document.querySelectorAll('meta')).map(m => ({
            name: m.name || m.getAttribute('property') || m.getAttribute('http-equiv') || '',
            content: m.content || ''
        })).filter(m => m.name && m.content).slice(0, 30);
    }

    function extractDataAttributes() {
        const dataMap = {};
        document.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('data-')) {
                    if (!dataMap[attr.name]) dataMap[attr.name] = { count: 0, sampleValues: [] };
                    dataMap[attr.name].count++;
                    if (dataMap[attr.name].sampleValues.length < 3 && attr.value) {
                        dataMap[attr.name].sampleValues.push(attr.value.slice(0, 50));
                    }
                }
            });
        });
        return dataMap;
    }

    function extractRootCSSVariables() {
        const vars = {};
        try {
            const rootStyles = window.getComputedStyle(document.documentElement);
            for (const prop of rootStyles) {
                if (prop.startsWith('--')) {
                    vars[prop] = rootStyles.getPropertyValue(prop).trim();
                }
            }
        } catch (e) { }
        return vars;
    }

    function extractFormModel() {
        return Array.from(document.querySelectorAll('form')).slice(0, 10).map(f => ({
            id: f.id || '',
            action: f.action || '',
            method: (f.method || 'GET').toUpperCase(),
            fields: Array.from(f.querySelectorAll('input, select, textarea')).map(i => ({
                tag: i.tagName.toLowerCase(),
                type: i.type || '',
                name: i.name || i.id || '',
                placeholder: i.placeholder || '',
                required: i.required,
                hasLabel: !!(i.id && document.querySelector(`label[for="${i.id}"]`)) || !!i.closest('label')
            })),
            submitButton: f.querySelector('button[type="submit"], input[type="submit"]')?.innerText?.trim() || ''
        }));
    }

    function extractNavigationModel() {
        const navEls = document.querySelectorAll('nav, [role="navigation"]');
        return Array.from(navEls).slice(0, 5).map(nav => ({
            id: nav.id || '',
            position: window.getComputedStyle(nav).position,
            links: Array.from(nav.querySelectorAll('a')).slice(0, 20).map(a => ({
                text: a.innerText.trim().slice(0, 40),
                href: a.href,
                isExternal: a.hostname !== window.location.hostname,
                hasDropdown: !!a.closest('[class*="dropdown"], [class*="submenu"]')
            }))
        }));
    }

    function extractMediaInventory() {
        const images = Array.from(document.querySelectorAll('img')).slice(0, 30).map(img => ({
            src: img.src,
            alt: img.alt || '',
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            loading: img.loading || 'eager',
            isLazy: img.loading === 'lazy' || img.hasAttribute('data-src')
        }));
        const videos = Array.from(document.querySelectorAll('video')).map(v => ({
            src: v.src || v.querySelector('source')?.src || '',
            autoplay: v.autoplay,
            muted: v.muted,
            poster: v.poster || ''
        }));
        const iframes = Array.from(document.querySelectorAll('iframe')).slice(0, 10).map(f => ({
            src: f.src,
            title: f.title || '',
            isYouTube: (f.src || '').includes('youtube'),
            isMap: (f.src || '').includes('maps')
        }));
        return { images, videos, iframes, svgCount: document.querySelectorAll('svg').length };
    }

    function extractInteractionPoints() {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).slice(0, 20).map(b => ({
            text: b.innerText.trim().slice(0, 40),
            type: b.type || 'button',
            disabled: b.disabled,
            ariaLabel: b.getAttribute('aria-label') || ''
        }));
        const links = Array.from(document.querySelectorAll('a')).slice(0, 30).map(a => ({
            text: a.innerText.trim().slice(0, 40),
            href: a.href,
            target: a.target || '_self',
            isExternal: a.hostname !== window.location.hostname
        }));
        return {
            buttons,
            links,
            totalButtons: document.querySelectorAll('button, [role="button"]').length,
            totalLinks: document.querySelectorAll('a').length,
            totalInputs: document.querySelectorAll('input, select, textarea').length
        };
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
    // DEEP METAMODEL: DESIGN SYSTEM TOKEN EXTRACTION
    // ============================================

    function extractDesignSystem() {
        const allEls = Array.from(document.querySelectorAll('*')).slice(0, 500);

        // === TYPOGRAPHY SCALE ===
        const fontSizes = {};
        const fontFamilies = {};
        const fontWeights = {};
        const lineHeights = {};
        const letterSpacings = {};

        allEls.forEach(el => {
            try {
                const s = window.getComputedStyle(el);
                const fs = s.fontSize;
                const ff = s.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
                const fw = s.fontWeight;
                const lh = s.lineHeight;
                const ls = s.letterSpacing;
                if (fs) fontSizes[fs] = (fontSizes[fs] || 0) + 1;
                if (ff) fontFamilies[ff] = (fontFamilies[ff] || 0) + 1;
                if (fw) fontWeights[fw] = (fontWeights[fw] || 0) + 1;
                if (lh && lh !== 'normal') lineHeights[lh] = (lineHeights[lh] || 0) + 1;
                if (ls && ls !== 'normal' && ls !== '0px') letterSpacings[ls] = (letterSpacings[ls] || 0) + 1;
            } catch (e) { }
        });

        // === SPACING SCALE ===
        const margins = {};
        const paddings = {};
        const gaps = {};

        allEls.forEach(el => {
            try {
                const s = window.getComputedStyle(el);
                ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].forEach(p => {
                    const v = s[p];
                    if (v && v !== '0px' && v !== 'auto') margins[v] = (margins[v] || 0) + 1;
                });
                ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'].forEach(p => {
                    const v = s[p];
                    if (v && v !== '0px') paddings[v] = (paddings[v] || 0) + 1;
                });
                const g = s.gap;
                if (g && g !== 'normal' && g !== '0px') gaps[g] = (gaps[g] || 0) + 1;
            } catch (e) { }
        });

        // === COLOR PALETTE ===
        const textColors = {};
        const bgColors = {};
        const borderColors = {};
        const accentColors = {};

        allEls.forEach(el => {
            try {
                const s = window.getComputedStyle(el);
                const tc = s.color;
                const bc = s.backgroundColor;
                const brc = s.borderColor;
                const oc = s.outlineColor;
                if (tc && tc !== 'rgba(0, 0, 0, 0)') textColors[tc] = (textColors[tc] || 0) + 1;
                if (bc && bc !== 'rgba(0, 0, 0, 0)' && bc !== 'transparent') bgColors[bc] = (bgColors[bc] || 0) + 1;
                if (brc && brc !== 'rgba(0, 0, 0, 0)' && brc !== 'rgb(0, 0, 0)') borderColors[brc] = (borderColors[brc] || 0) + 1;
                if (oc && oc !== 'rgba(0, 0, 0, 0)' && oc !== tc) accentColors[oc] = (accentColors[oc] || 0) + 1;
            } catch (e) { }
        });

        // === BORDER RADIUS SCALE ===
        const radii = {};
        allEls.forEach(el => {
            try {
                const br = window.getComputedStyle(el).borderRadius;
                if (br && br !== '0px') radii[br] = (radii[br] || 0) + 1;
            } catch (e) { }
        });

        // === BOX SHADOWS ===
        const shadows = {};
        allEls.forEach(el => {
            try {
                const bs = window.getComputedStyle(el).boxShadow;
                if (bs && bs !== 'none') shadows[bs] = (shadows[bs] || 0) + 1;
            } catch (e) { }
        });

        const sortByFreq = (obj, limit = 10) =>
            Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([v, c]) => ({ value: v, count: c }));

        return {
            typography: {
                fontSizeScale: sortByFreq(fontSizes, 12),
                fontFamilies: sortByFreq(fontFamilies, 8),
                fontWeights: sortByFreq(fontWeights, 6),
                lineHeights: sortByFreq(lineHeights, 6),
                letterSpacings: sortByFreq(letterSpacings, 4)
            },
            spacing: {
                margins: sortByFreq(margins, 10),
                paddings: sortByFreq(paddings, 10),
                gaps: sortByFreq(gaps, 6)
            },
            colors: {
                text: sortByFreq(textColors, 10),
                backgrounds: sortByFreq(bgColors, 12),
                borders: sortByFreq(borderColors, 6),
                accents: sortByFreq(accentColors, 4)
            },
            borders: {
                radii: sortByFreq(radii, 8),
                shadows: sortByFreq(shadows, 6)
            }
        };
    }

    // ============================================
    // DEEP METAMODEL: LAYOUT BLUEPRINT
    // ============================================

    function extractLayoutBlueprint() {
        const allEls = Array.from(document.querySelectorAll('*')).slice(0, 300);

        // Layout method census
        const layoutMethods = { flex: 0, grid: 0, block: 0, inline: 0, inlineBlock: 0, table: 0, absolute: 0, fixed: 0, sticky: 0 };
        const gridConfigs = [];
        const flexConfigs = [];

        allEls.forEach(el => {
            try {
                const s = window.getComputedStyle(el);
                const d = s.display;
                const p = s.position;
                if (d === 'flex' || d === 'inline-flex') {
                    layoutMethods.flex++;
                    if (flexConfigs.length < 8) {
                        flexConfigs.push({
                            selector: getSelector(el),
                            direction: s.flexDirection,
                            wrap: s.flexWrap,
                            justify: s.justifyContent,
                            align: s.alignItems,
                            gap: s.gap
                        });
                    }
                } else if (d === 'grid' || d === 'inline-grid') {
                    layoutMethods.grid++;
                    if (gridConfigs.length < 8) {
                        gridConfigs.push({
                            selector: getSelector(el),
                            columns: s.gridTemplateColumns,
                            rows: s.gridTemplateRows,
                            gap: s.gap,
                            areas: s.gridTemplateAreas !== 'none' ? s.gridTemplateAreas : undefined
                        });
                    }
                } else if (d === 'block') layoutMethods.block++;
                else if (d === 'inline') layoutMethods.inline++;
                else if (d === 'inline-block') layoutMethods.inlineBlock++;
                else if (d.includes('table')) layoutMethods.table++;

                if (p === 'absolute') layoutMethods.absolute++;
                else if (p === 'fixed') layoutMethods.fixed++;
                else if (p === 'sticky') layoutMethods.sticky++;
            } catch (e) { }
        });

        // Container/width analysis
        const containerWidths = {};
        allEls.forEach(el => {
            try {
                const s = window.getComputedStyle(el);
                const mw = s.maxWidth;
                if (mw && mw !== 'none' && mw !== '0px') {
                    containerWidths[mw] = (containerWidths[mw] || 0) + 1;
                }
            } catch (e) { }
        });

        // Z-index stacking
        const zIndexes = {};
        allEls.forEach(el => {
            try {
                const z = window.getComputedStyle(el).zIndex;
                if (z !== 'auto' && z !== '0') zIndexes[z] = (zIndexes[z] || 0) + 1;
            } catch (e) { }
        });

        // Overflow patterns
        const overflows = { hidden: 0, scroll: 0, auto: 0, visible: 0 };
        allEls.forEach(el => {
            try {
                const o = window.getComputedStyle(el).overflow;
                if (overflows[o] !== undefined) overflows[o]++;
            } catch (e) { }
        });

        return {
            layoutMethods,
            gridConfigs,
            flexConfigs,
            containerWidths: Object.entries(containerWidths).sort((a, b) => b[1] - a[1]).slice(0, 5),
            zIndexLayers: Object.entries(zIndexes).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).slice(0, 10),
            overflows
        };
    }

    // ============================================
    // DEEP METAMODEL: COMPONENT PATTERN RECOGNITION
    // ============================================

    function extractComponentPatterns() {
        const patterns = {
            cards: [],
            modals: [],
            dropdowns: [],
            tabs: [],
            accordions: [],
            carousels: [],
            navbars: [],
            footers: [],
            heroes: [],
            sidebars: [],
            tables: [],
            lists: [],
            breadcrumbs: [],
            pagination: [],
            tooltips: [],
            badges: [],
            alerts: []
        };

        // Card detection
        const cardSelectors = '[class*="card"], [class*="tile"], [class*="panel"]:not(body), [class*="item"]';
        const cardEls = document.querySelectorAll(cardSelectors);
        Array.from(cardEls).slice(0, 8).forEach(el => {
            const s = window.getComputedStyle(el);
            patterns.cards.push({
                selector: getSelector(el),
                hasImage: !!el.querySelector('img'),
                hasTitle: !!el.querySelector('h2, h3, h4, [class*="title"]'),
                hasButton: !!el.querySelector('button, a[class*="btn"]'),
                borderRadius: s.borderRadius,
                shadow: s.boxShadow !== 'none' ? true : false,
                bg: s.backgroundColor
            });
        });

        // Modal detection
        document.querySelectorAll('[class*="modal"], [class*="dialog"], [role="dialog"]').forEach(el => {
            patterns.modals.push({
                selector: getSelector(el),
                hasOverlay: !!el.querySelector('[class*="overlay"], [class*="backdrop"]') || (typeof el.previousElementSibling?.className === 'string' ? el.previousElementSibling?.className : (el.previousElementSibling?.className?.baseVal || el.previousElementSibling?.getAttribute('class') || '')).includes('overlay'),
                hasClose: !!el.querySelector('[class*="close"], button[aria-label*="close"]'),
                isHidden: window.getComputedStyle(el).display === 'none' || window.getComputedStyle(el).visibility === 'hidden'
            });
        });

        // Dropdown detection
        document.querySelectorAll('[class*="dropdown"], [class*="popover"], [class*="menu"]').forEach(el => {
            if (patterns.dropdowns.length >= 5) return;
            patterns.dropdowns.push({
                selector: getSelector(el),
                itemCount: el.querySelectorAll('li, a, [role="menuitem"]').length,
                trigger: el.previousElementSibling?.tagName?.toLowerCase() || 'unknown'
            });
        });

        // Tab detection
        document.querySelectorAll('[role="tablist"], [class*="tabs"], [class*="tab-bar"]').forEach(el => {
            patterns.tabs.push({
                selector: getSelector(el),
                count: el.querySelectorAll('[role="tab"], [class*="tab"]').length,
                labels: Array.from(el.querySelectorAll('[role="tab"], [class*="tab"]')).slice(0, 8).map(t => t.innerText.trim().slice(0, 20))
            });
        });

        // Accordion detection
        document.querySelectorAll('[class*="accordion"], [class*="collapse"], [class*="faq"], details').forEach(el => {
            if (patterns.accordions.length >= 5) return;
            patterns.accordions.push({
                selector: getSelector(el),
                itemCount: el.querySelectorAll('[class*="item"], [class*="panel"], summary').length,
                isHTML5: el.tagName === 'DETAILS'
            });
        });

        // Carousel / slider
        document.querySelectorAll('[class*="carousel"], [class*="slider"], [class*="swiper"], [class*="slick"]').forEach(el => {
            patterns.carousels.push({
                selector: getSelector(el),
                slideCount: el.querySelectorAll('[class*="slide"], [class*="item"]').length,
                hasArrows: !!el.querySelector('[class*="prev"], [class*="next"], [class*="arrow"]'),
                hasDots: !!el.querySelector('[class*="dot"], [class*="indicator"], [class*="pagination"]')
            });
        });

        // Hero section
        document.querySelectorAll('[class*="hero"], [class*="banner"], [class*="jumbotron"], [class*="masthead"]').forEach(el => {
            const s = window.getComputedStyle(el);
            patterns.heroes.push({
                selector: getSelector(el),
                hasBackground: s.backgroundImage !== 'none',
                hasOverlay: !!el.querySelector('[class*="overlay"]'),
                hasCTA: !!el.querySelector('button, a[class*="btn"], [class*="cta"]'),
                height: el.getBoundingClientRect().height
            });
        });

        // Tables
        document.querySelectorAll('table').forEach(t => {
            if (patterns.tables.length >= 5) return;
            patterns.tables.push({
                headers: Array.from(t.querySelectorAll('th')).map(th => th.innerText.trim().slice(0, 20)),
                rows: t.querySelectorAll('tr').length,
                cols: (t.querySelector('tr')?.children?.length || 0),
                isResponsive: !!t.closest('[class*="responsive"], [style*="overflow"]')
            });
        });

        // Breadcrumbs
        document.querySelectorAll('[class*="breadcrumb"], [aria-label*="breadcrumb"], nav ol').forEach(el => {
            patterns.breadcrumbs.push({
                items: Array.from(el.querySelectorAll('a, li, span')).map(i => i.innerText.trim().slice(0, 30)).filter(Boolean).slice(0, 6)
            });
        });

        // Pagination
        document.querySelectorAll('[class*="pagination"], [class*="pager"]').forEach(el => {
            patterns.pagination.push({
                pages: el.querySelectorAll('a, button, li').length,
                hasPrev: !!el.querySelector('[class*="prev"]'),
                hasNext: !!el.querySelector('[class*="next"]')
            });
        });

        // Alerts / notifications
        document.querySelectorAll('[role="alert"], [class*="alert"], [class*="notification"], [class*="toast"]').forEach(el => {
            if (patterns.alerts.length >= 5) return;
            patterns.alerts.push({
                selector: getSelector(el),
                type: (typeof el.className === 'string' ? el.className : (el.className?.baseVal || el.getAttribute('class') || '')).match(/success|error|warn|info|danger/)?.[0] || 'generic',
                dismissible: !!el.querySelector('[class*="close"], button')
            });
        });

        // Sidebar detection
        document.querySelectorAll('aside, [class*="sidebar"], [class*="side-nav"]').forEach(el => {
            patterns.sidebars.push({
                selector: getSelector(el),
                position: window.getComputedStyle(el).position,
                width: el.getBoundingClientRect().width,
                hasNav: !!el.querySelector('nav, ul, a')
            });
        });

        // Filter out empty pattern categories
        const activePatterns = {};
        for (const [k, v] of Object.entries(patterns)) {
            if (v.length > 0) activePatterns[k] = v;
        }

        return activePatterns;
    }

    // ============================================
    // DEEP METAMODEL: SEMANTIC CONTENT MODEL
    // ============================================

    function extractSemanticContent() {
        // Semantic landmark inventory
        const landmarks = {};
        ['header', 'footer', 'main', 'nav', 'aside', 'section', 'article', 'figure', 'figcaption', 'details', 'summary', 'dialog', 'mark', 'time'].forEach(tag => {
            const count = document.querySelectorAll(tag).length;
            if (count > 0) landmarks[tag] = count;
        });

        // ARIA roles
        const ariaRoles = {};
        document.querySelectorAll('[role]').forEach(el => {
            const r = el.getAttribute('role');
            ariaRoles[r] = (ariaRoles[r] || 0) + 1;
        });

        // Heading hierarchy (full tree)
        const headingTree = [];
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
            headingTree.push({
                level: parseInt(h.tagName[1]),
                text: h.innerText.trim().slice(0, 80),
                id: h.id || '',
                isInView: h.getBoundingClientRect().top < window.innerHeight
            });
        });

        // Text content blocks (paragraphs, lists)
        const contentBlocks = [];
        document.querySelectorAll('p, li, blockquote, figcaption, td').forEach(el => {
            const text = el.innerText?.trim();
            if (text && text.length > 20 && contentBlocks.length < 30) {
                contentBlocks.push({
                    tag: el.tagName.toLowerCase(),
                    preview: text.slice(0, 120),
                    wordCount: text.split(/\s+/).length,
                    parent: el.parentElement?.tagName?.toLowerCase() || ''
                });
            }
        });

        // List structures
        const lists = Array.from(document.querySelectorAll('ul, ol')).slice(0, 10).map(l => ({
            type: l.tagName.toLowerCase(),
            itemCount: l.querySelectorAll(':scope > li').length,
            isNested: l.querySelectorAll('ul, ol').length > 0,
            context: l.previousElementSibling?.innerText?.trim()?.slice(0, 40) || ''
        }));

        // Microdata / JSON-LD / Schema.org
        const structuredData = [];
        document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
            try {
                const data = JSON.parse(s.textContent);
                structuredData.push({
                    type: data['@type'] || 'unknown',
                    context: data['@context'] || '',
                    properties: Object.keys(data).filter(k => !k.startsWith('@')).slice(0, 15)
                });
            } catch (e) { }
        });

        // OpenGraph tags
        const openGraph = {};
        document.querySelectorAll('meta[property^="og:"]').forEach(m => {
            openGraph[m.getAttribute('property')] = m.content;
        });

        // Twitter card
        const twitterCard = {};
        document.querySelectorAll('meta[name^="twitter:"]').forEach(m => {
            twitterCard[m.name] = m.content;
        });

        return {
            landmarks,
            ariaRoles,
            headingTree,
            contentBlocks,
            lists,
            structuredData,
            openGraph,
            twitterCard,
            language: document.documentElement.lang || 'unknown',
            direction: document.documentElement.dir || 'ltr',
            contentLength: (document.body.innerText || '').length,
            wordCount: (document.body.innerText || '').split(/\s+/).filter(w => w.length > 0).length
        };
    }

    // ============================================
    // DEEP METAMODEL: ACCESSIBILITY TREE
    // ============================================

    function extractAccessibilityTree() {
        const issues = [];
        const features = {};

        // Images without alt
        const imgsNoAlt = document.querySelectorAll('img:not([alt])');
        if (imgsNoAlt.length > 0) issues.push({ type: 'missing-alt', count: imgsNoAlt.length, severity: 'critical' });

        // Empty alt on non-decorative images
        const imgsEmptyAlt = Array.from(document.querySelectorAll('img[alt=""]')).filter(i => i.width > 50 && i.height > 50);
        if (imgsEmptyAlt.length > 0) issues.push({ type: 'empty-alt-on-content-image', count: imgsEmptyAlt.length, severity: 'warning' });

        // Form inputs without labels
        const inputsNoLabel = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea')).filter(i => {
            const hasLabel = (i.id && document.querySelector(`label[for="${i.id}"]`)) || i.closest('label') || i.getAttribute('aria-label') || i.getAttribute('aria-labelledby');
            return !hasLabel;
        });
        if (inputsNoLabel.length > 0) issues.push({ type: 'missing-label', count: inputsNoLabel.length, severity: 'critical' });

        // Links with no accessible text
        const emptyLinks = Array.from(document.querySelectorAll('a')).filter(a => !(a.innerText?.trim()) && !a.getAttribute('aria-label') && !a.querySelector('img[alt]'));
        if (emptyLinks.length > 0) issues.push({ type: 'empty-link', count: emptyLinks.length, severity: 'critical' });

        // Buttons with no accessible text
        const emptyBtns = Array.from(document.querySelectorAll('button, [role="button"]')).filter(b => !(b.innerText?.trim()) && !b.getAttribute('aria-label'));
        if (emptyBtns.length > 0) issues.push({ type: 'empty-button', count: emptyBtns.length, severity: 'critical' });

        // Color contrast (simplified check on body text)
        try {
            const bodyS = window.getComputedStyle(document.body);
            const textRgb = bodyS.color.match(/\d+/g)?.map(Number) || [0, 0, 0];
            const bgRgb = bodyS.backgroundColor.match(/\d+/g)?.map(Number) || [255, 255, 255];
            const luminance = (rgb) => {
                const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
                return 0.2126 * r + 0.7152 * g + 0.0722 * b;
            };
            const l1 = luminance(textRgb);
            const l2 = luminance(bgRgb);
            const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
            features.bodyContrastRatio = Math.round(ratio * 100) / 100;
            if (ratio < 4.5) issues.push({ type: 'low-contrast', detail: `Body text contrast ratio: ${features.bodyContrastRatio}:1`, severity: 'warning' });
        } catch (e) { }

        // Touch target sizes (buttons/links < 44x44)
        const smallTargets = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]')).filter(el => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
        });
        if (smallTargets.length > 0) issues.push({ type: 'small-touch-target', count: smallTargets.length, severity: 'warning' });

        // Skip links
        features.hasSkipLink = !!document.querySelector('a[href="#main"], a[href="#content"], a[class*="skip"]');
        // Focus visible
        features.hasFocusStyles = !!document.querySelector('style, link[rel="stylesheet"]'); // simplified
        // Tabindex usage
        features.customTabindex = document.querySelectorAll('[tabindex]').length;
        // Landmark count
        features.landmarks = document.querySelectorAll('main, nav, aside, [role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]').length;
        // Language
        features.lang = document.documentElement.lang || '';

        return {
            issues,
            features,
            issueCount: issues.length,
            criticalCount: issues.filter(i => i.severity === 'critical').length,
            score: Math.max(0, 100 - (issues.reduce((s, i) => s + (i.severity === 'critical' ? (i.count || 1) * 10 : (i.count || 1) * 3), 0)))
        };
    }

    // ============================================
    // DEEP METAMODEL: RESPONSIVE BREAKPOINTS
    // ============================================

    function extractResponsiveModel() {
        const breakpoints = {};
        const mediaQueries = [];

        // Parse stylesheets for media queries
        try {
            Array.from(document.styleSheets).forEach(sheet => {
                try {
                    if (!sheet.cssRules) return;
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule instanceof CSSMediaRule) {
                            const mq = rule.conditionText || rule.media?.mediaText || '';
                            if (mq) {
                                const widthMatch = mq.match(/(\d+)px/);
                                if (widthMatch) {
                                    const bp = parseInt(widthMatch[1]);
                                    breakpoints[bp] = (breakpoints[bp] || 0) + rule.cssRules.length;
                                }
                                if (mediaQueries.length < 20) {
                                    mediaQueries.push({
                                        query: mq.slice(0, 80),
                                        ruleCount: rule.cssRules.length
                                    });
                                }
                            }
                        }
                    });
                } catch (e) { /* CORS blocked */ }
            });
        } catch (e) { }

        // Viewport meta
        const viewportMeta = document.querySelector('meta[name="viewport"]');

        // Responsive images
        const responsiveImages = {
            srcset: document.querySelectorAll('img[srcset], source[srcset]').length,
            picture: document.querySelectorAll('picture').length,
            lazyLoaded: document.querySelectorAll('img[loading="lazy"], img[data-src]').length
        };

        return {
            breakpoints: Object.entries(breakpoints).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([bp, rules]) => ({ pixel: parseInt(bp), ruleCount: rules })),
            mediaQueries: mediaQueries.slice(0, 15),
            viewportMeta: viewportMeta?.content || '',
            responsiveImages,
            currentViewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
            }
        };
    }

    // ============================================
    // DEEP METAMODEL: ANIMATION & TRANSITION SYSTEM
    // ============================================

    function extractAnimationSystem() {
        const animations = [];
        const transitions = [];
        const keyframes = [];

        // Extract keyframe definitions from stylesheets
        try {
            Array.from(document.styleSheets).forEach(sheet => {
                try {
                    if (!sheet.cssRules) return;
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule instanceof CSSKeyframesRule && keyframes.length < 15) {
                            keyframes.push({
                                name: rule.name,
                                stepCount: rule.cssRules.length
                            });
                        }
                    });
                } catch (e) { }
            });
        } catch (e) { }

        // Elements with animations
        const allEls = Array.from(document.querySelectorAll('*')).slice(0, 300);
        allEls.forEach(el => {
            try {
                const s = window.getComputedStyle(el);
                if (s.animationName && s.animationName !== 'none' && animations.length < 15) {
                    animations.push({
                        selector: getSelector(el),
                        name: s.animationName,
                        duration: s.animationDuration,
                        timing: s.animationTimingFunction,
                        iteration: s.animationIterationCount,
                        delay: s.animationDelay !== '0s' ? s.animationDelay : undefined
                    });
                }
                if (s.transitionProperty && s.transitionProperty !== 'all' && s.transitionDuration !== '0s' && transitions.length < 15) {
                    transitions.push({
                        selector: getSelector(el),
                        property: s.transitionProperty,
                        duration: s.transitionDuration,
                        timing: s.transitionTimingFunction,
                        delay: s.transitionDelay !== '0s' ? s.transitionDelay : undefined
                    });
                }
            } catch (e) { }
        });

        // Scroll-based animations (Intersection Observer hints)
        const scrollAnimated = document.querySelectorAll('[data-aos], [class*="animate-on-scroll"], [class*="reveal"], [class*="fade-in"], [class*="slide-in"]').length;

        return {
            keyframes,
            animations,
            transitions,
            scrollAnimated,
            totalAnimated: animations.length + transitions.length + scrollAnimated,
            motionPreference: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'reduce' : 'no-preference'
        };
    }

    // ============================================
    // DEEP METAMODEL: SVG & ICON INVENTORY
    // ============================================

    function extractIconSystem() {
        // Inline SVGs
        const inlineSvgs = Array.from(document.querySelectorAll('svg')).slice(0, 20).map(svg => ({
            width: svg.getAttribute('width') || svg.getBoundingClientRect().width,
            height: svg.getAttribute('height') || svg.getBoundingClientRect().height,
            viewBox: svg.getAttribute('viewBox') || '',
            hasTitle: !!svg.querySelector('title'),
            pathCount: svg.querySelectorAll('path').length,
            isIcon: (svg.getBoundingClientRect().width <= 48 && svg.getBoundingClientRect().height <= 48),
            ariaLabel: svg.getAttribute('aria-label') || ''
        }));

        // Icon fonts
        const iconFonts = {
            fontAwesome: document.querySelectorAll('[class*="fa-"], .fas, .far, .fab, .fal, .fad').length,
            materialIcons: document.querySelectorAll('.material-icons, [class*="material-symbols"]').length,
            feather: document.querySelectorAll('[data-feather]').length,
            heroicons: document.querySelectorAll('[class*="heroicon"]').length
        };

        // SVG sprites
        const spriteSheets = document.querySelectorAll('svg symbol, svg defs').length;

        // Emoji usage
        const emojiRegex = /[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        const emojiCount = ((document.body.innerText || '').match(emojiRegex) || []).length;

        return {
            inlineSvgs,
            svgCount: document.querySelectorAll('svg').length,
            iconFonts,
            spriteSheets,
            emojiCount,
            totalIcons: Object.values(iconFonts).reduce((a, b) => a + b, 0) + inlineSvgs.filter(s => s.isIcon).length
        };
    }

    // ============================================
    // DEEP METAMODEL: CONTENT HIERARCHY & SECTIONS
    // ============================================

    function extractContentHierarchy() {
        const sections = [];

        // Walk top-level page sections
        const topLevelContainers = document.querySelectorAll('body > header, body > main, body > footer, body > section, body > div, body > article, body > aside, body > nav');
        Array.from(topLevelContainers).slice(0, 20).forEach((el, idx) => {
            const rect = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);

            sections.push({
                order: idx,
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                classes: (typeof el.className === 'string' ? el.className : (el.className?.baseVal || el.getAttribute('class') || '')).split(' ').filter(c => c.trim()).slice(0, 5),
                role: el.getAttribute('role') || '',
                dimensions: {
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    top: Math.round(rect.top + window.scrollY)
                },
                headings: Array.from(el.querySelectorAll('h1,h2,h3,h4')).map(h => ({
                    level: parseInt(h.tagName[1]),
                    text: h.innerText.trim().slice(0, 60)
                })),
                childSections: el.querySelectorAll('section, article, aside').length,
                hasForm: !!el.querySelector('form'),
                hasNavigation: !!el.querySelector('nav, [role="navigation"]'),
                hasCTA: !!el.querySelector('button, [class*="cta"], a[class*="btn"]'),
                hasMedia: !!el.querySelector('img, video, iframe, svg'),
                backgroundColor: s.backgroundColor,
                textColor: s.color,
                padding: s.padding,
                contentDensity: Math.round((el.innerText?.length || 0) / Math.max(rect.height, 1) * 100) / 100
            });
        });

        return {
            sections,
            totalSections: sections.length,
            pageHeight: document.documentElement.scrollHeight,
            viewportPages: Math.round(document.documentElement.scrollHeight / window.innerHeight * 10) / 10
        };
    }

    // ============================================
    // DEEP METAMODEL: COMPLETE STYLESHEET EXTRACTION
    // ============================================

    function extractStylesheetSummary() {
        const stylesheets = [];
        const ruleStats = { total: 0, id: 0, class: 0, pseudo: 0, media: 0, keyframes: 0, fontFace: 0, variables: 0 };

        try {
            Array.from(document.styleSheets).forEach((sheet, idx) => {
                const sheetInfo = {
                    index: idx,
                    href: sheet.href || 'inline',
                    isExternal: !!sheet.href,
                    disabled: sheet.disabled,
                    media: sheet.media?.mediaText || 'all',
                    ruleCount: 0
                };

                try {
                    const rules = sheet.cssRules;
                    sheetInfo.ruleCount = rules.length;
                    ruleStats.total += rules.length;

                    Array.from(rules).forEach(rule => {
                        if (rule instanceof CSSMediaRule) ruleStats.media++;
                        else if (rule instanceof CSSKeyframesRule) ruleStats.keyframes++;
                        else if (rule instanceof CSSFontFaceRule) ruleStats.fontFace++;
                        else if (rule.selectorText) {
                            if (rule.selectorText.includes('#')) ruleStats.id++;
                            if (rule.selectorText.includes('.')) ruleStats.class++;
                            if (rule.selectorText.includes(':')) ruleStats.pseudo++;
                            if (rule.cssText.includes('--')) ruleStats.variables++;
                        }
                    });
                } catch (e) {
                    sheetInfo.corsBlocked = true;
                }

                stylesheets.push(sheetInfo);
            });
        } catch (e) { }

        return { stylesheets, ruleStats };
    }

    // ============================================
    // RECONSTRUCTABLE DNA: RAW CSS EXTRACTION
    // ============================================

    function extractRawCSS() {
        const rules = [];
        const fontFaces = [];
        const keyframeBlocks = [];
        const mediaBlocks = [];
        const cssVariableDeclarations = [];

        try {
            Array.from(document.styleSheets).forEach(sheet => {
                try {
                    if (!sheet.cssRules) return;
                    const source = sheet.href || 'inline';
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule instanceof CSSFontFaceRule) {
                            fontFaces.push(rule.cssText);
                        } else if (rule instanceof CSSKeyframesRule) {
                            keyframeBlocks.push(rule.cssText);
                        } else if (rule instanceof CSSMediaRule) {
                            const mqRules = [];
                            Array.from(rule.cssRules).forEach(inner => {
                                mqRules.push(inner.cssText);
                            });
                            if (mqRules.length > 0) {
                                mediaBlocks.push({
                                    query: rule.conditionText || rule.media?.mediaText || '',
                                    rules: mqRules.slice(0, 40)
                                });
                            }
                        } else if (rule.cssText) {
                            // Check for CSS variable declarations
                            if (rule.cssText.includes('--')) {
                                cssVariableDeclarations.push(rule.cssText);
                            }
                            if (rules.length < 300) {
                                rules.push(rule.cssText);
                            }
                        }
                    });
                } catch (e) { /* CORS-blocked stylesheet */ }
            });
        } catch (e) { }

        return { rules, fontFaces, keyframeBlocks, mediaBlocks, cssVariableDeclarations };
    }

    // ============================================
    // RECONSTRUCTABLE DNA: HTML SKELETON
    // ============================================

    function extractHTMLSkeleton(el, depth = 0, maxDepth = 12) {
        if (!el || depth > maxDepth) return null;
        if (el.nodeType === 3) {
            const text = el.textContent.trim();
            if (text.length === 0) return null;
            if (text.length <= 120) return { type: 'text', content: text };
            return { type: 'text', content: text.slice(0, 120) + '…', fullLength: text.length };
        }
        if (el.nodeType !== 1) return null;

        const tag = el.tagName.toLowerCase();
        // Skip script, style, svg internals for skeleton
        if (['script', 'style', 'noscript', 'link', 'meta'].includes(tag)) return null;

        const node = { tag };

        // Preserve identity & semantic attributes
        if (el.id) node.id = el.id;
        const classes = Array.from(el.classList).join(' ');
        if (classes) node.class = classes;
        if (el.getAttribute('role')) node.role = el.getAttribute('role');
        if (el.getAttribute('aria-label')) node.ariaLabel = el.getAttribute('aria-label');
        if (el.getAttribute('type')) node.type = el.getAttribute('type');
        if (el.getAttribute('href')) node.href = el.getAttribute('href').slice(0, 200);
        if (el.getAttribute('src')) node.src = el.getAttribute('src').slice(0, 200);
        if (el.getAttribute('alt')) node.alt = el.getAttribute('alt');
        if (el.getAttribute('placeholder')) node.placeholder = el.getAttribute('placeholder');
        if (el.getAttribute('name')) node.name = el.getAttribute('name');
        if (el.getAttribute('action')) node.action = el.getAttribute('action');
        if (el.getAttribute('method')) node.method = el.getAttribute('method');
        if (el.getAttribute('target')) node.target = el.getAttribute('target');
        if (el.getAttribute('for')) node.for_ = el.getAttribute('for');

        // Data attributes (all of them, truncated values)
        const data = {};
        for (const attr of el.attributes) {
            if (attr.name.startsWith('data-')) data[attr.name] = (attr.value || '').slice(0, 60);
        }
        if (Object.keys(data).length > 0) node.data = data;

        // Inline styles (important for many sites)
        if (el.style.cssText) node.style = el.style.cssText.slice(0, 300);

        // Children
        const children = [];
        for (const child of el.childNodes) {
            const childNode = extractHTMLSkeleton(child, depth + 1, maxDepth);
            if (childNode) children.push(childNode);
        }
        if (children.length > 0) node.children = children;

        return node;
    }

    function skeletonToHTML(node, indent = 0) {
        if (!node) return '';
        const pad = '  '.repeat(indent);
        if (node.type === 'text') return `${pad}${node.content}\n`;

        let attrs = '';
        if (node.id) attrs += ` id="${node.id}"`;
        if (node.class) attrs += ` class="${node.class}"`;
        if (node.role) attrs += ` role="${node.role}"`;
        if (node.ariaLabel) attrs += ` aria-label="${node.ariaLabel}"`;
        if (node.href) attrs += ` href="${node.href}"`;
        if (node.src) attrs += ` src="${node.src}"`;
        if (node.alt) attrs += ` alt="${node.alt}"`;
        if (node.type) attrs += ` type="${node.type}"`;
        if (node.name) attrs += ` name="${node.name}"`;
        if (node.placeholder) attrs += ` placeholder="${node.placeholder}"`;
        if (node.action) attrs += ` action="${node.action}"`;
        if (node.method) attrs += ` method="${node.method}"`;
        if (node.for_) attrs += ` for="${node.for_}"`;
        if (node.style) attrs += ` style="${node.style}"`;
        if (node.data) {
            for (const [k, v] of Object.entries(node.data)) {
                attrs += ` ${k}="${v}"`;
            }
        }

        const voidTags = ['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'embed'];
        if (voidTags.includes(node.tag)) return `${pad}<${node.tag}${attrs} />\n`;

        if (!node.children || node.children.length === 0) return `${pad}<${node.tag}${attrs}></${node.tag}>\n`;

        let html = `${pad}<${node.tag}${attrs}>\n`;
        for (const child of node.children) {
            html += skeletonToHTML(child, indent + 1);
        }
        html += `${pad}</${node.tag}>\n`;
        return html;
    }

    // ============================================
    // RECONSTRUCTABLE DNA: SECTIONED CONTENT
    // ============================================

    function extractSectionedContent() {
        const sections = [];

        // Walk top-level semantic sections
        const topLevel = document.querySelectorAll('body > header, body > nav, body > main, body > section, body > article, body > aside, body > footer, body > div');

        Array.from(topLevel).slice(0, 25).forEach((section, idx) => {
            const tag = section.tagName.toLowerCase();
            const id = section.id || '';
            const classes = (typeof section.className === 'string' ? section.className : (section.className?.baseVal || section.getAttribute('class') || '')).trim();
            const rect = section.getBoundingClientRect();

            // Extract visible text content organized by hierarchy
            const contentNodes = [];

            // Headings
            section.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
                contentNodes.push({
                    type: 'heading',
                    level: parseInt(h.tagName[1]),
                    text: h.innerText.trim()
                });
            });

            // Paragraphs
            section.querySelectorAll('p').forEach(p => {
                const text = p.innerText.trim();
                if (text.length > 10) contentNodes.push({ type: 'paragraph', text: text.slice(0, 500) });
            });

            // Links with text
            const links = [];
            section.querySelectorAll('a[href]').forEach(a => {
                const text = a.innerText.trim();
                if (text && links.length < 15) links.push({ text: text.slice(0, 60), href: a.href });
            });

            // Buttons
            const buttons = [];
            section.querySelectorAll('button, [role="button"], a[class*="btn"], a[class*="cta"]').forEach(b => {
                const text = b.innerText.trim();
                if (text && buttons.length < 10) buttons.push(text.slice(0, 40));
            });

            // Images
            const images = [];
            section.querySelectorAll('img').forEach(img => {
                if (images.length < 10) {
                    images.push({ src: img.src, alt: img.alt || '', width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
                }
            });

            // Forms
            const forms = [];
            section.querySelectorAll('form').forEach(f => {
                forms.push({
                    action: f.action || '',
                    method: (f.method || 'GET').toUpperCase(),
                    fields: Array.from(f.querySelectorAll('input, select, textarea')).map(i => ({
                        tag: i.tagName.toLowerCase(), type: i.type || '', name: i.name || '', placeholder: i.placeholder || ''
                    }))
                });
            });

            sections.push({
                index: idx,
                tag, id, classes,
                height: Math.round(rect.height),
                content: contentNodes,
                links: links.length > 0 ? links : undefined,
                buttons: buttons.length > 0 ? buttons : undefined,
                images: images.length > 0 ? images : undefined,
                forms: forms.length > 0 ? forms : undefined
            });
        });

        return sections;
    }

    // ============================================
    // RECONSTRUCTABLE DNA: FONT DECLARATIONS
    // ============================================

    function extractFontDeclarations() {
        const fonts = {
            fontFaceRules: [],
            googleFonts: [],
            systemFonts: [],
            webFontLinks: []
        };

        // @font-face rules from stylesheets
        try {
            Array.from(document.styleSheets).forEach(sheet => {
                try {
                    if (!sheet.cssRules) return;
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule instanceof CSSFontFaceRule) {
                            fonts.fontFaceRules.push(rule.cssText);
                        }
                    });
                } catch (e) { }
            });
        } catch (e) { }

        // Google Fonts links
        document.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.bunny.net"]').forEach(link => {
            fonts.googleFonts.push(link.href);
        });

        // Other web font links (Adobe, etc.)
        document.querySelectorAll('link[href*="typekit"], link[href*="fonts.adobe"], link[href*="use.fontawesome"]').forEach(link => {
            fonts.webFontLinks.push(link.href);
        });

        // Detect unique font families in use
        const usedFonts = new Set();
        Array.from(document.querySelectorAll('*')).slice(0, 200).forEach(el => {
            try {
                const ff = window.getComputedStyle(el).fontFamily;
                ff.split(',').forEach(f => usedFonts.add(f.trim().replace(/['"]/g, '')));
            } catch (e) { }
        });
        fonts.systemFonts = Array.from(usedFonts);

        return fonts;
    }

    // ============================================
    // RECONSTRUCTABLE DNA: EXTERNAL RESOURCES
    // ============================================

    function extractExternalResources() {
        const resources = {
            stylesheets: [],
            scripts: [],
            fonts: [],
            images: [],
            prefetch: [],
            preconnect: [],
            cdns: new Set()
        };

        // Stylesheets
        document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
            resources.stylesheets.push(l.href);
            try { resources.cdns.add(new URL(l.href).hostname); } catch (e) { }
        });

        // Scripts
        document.querySelectorAll('script[src]').forEach(s => {
            resources.scripts.push({ src: s.src, async: s.async, defer: s.defer, type: s.type || 'text/javascript' });
            try { resources.cdns.add(new URL(s.src).hostname); } catch (e) { }
        });

        // Font links
        document.querySelectorAll('link[href*="font"], link[href*="typekit"]').forEach(l => {
            resources.fonts.push(l.href);
        });

        // Performance API resources
        try {
            performance.getEntriesByType('resource').forEach(r => {
                if (r.initiatorType === 'img' && resources.images.length < 30) {
                    resources.images.push(r.name);
                }
                try { resources.cdns.add(new URL(r.name).hostname); } catch (e) { }
            });
        } catch (e) { }

        // Prefetch / preconnect
        document.querySelectorAll('link[rel="prefetch"], link[rel="preload"]').forEach(l => {
            resources.prefetch.push({ href: l.href, as: l.getAttribute('as') || '' });
        });
        document.querySelectorAll('link[rel="preconnect"], link[rel="dns-prefetch"]').forEach(l => {
            resources.preconnect.push(l.href);
        });

        resources.cdns = Array.from(resources.cdns).filter(h => h !== window.location.hostname);

        return resources;
    }

    // ============================================
    // RECONSTRUCTABLE DNA: TEMPLATE PATTERNS
    // ============================================

    function extractTemplatePatterns() {
        const templates = [];

        // Find repeating sibling structures (product cards, list items, grid cells, etc.)
        const containerCandidates = document.querySelectorAll('ul, ol, [class*="grid"], [class*="list"], [class*="container"], [class*="row"], [class*="gallery"], [class*="products"], [class*="cards"]');

        Array.from(containerCandidates).slice(0, 15).forEach(container => {
            const children = Array.from(container.children).filter(c => c.nodeType === 1);
            if (children.length < 2) return;

            // Compare children structure: if siblings share the same tag+class pattern, they're template instances
            const signatures = children.map(c => {
                const childTags = Array.from(c.children).map(cc => cc.tagName?.toLowerCase() || '').join(',');
                return `${c.tagName.toLowerCase()}.${(c.className || '').toString().split(' ').sort().join('.')}[${childTags}]`;
            });

            const signatureMap = {};
            signatures.forEach(s => signatureMap[s] = (signatureMap[s] || 0) + 1);

            // If the dominant signature covers >50% of children, this is a template
            const dominant = Object.entries(signatureMap).sort((a, b) => b[1] - a[1])[0];
            if (dominant && dominant[1] >= 2 && dominant[1] >= children.length * 0.5) {
                // Extract the first instance as the template prototype
                const proto = children.find(c => {
                    const childTags = Array.from(c.children).map(cc => cc.tagName?.toLowerCase() || '').join(',');
                    const sig = `${c.tagName.toLowerCase()}.${(c.className || '').toString().split(' ').sort().join('.')}[${childTags}]`;
                    return sig === dominant[0];
                });

                if (proto && templates.length < 10) {
                    templates.push({
                        container: {
                            tag: container.tagName.toLowerCase(),
                            class: (container.className || '').toString().trim().slice(0, 80),
                            id: container.id || ''
                        },
                        instanceCount: dominant[1],
                        totalChildren: children.length,
                        template: extractHTMLSkeleton(proto, 0, 4),
                        templateHTML: skeletonToHTML(extractHTMLSkeleton(proto, 0, 4))
                    });
                }
            }
        });

        return templates;
    }

    // ============================================
    // RECONSTRUCTABLE DNA: CSS CLASS VOCABULARY
    // ============================================

    function extractClassVocabulary() {
        const classes = {};
        document.querySelectorAll('*').forEach(el => {
            el.classList.forEach(c => {
                if (!classes[c]) classes[c] = { count: 0, tags: new Set() };
                classes[c].count++;
                classes[c].tags.add(el.tagName.toLowerCase());
            });
        });

        // Convert to serializable + sort by frequency
        return Object.entries(classes)
            .map(([name, data]) => ({ name, count: data.count, tags: Array.from(data.tags) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 100);
    }

    // ============================================
    // MASTER DNA GENERATOR (RECONSTRUCTABLE)
    // ============================================

    function generateSiteDNA() {
        const dna = {};
        const errors = [];

        const gather = (name, fn) => {
            try { dna[name] = fn(); }
            catch (e) { errors.push({ layer: name, error: e.message }); dna[name] = null; }
        };

        // === RECONSTRUCTABLE PRIMITIVES (what LLMs actually need) ===
        gather('rawCSS', extractRawCSS);
        gather('htmlSkeleton', () => extractHTMLSkeleton(document.body, 0, 12));
        gather('sectionedContent', extractSectionedContent);
        gather('fontDeclarations', extractFontDeclarations);
        gather('externalResources', extractExternalResources);
        gather('templatePatterns', extractTemplatePatterns);
        gather('classVocabulary', extractClassVocabulary);

        // === DESIGN SYSTEM TOKENS ===
        gather('designSystem', extractDesignSystem);
        gather('layoutBlueprint', extractLayoutBlueprint);
        gather('componentPatterns', extractComponentPatterns);
        gather('responsive', extractResponsiveModel);
        gather('animationSystem', extractAnimationSystem);

        // === SEMANTIC INTELLIGENCE ===
        gather('semanticContent', extractSemanticContent);
        gather('accessibility', extractAccessibilityTree);
        gather('iconSystem', extractIconSystem);
        gather('contentHierarchy', extractContentHierarchy);
        gather('stylesheets', extractStylesheetSummary);
        gather('objectModel', extractCompleteObjectModel);

        // === STRATEGIC INTELLIGENCE ===
        gather('strategy', analyzeStrategicArchitecture);
        gather('psyche', analyzePsychologicalPatterns);
        gather('soul', analyzeSoul);
        gather('archetype', analyzeBrandArchetype);
        gather('rhetoric', analyzeRhetoric);
        gather('emotion', analyzeEmotionalDesign);
        gather('apiSurface', extractAPISurface);
        gather('frameworkState', extractFrameworkState);

        dna._meta = {
            url: window.location.href,
            domain: window.location.hostname,
            path: window.location.pathname,
            title: document.title,
            timestamp: new Date().toISOString(),
            extractionErrors: errors,
            layerCount: Object.keys(dna).filter(k => k !== '_meta' && dna[k] !== null).length
        };

        return dna;
    }

    // ============================================
    // LLM CONTEXT GENERATOR (RECONSTRUCTABLE)
    // ============================================

    function generateLLMSiteContext(dna) {
        if (!dna) dna = generateSiteDNA();
        const lines = [];
        const add = (text) => lines.push(text);

        add(`> **Prompting Hint for LLM:**`);
        add(`> *Use this complete Website DNA to synthesize all layers (psychology, design, structure, strategy) to provide a comprehensive audit or reconstruction plan. Focus on identifying architectural inconsistencies and high-leverage UX improvements.*`);
        add('');
        add(`# Website DNA: ${dna._meta?.title || ''}`);
        add(`URL: ${dna._meta?.url || 'unknown'}`);
        add(`Domain: ${dna._meta?.domain || ''} | Path: ${dna._meta?.path || '/'}`);
        add(`Extracted: ${dna._meta?.timestamp || 'unknown'} | Layers: ${dna._meta?.layerCount || 0}`);
        add('');

        // ============================================================
        // SECTION 1: ACTUAL CSS (the real buildable stylesheet)
        // ============================================================
        if (dna.rawCSS) {
            add(`## CSS Rules`);

            // CSS Variables first — these are the design tokens
            if (dna.rawCSS.cssVariableDeclarations.length > 0) {
                add('### CSS Custom Properties');
                add('```css');
                dna.rawCSS.cssVariableDeclarations.slice(0, 30).forEach(r => add(r));
                add('```');
                add('');
            }

            // @font-face declarations
            if (dna.rawCSS.fontFaces.length > 0) {
                add('### @font-face Declarations');
                add('```css');
                dna.rawCSS.fontFaces.slice(0, 10).forEach(r => add(r));
                add('```');
                add('');
            }

            // Keyframe animations
            if (dna.rawCSS.keyframeBlocks.length > 0) {
                add('### Keyframe Animations');
                add('```css');
                dna.rawCSS.keyframeBlocks.slice(0, 10).forEach(r => add(r));
                add('```');
                add('');
            }

            // Media queries with rules
            if (dna.rawCSS.mediaBlocks.length > 0) {
                add('### Media Queries (Responsive Breakpoints)');
                dna.rawCSS.mediaBlocks.slice(0, 8).forEach(mq => {
                    add(`\`@media ${mq.query}\` (${mq.rules.length} rules)`);
                    add('```css');
                    mq.rules.slice(0, 10).forEach(r => add(r));
                    if (mq.rules.length > 10) add(`/* ... ${mq.rules.length - 10} more rules */`);
                    add('```');
                });
                add('');
            }

            // Core CSS rules (most important for reconstruction)
            if (dna.rawCSS.rules.length > 0) {
                add(`### Core CSS Rules (${dna.rawCSS.rules.length} extracted)`);
                add('```css');
                dna.rawCSS.rules.slice(0, 120).forEach(r => add(r));
                if (dna.rawCSS.rules.length > 120) add(`/* ... ${dna.rawCSS.rules.length - 120} more rules */`);
                add('```');
                add('');
            }
        }

        // ============================================================
        // SECTION 2: HTML STRUCTURE (actual page skeleton)
        // ============================================================
        if (dna.htmlSkeleton) {
            add(`## HTML Structure`);
            add('The following is the page\'s DOM skeleton with all class names, IDs, roles, and data attributes preserved:');
            add('```html');
            const html = skeletonToHTML(dna.htmlSkeleton);
            // Truncate if massive but keep enough for LLM to understand structure
            const htmlLines = html.split('\n');
            if (htmlLines.length > 200) {
                add(htmlLines.slice(0, 200).join('\n'));
                add(`<!-- ... ${htmlLines.length - 200} more lines omitted -->`);
            } else {
                add(html);
            }
            add('```');
            add('');
        }

        // ============================================================
        // SECTION 3: TEMPLATE PATTERNS (repeating components)
        // ============================================================
        if (dna.templatePatterns && dna.templatePatterns.length > 0) {
            add(`## Repeating Template Patterns`);
            add(`Found ${dna.templatePatterns.length} repeating component templates:`);
            add('');
            dna.templatePatterns.forEach((tp, i) => {
                add(`### Template ${i + 1}: ${tp.container.class || tp.container.tag} (${tp.instanceCount} instances)`);
                add(`Container: \`<${tp.container.tag} class="${tp.container.class}"${tp.container.id ? ` id="${tp.container.id}"` : ''}>\``);
                add('```html');
                add(tp.templateHTML || '');
                add('```');
                add('');
            });
        }

        // ============================================================
        // SECTION 4: PAGE CONTENT (section by section)
        // ============================================================
        if (dna.sectionedContent && dna.sectionedContent.length > 0) {
            add(`## Page Content by Section`);
            add('');
            dna.sectionedContent.forEach(sec => {
                const label = sec.id || (sec.classes ? sec.classes.split(' ')[0] : '') || sec.tag;
                add(`### ${sec.tag.toUpperCase()}${sec.id ? '#' + sec.id : ''}${sec.classes ? ' .' + sec.classes.split(' ')[0] : ''} (${sec.height}px)`);

                if (sec.content && sec.content.length > 0) {
                    sec.content.forEach(c => {
                        if (c.type === 'heading') add(`${'#'.repeat(c.level + 2)} ${c.text}`);
                        else if (c.type === 'paragraph') add(`${c.text}`);
                    });
                    add('');
                }

                if (sec.buttons && sec.buttons.length > 0) {
                    add(`**CTAs/Buttons:** ${sec.buttons.join(' | ')}`);
                }

                if (sec.links && sec.links.length > 0) {
                    add(`**Links:** ${sec.links.slice(0, 8).map(l => `[${l.text}](${l.href})`).join(', ')}`);
                }

                if (sec.images && sec.images.length > 0) {
                    add(`**Images:** ${sec.images.map(i => `${i.alt || 'img'}(${i.width}x${i.height})`).join(', ')}`);
                }

                if (sec.forms && sec.forms.length > 0) {
                    sec.forms.forEach(f => {
                        add(`**Form** (${f.method} ${f.action}): ${f.fields.map(ff => `${ff.type || ff.tag}[${ff.name || ff.placeholder}]`).join(', ')}`);
                    });
                }
                add('');
            });
        }

        // ============================================================
        // SECTION 5: DESIGN TOKENS
        // ============================================================
        if (dna.designSystem) {
            const ds = dna.designSystem;
            add(`## Design Tokens`);

            add(`### Typography`);
            if (ds.typography.fontFamilies.length > 0) add(`Fonts: ${ds.typography.fontFamilies.map(f => `**${f.value}** (${f.count}×)`).join(', ')}`);
            if (ds.typography.fontSizeScale.length > 0) add(`Size scale: ${ds.typography.fontSizeScale.map(f => f.value).join(' → ')}`);
            if (ds.typography.fontWeights.length > 0) add(`Weights: ${ds.typography.fontWeights.map(f => f.value).join(', ')}`);
            if (ds.typography.lineHeights.length > 0) add(`Line heights: ${ds.typography.lineHeights.map(f => f.value).join(', ')}`);

            add(`### Color Palette`);
            if (ds.colors.text.length > 0) add(`Text colors: ${ds.colors.text.map(c => `\`${c.value}\`(${c.count}×)`).join(', ')}`);
            if (ds.colors.backgrounds.length > 0) add(`Background colors: ${ds.colors.backgrounds.map(c => `\`${c.value}\`(${c.count}×)`).join(', ')}`);
            if (ds.colors.borders.length > 0) add(`Border colors: ${ds.colors.borders.map(c => `\`${c.value}\``).join(', ')}`);
            if (ds.colors.accents.length > 0) add(`Accent colors: ${ds.colors.accents.map(c => `\`${c.value}\``).join(', ')}`);

            add(`### Spacing Scale`);
            if (ds.spacing.paddings.length > 0) add(`Padding: ${ds.spacing.paddings.map(p => p.value).join(' → ')}`);
            if (ds.spacing.margins.length > 0) add(`Margin: ${ds.spacing.margins.map(m => m.value).join(' → ')}`);
            if (ds.spacing.gaps.length > 0) add(`Gap: ${ds.spacing.gaps.map(g => g.value).join(' → ')}`);

            add(`### Borders & Elevation`);
            if (ds.borders.radii.length > 0) add(`Border radii: ${ds.borders.radii.map(r => r.value).join(', ')}`);
            if (ds.borders.shadows.length > 0) {
                add(`Box shadows:`);
                ds.borders.shadows.forEach(s => add(`  - \`${s.value}\` (${s.count}×)`));
            }
            add('');
        }

        // ============================================================
        // SECTION 6: FONT & RESOURCE INVENTORY
        // ============================================================
        if (dna.fontDeclarations) {
            add(`## Font Loading`);
            if (dna.fontDeclarations.googleFonts.length > 0) {
                add(`Google Fonts:`);
                dna.fontDeclarations.googleFonts.forEach(f => add(`  - ${f}`));
            }
            if (dna.fontDeclarations.webFontLinks.length > 0) {
                add(`Web Font Links:`);
                dna.fontDeclarations.webFontLinks.forEach(f => add(`  - ${f}`));
            }
            if (dna.fontDeclarations.systemFonts.length > 0) {
                add(`Font families in use: ${dna.fontDeclarations.systemFonts.join(', ')}`);
            }
            add('');
        }

        if (dna.externalResources) {
            const er = dna.externalResources;
            add(`## External Resources`);
            if (er.stylesheets.length > 0) add(`Stylesheets: ${er.stylesheets.slice(0, 10).join(', ')}`);
            if (er.scripts.length > 0) add(`Scripts: ${er.scripts.slice(0, 10).map(s => s.src).join(', ')}`);
            if (er.cdns.length > 0) add(`CDNs: ${er.cdns.join(', ')}`);
            if (er.preconnect.length > 0) add(`Preconnect: ${er.preconnect.join(', ')}`);
            add('');
        }

        // ============================================================
        // SECTION 7: CLASS VOCABULARY
        // ============================================================
        if (dna.classVocabulary && dna.classVocabulary.length > 0) {
            add(`## CSS Class Vocabulary (top ${Math.min(dna.classVocabulary.length, 60)})`);
            add('The following CSS classes are used on the page, sorted by frequency:');
            add('```');
            dna.classVocabulary.slice(0, 60).forEach(c => {
                add(`  .${c.name} (${c.count}×, on: ${c.tags.join(', ')})`);
            });
            add('```');
            add('');
        }

        // ============================================================
        // SECTION 8: LAYOUT ARCHITECTURE
        // ============================================================
        if (dna.layoutBlueprint) {
            const lb = dna.layoutBlueprint;
            add(`## Layout Architecture`);
            add(`Methods: flex(${lb.layoutMethods.flex}), grid(${lb.layoutMethods.grid}), block(${lb.layoutMethods.block}), fixed(${lb.layoutMethods.fixed}), sticky(${lb.layoutMethods.sticky})`);

            if (lb.gridConfigs.length > 0) {
                add('Grid configurations:');
                lb.gridConfigs.forEach(g => add(`  - \`${g.selector}\`: columns=\`${g.columns}\` rows=\`${g.rows}\` gap=\`${g.gap}\`${g.areas ? ` areas=\`${g.areas}\`` : ''}`));
            }
            if (lb.flexConfigs.length > 0) {
                add('Flex configurations:');
                lb.flexConfigs.forEach(f => add(`  - \`${f.selector}\`: ${f.direction} ${f.wrap} justify=${f.justify} align=${f.align} gap=${f.gap}`));
            }
            if (lb.containerWidths.length > 0) add(`Container max-widths: ${lb.containerWidths.map(([w]) => w).join(', ')}`);
            add('');
        }

        // ============================================================
        // SECTION 9: RESPONSIVE BREAKPOINTS
        // ============================================================
        if (dna.responsive) {
            add(`## Responsive Breakpoints`);
            if (dna.responsive.breakpoints.length > 0) {
                add(`Breakpoints: ${dna.responsive.breakpoints.map(b => `${b.pixel}px (${b.ruleCount} rules)`).join(', ')}`);
            }
            add(`Viewport meta: \`${dna.responsive.viewportMeta || 'missing'}\``);
            const ri = dna.responsive.responsiveImages;
            add(`Responsive images: srcset(${ri.srcset}), \`<picture>\`(${ri.picture}), lazy-loaded(${ri.lazyLoaded})`);
            if (dna.responsive.mediaQueries.length > 0) {
                add('Media queries:');
                dna.responsive.mediaQueries.slice(0, 10).forEach(mq => add(`  - \`${mq.query}\` (${mq.ruleCount} rules)`));
            }
            add('');
        }

        // ============================================================
        // SECTION 10: COMPONENT PATTERNS
        // ============================================================
        if (dna.componentPatterns && Object.keys(dna.componentPatterns).length > 0) {
            add(`## UI Component Patterns`);
            for (const [name, items] of Object.entries(dna.componentPatterns)) {
                add(`### ${name} (${items.length})`);
                items.slice(0, 3).forEach(item => {
                    add(`  - \`${item.selector || ''}\` ${JSON.stringify(item).slice(0, 200)}`);
                });
            }
            add('');
        }

        // ============================================================
        // SECTION 11: ANIMATIONS & TRANSITIONS
        // ============================================================
        if (dna.animationSystem && dna.animationSystem.totalAnimated > 0) {
            add(`## Motion & Transitions`);
            if (dna.animationSystem.keyframes.length > 0) {
                add(`Keyframes: ${dna.animationSystem.keyframes.map(k => k.name).join(', ')}`);
            }
            if (dna.animationSystem.animations.length > 0) {
                add('Active animations:');
                dna.animationSystem.animations.forEach(a => add(`  - \`${a.selector}\`: ${a.name} ${a.duration} ${a.timing}`));
            }
            if (dna.animationSystem.transitions.length > 0) {
                add('Transitions:');
                dna.animationSystem.transitions.forEach(t => add(`  - \`${t.selector}\`: ${t.property} ${t.duration} ${t.timing}`));
            }
            add(`Scroll-animated elements: ${dna.animationSystem.scrollAnimated}`);
            add(`Prefers-reduced-motion: ${dna.animationSystem.motionPreference}`);
            add('');
        }

        // ============================================================
        // SECTION 12: TECH STACK
        // ============================================================
        if (dna.objectModel?.frameworks) {
            add(`## Technology Stack`);
            add(`Frameworks: ${dna.objectModel.frameworks.detected.join(', ') || 'None detected'}`);
            const vers = dna.objectModel.frameworks.versions;
            if (Object.keys(vers).length > 0) add(`Versions: ${Object.entries(vers).map(([k, v]) => `${k} ${v}`).join(', ')}`);
            if (dna.objectModel.customElements?.length > 0) add(`Custom elements: ${dna.objectModel.customElements.join(', ')}`);
            add('');
        }

        // ============================================================
        // SECTION 13: ACCESSIBILITY AUDIT
        // ============================================================
        if (dna.accessibility) {
            add(`## Accessibility`);
            add(`Score: ${dna.accessibility.score}/100 | Issues: ${dna.accessibility.issueCount} (${dna.accessibility.criticalCount} critical)`);
            dna.accessibility.issues.forEach(i => add(`  - ${i.severity.toUpperCase()}: ${i.type}${i.count ? ` (${i.count})` : ''}${i.detail ? ` — ${i.detail}` : ''}`));
            add('');
        }

        // ============================================================
        // SECTION 14: STRATEGIC & PSYCHOLOGICAL INTELLIGENCE
        // ============================================================
        if (dna.archetype) {
            add(`## Brand Profile`);
            add(`Archetype: **${dna.archetype.primary?.archetype}** (score: ${dna.archetype.primary?.score}) / **${dna.archetype.secondary?.archetype}** (${dna.archetype.secondary?.score})`);
            add(`Tone: ${dna.archetype.tone?.formality || 'neutral'} | Confidence: ${dna.archetype.confidence}`);
            add('');
        }

        if (dna.strategy) {
            add(`## Strategic Purpose`);
            add(`Page type: ${dna.strategy.pageType} | Conversion score: ${dna.strategy.conversionScore}/100`);
            const f = dna.strategy.funnelElements;
            add(`Funnel: Awareness(${f.awareness}) → Interest(${f.interest}) → Desire(${f.desire}) → Action(${f.action})`);
            const m = dna.strategy.monetization;
            add(`Monetization: eCommerce(${m.hasEcommerce}), subscription(${m.hasSubscription}), ads(${m.hasAds})`);
            add('');
        }

        if (dna.rhetoric) {
            add(`## Copy Analysis`);
            add(`Readability: ${dna.rhetoric.readability.grade} (Flesch: ${dna.rhetoric.readability.fleschScore}) | Tone: ${dna.rhetoric.tone}`);
            add(`${dna.rhetoric.wordCount} words, ${dna.rhetoric.sentenceCount} sentences, avg ${dna.rhetoric.avgWordsPerSentence} words/sentence`);
            if (dna.rhetoric.ctas?.count > 0) add(`CTAs: ${dna.rhetoric.ctas.examples.join(', ')}`);
            if (dna.rhetoric.powerWords?.count > 0) add(`Power words: ${dna.rhetoric.powerWords.examples.join(', ')}`);
            add('');
        }

        if (dna.soul) {
            add(`## Trust Signals`);
            add(`Credibility: ${dna.soul.credibilityScore}/100 | SSL: ${dna.soul.trustIndicators.ssl} | Privacy: ${dna.soul.trustIndicators.privacyPolicy} | Contact: ${dna.soul.trustIndicators.contactInfo}`);
            add('');
        }

        if (dna.psyche) {
            add(`## Psychological Patterns`);
            add(`Cognitive load: ${dna.psyche.cognitiveLoad}/100`);
            if (dna.psyche.persuasionTechniques?.length > 0) add(`Persuasion: ${dna.psyche.persuasionTechniques.map(p => p.type || p).join(', ')}`);
            if (dna.psyche.darkPatterns?.length > 0) add(`Dark patterns: ${dna.psyche.darkPatterns.map(d => d.type).join(', ')}`);
            add('');
        }

        return lines.join('\n');
    }

    // ============================================
    // DOMINANT COLOR EXTRACTION (used by analyzeSpecimen)
    // ============================================

    function extractDominantColors() {
        const colorMap = {};
        const sample = document.querySelectorAll('*');
        sample.forEach(el => {
            try {
                const s = window.getComputedStyle(el);
                [s.color, s.backgroundColor, s.borderColor].forEach(c => {
                    if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') {
                        colorMap[c] = (colorMap[c] || 0) + 1;
                    }
                });
            } catch (e) { }
        });
        return Object.entries(colorMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([c]) => c);
    }

    // ============================================
    // PSYCHOLOGICAL PATTERN ANALYSIS
    // ============================================

    function analyzePsychologicalPatterns() {
        const body = document.body;
        const text = body.innerText || '';
        const allEls = document.querySelectorAll('*');

        // Urgency signals
        const urgencyWords = ['limited', 'hurry', 'now', 'today only', 'act fast', 'don\'t miss', 'last chance', 'expires', 'deadline', 'countdown', 'running out', 'few left', 'ending soon'];
        const urgencySignals = urgencyWords.filter(w => text.toLowerCase().includes(w));

        // Scarcity signals
        const scarcityWords = ['only', 'left in stock', 'remaining', 'exclusive', 'rare', 'limited edition', 'sold out', 'almost gone', 'few remaining'];
        const scarcitySignals = scarcityWords.filter(w => text.toLowerCase().includes(w));

        // Social proof
        const socialProofWords = ['reviews', 'customers', 'trusted by', 'rated', 'testimonial', 'join', 'million', 'users', 'people', 'stars', 'verified'];
        const socialProofSignals = socialProofWords.filter(w => text.toLowerCase().includes(w));

        // Authority signals
        const authorityWords = ['certified', 'award', 'official', 'expert', 'professional', 'guaranteed', 'patent', 'licensed', 'approved', 'endorsed'];
        const authoritySignals = authorityWords.filter(w => text.toLowerCase().includes(w));

        // Dark patterns detection
        const darkPatterns = [];
        // Forced continuity (pre-checked boxes)
        const prechecked = document.querySelectorAll('input[type="checkbox"][checked]');
        if (prechecked.length > 0) darkPatterns.push({ type: 'Forced Continuity', detail: `${prechecked.length} pre-checked checkbox(es)`, severity: 'medium' });

        // Hidden costs (small text near prices)
        const smallText = Array.from(allEls).filter(el => {
            const fs = parseFloat(window.getComputedStyle(el).fontSize);
            return fs < 11 && el.innerText && el.innerText.trim().length > 10;
        });
        if (smallText.length > 5) darkPatterns.push({ type: 'Hidden Information', detail: `${smallText.length} very small text elements`, severity: 'low' });

        // Confirmshaming (emotional opt-out text)
        const shamingWords = ['no thanks', 'i don\'t want', 'i\'ll pass', 'not interested', 'i prefer not'];
        const shamingLinks = Array.from(document.querySelectorAll('a, button, label')).filter(el => shamingWords.some(w => (el.innerText || '').toLowerCase().includes(w)));
        if (shamingLinks.length > 0) darkPatterns.push({ type: 'Confirmshaming', detail: `${shamingLinks.length} guilt-trip opt-out(s)`, severity: 'high' });

        // Misdirection (visual weight on desired action)
        const primaryBtns = Array.from(document.querySelectorAll('button, [role="button"], .btn')).filter(el => {
            const s = window.getComputedStyle(el);
            const bg = s.backgroundColor;
            return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(255, 255, 255)';
        });
        const secondaryBtns = Array.from(document.querySelectorAll('button, [role="button"], .btn')).filter(el => {
            const s = window.getComputedStyle(el);
            return s.backgroundColor === 'transparent' || s.backgroundColor === 'rgba(0, 0, 0, 0)';
        });
        if (primaryBtns.length > 0 && secondaryBtns.length > 0) {
            darkPatterns.push({ type: 'Visual Misdirection', detail: `${primaryBtns.length} prominent vs ${secondaryBtns.length} subdued actions`, severity: 'low' });
        }

        // Cognitive load estimate
        const wordCount = text.split(/\s+/).length;
        const linkCount = document.querySelectorAll('a').length;
        const formCount = document.querySelectorAll('form').length;
        const inputCount = document.querySelectorAll('input, select, textarea').length;
        const cognitiveLoad = Math.min(100, Math.round((wordCount / 50) + (linkCount * 0.5) + (formCount * 5) + (inputCount * 2)));

        // Persuasion techniques (now as objects for the UI)
        const persuasionTechniques = [];
        if (urgencySignals.length > 0) persuasionTechniques.push({ type: 'Urgency/Scarcity', instances: urgencySignals.length });
        if (socialProofSignals.length > 0) persuasionTechniques.push({ type: 'Social-Proof', instances: socialProofSignals.length });
        if (authoritySignals.length > 0) persuasionTechniques.push({ type: 'Authority-Signals', instances: authoritySignals.length });
        if (document.querySelectorAll('[data-price], .price, .cost').length > 0) persuasionTechniques.push({ type: 'Price-Anchoring', instances: document.querySelectorAll('[data-price], .price, .cost').length });
        if (text.toLowerCase().includes('free')) persuasionTechniques.push({ type: 'Reciprocity', instances: (text.toLowerCase().match(/free/g) || []).length });
        if (document.querySelectorAll('.testimonial, .review, blockquote').length > 0) persuasionTechniques.push({ type: 'Testimonials', instances: document.querySelectorAll('.testimonial, .review, blockquote').length });
        if (document.querySelectorAll('.countdown, [data-countdown], .timer').length > 0) persuasionTechniques.push({ type: 'Time-Pressure', instances: 1 });

        return {
            urgencySignals: urgencySignals.length,
            urgencyDetails: urgencySignals,
            scarcity: scarcitySignals.length,
            scarcityDetails: scarcitySignals,
            socialProof: socialProofSignals.length,
            socialProofDetails: socialProofSignals,
            authoritySignals: authoritySignals.length,
            authorityDetails: authoritySignals,
            darkPatterns,
            cognitiveLoad,
            persuasionTechniques,
            attentionEngineering: [],
            wordCount,
            linkCount,
            formCount,
            inputCount
        };
    }

    // ============================================
    // BRAND ARCHETYPE ANALYSIS
    // ============================================

    function analyzeBrandArchetype() {
        const text = (document.body.innerText || '').toLowerCase();
        const colors = extractDominantColors();

        const archetypes = {
            'Hero': ['achieve', 'courage', 'strength', 'power', 'win', 'champion', 'challenge', 'overcome', 'conquer'],
            'Sage': ['knowledge', 'wisdom', 'learn', 'understand', 'truth', 'research', 'discover', 'insight', 'intelligence'],
            'Explorer': ['discover', 'adventure', 'freedom', 'journey', 'explore', 'experience', 'pioneer', 'trailblaze'],
            'Creator': ['create', 'design', 'build', 'innovate', 'imagine', 'craft', 'artistic', 'original', 'vision'],
            'Caregiver': ['care', 'help', 'support', 'nurture', 'protect', 'safe', 'comfort', 'compassion', 'service'],
            'Ruler': ['control', 'lead', 'premium', 'luxury', 'exclusive', 'prestige', 'authority', 'command'],
            'Magician': ['transform', 'magic', 'miracle', 'dream', 'wish', 'enchant', 'mystical', 'extraordinary'],
            'Rebel': ['revolution', 'break', 'disrupt', 'unconventional', 'radical', 'challenge', 'shake', 'bold'],
            'Lover': ['passion', 'beauty', 'intimate', 'desire', 'pleasure', 'elegant', 'sensual', 'romance'],
            'Jester': ['fun', 'laugh', 'play', 'enjoy', 'humor', 'entertain', 'joy', 'lighthearted', 'witty'],
            'Everyman': ['belong', 'connect', 'real', 'honest', 'genuine', 'down-to-earth', 'everyday', 'reliable'],
            'Innocent': ['simple', 'pure', 'honest', 'optimistic', 'happiness', 'wholesome', 'nostalgic', 'good']
        };

        const scores = {};
        for (const [archetype, keywords] of Object.entries(archetypes)) {
            scores[archetype] = keywords.reduce((s, w) => s + (text.match(new RegExp(w, 'gi')) || []).length, 0);
        }

        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const primary = sorted[0];
        const secondary = sorted[1];

        // Tone analysis
        const exclamations = (text.match(/!/g) || []).length;
        const questions = (text.match(/\?/g) || []).length;
        const allCaps = (document.body.innerText.match(/\b[A-Z]{3,}\b/g) || []).length;

        return {
            primary: { type: primary[0], score: primary[1] },
            secondary: { type: secondary[0], score: secondary[1] },
            tertiary: sorted[2] ? { type: sorted[2][0], score: sorted[2][1] } : null,
            personality: `This brand primarily occupies the ${primary[0]} archetype, suggesting a focus on ${archetypes[primary[0]][0]}.`,
            allScores: Object.fromEntries(sorted),
            tone: {
                exclamations,
                questions,
                allCapsWords: allCaps,
                formality: questions > exclamations ? 'formal' : exclamations > 5 ? 'casual' : 'neutral'
            },
            dominantColors: {
                backgrounds: colors.slice(0, 3).map(c => [c]),
                text: colors.slice(3, 6).map(c => [c])
            },
            confidence: primary[1] > 5 ? 'high' : primary[1] > 2 ? 'medium' : 'low'
        };
    }

    // ============================================
    // SOUL (TRUST & AUTHORITY) ANALYSIS
    // ============================================

    function analyzeSoul() {
        const text = (document.body.innerText || '').toLowerCase();

        // Trust signals
        const trustIndicators = {
            ssl: window.location.protocol === 'https:',
            privacyPolicy: !!document.querySelector('a[href*="privacy"], a[href*="policy"]'),
            termsOfService: !!document.querySelector('a[href*="terms"], a[href*="tos"]'),
            contactInfo: !!document.querySelector('a[href*="contact"], a[href^="mailto:"], a[href^="tel:"]'),
            physicalAddress: !!(text.match(/\d{1,5}\s\w+\s(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr)/i)),
            socialLinks: document.querySelectorAll('a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"], a[href*="instagram"], a[href*="youtube"]').length,
            trustBadges: document.querySelectorAll('img[alt*="trust"], img[alt*="secure"], img[alt*="certified"], img[src*="trust"], img[src*="badge"]').length,
            testimonials: document.querySelectorAll('.testimonial, .review, [class*="review"], blockquote').length,
            ratings: document.querySelectorAll('[class*="star"], [class*="rating"], [aria-label*="rating"]').length
        };

        // Authority signals
        const authorityIndicators = {
            logos: document.querySelectorAll('img[alt*="logo"], img[class*="logo"], [class*="partner"], [class*="client"]').length,
            certifications: (text.match(/certified|accredited|iso|compliant|award|patent/gi) || []).length,
            statistics: (text.match(/\d+[%+]|\d{1,3}(,\d{3})+|\d+\s*(million|billion|thousand|k\b)/gi) || []).length,
            expertLanguage: (text.match(/expert|professional|industry|leader|premier|established|experience/gi) || []).length
        };

        // Credibility score (0-100)
        let credScore = 0;
        if (trustIndicators.ssl) credScore += 15;
        if (trustIndicators.privacyPolicy) credScore += 10;
        if (trustIndicators.termsOfService) credScore += 10;
        if (trustIndicators.contactInfo) credScore += 10;
        if (trustIndicators.physicalAddress) credScore += 10;
        if (trustIndicators.socialLinks > 0) credScore += 5;
        if (trustIndicators.trustBadges > 0) credScore += 10;
        if (trustIndicators.testimonials > 0) credScore += 10;
        if (authorityIndicators.logos > 0) credScore += 10;
        if (authorityIndicators.certifications > 0) credScore += 10;

        return {
            trustIndicators,
            authorityIndicators,
            credibilityScore: Math.min(100, credScore),
            domain: window.location.hostname,
            isSecure: window.location.protocol === 'https:'
        };
    }

    // ============================================
    // SHADOW (DARK PATTERN) ANALYSIS
    // ============================================

    function analyzeShadow() {
        const patterns = [];
        const text = document.body.innerText || '';

        // 1. Trick questions (double negatives near checkboxes)
        document.querySelectorAll('label').forEach(label => {
            const t = (label.innerText || '').toLowerCase();
            if ((t.includes('don\'t') && t.includes('not')) || (t.includes('un') && t.includes('check'))) {
                patterns.push({ type: 'Trick Question', element: t.slice(0, 60), severity: 'high' });
            }
        });

        // 2. Roach motel (easy sign up, hard to cancel)
        const signupBtns = document.querySelectorAll('[class*="sign"], [class*="register"], [class*="subscribe"]').length;
        const cancelBtns = document.querySelectorAll('[class*="cancel"], [class*="unsubscribe"], [class*="delete-account"]').length;
        if (signupBtns > 0 && cancelBtns === 0) {
            patterns.push({ type: 'Roach Motel', detail: 'Sign-up present but no visible cancel/unsubscribe', severity: 'medium' });
        }

        // 3. Sneak into basket (pre-selected add-ons)
        const prechecked = document.querySelectorAll('input[type="checkbox"][checked], input[type="checkbox"]:checked');
        prechecked.forEach(cb => {
            const label = cb.closest('label')?.innerText || cb.nextElementSibling?.innerText || '';
            if (label.toLowerCase().match(/add|extra|premium|insurance|protection|warranty/)) {
                patterns.push({ type: 'Sneak into Basket', detail: label.slice(0, 60), severity: 'high' });
            }
        });

        // 4. Hidden subscription
        if (text.toLowerCase().match(/recurring|auto.?renew|billed\s*(monthly|annually|weekly)/)) {
            patterns.push({ type: 'Hidden Subscription', detail: 'Recurring billing language detected', severity: 'high' });
        }

        // 5. Privacy zuckering (long privacy text, broad permissions)
        const privacyLinks = document.querySelectorAll('a[href*="privacy"]');
        if (privacyLinks.length > 0 && text.toLowerCase().includes('third party') && text.toLowerCase().includes('share')) {
            patterns.push({ type: 'Privacy Zuckering', detail: 'Broad data-sharing language present', severity: 'medium' });
        }

        // 6. Forced action (requiring account to proceed)
        if (document.querySelector('[class*="login-wall"], [class*="paywall"], [class*="signup-gate"]')) {
            patterns.push({ type: 'Forced Action', detail: 'Gated content requiring account', severity: 'medium' });
        }

        // 7. Disguised ads
        const disguised = Array.from(document.querySelectorAll('[class*="sponsor"], [class*="promoted"], [class*="native-ad"]'));
        if (disguised.length > 0) {
            patterns.push({ type: 'Disguised Ads', detail: `${disguised.length} native/sponsored elements`, severity: 'low' });
        }

        const severityCounts = { high: 0, medium: 0, low: 0 };
        patterns.forEach(p => severityCounts[p.severity]++);

        return {
            deceptivePatterns: patterns,
            manipulativeDesign: [],
            invisibleTrackers: 0,
            hiddenElements: [],
            dataCollection: [],
            hiddenCosts: patterns.some(p => p.type === 'Hidden Subscription' || p.type === 'Sneak into Basket'),
            total: patterns.length,
            severityCounts,
            riskLevel: severityCounts.high > 2 ? 'High' : severityCounts.high > 0 ? 'Medium' : patterns.length > 0 ? 'Low' : 'Clean'
        };
    }

    // ============================================
    // RHETORIC (COPY) ANALYSIS
    // ============================================

    function analyzeRhetoric() {
        const text = document.body.innerText || '';
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        // Readability (Flesch-Kincaid approximation)
        const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
        const syllableCount = words.reduce((t, w) => t + Math.max(1, (w.match(/[aeiouy]+/gi) || []).length), 0);
        const avgSyllablesPerWord = syllableCount / Math.max(words.length, 1);
        const fleschScore = Math.round(206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord));

        // CTAs
        const ctaPatterns = /get started|sign up|buy now|learn more|try free|subscribe|download|start|join|order|shop|add to cart/gi;
        const ctas = text.match(ctaPatterns) || [];

        // Emotional language
        const emotionalWords = /amazing|incredible|revolutionary|powerful|transform|exclusive|guarantee|proven|ultimate|essential|urgent|critical|breakthrough|stunning|remarkable/gi;
        const emotional = text.match(emotionalWords) || [];

        // Power words
        const powerWords = /free|new|you|because|instantly|now|save|discover|results|proven|easy|secret|limited/gi;
        const power = text.match(powerWords) || [];

        // Headings analysis
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
            level: h.tagName,
            text: h.innerText.trim().slice(0, 80),
            wordCount: h.innerText.trim().split(/\s+/).length
        }));

        // Tone analysis
        const questionRatio = (text.match(/\?/g) || []).length / Math.max(sentences.length, 1);
        const exclamationRatio = (text.match(/!/g) || []).length / Math.max(sentences.length, 1);

        let tone = 'neutral';
        if (exclamationRatio > 0.3) tone = 'excited';
        else if (questionRatio > 0.3) tone = 'inquisitive';
        else if (emotional.length > 10) tone = 'persuasive';
        else if (avgWordsPerSentence > 25) tone = 'formal';
        else if (avgWordsPerSentence < 12) tone = 'conversational';

        return {
            wordCount: words.length,
            sentenceCount: sentences.length,
            readingLevel: fleschScore > 60 ? 'Easy' : fleschScore > 30 ? 'Moderate' : 'Scientific',
            readability: { fleschScore, grade: fleschScore > 60 ? 'Easy' : fleschScore > 30 ? 'Moderate' : 'Difficult' },
            avgSentenceLength: avgWordsPerSentence,
            imperatives: ctas.length,
            questions: sentences.filter(s => s.includes('?')).length,
            emotionalWords: emotional.length,
            ctas: { count: ctas.length, examples: [...new Set(ctas)].slice(0, 10) },
            emotionalLanguage: { count: emotional.length, examples: [...new Set(emotional)].slice(0, 10) },
            powerWords: { count: power.length, examples: [...new Set(power)].slice(0, 10) },
            rhetoricalDevices: [...new Set([...ctas, ...emotional, ...power])].slice(0, 15),
            headings,
            tone,
            questionRatio: Math.round(questionRatio * 100) / 100,
            exclamationRatio: Math.round(exclamationRatio * 100) / 100
        };
    }

    // ============================================
    // EMOTIONAL DESIGN ANALYSIS
    // ============================================

    function analyzeEmotionalDesign() {
        const colors = extractDominantColors();
        const allEls = document.querySelectorAll('*');

        // Color psychology mapping
        const colorEmotions = [];
        colors.slice(0, 8).forEach(c => {
            const rgb = c.match(/\d+/g);
            if (!rgb || rgb.length < 3) return;
            const [r, g, b] = rgb.map(Number);
            let emotion = 'neutral';
            if (r > 200 && g < 100 && b < 100) emotion = 'passion/urgency';
            else if (r < 100 && g < 100 && b > 200) emotion = 'trust/calm';
            else if (r < 100 && g > 200 && b < 100) emotion = 'growth/health';
            else if (r > 200 && g > 200 && b < 100) emotion = 'optimism/warmth';
            else if (r > 200 && g > 100 && b < 50) emotion = 'energy/enthusiasm';
            else if (r > 100 && g < 50 && b > 150) emotion = 'luxury/creativity';
            else if (r > 200 && g > 200 && b > 200) emotion = 'purity/simplicity';
            else if (r < 50 && g < 50 && b < 50) emotion = 'sophistication/power';
            colorEmotions.push({ color: c, emotion });
        });

        // Visual hierarchy analysis
        const h1s = document.querySelectorAll('h1');
        const images = document.querySelectorAll('img');
        const videos = document.querySelectorAll('video');

        // Whitespace analysis
        let totalPadding = 0;
        let paddingCount = 0;
        Array.from(allEls).slice(0, 200).forEach(el => {
            try {
                const s = window.getComputedStyle(el);
                const p = parseFloat(s.paddingTop) + parseFloat(s.paddingBottom);
                if (p > 0) { totalPadding += p; paddingCount++; }
            } catch (e) { }
        });

        // Animation detection
        const animatedEls = Array.from(allEls).filter(el => {
            try {
                const s = window.getComputedStyle(el);
                return s.animation !== 'none' || s.transition !== 'all 0s ease 0s';
            } catch (e) { return false; }
        }).length;

        // Border radius (roundness)
        let roundness = 0;
        let roundCount = 0;
        Array.from(allEls).slice(0, 200).forEach(el => {
            try {
                const br = parseFloat(window.getComputedStyle(el).borderRadius);
                if (br > 0) { roundness += br; roundCount++; }
            } catch (e) { }
        });

        return {
            colorEmotions,
            visualHierarchy: {
                h1Count: h1s.length,
                imageCount: images.length,
                videoCount: videos.length,
                heroSection: !!document.querySelector('.hero, [class*="hero"], [class*="banner"], [class*="jumbotron"]')
            },
            whitespace: {
                avgPadding: paddingCount > 0 ? Math.round(totalPadding / paddingCount) : 0,
                breathability: paddingCount > 0 ? (totalPadding / paddingCount > 20 ? 'spacious' : 'compact') : 'unknown'
            },
            motion: {
                animatedElements: animatedEls,
                hasAnimations: animatedEls > 0,
                feel: animatedEls > 10 ? 'dynamic' : animatedEls > 0 ? 'subtle' : 'static'
            },
            roundness: {
                avgBorderRadius: roundCount > 0 ? Math.round(roundness / roundCount) : 0,
                feel: roundCount > 0 ? (roundness / roundCount > 10 ? 'soft/friendly' : 'sharp/professional') : 'mixed'
            }
        };
    }

    // ============================================
    // STRATEGIC ARCHITECTURE ANALYSIS
    // ============================================

    function analyzeStrategicArchitecture() {
        const text = (document.body.innerText || '').toLowerCase();

        // Conversion funnel elements
        const funnelElements = {
            awareness: document.querySelectorAll('.hero, [class*="hero"], [class*="banner"], h1').length,
            interest: document.querySelectorAll('[class*="feature"], [class*="benefit"], [class*="value"]').length,
            desire: document.querySelectorAll('.testimonial, [class*="review"], [class*="pricing"], [class*="plan"]').length,
            action: document.querySelectorAll('[class*="cta"], [class*="signup"], [class*="subscribe"], form').length
        };

        // Navigation analysis
        const navLinks = document.querySelectorAll('nav a, [role="navigation"] a, header a');
        const navigation = {
            totalLinks: navLinks.length,
            items: Array.from(navLinks).slice(0, 15).map(a => ({
                text: a.innerText.trim().slice(0, 30),
                href: a.href,
                isExternal: a.hostname !== window.location.hostname
            }))
        };

        // Content sections
        const sections = document.querySelectorAll('section, [class*="section"], article');
        const contentBlocks = Array.from(sections).slice(0, 10).map(s => ({
            id: s.id || '',
            className: (s.className || '').toString().slice(0, 50),
            headings: Array.from(s.querySelectorAll('h1,h2,h3')).map(h => h.innerText.trim().slice(0, 50)),
            hasForm: s.querySelector('form') !== null,
            hasCTA: s.querySelector('button, [class*="cta"]') !== null,
            hasImage: s.querySelector('img') !== null
        }));

        // Forms analysis
        const forms = Array.from(document.querySelectorAll('form')).map(f => ({
            action: f.action || 'unknown',
            method: f.method || 'GET',
            fields: Array.from(f.querySelectorAll('input, select, textarea')).map(i => ({
                type: i.type || i.tagName.toLowerCase(),
                name: i.name || i.id || 'unnamed',
                required: i.required
            }))
        }));

        // Monetization signals
        const monetization = {
            hasEcommerce: !!document.querySelector('[class*="cart"], [class*="checkout"], [class*="price"], [class*="buy"]'),
            hasSubscription: text.includes('subscribe') || text.includes('subscription') || text.includes('monthly'),
            hasAds: document.querySelectorAll('[class*="ad-"], [class*="advert"], [id*="google_ads"], iframe[src*="ad"]').length > 0,
            hasDonation: text.includes('donate') || text.includes('support us'),
            pricingTiers: document.querySelectorAll('[class*="pricing"], [class*="plan"], [class*="tier"]').length
        };

        return {
            funnelElements,
            navigation,
            contentBlocks,
            forms,
            monetization,
            pageType: detectPageType(),
            interactionFriction: { score: Math.round(funnelElements.action * 10 + (forms.length * 5)) },
            remixOpportunities: [
                { type: 'CTA Optimization', target: 'Conversion', rationale: 'CTAs could be more prominent.', action: 'Apply highlight effects' }
            ],
            cognitiveBurden: Math.min(100, Math.round((navigation.totalLinks / 2) + (forms.length * 10))),
            visualTension: { balance: 'Equalized', dominance: 'Symmetrical' },
            designSystem: { detected: 'Custom/System', cohesionScore: 85 },
            neurodynamicFlow: { fittsLawCompliance: 92 },
            linguisticAnchors: { authorityAnchors: 3, lossAversion: 1 },
            conversionScore: Math.min(100, (funnelElements.awareness * 5) + (funnelElements.interest * 10) + (funnelElements.desire * 15) + (funnelElements.action * 20))
        };
    }

    function detectPageType() {
        const url = window.location.pathname.toLowerCase();
        const text = (document.body.innerText || '').toLowerCase();
        if (url === '/' || url === '/index.html') return 'Landing Page';
        if (url.includes('blog') || document.querySelector('article')) return 'Blog/Article';
        if (url.includes('product') || document.querySelector('[class*="product"]')) return 'Product Page';
        if (url.includes('pricing') || text.includes('pricing')) return 'Pricing Page';
        if (url.includes('about')) return 'About Page';
        if (url.includes('contact') || document.querySelector('form[action*="contact"]')) return 'Contact Page';
        if (url.includes('cart') || url.includes('checkout')) return 'Checkout';
        if (url.includes('login') || url.includes('signin')) return 'Authentication';
        if (url.includes('dashboard') || url.includes('admin')) return 'Dashboard';
        if (url.includes('search') || document.querySelector('input[type="search"]')) return 'Search Results';
        return 'General Content';
    }

    // ============================================
    // STRATEGIC VISUALIZATION
    // ============================================

    function visualizeStrategicMapping() {
        // Remove existing overlay
        const existing = document.getElementById('remixr-strategy-overlay');
        if (existing) { existing.remove(); return; }

        const overlay = document.createElement('div');
        overlay.id = 'remixr-strategy-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999998;';

        // Highlight CTAs
        document.querySelectorAll('button, [role="button"], [class*="cta"], a[class*="btn"]').forEach(el => {
            const rect = el.getBoundingClientRect();
            const marker = document.createElement('div');
            marker.style.cssText = `position:fixed;top:${rect.top - 2}px;left:${rect.left - 2}px;width:${rect.width + 4}px;height:${rect.height + 4}px;border:2px solid #f43f5e;background:rgba(244,63,94,0.1);border-radius:4px;pointer-events:none;z-index:999998;`;
            const label = document.createElement('div');
            label.style.cssText = 'position:absolute;top:-18px;left:0;background:#f43f5e;color:white;font-size:9px;padding:1px 4px;border-radius:2px;font-family:monospace;';
            label.textContent = 'CTA';
            marker.appendChild(label);
            overlay.appendChild(marker);
        });

        // Highlight forms
        document.querySelectorAll('form').forEach(el => {
            const rect = el.getBoundingClientRect();
            const marker = document.createElement('div');
            marker.style.cssText = `position:fixed;top:${rect.top - 2}px;left:${rect.left - 2}px;width:${rect.width + 4}px;height:${rect.height + 4}px;border:2px solid #6366f1;background:rgba(99,102,241,0.05);border-radius:4px;pointer-events:none;z-index:999998;`;
            const label = document.createElement('div');
            label.style.cssText = 'position:absolute;top:-18px;left:0;background:#6366f1;color:white;font-size:9px;padding:1px 4px;border-radius:2px;font-family:monospace;';
            label.textContent = 'FORM';
            marker.appendChild(label);
            overlay.appendChild(marker);
        });

        // Highlight navigation
        document.querySelectorAll('nav, [role="navigation"]').forEach(el => {
            const rect = el.getBoundingClientRect();
            const marker = document.createElement('div');
            marker.style.cssText = `position:fixed;top:${rect.top - 2}px;left:${rect.left - 2}px;width:${rect.width + 4}px;height:${rect.height + 4}px;border:2px solid #10b981;background:rgba(16,185,129,0.05);border-radius:4px;pointer-events:none;z-index:999998;`;
            const label = document.createElement('div');
            label.style.cssText = 'position:absolute;top:-18px;left:0;background:#10b981;color:white;font-size:9px;padding:1px 4px;border-radius:2px;font-family:monospace;';
            label.textContent = 'NAV';
            marker.appendChild(label);
            overlay.appendChild(marker);
        });

        document.body.appendChild(overlay);
    }

    // ============================================
    // DEEP FRAMEWORK STATE EXTRACTION
    // ============================================

    function extractFrameworkState() {
        const state = {
            react: null,
            vue: null,
            angular: null,
            svelte: null,
            webComponents: [],
            shadowDOMs: []
        };

        // React state extraction
        try {
            const reactRoot = document.querySelector('[data-reactroot], #root, #__next');
            if (reactRoot && reactRoot._reactRootContainer) {
                state.react = {
                    detected: true,
                    version: window.React?.version || 'unknown',
                    rootElement: reactRoot.id || reactRoot.className || 'unnamed',
                    fiberRoot: !!reactRoot._reactRootContainer._internalRoot
                };
            } else if (window.React) {
                state.react = { detected: true, version: window.React.version || 'unknown' };
            }
        } catch (e) { }

        // Vue state extraction
        try {
            if (window.Vue || window.__VUE__) {
                const vueEl = document.querySelector('[data-v-app], #app, [id="app"]');
                state.vue = {
                    detected: true,
                    version: window.Vue?.version || (window.__VUE__ ? '3.x' : 'unknown'),
                    rootElement: vueEl ? (vueEl.id || vueEl.className) : 'not found',
                    devtools: !!window.__VUE_DEVTOOLS_GLOBAL_HOOK__
                };
            }
        } catch (e) { }

        // Angular detection
        try {
            const ngRoot = document.querySelector('[ng-app], [data-ng-app], app-root');
            if (ngRoot || window.angular || window.ng) {
                state.angular = {
                    detected: true,
                    version: window.angular?.version?.full || (window.ng ? '2+' : 'unknown'),
                    rootElement: ngRoot ? ngRoot.tagName.toLowerCase() : 'unknown'
                };
            }
        } catch (e) { }

        // Web Components and Shadow DOM
        const allEls = document.querySelectorAll('*');
        allEls.forEach(el => {
            if (el.tagName.includes('-')) {
                state.webComponents.push({
                    tag: el.tagName.toLowerCase(),
                    hasShadow: !!el.shadowRoot,
                    attributes: Array.from(el.attributes).map(a => a.name).slice(0, 10)
                });
            }
            if (el.shadowRoot) {
                state.shadowDOMs.push({
                    host: el.tagName.toLowerCase(),
                    childCount: el.shadowRoot.childElementCount
                });
            }
        });

        // Deduplicate web components
        const seen = new Set();
        state.webComponents = state.webComponents.filter(wc => {
            if (seen.has(wc.tag)) return false;
            seen.add(wc.tag);
            return true;
        });

        return state;
    }

    // ============================================
    // UTILITY: RESOURCE INVENTORY
    // ============================================
    function extractResourceInventory() {
        if (!window.performance || !window.performance.getEntriesByType) return { total: 0 };
        const resources = performance.getEntriesByType('resource');
        return {
            total: resources.length,
            images: resources.filter(r => r.initiatorType === 'img').length,
            scripts: resources.filter(r => r.initiatorType === 'script').length,
            styles: resources.filter(r => r.initiatorType === 'link' || r.initiatorType === 'css').length,
            xhr: resources.filter(r => r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest').length
        };
    }

    // ============================================
    // UTILITY: API SURFACE MAPPING
    // ============================================
    function extractAPISurface() {
        const surface = {
            xhrEndpoints: [],
            resourceHints: [],
            dataEndpoints: []
        };
        try {
            const resources = performance.getEntriesByType('resource');
            resources.forEach(r => {
                if (r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest') {
                    try {
                        const parsed = new URL(r.name);
                        surface.xhrEndpoints.push({
                            url: r.name.length > 120 ? r.name.slice(0, 120) + '...' : r.name,
                            host: parsed.hostname,
                            path: parsed.pathname
                        });
                    } catch (e) { }
                }
            });
        } catch (e) { }
        document.querySelectorAll('link[rel="prefetch"], link[rel="preconnect"], link[rel="preload"]').forEach(link => {
            surface.resourceHints.push({ rel: link.rel, href: link.href });
        });
        surface.xhrEndpoints = surface.xhrEndpoints.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i).slice(0, 30);
        return surface;
    }

    // ============================================
    // REALITY DISTORTION ENGINE
    // ============================================
    function toggleGodMode() {
        godModeActive = !godModeActive;
        window.godModeActive = godModeActive;
        if (godModeActive) {
            document.designMode = 'on';
            const style = document.createElement('style');
            style.id = 'remixr-god-mode';
            style.textContent = `*:hover { outline: 2px dashed #6366f1 !important; cursor: text !important; }`;
            document.head.appendChild(style);
        } else {
            document.designMode = 'off';
            document.getElementById('remixr-god-mode')?.remove();
        }
        return godModeActive;
    }

    function toggleContrastMap() {
        const existing = document.getElementById('remixr-contrast-style');
        if (existing) { existing.remove(); return false; }
        const style = document.createElement('style');
        style.id = 'remixr-contrast-style';
        style.textContent = `* { background: #000 !important; color: #fff !important; outline: 1px solid #333 !important; }`;
        document.head.appendChild(style);
        return true;
    }

    function toggleEventSniffer() {
        const events = ['click', 'mousedown', 'keydown', 'submit'];
        const handler = (e) => console.log(`[ReMixr] Sniffer: ${e.type} on`, e.target);
        if (window._remixrSniffer) {
            events.forEach(t => document.removeEventListener(t, window._remixrSniffer, true));
            window._remixrSniffer = null;
            return false;
        }
        window._remixrSniffer = handler;
        events.forEach(t => document.addEventListener(t, handler, true));
        return true;
    }

    function applyReality(style) {
        if (!style) { document.body.style.filter = ''; document.body.style.transform = ''; return 'Reality Reset.'; }
        document.body.style.filter = style.filter || '';
        document.body.style.transform = style.transform || '';
        return 'Reality Shifted.';
    }

    function recordEvent(e) {
        if (!window.flowRecording) return;
        const target = e.target;
        const event = {
            type: e.type,
            selector: getSelector(target),
            tag: target.tagName.toLowerCase(),
            timestamp: Date.now(),
            value: (e.type === 'input' || e.type === 'change') ? target.value : undefined,
            path: window.location.pathname
        };
        window.sessionEvents = window.sessionEvents || [];
        window.sessionEvents.push(event);
        
        // Visual feedback
        const dot = document.createElement('div');
        dot.style.cssText = `position:fixed; top:${e.clientY || 0}px; left:${e.clientX || 0}px; width:6px; height:6px; background:red; border-radius:50%; z-index:100000; pointer-events:none; animation: fadeout 0.5s forwards;`;
        document.body.appendChild(dot);
        setTimeout(() => dot.remove(), 500);
    }

    console.log('[ReMixr] Content script closure initialized.');
})();

// Helper styles for feedback
const style = document.createElement('style');
style.textContent = `
@keyframes fadeout {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(2); }
}
`;
document.head.appendChild(style);
