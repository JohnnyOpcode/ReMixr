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

/**
 * ReMixr Core Utilities
 * Pure logic and Extension API helpers that are safe for both 
 * Popup (DOM) and Background (Service Worker) contexts.
 */

// Set DEBUG=true only in development (popup is served from extension context, not a public URL)
const DEBUG = (typeof chrome !== 'undefined' && chrome.runtime?.getManifest?.()?.version_name?.includes('dev')) || false;


const log = (...args) => {
    if (DEBUG) console.log('[ReMixr]', ...args);
};

const warn = (...args) => {
    if (DEBUG) console.warn('[ReMixr]', ...args);
};

const error = (...args) => {
    console.error('[ReMixr]', ...args);
};

/**
 * Sends a message to a tab with a timeout
 */
function sendMessageWithTimeout(tabId, message, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            const timeoutError = new Error(`Timeout (${timeout}ms) for action: ${message.action}`);
            warn(`sendMessageWithTimeout timed out on tab ${tabId}:`, timeoutError.message);
            reject(timeoutError);
        }, timeout);

        chrome.tabs.sendMessage(tabId, message, (response) => {
            clearTimeout(timer);
            if (chrome.runtime.lastError) {
                const runtimeError = new Error(chrome.runtime.lastError.message);
                warn(`sendMessageWithTimeout failed on tab ${tabId}:`, runtimeError.message);
                reject(runtimeError);
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * Ensures the content script is running and ready on a tab
 */
async function ensureContentScriptReady(tabId) {
    const tab = await chrome.tabs.get(tabId);
    const restrictedProtocols = ['chrome:', 'about:', 'edge:', 'view-source:', 'chrome-extension:'];
    if (restrictedProtocols.some(p => tab.url.startsWith(p))) {
        throw new Error('ReMixr cannot run on restricted browser pages. Please navigate to a standard website (e.g., https://example.com).');
    }

    const checkPing = async () => {
        try {
            const resp = await sendMessageWithTimeout(tabId, { action: 'ping' }, 500);
            return resp && resp.pong;
        } catch (e) {
            return false;
        }
    };

    if (await checkPing()) return true;

    try {
        log('Injecting ReMixr kernel into tab', tabId);
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['lib/analysis.js', 'content.js']
        });

        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 150));
            if (await checkPing()) {
                log('Handshake successful on tab', tabId);
                return true;
            }
        }
        throw new Error('Script initialization handshake failed (2.5s timeout). If this persists, please refresh the page.');
    } catch (err) {
        error('Injection Critical Failure:', err);
        if (err.message.includes('restricted')) {
            throw new Error('Security Error: Cannot inject into this page.');
        }
        throw new Error(`Activation error: ${err.message}`);
    }
}

/**
 * Shared utility helpers
 */
const CoreUtils = {
    debounce: (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    },

    throttle: (func, limit) => {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    generateId: () => 'id-' + Math.random().toString(36).substr(2, 9),

    escapeHTML: (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        }[m]));
    },

    /**
     * Deep clones an object while stripping non-serializable properties (like DOM nodes)
     * and preventing circular references.
     */
    sanitizeForTransport: (obj, seen = new WeakSet()) => {
        if (obj === null || typeof obj !== 'object') return obj;

        // Strip functions
        if (typeof obj === 'function') return '[Function]';

        // Check for circular references
        try {
            if (seen.has(obj)) return '[Circular Reference]';
        } catch (e) {
            // WeakSet might throw on non-object-like things in some edge cases
            return '[Unserializable]';
        }

        // Skip DOM nodes
        if (typeof Node !== 'undefined' && obj instanceof Node) {
            return `[DOM Node: ${obj.nodeName}]`;
        }

        // Handle Arrays
        if (Array.isArray(obj)) {
            seen.add(obj);
            return obj.map(item => CoreUtils.sanitizeForTransport(item, seen));
        }

        // Handle Objects (Plain)
        seen.add(obj);
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            // Skip private properties or very large blobs if needed
            if (key.startsWith('_')) continue;
            result[key] = CoreUtils.sanitizeForTransport(value, seen);
        }
        return result;
    }
};

/**
 * Converts RGB color to Hex
 */
function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    if (rgb.startsWith('#')) return rgb;
    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.?\d*))?\)$/);
    if (!match) return '#000000';
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Export if in a module environment or make global
if (typeof module !== 'undefined') {
    module.exports = { CoreUtils, sendMessageWithTimeout, ensureContentScriptReady, rgbToHex, log, warn, error };
} else {
    const globalScope = typeof window !== 'undefined' ? window : self;
    globalScope.CoreUtils = CoreUtils;
    globalScope.rgbToHex = rgbToHex;
    globalScope.sendMessageWithTimeout = sendMessageWithTimeout;
    globalScope.ensureContentScriptReady = ensureContentScriptReady;
    globalScope.log = log;
    globalScope.warn = warn;
    globalScope.error = error;
}
