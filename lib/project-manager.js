/*
 * Copyright 2026 John Kost
 * Licensed under the Apache License, Version 2.0
 */

/**
 * ReMixr Project Manager
 * Handles project CRUD operations and persistence.
 */

const ProjectManager = {
    projects: [],
    currentProject: null,

    async init() {
        this.projects = await this.loadFromStorage();
        return this.projects;
    },

    async loadFromStorage() {
        return new Promise(resolve => {
            chrome.storage.local.get(['extensionProjects'], (result) => {
                resolve(result.extensionProjects || []);
            });
        });
    },

    async saveToStorage() {
        return new Promise(resolve => {
            chrome.storage.local.set({ extensionProjects: this.projects }, resolve);
        });
    },

    getProject(index) {
        return this.projects[index];
    },

    async addProject(project) {
        this.projects.push(project);
        await this.saveToStorage();
        return this.projects.length - 1;
    },

    async deleteProject(index) {
        if (index >= 0 && index < this.projects.length) {
            this.projects.splice(index, 1);
            await this.saveToStorage();
            return true;
        }
        return false;
    },

    setCurrentProject(project) {
        this.currentProject = project;
    },

    // --- Theme Management ---
    async getTheme() {
        return new Promise(resolve => {
            chrome.storage.local.get(['theme'], (result) => {
                resolve(result.theme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
            });
        });
    },

    async setTheme(theme) {
        return new Promise(resolve => {
            chrome.storage.local.set({ theme }, resolve);
        });
    },

    // --- Site Context Caching ---
    async cacheSiteContext(url, context) {
        const cacheKey = `context_${new URL(url).hostname}`;
        return new Promise(resolve => {
            chrome.storage.local.set({
                [cacheKey]: {
                    data: context,
                    timestamp: Date.now()
                }
            }, resolve);
        });
    },

    async getCachedSiteContext(url) {
        const cacheKey = `context_${new URL(url).hostname}`;
        return new Promise(resolve => {
            chrome.storage.local.get(cacheKey, (result) => {
                if (result[cacheKey]) {
                    const cached = result[cacheKey];
                    const age = Date.now() - cached.timestamp;
                    // Cache valid for 1 hour
                    if (age < 3600000) {
                        return resolve(cached.data);
                    }
                }
                resolve(null);
            });
        });
    }
};

// Global export for extension context
window.ProjectManager = ProjectManager;
