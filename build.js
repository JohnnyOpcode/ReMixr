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

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'build');

// Files and folders to copy
const INCLUDES = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'popup.css',
    'content.js',
    'background.js',
    'export.js',
    'lib',
    'icons',
    'README.md',
    'LICENSE'
];

function cleanBuild() {
    if (fs.existsSync(BUILD_DIR)) {
        console.log('Cleaning build directory...');
        fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(BUILD_DIR);
}

function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function build() {
    console.log('Starting build...');
    cleanBuild();

    INCLUDES.forEach(item => {
        const srcPath = path.join(__dirname, item);
        const destPath = path.join(BUILD_DIR, item);

        if (fs.existsSync(srcPath)) {
            console.log(`Copying ${item}...`);
            copyRecursive(srcPath, destPath);
        } else {
            console.warn(`Warning: ${item} not found.`);
        }
    });

    console.log('Build complete! Output in /build');
}

build();
