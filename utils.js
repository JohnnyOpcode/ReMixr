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
 * ReMixr Utility Functions
 * Common helper functions for the ReMixr extension
 */

/**
 * Displays a status message to the user
 * @param {string} message - The message to display
 * @param {string} type - 'info', 'success', or 'error'
 */
function showStatus(message, type = 'info') {
    const status = document.getElementById('status');
    if (!status) return;

    status.textContent = message;
    status.className = `status show ${type}`;

    // Clear previous timeout if exists
    if (window._statusTimeout) {
        clearTimeout(window._statusTimeout);
    }

    // Auto-hide after 3 seconds
    window._statusTimeout = setTimeout(() => {
        status.className = 'status';
        window._statusTimeout = null;
    }, 3000);
}

/**
 * Downloads content as a file
 * @param {string} content - The file content
 * @param {string} filename - The name of the file
 * @param {string} mimeType - The MIME type of the file
 */
function downloadAsFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Copies text to the clipboard with visual feedback
 * @param {string} text - The text to copy
 * @param {Function} onSuccess - Optional callback on success
 */
function copyToClipboard(text, onSuccess) {
    navigator.clipboard.writeText(text).then(() => {
        showStatus('Copied to clipboard!', 'success');
        if (onSuccess) onSuccess();
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showStatus('Failed to copy to clipboard', 'error');
    });
}

/**
 * Debounces a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttles a function call
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

/**
 * Generates a unique ID
 * @returns {string} - A random unique ID
 */
function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Escapes HTML characters to prevent XSS
 * @param {string} unsafe - The unsafe string
 * @returns {string} - The escaped string
 */
function escapeHTML(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
/**
 * Waits for an element to appear in the DOM
 * @param {string} selector - The CSS selector to wait for
 * @param {number} timeout - Maximum time to wait in ms
 * @returns {Promise<Element>} - Resolves with the element when found
 */
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            return resolve(element);
        }

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                resolve(el);
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        if (timeout) {
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for element ${selector}`));
            }, timeout);
        }
    });
}
