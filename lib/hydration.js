/*
 * ReMixr Hydration Engine
 * Automatically injects Site DNA into extension templates.
 */

const HydrationEngine = {
    /**
     * Hydrates a project object with data from Site DNA.
     * @param {Object} project - The project being created.
     * @param {Object} dna - The extracted Site DNA object.
     * @returns {Object} The hydrated project.
     */
    hydrate(project, dna) {
        if (!dna) return project;

        log('Hydrating project with Site DNA:', dna.metadata?.domain);

        // 1. Update Project Metadata
        if (dna.metadata) {
            project.name = `${dna.metadata.title || 'Site'} Modifier`;
            // Sanitize name for manifest
            const manifestName = project.name.slice(0, 45);
            
            if (project.files['manifest.json']) {
                const manifest = JSON.parse(project.files['manifest.json']);
                manifest.name = manifestName;
                manifest.description = `AI-generated extension for ${dna.metadata.domain || 'this site'}.`;
                project.files['manifest.json'] = JSON.stringify(manifest, null, 2);
            }
        }

        // 2. Inject Design Tokens into styles.css
        if (dna.designSystem && project.files['styles.css']) {
            project.files['styles.css'] = this.injectStyles(project.files['styles.css'], dna.designSystem);
        }

        // 3. Inject Site Context for the extension's JS to use
        project.files['site-context.js'] = `/**
 * Generated Site Context for ${dna.metadata?.domain || 'Unknown'}
 * This file contains structured intelligence about the target site.
 */
const SITE_CONTEXT = ${JSON.stringify(dna, null, 2)};
`;

        // 4. Update content.js if it exists with better defaults
        if (dna.classVocabulary && project.files['content.js']) {
           project.files['content.js'] = this.injectContentLogic(project.files['content.js'], dna);
        }

        return project;
    },

    /**
     * Injects design tokens into CSS content.
     */
    injectStyles(css, designSystem) {
        const colorsObj = designSystem.colors || {};
        const colors = Array.isArray(colorsObj.all) ? colorsObj.all : 
                       (Array.isArray(colorsObj.accents) ? colorsObj.accents : []);
        const typography = designSystem.typography || {};
        
        // Create a :root block with variables
        let rootVars = ':root {\n';
        colors.slice(0, 6).forEach((color, i) => {
            rootVars += `  --site-color-${i + 1}: ${color};\n`;
        });
        if (typography.fontFamilies && typography.fontFamilies[0]) {
            rootVars += `  --site-font: ${typography.fontFamilies[0]};\n`;
        }
        rootVars += '}\n\n';

        return rootVars + css;
    },

    /**
     * Injects logic into content.js based on DNA.
     */
    injectContentLogic(js, dna) {
        const vocab = dna.classVocabulary || [];
        const topClasses = vocab.slice(0, 5).map(c => `.${c}`).join(', ');
        
        const injection = `
// --- Site-specific Intelligence ---
// Top detected classes: ${vocab.slice(0, 10).join(', ')}
const TARGET_SELECTORS = "${topClasses}";
// ----------------------------------

`;
        return injection + js;
    }
};

if (typeof module !== 'undefined') {
    module.exports = HydrationEngine;
} else {
    window.HydrationEngine = HydrationEngine;
}
