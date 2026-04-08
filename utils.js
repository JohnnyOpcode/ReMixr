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
    const container = document.getElementById('toast-container');
    if (!container) return;

    const TOAST_ICONS = { info: 'ℹ️', success: '✓', error: '✗' };

    // Create new toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconEl = document.createElement('span');
    iconEl.className = 'toast-icon';
    iconEl.textContent = TOAST_ICONS[type] || 'ℹ️';

    const textEl = document.createElement('span');
    textEl.className = 'toast-text';
    textEl.textContent = message;

    toast.appendChild(iconEl);
    toast.appendChild(textEl);

    // Append to container
    container.appendChild(toast);

    // Trigger animation frame for CSS transition
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('removing');

        // Wait for removal animation to complete before destroying DOM node
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300); // matches CSS transition duration
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

