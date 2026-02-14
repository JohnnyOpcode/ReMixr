/*
 * Copyright 2026 John Kost
 * Licensed under the Apache License, Version 2.0
 */

/**
 * ReMixr Inspector Kernels
 * Light-weight analysis functions meant for one-off injection or message-based execution.
 */

const InspectorKernels = {
    analyzeStructure: () => {
        const nodes = [];
        const collect = (root) => {
            const all = root.querySelectorAll('*');
            all.forEach(el => {
                nodes.push(el);
                if (el.shadowRoot) collect(el.shadowRoot);
            });
        };
        collect(document);
        const depth = (n) => n.parentNode ? depth(n.parentNode) + 1 : (n.host ? depth(n.host) + 1 : 0);
        let maxDepth = 0;
        nodes.forEach(el => maxDepth = Math.max(maxDepth, depth(el)));
        const tags = {};
        nodes.forEach(el => {
            const tag = el.tagName.toLowerCase();
            tags[tag] = (tags[tag] || 0) + 1;
        });
        const sortedTags = Object.entries(tags).sort((a, b) => b[1] - a[1]);
        return {
            totalElements: nodes.length,
            maxDepth,
            topTags: sortedTags,
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content || 'None'
        };
    },

    analyzePalette: () => {
        const all = document.querySelectorAll('*');
        const colors = {};
        const backgrounds = {};
        all.forEach(el => {
            const style = window.getComputedStyle(el);
            const color = style.color;
            const bg = style.backgroundColor;
            if (color && color !== 'rgba(0, 0, 0, 0)') colors[color] = (colors[color] || 0) + 1;
            if (bg && bg !== 'rgba(0, 0, 0, 0)') backgrounds[bg] = (backgrounds[bg] || 0) + 1;
        });
        const process = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);
        return { text: process(colors), backgrounds: process(backgrounds) };
    },

    analyzeAssets: () => {
        const imageElements = Array.from(document.querySelectorAll('img'));
        const images = imageElements.map(img => ({
            src: img.src,
            width: img.naturalWidth || img.clientWidth,
            height: img.naturalHeight || img.clientHeight,
            alt: img.alt || 'No alt text',
            type: img.src.split('.').pop().split(/[?#]/)[0].toUpperCase() || 'IMG',
            broken: img.naturalWidth === 0 && img.src !== ''
        })).filter(img => img.src);
        const svgs = document.querySelectorAll('svg').length;
        const bgImages = [];
        document.querySelectorAll('*').forEach(el => {
            const bg = window.getComputedStyle(el).backgroundImage;
            if (bg && bg !== 'none' && bg.includes('url')) {
                const url = bg.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
                if (url) bgImages.push(url);
            }
        });
        return { images, svgs, bgImages: [...new Set(bgImages)], imageCount: images.length };
    },

    analyzeFonts: () => {
        const fonts = {};
        document.querySelectorAll('*').forEach(el => {
            const font = window.getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g, '');
            if (font) fonts[font] = (fonts[font] || 0) + 1;
        });
        return Object.entries(fonts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([f, c]) => ({ font: f, count: c }));
    },

    analyzeStorage: () => {
        const getStorageSize = (storage) => {
            let t = 0;
            for (let x in storage) t += (storage[x].length + x.length) * 2;
            return (t / 1024).toFixed(2);
        };
        return {
            lsCount: localStorage.length,
            lsSize: getStorageSize(localStorage),
            ssCount: sessionStorage.length,
            ssSize: getStorageSize(sessionStorage),
            cookies: document.cookie.split(';').filter(c => c.trim()).length
        };
    },

    analyzePerf: () => {
        const perf = window.performance;
        const nav = perf.getEntriesByType('navigation')[0] || {};
        return {
            loadTime: (nav.loadEventEnd - nav.startTime).toFixed(0),
            domReady: (nav.domContentLoadedEventEnd - nav.startTime).toFixed(0)
        };
    },

    analyzeStack: () => {
        const stack = [];
        if (window.React || document.querySelector('[data-reactroot], [id^="react-"]')) stack.push('React');
        if (window.Vue || document.querySelector('[data-v-]')) stack.push('Vue');
        if (window.angular || document.querySelector('.ng-binding, [ng-app], [data-ng-app]')) stack.push('Angular');
        if (window.jQuery || window.$) stack.push('jQuery');
        if (window.next) stack.push('Next.js');
        return stack.length ? stack : ['Unknown / Custom'];
    },

    analyzeDomTree: () => {
        const traverse = (node, depth = 0) => {
            if (depth > 4) return null;
            if (node.nodeType !== 1) return null;
            const tag = node.tagName.toLowerCase();
            if (['script', 'style', 'svg'].includes(tag)) return null;
            const children = [];
            node.childNodes.forEach(child => {
                const c = traverse(child, depth + 1);
                if (c) children.push(c);
            });
            return {
                name: tag,
                id: node.id || '',
                class: node.getAttribute('class')?.split(' ')[0] || '',
                children: children.length ? children : null
            };
        };
        return traverse(document.body);
    },

    analyzeA11y: () => {
        const images = Array.from(document.querySelectorAll('img'));
        const missingAlt = images.filter(img => !img.alt).length;
        const buttons = document.querySelectorAll('button, [role="button"]').length;
        return { images: { total: images.length, missingAlt }, buttons };
    },

    analyzeSEO: () => {
        const headings = {};
        ['H1', 'H2', 'H3'].forEach(h => { headings[h] = document.querySelectorAll(h).length; });
        return { title: document.title, headings };
    },

    analyzeSequence: () => {
        const actions = [];
        document.querySelectorAll('button, a, input[type="submit"]').forEach(el => {
            const isCta = el.innerText.match(/buy|get|start|sign|join|apply/i);
            if (isCta || el.tagName === 'BUTTON') {
                actions.push({
                    type: el.tagName.toLowerCase(),
                    text: el.innerText.trim().slice(0, 30),
                    importance: isCta ? 'high' : 'medium'
                });
            }
        });
        const forms = Array.from(document.querySelectorAll('form')).map(f => ({
            id: f.id,
            action: f.action,
            inputs: f.querySelectorAll('input').length
        }));
        return { actions: actions.slice(0, 10), forms };
    }
};

window.InspectorKernels = InspectorKernels;
