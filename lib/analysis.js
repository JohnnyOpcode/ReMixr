// DEEP STRATEGIC INTROSPECTION (THE "HARD" STUFF)
// ============================================

function analyzeStrategicArchitecture() {
    const strategy = {
        neurodynamicFlow: analyzeNeurodynamics(),
        linguisticAnchors: analyzeLinguisticAnchors(),
        interactionFriction: analyzeInteractionFriction(),
        cognitiveBurden: calculateCognitiveBurden(),
        conversionArchitecture: analyzeConversionArchitecture(),
        designSystem: analyzeDesignSystem(),
        visualTension: analyzeVisualTension(),
        competitorWeaknesses: scanCompetitorWeaknesses(),
        remixOpportunities: []
    };

    // Identify Remix Opportunities (The "What If")

    // 1. Cognitive Load Opportunity
    if (strategy.cognitiveBurden > 70) {
        strategy.remixOpportunities.push({
            type: 'Simplification',
            target: 'Information Architecture',
            rationale: `Cognitive Load is critical (${strategy.cognitiveBurden}/100). Users are drowning in options.`,
            action: 'Slash navigation links by 40% and increase whitespace.'
        });
    }

    // 2. Friction Opportunity
    if (strategy.conversionArchitecture.frictionScore > 50) {
        strategy.remixOpportunities.push({
            type: 'Friction Removal',
            target: 'Conversion Funnel',
            rationale: 'Hidden costs or deceptive patterns are creating "Shadow Friction". Trust is eroding.',
            action: 'Remove "confirmshaming" patterns and transparently price items upfront.'
        });
    }

    // 3. Visual Tension Opportunity
    if (strategy.visualTension.balance === 'Unbalanced') {
        strategy.remixOpportunities.push({
            type: 'Rebalancing',
            target: 'Visual Hierarchy',
            rationale: `Layout is heavily ${strategy.visualTension.dominance}-dominant. The eye is getting stuck.`,
            action: 'Introduce a counter-weight element (image or bold typography) on the opposing side.'
        });
    }

    // 4. Design System Opportunity
    if (strategy.designSystem.detected === 'Bootstrap' || strategy.designSystem.detected === 'Tailwind') {
        strategy.remixOpportunities.push({
            type: 'Brand Differentiation',
            target: 'UI Framework',
            rationale: `Site feels generic due to standard ${strategy.designSystem.detected} tokens.`,
            action: 'remix: Override default boarder-radii and inject a custom display typeface to break the "template" feel.'
        });
    } else if (strategy.designSystem.detected === 'Chaos') {
        strategy.remixOpportunities.push({
            type: 'Systematization',
            target: 'Global Styles',
            rationale: 'Inconsistent spacing and color usage detected. No clear system.',
            action: 'remix: Define a strict 8pt spacing grid and consolidate the 20+ detected colors into a cohesive palette.'
        });
    }

    return strategy;
}

function analyzeDesignSystem() {
    const classes = Array.from(document.querySelectorAll('*')).map(el => el.className).join(' ');
    const computed = window.getComputedStyle(document.body);

    let system = 'Custom/Unknown';
    if (classes.includes('btn-primary') || classes.includes('container-fluid')) system = 'Bootstrap';
    if (classes.includes('text-xl') || classes.includes('p-4') || classes.includes('flex-row')) system = 'Tailwind';
    if (classes.includes('MuiButton')) system = 'Material UI';
    if (classes.includes('css-') && (classes.includes('chakra-') || classes.includes('emotion-'))) system = 'Chakra UI / Emotion';
    if (classes.includes('is-primary') && classes.includes('columns')) system = 'Bulma';
    if (classes.includes('ant-')) system = 'Ant Design';

    // Check for Chaos (too many font sizes or colors)
    const elements = Array.from(document.querySelectorAll('*')).slice(0, 100);
    const fontSizes = new Set(elements.map(el => window.getComputedStyle(el).fontSize));
    const colors = new Set(elements.map(el => window.getComputedStyle(el).color));

    if (system === 'Custom/Unknown' && (fontSizes.size > 20 || colors.size > 25)) system = 'Chaos';

    return {
        detected: system,
        cohesionScore: system === 'Chaos' ? 20 : (system === 'Custom/Unknown' ? 60 : 90),
        tokens: {
            fontSizes: fontSizes.size,
            colors: colors.size
        }
    };
}

function analyzeVisualTension() {
    const leftSide = document.querySelectorAll('*').length / 2; // Rough heuristic
    // Better heuristic: Center of gravity
    let leftWeight = 0;
    let rightWeight = 0;
    const width = window.innerWidth;

    const elements = document.querySelectorAll('img, h1, h2, button');
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const center = rect.left + (rect.width / 2);
        const weight = (rect.width * rect.height); // Area as weight
        if (center < width / 2) leftWeight += weight;
        else rightWeight += weight;
    });

    let balance = 'Balanced';
    let dominance = 'Center';

    if (leftWeight > rightWeight * 1.5) {
        balance = 'Unbalanced';
        dominance = 'Left';
    } else if (rightWeight > leftWeight * 1.5) {
        balance = 'Unbalanced';
        dominance = 'Right';
    }

    return { balance, dominance, leftWeight, rightWeight };
}

function scanCompetitorWeaknesses() {
    const weaknesses = [];

    if (document.querySelectorAll('h1').length === 0) weaknesses.push('No H1 Tag (SEO Weakness)');
    if (document.querySelectorAll('h1').length > 1) weaknesses.push('Multiple H1 Tags (SEO Warning)');
    if (document.querySelectorAll('meta[name="description"]').length === 0) weaknesses.push('Missing Meta Description');

    // Check load time markers (navigation timing)
    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry && navEntry.domInteractive > 2000) weaknesses.push('Slow DOM Interactive (>2s)');

    // Missing ALTs
    const missingAlt = Array.from(document.querySelectorAll('img')).filter(img => !img.alt).length;
    if (missingAlt > 0) weaknesses.push(`${missingAlt} images missing ALT text (A11y/SEO Weakness)`);

    // Insecure Content
    if (window.location.protocol === 'http:') {
        weaknesses.push('Non-HTTPS connection (Security/Trust Weakness)');
    }

    // Heavy DOM
    if (document.querySelectorAll('*').length > 1500) {
        weaknesses.push('High DOM Complexity (>1500 nodes)');
    }

    return weaknesses;
}

function analyzeNeurodynamics() {
    const layout = {
        pattern: 'Z-Pattern (Standard)',
        fittsLawCompliance: 0,
        visualHierarchyScore: 0,
        eyeTrackEstimation: []
    };

    // Fitts's Law Estimation (Target size vs distance)
    const ctas = document.querySelectorAll('button, .btn, [role="button"]');
    let avgSize = 0;
    ctas.forEach(cta => {
        const rect = cta.getBoundingClientRect();
        avgSize += (rect.width * rect.height);
    });
    layout.fittsLawCompliance = Math.min(100, Math.round((avgSize / Math.max(ctas.length, 1)) / 100));

    // Visual Hierarchy (Size contrast between H1, H2, and body)
    const h1 = document.querySelector('h1');
    const body = document.body;
    if (h1 && body) {
        const h1Size = parseFloat(window.getComputedStyle(h1).fontSize);
        const bodySize = parseFloat(window.getComputedStyle(body).fontSize);
        layout.visualHierarchyScore = Math.round((h1Size / bodySize) * 20);
    }

    // Eye Tracking Estimation (Predictive)
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Z-Pattern nodes: Top-left, Top-right, Center-left, Bottom-right
    layout.eyeTrackEstimation = [
        { x: width * 0.1, y: height * 0.1, importance: 'Primary Hook' },
        { x: width * 0.9, y: height * 0.1, importance: 'Header Action' },
        { x: width * 0.5, y: height * 0.5, importance: 'Content Center' },
        { x: width * 0.9, y: height * 0.9, importance: 'Final CTA' }
    ];

    return layout;
}

function analyzeLinguisticAnchors() {
    const anchors = {
        authorityAnchors: 0,
        lossAversion: 0,
        scarcityDrivers: 0,
        anchoringQuotes: 0,
        sentiment: 'Neutral'
    };

    const text = document.body.innerText.toLowerCase();

    // Anchoring Search
    const lossWords = ['don\'t miss', 'lose', 'wasted', 'gone', 'expired', 'last chance'];
    lossWords.forEach(word => {
        if (text.includes(word)) anchors.lossAversion++;
    });

    const authorityWords = ['guaranteed', 'certified', 'official', 'exclusive', 'verified'];
    authorityWords.forEach(word => {
        if (text.includes(word)) anchors.authorityAnchors++;
    });

    return anchors;
}

function analyzeInteractionFriction() {
    const friction = {
        formComplexity: 0,
        navigationDepth: 0,
        exitIntentLikelihood: 'Low',
        score: 0
    };

    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        friction.formComplexity += form.querySelectorAll('input, select, textarea').length;
    });

    const navs = document.querySelectorAll('nav a').length;
    friction.navigationDepth = navs > 20 ? 'High' : 'Optimal';

    friction.score = Math.min(100, (friction.formComplexity * 5) + (navs * 2));

    return friction;
}

function calculateCognitiveBurden() {
    const allElements = document.querySelectorAll('*');
    const elements = allElements.length;
    const colors = new Set(Array.from(allElements).slice(0, 100).map(el => window.getComputedStyle(el).color)).size;
    const fonts = new Set(Array.from(allElements).slice(0, 50).map(el => window.getComputedStyle(el).fontFamily)).size;
    const inputs = document.querySelectorAll('input, select, textarea').length;

    // Detect active animations
    const animations = document.querySelectorAll('*').length - Array.from(document.querySelectorAll('*')).filter(el => window.getComputedStyle(el).animationName === 'none').length;

    let burden = (elements / 150) + (colors * 3) + (fonts * 8) + (inputs * 5) + (animations * 10);

    // Density factor
    const density = elements / (window.innerWidth * window.innerHeight / 10000); // elements per 100x100 block
    if (density > 10) burden += 15;

    return Math.min(100, Math.round(burden));
}

function analyzeConversionArchitecture() {
    const conv = {
        ctaClarity: 'Medium',
        frictionScore: 0,
        deceptiveTriggers: 0
    };

    const ctas = document.querySelectorAll('button, .btn');
    ctas.forEach(cta => {
        const text = cta.innerText.toLowerCase();
        if (text.includes('buy') || text.includes('get') || text.includes('start')) {
            conv.ctaClarity = 'High';
        }
    });

    return conv;
}

function visualizeStrategicMapping() {
    // Clear existing strategic overlays
    const existing = document.querySelectorAll('.remixr-strategic-marker');
    existing.forEach(e => e.remove());

    // Highlight conversion drivers
    document.querySelectorAll('button, .btn').forEach(el => {
        addStrategicMarker(el, 'Conversion Anchor', '#4ade80');
    });

    // Highlight Scarcity/Panic drivers
    const bodyText = document.body.innerText.toLowerCase();
    const scarcityPatterns = ['limited', 'only', 'ends'];
    document.querySelectorAll('span, p, h1, h2, h3').forEach(el => {
        if (scarcityPatterns.some(p => el.innerText.toLowerCase().includes(p))) {
            addStrategicMarker(el, 'Scarcity Bias', '#f87171');
        }
    });

    // Highlight data collection
    document.querySelectorAll('input').forEach(el => {
        addStrategicMarker(el, 'Data Harvest', '#60a5fa');
    });
}

function addStrategicMarker(el, label, color) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const marker = document.createElement('div');
    marker.className = 'remixr-strategic-marker';
    marker.style.cssText = `
        position: absolute;
        top: ${rect.top + window.scrollY}px;
        left: ${rect.left + window.scrollX}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px dashed ${color};
        background: ${color}11;
        z-index: 999998;
        pointer-events: none;
        transition: all 0.3s;
    `;

    const labelTag = document.createElement('div');
    labelTag.style.cssText = `
        position: absolute;
        top: -20px;
        left: 0;
        background: ${color};
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: bold;
        border-radius: 4px;
        white-space: nowrap;
    `;
    labelTag.textContent = label;
    marker.appendChild(labelTag);

    document.body.appendChild(marker);
}

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
    const urgencyPatterns = ['today only', 'ends soon', 'last chance', 'now or never', 'don\'t miss', 'expires'];
    urgencyPatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        const matches = bodyText.match(regex);
        if (matches) {
            patterns.urgencySignals += matches.length;
            patterns.persuasionTechniques.push({ type: 'urgency', instances: matches.length });
        }
    });

    // Social Proof Detection
    const socialProofElements = document.querySelectorAll('[class*="review"], [class*="rating"], [class*="testimonial"], [class*="customer"]');
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

    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [onclick], [role="button"]');
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
    const popups = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"]');
    const autoplay = document.querySelectorAll('video[autoplay], audio[autoplay]');
    const notifications = document.querySelectorAll('[class*="notification"], [class*="alert"], [class*="banner"]');

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
    const trustElements = document.querySelectorAll('[class*="secure"], [class*="verified"], [class*="guarantee"], [class*="trust"]');
    soul.trustSignals = trustElements.length;

    // Transparency
    const transparencyElements = document.querySelectorAll('a[href*="privacy"], a[href*="terms"], a[href*="about"]');
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
    const buttons = Array.from(document.querySelectorAll('button, .btn, [role="button"]'));
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
        if (color.match(/rgb\(2[45]\d|255/)) emotions['red'] = colorEmotionMap.red;
        if (color.match(/rgb\(\d+, \d+, 2[45]\d\)/)) emotions['blue'] = colorEmotionMap.blue;
        if (color.match(/rgb\(\d+, 2[45]\d, \d+\)/)) emotions['green'] = colorEmotionMap.green;
    });

    return emotions;
}

// ============================================
// ACCESSIBILITY: CONTRAST MAP
// ============================================

let contrastActive = false;
let contrastOverlay = null;

function toggleContrastMap() {
    contrastActive = !contrastActive;
    if (contrastActive) {
        contrastOverlay = document.createElement('div');
        contrastOverlay.id = 'remixr-contrast-overlay';
        contrastOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999996;
            background: rgba(0,0,0,0.4);
        `;
        document.body.appendChild(contrastOverlay);

        const all = document.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, button');
        all.forEach(el => {
            const style = window.getComputedStyle(el);
            const bg = getRecursiveBg(el);
            const fg = style.color;

            try {
                const ratio = getContrastRatio(fg, bg);
                if (ratio < 4.5) {
                    const rect = el.getBoundingClientRect();
                    const marker = document.createElement('div');
                    marker.className = 'remixr-contrast-warning';
                    marker.style.cssText = `
                        position: absolute;
                        top: ${rect.top + window.scrollY}px;
                        left: ${rect.left + window.scrollX}px;
                        width: ${rect.width}px;
                        height: ${rect.height}px;
                        border: 2px solid #ef4444;
                        background: rgba(239, 68, 68, 0.1);
                        z-index: 999997;
                        pointer-events: auto;
                    `;
                    marker.title = `Low Contrast: ${ratio.toFixed(2)} (Target: 4.5)`;
                    contrastOverlay.appendChild(marker);
                }
            } catch (e) { }
        });
    } else {
        if (contrastOverlay) contrastOverlay.remove();
    }
    return contrastActive;
}

function getRecursiveBg(el) {
    let style = window.getComputedStyle(el);
    let bg = style.backgroundColor;
    while ((bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') && el.parentElement) {
        el = el.parentElement;
        style = window.getComputedStyle(el);
        bg = style.backgroundColor;
    }
    return bg;
}

function getContrastRatio(f, b) {
    const l1 = getLuminance(f);
    const l2 = getLuminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function getLuminance(color) {
    const match = color.match(/\d+/g);
    if (!match) return 0;
    let [r, g, b] = match.map(x => {
        x /= 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ============================================
// TECHNICAL: EVENT SNIFFER
// ============================================

let eventSnifferActive = false;
let snifferPanel = null;

function toggleEventSniffer() {
    eventSnifferActive = !eventSnifferActive;
    if (eventSnifferActive) {
        snifferPanel = document.createElement('div');
        snifferPanel.id = 'remixr-sniffer-panel';
        snifferPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 300px;
            height: 200px;
            background: rgba(15, 23, 42, 0.9);
            color: #4ade80;
            padding: 10px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 10px;
            overflow-y: auto;
            z-index: 999999;
            border: 1px solid #4ade80;
            backdrop-filter: blur(5px);
        `;
        snifferPanel.innerHTML = '<div style="color:#fff; border-bottom: 1px solid #4ade80; margin-bottom: 5px; padding-bottom: 3px;">Live Event Sniffer</div>';
        document.body.appendChild(snifferPanel);

        window.addEventListener('click', logSniffEvent, true);
        window.addEventListener('mouseover', logSniffEvent, true);
        window.addEventListener('keydown', logSniffEvent, true);
        window.addEventListener('scroll', logSniffEvent, true);
    } else {
        if (snifferPanel) snifferPanel.remove();
        window.removeEventListener('click', logSniffEvent, true);
        window.removeEventListener('mouseover', logSniffEvent, true);
        window.removeEventListener('keydown', logSniffEvent, true);
        window.removeEventListener('scroll', logSniffEvent, true);
    }
    return eventSnifferActive;
}

function logSniffEvent(e) {
    if (!snifferPanel) return;
    const item = document.createElement('div');
    item.style.marginBottom = '2px';
    const time = new Date().toLocaleTimeString();
    item.textContent = `[${time}] ${e.type.toUpperCase()} -> ${e.target.tagName.toLowerCase()}${e.target.id ? '#' + e.target.id : ''}`;
    snifferPanel.appendChild(item);
    snifferPanel.scrollTop = snifferPanel.scrollHeight;

    if (snifferPanel.childNodes.length > 50) {
        snifferPanel.removeChild(snifferPanel.childNodes[1]);
    }
}

// ============================================
// REALITY DISTORTION ENGINE
// ============================================

let currentReality = null;

function applyReality(type) {
    // Remove existing reality
    const existing = document.getElementById('remixr-reality-style');
    if (existing) existing.remove();
    document.body.classList.remove('remixr-reality-active');

    if (type === 'none') {
        currentReality = null;
        return 'Normalcy Restored';
    }

    const style = document.createElement('style');
    style.id = 'remixr-reality-style';

    let css = '';
    if (type === 'cyberdeck') {
        css = `
      body, html { background: #050505 !important; color: #00ff41 !important; font-family: 'Courier New', monospace !important; }
      * { border-color: #008F11 !important; box-shadow: none !important; border-radius: 0 !important; }
      h1, h2, h3, h4, h5, h6 { color: #f20089 !important; text-transform: uppercase !important; text-shadow: 2px 2px #00ff41 !important; }
      a { color: #00ff41 !important; text-decoration: none !important; border-bottom: 1px dashed #00ff41 !important; }
      img { filter: grayscale(100%) contrast(150%) brightness(0.8) sepia(100%) hue-rotate(90deg) !important; mix-blend-mode: screen !important; }
      button, input { background: #111 !important; border: 1px solid #00ff41 !important; color: #00ff41 !important; }
      div { border: 1px solid rgba(0, 255, 65, 0.1); }
      ::-webkit-scrollbar { width: 10px; background: #000; }
      ::-webkit-scrollbar-thumb { background: #00ff41; }
    `;
    } else if (type === 'blueprint') {
        css = `
      body, html { background: #0a4f8b !important; color: #fff !important; font-family: 'Consolas', monospace !important; }
      * { border: 1px solid rgba(255,255,255,0.3) !important; background: transparent !important; box-shadow: none !important; }
      h1, h2, h3 { color: #fff !important; text-decoration: underline !important; }
      img { opacity: 0.5 !important; filter: blueprint !important; }
      p, span { color: rgba(255,255,255,0.9) !important; }
    `;
    } else if (type === 'brutalist') {
        css = `
      body, html { background: #fff !important; color: #000 !important; font-family: 'Helvetica', 'Arial', sans-serif !important; }
      * { border: 3px solid #000 !important; border-radius: 0 !important; box-shadow: 5px 5px 0px #000 !important; background: #fff !important; max-width: 100%; }
      h1, h2 { background: #ff00ff !important; color: #000 !important; display: inline-block !important; padding: 5px !important; transform: rotate(-1deg); }
      a { background: #ffff00 !important; color: #000 !important; text-decoration: underline !important; font-weight: bold !important; }
      img { filter: contrast(120%) !important; }
      .container, div { padding: 20px !important; margin: 10px !important; }
    `;
    } else if (type === 'vaporwave') {
        css = `
      body, html { background: linear-gradient(45deg, #ff71ce, #01cdfe) !important; color: #fff !important; font-family: 'Comic Sans MS', cursive !important; }
      * { border: none !important; box-shadow: 0 0 10px rgba(255,255,255,0.5) !important; background: rgba(255,255,255,0.1) !important; backdrop-filter: blur(5px); }
      h1, h2, h3 { color: #ffffff !important; text-shadow: 3px 3px 0px #ff00ff !important; font-style: italic !important; }
      img { filter: hue-rotate(45deg) contrast(0.8) !important; border-radius: 15px !important; }
    `;
    } else if (type === 'glitch') {
        css = `
      @keyframes remixr-glitch {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
      }
      body, html { background: #000 !important; color: #fff !important; overflow-x: hidden; }
      * { 
        animation: remixr-glitch 0.2s infinite; 
        border: 1px solid rgba(255,255,255,0.1) !important; 
        position: relative;
      }
      *:before {
        content: attr(data-text);
        position: absolute;
        left: -2px;
        text-shadow: 2px 0 #ff00c1;
        background: #000;
        overflow: hidden;
        clip: rect(0, 900px, 0, 0);
        animation: remixr-glitch-2 3s infinite linear alternate-reverse;
      }
      h1, h2, h3 { color: #0ff !important; text-shadow: 2px 2px #f0f !important; }
      img { filter: invert(1) hue-rotate(180deg) !important; }
    `;
    }

    style.innerHTML = css;
    document.head.appendChild(style);
    document.body.classList.add('remixr-reality-active');
    currentReality = type;

    return type.charAt(0).toUpperCase() + type.slice(1) + ' Reality Applied';
}

function toggleGodMode() {
    const isGod = document.designMode === 'on';
    document.designMode = isGod ? 'off' : 'on';

    if (!isGod) {
        // Activate God Mode
        const badge = document.createElement('div');
        badge.id = 'remixr-god-mode-badge';
        badge.innerText = 'GOD MODE: EDITING ENABLED';
        badge.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: red; color: white; padding: 10px 20px; font-weight: bold;
      z-index: 999999; pointer-events: none; box-shadow: 0 0 20px red;
      font-family: sans-serif; text-transform: uppercase; letter-spacing: 2px;
    `;
        document.body.appendChild(badge);

        // Add hover effects for editing
        const style = document.createElement('style');
        style.id = 'remixr-god-mode-styles';
        style.innerHTML = `
      *:hover { outline: 1px dashed rgba(255,0,0,0.5); cursor: text; }
    `;
        document.head.appendChild(style);

        return true;
    } else {
        // Deactivate
        const badge = document.getElementById('remixr-god-mode-badge');
        if (badge) badge.remove();
        const style = document.getElementById('remixr-god-mode-styles');
        if (style) style.remove();
        return false;
    }
}
// ============================================
// COMPLETE OBJECT MODEL EXTRACTION
// Deep introspection system for ReMixr
// ============================================

/**
 * Extracts the complete object model from the target website
 * This is the CORE function for achieving the ReMixr objective
 */
function extractCompleteObjectModel() {
    const extraction = {
        metadata: {
            url: window.location.href,
            domain: window.location.hostname,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: { width: window.innerWidth, height: window.innerHeight }
        },
        windowObject: extractWindowObject(),
        domTree: extractDOMTree(),
        frameworks: detectFrameworks(),
        stateManagement: extractStateManagement(),
        eventListeners: extractEventListeners(),
        apiEndpoints: extractAPIEndpoints(),
        storage: extractStorage(),
        globalVariables: extractGlobalVariables(),
        prototypes: extractPrototypeChain(),
        computedStyles: extractComputedStyles(),
        dataAttributes: extractDataAttributes(),
        customElements: extractCustomElements()
    };

    return extraction;
}

/**
 * Deep introspection of the window object
 * Recursively traverses all properties with circular reference handling
 */
function extractWindowObject(maxDepth = 3) {
    const seen = new WeakSet();
    const primitiveTypes = ['string', 'number', 'boolean', 'undefined', 'symbol', 'bigint'];

    function traverse(obj, depth = 0, path = 'window') {
        if (depth > maxDepth) return '[Max Depth Reached]';
        if (obj === null) return null;

        const type = typeof obj;
        if (primitiveTypes.includes(type)) return obj;

        if (typeof obj === 'function') {
            return {
                __type: 'function',
                name: obj.name || 'anonymous',
                signature: obj.toString().split('\n')[0].substring(0, 100),
                length: obj.length
            };
        }

        if (typeof obj === 'object') {
            if (seen.has(obj)) return '[Circular Reference]';
            seen.add(obj);

            if (Array.isArray(obj)) {
                return obj.slice(0, 10).map((item, i) => traverse(item, depth + 1, `${path}[${i}]`));
            }

            const result = {};
            const keys = Object.getOwnPropertyNames(obj).slice(0, 50); // Limit to 50 properties per level

            for (const key of keys) {
                try {
                    const value = obj[key];
                    result[key] = traverse(value, depth + 1, `${path}.${key}`);
                } catch (e) {
                    result[key] = `[Error: ${e.message}]`;
                }
            }

            return result;
        }

        return obj;
    }

    const windowSnapshot = {};
    const importantKeys = [
        'document', 'location', 'navigator', 'performance', 'localStorage', 'sessionStorage',
        'console', 'fetch', 'XMLHttpRequest', 'WebSocket', 'indexedDB', 'crypto',
        // Framework globals
        'React', 'ReactDOM', 'Vue', 'angular', 'Angular', '$', 'jQuery', 'Backbone', 'Ember',
        // State management
        'Redux', '__REDUX_DEVTOOLS_EXTENSION__', 'Vuex', 'MobX',
        // Common libraries
        'moment', 'lodash', '_', 'axios', 'gsap', 'd3'
    ];

    for (const key of importantKeys) {
        if (window[key]) {
            windowSnapshot[key] = traverse(window[key], 0, `window.${key}`);
        }
    }

    // Also capture custom globals (non-standard window properties)
    const customGlobals = Object.getOwnPropertyNames(window).filter(key => {
        return !key.startsWith('webkit') &&
            !key.startsWith('moz') &&
            !key.startsWith('on') &&
            typeof window[key] === 'object' &&
            !importantKeys.includes(key);
    }).slice(0, 20);

    windowSnapshot.__customGlobals = customGlobals.map(key => ({
        name: key,
        type: typeof window[key],
        value: traverse(window[key], 1, `window.${key}`)
    }));

    return windowSnapshot;
}

/**
 * Extract complete DOM tree with all relevant metadata
 */
function extractDOMTree(maxDepth = 10) {
    function serializeNode(node, depth = 0) {
        if (depth > maxDepth || !node) return null;

        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            return text ? { type: 'text', content: text } : null;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return null;

        const element = {
            tag: node.tagName.toLowerCase(),
            attributes: {},
            dataAttributes: {},
            classes: Array.from(node.classList || []),
            id: node.id || null,
            computedStyle: {},
            boundingBox: null,
            children: []
        };

        // Extract attributes
        if (node.attributes) {
            for (const attr of node.attributes) {
                if (attr.name.startsWith('data-')) {
                    element.dataAttributes[attr.name] = attr.value;
                } else {
                    element.attributes[attr.name] = attr.value;
                }
            }
        }

        // Extract key computed styles
        try {
            const computed = window.getComputedStyle(node);
            element.computedStyle = {
                display: computed.display,
                position: computed.position,
                width: computed.width,
                height: computed.height,
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                fontSize: computed.fontSize,
                fontFamily: computed.fontFamily,
                zIndex: computed.zIndex
            };

            element.boundingBox = node.getBoundingClientRect();
        } catch (e) {
            // Ignore errors for detached nodes
        }

        // Recursively process children
        for (const child of node.childNodes) {
            const serialized = serializeNode(child, depth + 1);
            if (serialized) element.children.push(serialized);
        }

        return element;
    }

    return serializeNode(document.documentElement);
}

/**
 * Detect frameworks and extract their metadata
 */
function detectFrameworks() {
    const frameworks = {
        detected: [],
        versions: {},
        componentTrees: {}
    };

    // React Detection
    if (window.React || document.querySelector('[data-reactroot], [data-reactid]')) {
        frameworks.detected.push('React');
        frameworks.versions.React = window.React?.version || 'Unknown';

        // Try to extract React component tree
        try {
            const reactRoot = document.querySelector('[data-reactroot]') || document.getElementById('root');
            if (reactRoot && reactRoot._reactRootContainer) {
                frameworks.componentTrees.React = extractReactTree(reactRoot);
            }
        } catch (e) {
            frameworks.componentTrees.React = { error: e.message };
        }
    }

    // Vue Detection
    if (window.Vue || document.querySelector('[data-v-]')) {
        frameworks.detected.push('Vue');
        frameworks.versions.Vue = window.Vue?.version || 'Unknown';

        // Try to extract Vue instance
        try {
            const vueRoot = document.querySelector('[data-v-app]') || document.getElementById('app');
            if (vueRoot && vueRoot.__vue__) {
                frameworks.componentTrees.Vue = extractVueTree(vueRoot.__vue__);
            }
        } catch (e) {
            frameworks.componentTrees.Vue = { error: e.message };
        }
    }

    // Angular Detection
    if (window.angular || window.ng || document.querySelector('[ng-app], [ng-version]')) {
        frameworks.detected.push('Angular');
        const ngVersion = document.querySelector('[ng-version]');
        frameworks.versions.Angular = ngVersion?.getAttribute('ng-version') || 'Unknown';
    }

    // jQuery Detection
    if (window.jQuery || window.$) {
        frameworks.detected.push('jQuery');
        frameworks.versions.jQuery = window.jQuery?.fn?.jquery || 'Unknown';
    }

    // Svelte Detection
    if (document.querySelector('[class*="svelte-"]')) {
        frameworks.detected.push('Svelte');
    }

    // Next.js Detection
    if (window.__NEXT_DATA__) {
        frameworks.detected.push('Next.js');
        frameworks.nextData = window.__NEXT_DATA__;
    }

    // Nuxt.js Detection
    if (window.__NUXT__) {
        frameworks.detected.push('Nuxt.js');
        frameworks.nuxtData = window.__NUXT__;
    }

    return frameworks;
}

/**
 * Extract React component tree
 */
function extractReactTree(element, depth = 0, maxDepth = 5) {
    if (depth > maxDepth) return null;

    const fiber = element._reactRootContainer?._internalRoot?.current ||
        element._reactInternalFiber ||
        element._reactInternalInstance;

    if (!fiber) return null;

    function traverseFiber(fiber) {
        if (!fiber) return null;

        const component = {
            type: fiber.type?.name || fiber.type || 'Unknown',
            props: {},
            state: fiber.memoizedState,
            children: []
        };

        // Extract props (sanitized)
        if (fiber.memoizedProps) {
            for (const [key, value] of Object.entries(fiber.memoizedProps)) {
                if (typeof value !== 'function' && typeof value !== 'object') {
                    component.props[key] = value;
                }
            }
        }

        // Traverse children
        let child = fiber.child;
        while (child) {
            const childComponent = traverseFiber(child);
            if (childComponent) component.children.push(childComponent);
            child = child.sibling;
        }

        return component;
    }

    return traverseFiber(fiber);
}

/**
 * Extract Vue component tree
 */
function extractVueTree(vm, depth = 0, maxDepth = 5) {
    if (depth > maxDepth || !vm) return null;

    const component = {
        name: vm.$options.name || vm.$options._componentTag || 'Anonymous',
        data: {},
        computed: {},
        props: vm.$props || {},
        children: []
    };

    // Extract data (sanitized)
    if (vm.$data) {
        for (const [key, value] of Object.entries(vm.$data)) {
            if (!key.startsWith('_') && typeof value !== 'function') {
                component.data[key] = value;
            }
        }
    }

    // Extract computed properties
    if (vm.$options.computed) {
        component.computed = Object.keys(vm.$options.computed);
    }

    // Traverse children
    if (vm.$children) {
        for (const child of vm.$children) {
            const childComponent = extractVueTree(child, depth + 1, maxDepth);
            if (childComponent) component.children.push(childComponent);
        }
    }

    return component;
}

/**
 * Extract state management stores
 */
function extractStateManagement() {
    const state = {
        redux: null,
        vuex: null,
        mobx: null,
        context: null
    };

    // Redux
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        try {
            const reduxState = window.__REDUX_DEVTOOLS_EXTENSION__.getState?.();
            state.redux = reduxState;
        } catch (e) {
            state.redux = { error: e.message };
        }
    }

    // Vuex
    if (window.$store || window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
        try {
            state.vuex = window.$store?.state || 'Detected but inaccessible';
        } catch (e) {
            state.vuex = { error: e.message };
        }
    }

    // MobX
    if (window.__mobxInstanceCount || window.__mobxGlobal) {
        state.mobx = 'Detected';
    }

    return state;
}

/**
 * Extract potential event listeners from the DOM
 * Since getEventListeners() is only available in DevTools console,
 * we check for inline event handlers and common interactive attributes.
 */
function extractEventListeners() {
    const listeners = [];
    const elements = document.querySelectorAll('button, a, input, select, textarea, [onclick], [onchange], [onmouseover], [role="button"]');

    for (const element of Array.from(elements).slice(0, 50)) {
        const elementEvents = [];

        // Check for common inline handlers
        const inlineHandlers = ['onclick', 'onchange', 'onsubmit', 'onmouseover', 'onkeydown', 'onload'];
        inlineHandlers.forEach(handler => {
            if (element[handler] || element.getAttribute(handler)) {
                elementEvents.push(handler.replace('on', ''));
            }
        });

        // Check for attributes that often imply attached listeners in frameworks
        const frameworkAttrs = ['@click', 'v-on:', '(click)', 'ng-click', 'data-onclick'];
        Array.from(element.attributes).forEach(attr => {
            if (frameworkAttrs.some(f => attr.name.includes(f))) {
                elementEvents.push(attr.name);
            }
        });

        if (elementEvents.length > 0) {
            listeners.push({
                selector: getSelector(element),
                tag: element.tagName.toLowerCase(),
                events: [...new Set(elementEvents)]
            });
        }
    }

    return listeners;
}

/**
 * Extract API endpoints from network requests and code
 */
function extractAPIEndpoints() {
    const endpoints = {
        detected: [],
        methods: {}
    };

    // Scan for API URLs in the code
    const scripts = Array.from(document.querySelectorAll('script'));
    const urlPattern = /(https?:\/\/[^\s'"]+\/api[^\s'"]*)/gi;

    for (const script of scripts) {
        const matches = script.textContent.match(urlPattern);
        if (matches) {
            endpoints.detected.push(...matches);
        }
    }

    // Check for common API patterns in window object
    if (window.API_URL || window.API_BASE_URL || window.apiUrl) {
        endpoints.baseUrl = window.API_URL || window.API_BASE_URL || window.apiUrl;
    }

    // Detect GraphQL
    if (window.__APOLLO_CLIENT__ || document.querySelector('[data-apollo-client]')) {
        endpoints.graphql = true;
    }

    return endpoints;
}

/**
 * Extract all storage data
 */
function extractStorage() {
    const storage = {
        localStorage: {},
        sessionStorage: {},
        cookies: {},
        indexedDB: []
    };

    // LocalStorage
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            storage.localStorage[key] = localStorage.getItem(key);
        }
    } catch (e) {
        storage.localStorage = { error: e.message };
    }

    // SessionStorage
    try {
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            storage.sessionStorage[key] = sessionStorage.getItem(key);
        }
    } catch (e) {
        storage.sessionStorage = { error: e.message };
    }

    // Cookies
    try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [key, value] = cookie.split('=').map(s => s.trim());
            storage.cookies[key] = value;
        }
    } catch (e) {
        storage.cookies = { error: e.message };
    }

    // IndexedDB databases
    if (window.indexedDB) {
        try {
            indexedDB.databases?.().then(dbs => {
                storage.indexedDB = dbs.map(db => ({ name: db.name, version: db.version }));
            });
        } catch (e) {
            storage.indexedDB = { error: e.message };
        }
    }

    return storage;
}

/**
 * Extract global variables
 */
function extractGlobalVariables() {
    const globals = {};
    const standardGlobals = new Set([
        'window', 'document', 'location', 'navigator', 'screen', 'history',
        'localStorage', 'sessionStorage', 'console', 'setTimeout', 'setInterval',
        'fetch', 'XMLHttpRequest', 'Promise', 'Array', 'Object', 'String', 'Number',
        'Math', 'Date', 'JSON', 'RegExp', 'Error', 'Map', 'Set', 'WeakMap', 'WeakSet'
    ]);

    for (const key of Object.getOwnPropertyNames(window)) {
        if (!standardGlobals.has(key) && !key.startsWith('webkit') && !key.startsWith('on')) {
            const value = window[key];
            globals[key] = {
                type: typeof value,
                constructor: value?.constructor?.name,
                isFunction: typeof value === 'function',
                isObject: typeof value === 'object' && value !== null
            };
        }
    }

    return globals;
}

/**
 * Extract prototype chains
 */
function extractPrototypeChain() {
    const prototypes = {};
    const targets = ['HTMLElement', 'Element', 'Node', 'EventTarget', 'Object', 'Array'];

    for (const target of targets) {
        if (window[target]) {
            prototypes[target] = Object.getOwnPropertyNames(window[target].prototype);
        }
    }

    return prototypes;
}

/**
 * Extract computed styles for key elements
 */
function extractComputedStyles() {
    const styles = {};
    const selectors = ['body', 'main', 'header', 'footer', 'nav', '.container', '#app', '#root'];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            const computed = window.getComputedStyle(element);
            styles[selector] = {
                display: computed.display,
                position: computed.position,
                width: computed.width,
                height: computed.height,
                backgroundColor: computed.backgroundColor,
                color: computed.color,
                fontFamily: computed.fontFamily,
                fontSize: computed.fontSize
            };
        }
    }

    return styles;
}

/**
 * Extract all data attributes
 */
function extractDataAttributes() {
    const dataAttrs = {};
    const elements = document.querySelectorAll('[data-]');

    for (const element of Array.from(elements).slice(0, 100)) {
        const attrs = {};
        for (const attr of element.attributes) {
            if (attr.name.startsWith('data-')) {
                attrs[attr.name] = attr.value;
            }
        }
        if (Object.keys(attrs).length > 0) {
            const selector = getSelector(element);
            dataAttrs[selector] = attrs;
        }
    }

    return dataAttrs;
}

/**
 * Extract custom elements (Web Components)
 */
function extractCustomElements() {
    const customElements = [];
    const elements = document.querySelectorAll('*');

    for (const element of elements) {
        if (element.tagName.includes('-')) {
            customElements.push({
                tag: element.tagName.toLowerCase(),
                attributes: Array.from(element.attributes).map(attr => ({
                    name: attr.name,
                    value: attr.value
                }))
            });
        }
    }

    return customElements;
}

/**
 * Extract framework-specific state
 */
function extractFrameworkState() {
    const state = {
        react: extractReactState(),
        vue: extractVueState(),
        angular: extractAngularState()
    };

    return state;
}

function extractReactState() {
    // Try to find React DevTools hook
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return { detected: true, devtools: 'available' };
    }

    // Try to extract from root
    const root = document.getElementById('root') || document.querySelector('[data-reactroot]');
    if (root) {
        return extractReactTree(root);
    }

    return null;
}

function extractVueState() {
    // Try to find Vue instance
    const app = document.getElementById('app');
    if (app && app.__vue__) {
        return extractVueTree(app.__vue__);
    }

    return null;
}

function extractAngularState() {
    // Angular detection
    if (window.ng) {
        return { detected: true, version: 'Angular 2+' };
    }

    if (window.angular) {
        return { detected: true, version: 'AngularJS' };
    }

    return null;
}

/**
 * Analyze Emotional Design impact
 */
function analyzeEmotionalDesign() {
    const analysis = {
        typographyMood: 'Serious',
        visualWeight: 'Balanced',
        emotionalIntent: 'Trust & Professionalism',
        designPersonality: [],
        colorPsychology: {},
        spacingAnalysis: {
            avgPadding: 0,
            avgMargin: 0,
            feeling: 'Neutral'
        }
    };

    // Typography mood detection
    const fonts = Array.from(document.querySelectorAll('*'))
        .map(el => window.getComputedStyle(el).fontFamily)
        .slice(0, 50)
        .join(' ');

    if (fonts.match(/serif/i)) analysis.typographyMood = 'Classic/Trust';
    if (fonts.match(/sans-serif/i)) analysis.typographyMood = 'Modern/Clean';
    if (fonts.match(/display|cursive|comic/i)) analysis.typographyMood = 'Playful/Expressive';

    // Color psychology
    const colorResults = extractDominantColors();
    colorResults.slice(0, 3).forEach(c => {
        if (c.match(/blue/i)) analysis.colorPsychology[c] = 'Trust, Stability';
        if (c.match(/red/i)) analysis.colorPsychology[c] = 'Excitement, Urgency';
        if (c.match(/green/i)) analysis.colorPsychology[c] = 'Growth, Health';
        if (c.match(/orange|yellow/i)) analysis.colorPsychology[c] = 'Friendliness, Energy';
        if (c.match(/black|gray/i)) analysis.colorPsychology[c] = 'Authority, Sophistication';
    });

    // Spacing psychology (Breathability)
    let totalPad = 0, totalMar = 0, count = 0;
    document.querySelectorAll('div, section, main').forEach(el => {
        if (count > 20) return;
        const s = window.getComputedStyle(el);
        totalPad += parseInt(s.padding) || 0;
        totalMar += parseInt(s.margin) || 0;
        count++;
    });
    analysis.spacingAnalysis.avgPadding = Math.round(totalPad / count) || 0;
    analysis.spacingAnalysis.avgMargin = Math.round(totalMar / count) || 0;

    if (analysis.spacingAnalysis.avgPadding > 30) analysis.spacingAnalysis.feeling = 'Expansive/Premium';
    else if (analysis.spacingAnalysis.avgPadding < 10) analysis.spacingAnalysis.feeling = 'Information Dense/Utility';
    else analysis.spacingAnalysis.feeling = 'Standard/Functional';

    // Personality Traits
    if (document.querySelectorAll('img').length > 10) analysis.designPersonality.push('Visual-Heavy');
    if (document.querySelectorAll('input').length > 5) analysis.designPersonality.push('Interactive/Utility');
    if (analysis.typographyMood.includes('Classic')) analysis.designPersonality.push('Traditional');
    if (analysis.spacingAnalysis.feeling.includes('Expansive')) analysis.designPersonality.push('Minimalist');

    return analysis;
}

/**
 * Deep extraction of framework-specific internal state
 */
function extractFrameworkState() {
    const states = {
        react: null,
        vue: null,
        angular: null,
        detected: []
    };

    // React Fiber Tree Introspection (Safe approach)
    const reactRoot = document.querySelector('[data-reactroot], #root, #app');
    if (reactRoot) {
        const key = Object.keys(reactRoot).find(k => k.startsWith('__reactContainer') || k.startsWith('__reactRootContainer'));
        if (key) {
            states.detected.push('React');
            states.react = {
                version: window.React?.version || 'Unknown',
                memoizedState: !!reactRoot[key].memoizedState
            };
        }
    }

    // Vue state
    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
        states.detected.push('Vue');
        states.vue = { active: true };
    }

    return states;
}
