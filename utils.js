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
 * ReMixr DOM Utilities
 * UI-dependent helper functions for the ReMixr popup.
 * Requires core-utils.js to be loaded first.
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
 * Escapes HTML characters to prevent XSS
 * @param {string} unsafe - The unsafe string
 * @returns {string} - The escaped string
 */
function escapeHTML(unsafe) {
    return CoreUtils.escapeHTML(unsafe);
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
