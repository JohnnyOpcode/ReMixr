/*
 * Copyright 2026 John Kost
 * Licensed under the Apache License, Version 2.0
 */

/**
 * ReMixr Pipeline Engine
 * Orchestrates multi-agent analysis and generation sequences.
 */

const PipelineEngine = {
    agents: {},
    pipelines: {},

    /**
     * Registers a new agent function
     * @param {string} id - Unique ID for the agent
     * @param {function} fn - The agent implementation (async)
     */
    registerAgent(id, fn) {
        this.agents[id] = fn;
    },

    /**
     * Defines a new pipeline sequence
     * @param {string} id - Unique ID for the pipeline
     * @param {string[]} steps - Array of agent IDs to run in sequence
     */
    definePipeline(id, steps) {
        this.pipelines[id] = steps;
    },

    /**
     * Runs a pipeline by ID
     * @param {string} pipelineId - ID of the pipeline to run
     * @param {object} input - Initial context/input for the pipeline
     * @param {function} onStepComplete - Callback for progress reporting
     * @returns {Promise<object>} - Cumulative result from all agents
     */
    async run(pipelineId, input, onStepComplete = null) {
        const steps = this.pipelines[pipelineId];
        if (!steps) throw new Error(`Pipeline "${pipelineId}" not found`);

        let context = { ...input, _timestamp: Date.now() };
        const results = [];

        for (const stepId of steps) {
            const agent = this.agents[stepId];
            if (!agent) {
                console.warn(`[Pipeline] Agent "${stepId}" not registered. Skipping.`);
                continue;
            }

            if (onStepComplete) onStepComplete(stepId, 'running');
            
            try {
                const stepResult = await agent(context);
                context = { ...context, ...stepResult };
                results.push({ stepId, status: 'success' });
                if (onStepComplete) onStepComplete(stepId, 'success', stepResult);
            } catch (error) {
                console.error(`[Pipeline] Error in step "${stepId}":`, error);
                results.push({ stepId, status: 'error', message: error.message });
                if (onStepComplete) onStepComplete(stepId, 'error', error);
                // Stay resilient: continue to next step if possible, or stop?
                // For now, we stop on critical failures.
                throw error;
            }
        }

        return {
            pipeline: pipelineId,
            finalContext: context,
            steps: results
        };
    }
};

// --- Default Agents ---

// Agent: Strategic Auditor
// Analyzes DNA and produces a SWOT/Gap analysis
PipelineEngine.registerAgent('strategic_auditor', async (context) => {
    const dna = context.dna;
    if (!dna) throw new Error('No Site DNA found for audit');

    const strengths = [];
    const weaknesses = [];
    const opportunities = [];

    // Technology Strength
    if (dna.designSystem?.system) strengths.push(`Using ${dna.designSystem.system} framework`);
    if (dna.accessibility?.score > 80) strengths.push('High accessibility compliance');

    // UX Weakness
    if (dna.strategy?.cognitiveBurden > 60) weaknesses.push('High cognitive friction detected');
    if (dna.strategy?.interactionFriction > 50) weaknesses.push('Non-linear flow bottlenecks');

    // Strategic Opportunities
    if (dna.archetype?.persona === 'Generic') opportunities.push('Brand soul differentiation');
    if (dna.soul?.complexity < 3) opportunities.push('Emotional resonance expansion');

    return {
        audit: {
            strengths,
            weaknesses,
            opportunities,
            siteTitle: dna._meta?.title || 'Unknown Asset'
        }
    };
});

// Agent: Security Auditor
// Analyzes privacy policy, SSL status, and dark patterns for risk
PipelineEngine.registerAgent('security_auditor', async (context) => {
    const dna = context.dna;
    const shadow = dna.shadow || {};
    const soul = dna.soul || {};
    
    const risks = [];
    const compliance = [];

    // Protocol Check
    if (!soul.isSecure) risks.push('Insecure connection (No SSL)');
    else compliance.push('Secure HTTPS connection');

    // Privacy Check
    if (!soul.trustIndicators?.privacyPolicy) risks.push('Missing Privacy Policy');
    
    // Dark Pattern Check
    const deceptive = shadow.deceptivePatterns || [];
    deceptive.forEach(p => {
        if (p.severity === 'high' || p.type === 'Privacy Zuckering') {
            risks.push(`${p.type} detected: ${p.detail || 'High risk pattern'}`);
        }
    });

    return {
        securityAudit: {
            risks,
            compliance,
            riskLevel: risks.length > 2 ? 'High' : risks.length > 0 ? 'Medium' : 'Clean'
        }
    };
});

// Agent: Remix Architect
// Generates specific "Remix" opportunities based on the audit
PipelineEngine.registerAgent('remix_architect', async (context) => {
    const audit = context.audit;
    const security = context.securityAudit || {};
    const dna = context.dna;
    const suggestions = [];

    // Prioritize Security
    if (security.riskLevel === 'High' || security.riskLevel === 'Medium') {
        suggestions.push({
            id: 'privacy_shield',
            type: 'Privacy Shield',
            rationale: `Detected ${security.risks.length} privacy risks. Site needs visual transparency layer.`,
            impact: 'critical',
            priority: 0
        });
    }

    if (audit.weaknesses.length > 0) {
        suggestions.push({
            id: 'ux_fluidity',
            type: 'UX Fluidity Boost',
            rationale: `Remedying ${audit.weaknesses[0]} by smoothing interaction curves.`,
            impact: 'high',
            priority: 1
        });
    }

    if (dna.designSystem?.colors?.accents?.length > 0) {
        suggestions.push({
            id: 'brand_glow',
            type: 'Brand Atmosphere',
            rationale: 'Harmonizing site tokens for a premium "Ambient" feel.',
            impact: 'medium',
            priority: 2,
            primaryColor: dna.designSystem.colors.accents[0].value
        });
    }

    return { suggestedOpportunities: suggestions };
});

// Agent: Code Synthesizer
// Converts suggestions into actual runnable extension code
PipelineEngine.registerAgent('code_synthesizer', async (context) => {
    const suggestions = context.suggestedOpportunities;
    const dna = context.dna;
    
    const codeRemixes = suggestions.map(s => {
        let generatedCode = `// AI Synthesized Remix for: ${s.type}\n`;
        
        if (s.id === 'brand_glow') {
           const accent = s.primaryColor || '#6366f1';
           generatedCode += `
const style = document.createElement('style');
style.textContent = \`
  :root { --remix-accent: ${accent}; }
  body { border-top: 4px solid var(--remix-accent) !important; }
  ::selection { background: var(--remix-accent); color: white; }
  button:hover { filter: brightness(1.2); box-shadow: 0 0 15px var(--remix-accent); }
\`;
document.head.appendChild(style);
console.log('[ReMixr] Brand Glow applied using site-native accent: ${accent}');`;
        } else if (s.id === 'privacy_shield') {
           generatedCode += `
const banner = document.createElement('div');
banner.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#ef4444; color:white; text-align:center; padding:8px; z-index:999999; font-weight:bold; font-family:sans-serif; font-size:12px;';
banner.textContent = '🛡️ PRIVACY SHIELD ACTIVE: Deceptive patterns and data-sharing detected on this asset.';
document.body.prepend(banner);

// Highlight known deceptive elements (heuristics)
document.querySelectorAll('a[href*="third-party"], [class*="ad-track"]').forEach(el => {
  el.style.border = '2px solid #ef4444 !important';
  el.style.backgroundColor = 'rgba(239, 68, 68, 0.1) !important';
  el.title = 'ReMixr Alert: Deceptive link/element detected';
});
console.log('[ReMixr] Privacy Shield activated.');`;
        } else if (s.id === 'ux_fluidity') {
           generatedCode += `
document.body.style.scrollBehavior = 'smooth';
document.querySelectorAll('a, button').forEach(el => {
  el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
});
console.log('[ReMixr] UX Fluidity applied - interaction curves normalized.');`;
        } else {
           generatedCode += `console.log("[ReMixr Agent] Base modification for ${s.type} applied.");`;
        }

        return { ...s, code: generatedCode };
    });

    return { synthesizedCode: codeRemixes };
});

// --- Predefined Pipelines ---

PipelineEngine.definePipeline('remix_generation', [
    'strategic_auditor',
    'security_auditor',
    'remix_architect',
    'code_synthesizer'
]);

// Attach to window for popup access
window.PipelineEngine = PipelineEngine;
