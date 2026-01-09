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
        const newState = request.state !== undefined ? request.state : !inspectorActive;
        toggleInspector(newState);
        sendResponse({ active: newState });
        return true;
    } else if (request.action === 'analyzePsyche') {
        try {
            const result = analyzePsychologicalPatterns();
            sendResponse(result);
        } catch (error) {
            console.error('analyzePsyche error:', error);
            sendResponse(null);
        }
        return true;
    } else if (request.action === 'analyzeArchetype') {
        try {
            const result = analyzeBrandArchetype();
            sendResponse(result);
        } catch (error) {
            console.error('analyzeArchetype error:', error);
            sendResponse(null);
        }
        return true;
    } else if (request.action === 'analyzeSoul') {
        try {
            const result = analyzeSoul();
            sendResponse(result);
        } catch (error) {
            console.error('analyzeSoul error:', error);
            sendResponse(null);
        }
        return true;
    } else if (request.action === 'analyzeShadow') {
        try {
            const result = analyzeShadow();
            sendResponse(result);
        } catch (error) {
            console.error('analyzeShadow error:', error);
            sendResponse(null);
        }
        return true;
    } else if (request.action === 'analyzeRhetoric') {
        try {
            const result = analyzeRhetoric();
            sendResponse(result);
        } catch (error) {
            console.error('analyzeRhetoric error:', error);
            sendResponse(null);
        }
        return true;
    } else if (request.action === 'analyzeEmotion') {
        try {
            const result = analyzeEmotionalDesign();
            sendResponse(result);
        } catch (error) {
            console.error('analyzeEmotion error:', error);
            sendResponse(null);
        }
        return true;
    }
});

// ============================================
// PSYCHOLOGICAL PATTERN ANALYSIS
// ============================================

function analyzePsychologicalPatterns() {
    const patterns = {
        darkPatterns: [],
        persuasionTechniques: [],
        cognitiveLoad: 0,
        attentionEngineering: [],
        urgencySignals: 0,
        socialProof: 0,
        scarcity: 0,
        authority: 0
    };

    const bodyText = document.body.innerText.toLowerCase();
    const allElements = Array.from(document.querySelectorAll('*'));

    // Dark Pattern Detection
    const darkPatternKeywords = {
        'forced-continuity': ['trial ends', 'auto-renew', 'automatic renewal', 'will be charged'],
        'confirmshaming': ['no thanks', 'no, i don\'t want', 'maybe later', 'skip this'],
        'hidden-costs': ['additional fees', 'service charge', 'processing fee', 'hidden'],
        'bait-and-switch': ['limited time', 'exclusive', 'members only', 'special offer'],
        'disguised-ads': ['sponsored', 'promoted', 'recommended for you'],
        'roach-motel': ['easy to subscribe', 'cancel anytime', 'no commitment'],
        'privacy-zuckering': ['accept all', 'agree to all', 'allow cookies']
    };

    for (const [pattern, keywords] of Object.entries(darkPatternKeywords)) {
        keywords.forEach(keyword => {
            if (bodyText.includes(keyword)) {
                patterns.darkPatterns.push({
                    type: pattern,
                    trigger: keyword,
                    severity: getSeverity(pattern)
                });
            }
        });
    }

    // Persuasion Techniques
    // Scarcity Detection
    const scarcityPatterns = ['only \\d+ left', 'limited stock', 'almost gone', 'selling fast', 'low stock', 'hurry'];
    scarcityPatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        const matches = bodyText.match(regex);
        if (matches) {
            patterns.scarcity += matches.length;
            patterns.persuasionTechniques.push({ type: 'scarcity', instances: matches.length });
        }
    });

    // Urgency Detection
    const urgencyPatterns = ['today only', 'ends soon', 'last chance', 'now or never', 'don\\'t miss', 'expires'];
    urgencyPatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        const matches = bodyText.match(regex);
        if (matches) {
            patterns.urgencySignals += matches.length;
            patterns.persuasionTechniques.push({ type: 'urgency', instances: matches.length });
        }
    });

    // Social Proof Detection
    const socialProofElements = document.querySelectorAll('[class*=\"review\"], [class*=\"rating\"], [class*=\"testimonial\"], [class*=\"customer\"]');
    patterns.socialProof = socialProofElements.length;
    if (socialProofElements.length > 0) {
        patterns.persuasionTechniques.push({ type: 'social-proof', instances: socialProofElements.length });
    }

    // Authority Detection
    const authorityKeywords = ['expert', 'certified', 'approved', 'official', 'verified', 'trusted', 'award'];
    authorityKeywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = bodyText.match(regex);
        if (matches) {
            patterns.authority += matches.length;
        }
    });
    if (patterns.authority > 0) {
        patterns.persuasionTechniques.push({ type: 'authority', instances: patterns.authority });
    }

    // Cognitive Load Analysis
    const visibleElements = allElements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
    
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [onclick], [role=\"button\"]');
    const animations = Array.from(document.styleSheets).reduce((count, sheet) => {
        try {
            const rules = Array.from(sheet.cssRules || []);
            return count + rules.filter(rule => rule.cssText && rule.cssText.includes('animation')).length;
        } catch (e) {
            return count;
        }
    }, 0);

    patterns.cognitiveLoad = Math.round(
        (visibleElements.length * 0.1) + 
        (interactiveElements.length * 2) + 
        (animations * 5) +
        (patterns.darkPatterns.length * 10)
    );

    // Attention Engineering
    const popups = document.querySelectorAll('[class*=\"modal\"], [class*=\"popup\"], [class*=\"overlay\"]');
    const autoplay = document.querySelectorAll('video[autoplay], audio[autoplay]');
    const notifications = document.querySelectorAll('[class*=\"notification\"], [class*=\"alert\"], [class*=\"banner\"]');
    
    if (popups.length > 0) patterns.attentionEngineering.push({ type: 'modals', count: popups.length });
    if (autoplay.length > 0) patterns.attentionEngineering.push({ type: 'autoplay-media', count: autoplay.length });
    if (notifications.length > 0) patterns.attentionEngineering.push({ type: 'notifications', count: notifications.length });

    return patterns;
}

function getSeverity(pattern) {
    const severityMap = {
        'forced-continuity': 'high',
        'confirmshaming': 'medium',
        'hidden-costs': 'high',
        'bait-and-switch': 'medium',
        'disguised-ads': 'low',
        'roach-motel': 'high',
        'privacy-zuckering': 'medium'
    };
    return severityMap[pattern] || 'low';
}

// ============================================
// BRAND ARCHETYPE ANALYSIS
// ============================================

function analyzeBrandArchetype() {
    const bodyText = document.body.innerText.toLowerCase();
    const archetypes = {
        innocent: 0, explorer: 0, sage: 0, hero: 0, outlaw: 0, magician: 0,
        regular: 0, lover: 0, jester: 0, caregiver: 0, creator: 0, ruler: 0
    };

    // Archetype keyword mapping
    const archetypeKeywords = {
        innocent: ['pure', 'simple', 'honest', 'trust', 'optimistic', 'happy', 'natural', 'authentic'],
        explorer: ['adventure', 'freedom', 'discover', 'explore', 'journey', 'experience', 'independent', 'pioneer'],
        sage: ['wisdom', 'knowledge', 'expert', 'truth', 'insight', 'understand', 'intelligence', 'learn'],
        hero: ['courage', 'brave', 'strong', 'power', 'achieve', 'win', 'conquer', 'champion'],
        outlaw: ['rebel', 'revolution', 'break', 'disrupt', 'challenge', 'wild', 'radical', 'liberate'],
        magician: ['transform', 'magic', 'dream', 'imagine', 'create', 'vision', 'inspire', 'wonder'],
        regular: ['friend', 'belong', 'community', 'everyday', 'reliable', 'down-to-earth', 'comfortable'],
        lover: ['passion', 'intimate', 'sensual', 'pleasure', 'indulge', 'desire', 'romance', 'beautiful'],
        jester: ['fun', 'enjoy', 'play', 'laugh', 'humor', 'entertaining', 'lighthearted', 'spontaneous'],
        caregiver: ['care', 'nurture', 'protect', 'compassion', 'support', 'help', 'service', 'generous'],
        creator: ['innovate', 'design', 'craft', 'build', 'artistic', 'original', 'express', 'unique'],
        ruler: ['leader', 'control', 'power', 'prestige', 'exclusive', 'premium', 'luxury', 'sophisticated']
    };

    // Score each archetype
    for (const [archetype, keywords] of Object.entries(archetypeKeywords)) {
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
            const matches = bodyText.match(regex);
            if (matches) archetypes[archetype] += matches.length;
        });
    }

    // Color psychology analysis
    const dominantColors = extractDominantColors();
    const colorArchetypes = analyzeColorArchetype(dominantColors);
    
    // Combine scores
    for (const [archetype, score] of Object.entries(colorArchetypes)) {
        archetypes[archetype] += score;
    }

    // Get top 3 archetypes
    const sorted = Object.entries(archetypes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    return {
        primary: sorted[0] ? { type: sorted[0][0], score: sorted[0][1] } : null,
        secondary: sorted[1] ? { type: sorted[1][0], score: sorted[1][1] } : null,
        tertiary: sorted[2] ? { type: sorted[2][0], score: sorted[2][1] } : null,
        allScores: archetypes,
        dominantColors: dominantColors,
        personality: determinePersonality(sorted)
    };
}

function extractDominantColors() {
    const elements = Array.from(document.querySelectorAll('*')).slice(0, 200);
    const colors = { backgrounds: {}, text: {} };

    elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;

        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            colors.backgrounds[bg] = (colors.backgrounds[bg] || 0) + 1;
        }
        if (color) {
            colors.text[color] = (colors.text[color] || 0) + 1;
        }
    });

    const topBg = Object.entries(colors.backgrounds).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topText = Object.entries(colors.text).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { backgrounds: topBg, text: topText };
}

function analyzeColorArchetype(colors) {
    const scores = {
        innocent: 0, explorer: 0, sage: 0, hero: 0, outlaw: 0, magician: 0,
        regular: 0, lover: 0, jester: 0, caregiver: 0, creator: 0, ruler: 0
    };

    // Simplified color to archetype mapping
    colors.backgrounds.forEach(([color]) => {
        if (color.includes('255, 255, 255') || color.includes('white')) scores.innocent += 5;
        if (color.includes('0, 0, 0') || color.includes('black')) scores.ruler += 5;
        if (color.match(/rgb.*255.*0.*0/)) scores.hero += 5; // Red
        if (color.match(/rgb.*0.*0.*255/)) scores.sage += 5; // Blue
        if (color.match(/rgb.*0.*255.*0/)) scores.caregiver += 5; // Green
        if (color.match(/rgb.*255.*192.*203/)) scores.lover += 5; // Pink
        if (color.match(/rgb.*255.*255.*0/)) scores.jester += 5; // Yellow
        if (color.match(/rgb.*128.*0.*128/)) scores.magician += 5; // Purple
    });

    return scores;
}

function determinePersonality(topArchetypes) {
    const descriptions = {
        innocent: 'Pure, optimistic, seeking simplicity and happiness',
        explorer: 'Adventurous, independent, seeking freedom and discovery',
        sage: 'Knowledgeable, thoughtful, seeking truth and wisdom',
        hero: 'Courageous, bold, seeking to prove worth through achievement',
        outlaw: 'Revolutionary, disruptive, challenging the status quo',
        magician: 'Transformative, visionary, turning dreams into reality',
        regular: 'Relatable, down-to-earth, seeking connection and belonging',
        lover: 'Passionate, intimate, seeking pleasure and connection',
        jester: 'Playful, entertaining, bringing joy and spontaneity',
        caregiver: 'Nurturing, compassionate, protecting and caring for others',
        creator: 'Innovative, artistic, expressing imagination and originality',
        ruler: 'Authoritative, prestigious, seeking control and leadership'
    };

    if (topArchetypes[0]) {
        return descriptions[topArchetypes[0][0]] || 'Undefined personality';
    }
    return 'Undefined personality';
}

// ============================================
// SOUL ANALYSIS
// ============================================

function analyzeSoul() {
    const soul = {
        authenticity: 0,
        intention: '',
        coherence: 0,
        trustSignals: 0,
        corporateness: 0,
        humanCentered: 0,
        transparencyScore: 0,
        purpose: ''
    };

    const bodyText = document.body.innerText.toLowerCase();
    
    // Authenticity detection
    const authenticityKeywords = ['we', 'our story', 'our mission', 'founded', 'believe', 'values', 'about us'];
    const corporateJargon = ['synergy', 'leverage', 'paradigm', 'ecosystem', 'disruptive', 'optimize', 'stakeholder'];
    
    authenticityKeywords.forEach(keyword => {
        if (bodyText.includes(keyword)) soul.authenticity += 10;
    });
    
    corporateJargon.forEach(keyword => {
        if (bodyText.includes(keyword)) {
            soul.corporateness += 10;
            soul.authenticity -= 5;
        }
    });

    // Trust signals
    const trustElements = document.querySelectorAll('[class*=\"secure\"], [class*=\"verified\"], [class*=\"guarantee\"], [class*=\"trust\"]');
    soul.trustSignals = trustElements.length;

    // Transparency
    const transparencyElements = document.querySelectorAll('a[href*=\"privacy\"], a[href*=\"terms\"], a[href*=\"about\"]');
    soul.transparencyScore = Math.min(transparencyElements.length * 20, 100);

    // Human-centered vs corporate
    const humanWords = bodyText.match(/\\b(you|your|people|community|together|help|care)\\b/g) || [];
    const corporateWords = bodyText.match(/\\b(company|business|enterprise|corporation|organization|firm)\\b/g) || [];
    
    soul.humanCentered = humanWords.length;
    soul.corporateness += corporateWords.length;

    // Determine intention
    if (bodyText.includes('buy') || bodyText.includes('purchase') || bodyText.includes('shop')) {
        soul.intention = 'Commercial';
    } else if (bodyText.includes('learn') || bodyText.includes('read') || bodyText.includes('discover')) {
        soul.intention = 'Educational';
    } else if (bodyText.includes('connect') || bodyText.includes('share') || bodyText.includes('community')) {
        soul.intention = 'Social';
    } else {
        soul.intention = 'Informational';
    }

    // Coherence - do visual and textual elements align?
    soul.coherence = Math.max(0, 100 - (soul.corporateness - soul.humanCentered));

    // Purpose detection
    const title = document.title.toLowerCase();
    const h1 = document.querySelector('h1')?.innerText.toLowerCase() || '';
    
    if (title.includes('blog') || h1.includes('blog')) soul.purpose = 'Content & Publishing';
    else if (title.includes('shop') || h1.includes('shop')) soul.purpose = 'E-commerce';
    else if (title.includes('learn') || h1.includes('course')) soul.purpose = 'Education';
    else if (title.includes('app') || h1.includes('software')) soul.purpose = 'Software/SaaS';
    else soul.purpose = 'General Website';

    return soul;
}

// ============================================
// SHADOW ANALYSIS (Hidden Manipulations)
// ============================================

function analyzeShadow() {
    const shadow = {
        hiddenElements: [],
        invisibleTrackers: 0,
        a11yViolations: 0,
        deceptivePatterns: [],
        hiddenCosts: false,
        dataCollection: [],
        manipulativeDesign: []
    };

    // Hidden elements
    const allElements = Array.from(document.querySelectorAll('*'));
    allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        if ((style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') && 
            (el.innerText.includes('price') || el.innerText.includes('fee') || el.innerText.includes('charge'))) {
            shadow.hiddenElements.push({
                tag: el.tagName,
                text: el.innerText.substring(0, 50)
            });
            shadow.hiddenCosts = true;
        }
    });

    // Invisible trackers
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const trackers = ['analytics', 'tracking', 'pixel', 'tag', 'gtag', 'fbq', 'ga'];
    shadow.invisibleTrackers = scripts.filter(script => 
        trackers.some(tracker => script.src.includes(tracker))
    ).length;

    // Data collection indicators
    const inputs = Array.from(document.querySelectorAll('input'));
    inputs.forEach(input => {
        if (input.type === 'email' || input.type === 'tel' || input.name.includes('phone')) {
            shadow.dataCollection.push(input.type || input.name);
        }
    });

    // Accessibility violations (shadow in terms of excluding users)
    const images = Array.from(document.querySelectorAll('img'));
    shadow.a11yViolations = images.filter(img => !img.alt || img.alt.trim() === '').length;

    // Manipulative design patterns
    const bodyText = document.body.innerText.toLowerCase();
    if (bodyText.includes('no thanks') || bodyText.includes('maybe later')) {
        shadow.manipulativeDesign.push('Confirmshaming');
    }
    if (bodyText.includes('other people are viewing') || bodyText.includes('people bought')) {
        shadow.manipulativeDesign.push('Fake Social Proof');
    }
    if (bodyText.includes('limited time') && bodyText.includes('only')) {
        shadow.manipulativeDesign.push('Artificial Scarcity');
    }

    // Deceptive patterns
    const buttons = Array.from(document.querySelectorAll('button'));
    buttons.forEach(btn => {
        const text = btn.innerText.toLowerCase();
        if (text.includes('accept all') || text.includes('agree to all')) {
            shadow.deceptivePatterns.push({ type: 'Privacy Zuckering', element: 'button' });
        }
        if (text.includes('maybe later') || text.includes('no thanks')) {
            shadow.deceptivePatterns.push({ type: 'Confirmshaming', element: 'button' });
        }
    });

    return shadow;
}

// ============================================
// RHETORICAL ANALYSIS
// ============================================

function analyzeRhetoric() {
    const bodyText = document.body.innerText;
    const rhetoric = {
        tone: '',
        readingLevel: 0,
        persuasiveTechniques: [],
        emotionalWords: 0,
        imperatives: 0,
        questions: 0,
        metaphors: [],
        wordCount: 0,
        avgSentenceLength: 0,
        rhetoricalDevices: []
    };

    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = bodyText.split(/\\s+/).filter(w => w.length > 0);
    
    rhetoric.wordCount = words.length;
    rhetoric.avgSentenceLength = words.length / Math.max(sentences.length, 1);

    // Tone detection
    const positiveWords = words.filter(w => 
        ['great', 'amazing', 'wonderful', 'excellent', 'best', 'love', 'perfect', 'happy'].includes(w.toLowerCase())
    ).length;
    const negativeWords = words.filter(w => 
        ['bad', 'worst', 'terrible', 'hate', 'problem', 'issue', 'difficult', 'hard'].includes(w.toLowerCase())
    ).length;
    
    if (positiveWords > negativeWords * 2) rhetoric.tone = 'Highly Positive';
    else if (positiveWords > negativeWords) rhetoric.tone = 'Positive';
    else if (negativeWords > positiveWords) rhetoric.tone = 'Negative';
    else rhetoric.tone = 'Neutral';

    // Imperatives (commands)
    const imperativeVerbs = ['buy', 'get', 'try', 'start', 'join', 'sign', 'click', 'download', 'learn', 'discover'];
    rhetoric.imperatives = imperativeVerbs.reduce((count, verb) => {
        const regex = new RegExp(`\\b${verb}\\b`, 'gi');
        return count + (bodyText.match(regex) || []).length;
    }, 0);

    // Questions
    rhetoric.questions = (bodyText.match(/\\?/g) || []).length;

    // Emotional words
    const emotionalKeywords = ['love', 'hate', 'fear', 'joy', 'sad', 'angry', 'excited', 'worried', 'happy', 'anxious'];
    rhetoric.emotionalWords = emotionalKeywords.reduce((count, word) => {
        const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
        return count + (bodyText.match(regex) || []).length;
    }, 0);

    // Rhetorical devices
    if (bodyText.toLowerCase().includes('imagine if')) rhetoric.rhetoricalDevices.push('Hypothetical');
    if ((bodyText.match(/\\bwe\\b/gi) || []).length > 10) rhetoric.rhetoricalDevices.push('Inclusive Language');
    if ((bodyText.match(/\\byou\\b/gi) || []).length > 20) rhetoric.rhetoricalDevices.push('Direct Address');
    if ((bodyText.match(/\\d+%|\\d+ times/gi) || []).length > 3) rhetoric.rhetoricalDevices.push('Statistics/Numbers');
    
    // Reading level (simplified Flesch formula)
    const syllables = estimateSyllables(bodyText);
    rhetoric.readingLevel = Math.max(0, Math.round(
        206.835 - 1.015 * (words.length / Math.max(sentences.length, 1)) - 84.6 * (syllables / Math.max(words.length, 1))
    ));

    return rhetoric;
}

function estimateSyllables(text) {
    // Simplified syllable estimation
    const words = text.toLowerCase().match(/\\b[a-z]+\\b/g) || [];
    return words.reduce((count, word) => {
        return count + Math.max(1, word.match(/[aeiouy]+/g)?.length || 1);
    }, 0);
}

// ============================================
// EMOTIONAL DESIGN ANALYSIS
// ============================================

function analyzeEmotionalDesign() {
    const emotion = {
        colorPsychology: {},
        spacingAnalysis: {},
        typographyMood: '',
        visualWeight: '',
        emotionalIntent: '',
        designPersonality: []
    };

    // Color Psychology
    const colors = extractDominantColors();
    emotion.colorPsychology = analyzeColorEmotions(colors);

    // Spacing analysis
    const body = document.body;
    const bodyStyle = window.getComputedStyle(body);
    const containers = Array.from(document.querySelectorAll('div, section, article')).slice(0, 50);
    
    let totalPadding = 0;
    let totalMargin = 0;
    containers.forEach(el => {
        const style = window.getComputedStyle(el);
        totalPadding += parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        totalMargin += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    });

    const avgPadding = totalPadding / containers.length;
    const avgMargin = totalMargin / containers.length;

    emotion.spacingAnalysis = {
        avgPadding: Math.round(avgPadding),
        avgMargin: Math.round(avgMargin),
        feeling: avgPadding > 40 ? 'Spacious & Calm' : avgPadding > 20 ? 'Balanced' : 'Dense & Urgent'
    };

    // Typography mood
    const headings = document.querySelectorAll('h1, h2, h3');
    if (headings.length > 0) {
        const h1Style = window.getComputedStyle(headings[0]);
        const fontFamily = h1Style.fontFamily.toLowerCase();
        const fontWeight = parseInt(h1Style.fontWeight);
        const fontSize = parseFloat(h1Style.fontSize);

        if (fontFamily.includes('serif')) {
            emotion.typographyMood = 'Traditional & Trustworthy';
        } else if (fontFamily.includes('mono')) {
            emotion.typographyMood = 'Technical & Modern';
        } else if (fontWeight >= 700) {
            emotion.typographyMood = 'Bold & Confident';
        } else if (fontWeight <= 300) {
            emotion.typographyMood = 'Elegant & Refined';
        } else {
            emotion.typographyMood = 'Clean & Professional';
        }
    }

    // Visual weight
    const images = document.querySelectorAll('img').length;
    const text = document.body.innerText.length;
    const ratio = images / Math.max(text / 1000, 1);

    if (ratio > 0.5) emotion.visualWeight = 'Image-Heavy (Visual-First)';
    else if (ratio > 0.2) emotion.visualWeight = 'Balanced (Visual-Text Mix)';
    else emotion.visualWeight = 'Text-Heavy (Content-First)';

    // Design personality traits
    if (avgPadding > 40) emotion.designPersonality.push('Minimalist');
    if (images > 20) emotion.designPersonality.push('Visual');
    if (document.querySelectorAll('button, a').length > 50) emotion.designPersonality.push('Interactive');
    if (avgMargin < 10) emotion.designPersonality.push('Dense');
    
    // Emotional intent
    const buttons = Array.from(document.querySelectorAll('button, .btn, [role=\"button\"]'));
    const ctaText = buttons.map(b => b.innerText.toLowerCase()).join(' ');
    
    if (ctaText.includes('buy') || ctaText.includes('shop')) emotion.emotionalIntent = 'Conversion-Focused';
    else if (ctaText.includes('learn') || ctaText.includes('explore')) emotion.emotionalIntent = 'Discovery-Focused';
    else if (ctaText.includes('join') || ctaText.includes('sign up')) emotion.emotionalIntent = 'Community-Focused';
    else emotion.emotionalIntent = 'Information-Focused';

    return emotion;
}

function analyzeColorEmotions(colors) {
    const emotions = {};
    
    const colorEmotionMap = {
        red: 'Passion, Urgency, Energy',
        blue: 'Trust, Calm, Professional',
        green: 'Growth, Health, Harmony',
        yellow: 'Optimism, Warmth, Attention',
        purple: 'Luxury, Creativity, Wisdom',
        orange: 'Enthusiasm, Confidence, Friendly',
        black: 'Sophistication, Power, Elegance',
        white: 'Purity, Simplicity, Cleanliness',
        gray: 'Neutral, Professional, Balanced'
    };

    // Simplified color detection
    colors.backgrounds.forEach(([color]) => {
        if (color.match(/rgb\\(2[45]\\d|255/)) { // High red
            emotions['red'] = colorEmotionMap.red;
        }
        if (color.match(/rgb\\(\\d+,\\s*\\d+,\\s*2[45]\\d|255/)) { // High blue
            emotions['blue'] = colorEmotionMap.blue;
        }
        if (color.includes('0, 0, 0') || color.includes('black')) {
            emotions['black'] = colorEmotionMap.black;
        }
        if (color.includes('255, 255, 255') || color.includes('white')) {
            emotions['white'] = colorEmotionMap.white;
        }
    });

    return Object.keys(emotions).length > 0 ? emotions : { neutral: 'Undefined color emotion' };
}

