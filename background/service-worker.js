import { ModManager } from './mod-manager.js';
import { UpdateChecker } from './update-checker.js';

class ServiceWorker {
    constructor() {
        this.modManager = new ModManager();
        this.updateChecker = new UpdateChecker();
        this.init();
    }

    init() {
        // Handle extension startup
        chrome.runtime.onStartup.addListener(() => this.onStartup());
        chrome.runtime.onInstalled.addListener(() => this.onInstalled());

        // Handle messages from popup and content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Schedule daily update checks
        this.scheduleUpdateChecks();
    }

    async onStartup() {
        console.log('CodysTools starting up...');
        await this.modManager.initialize();
        await this.updateChecker.checkAllUpdates();
    }

    async onInstalled() {
        console.log('CodysTools installed');
        await this.modManager.initialize();
        
        // Install default mods
        await this.installDefaultMods();
    }

    async installDefaultMods() {
        const defaultMods = [
            {
                id: 'dark-mode',
                name: 'Dark Mode Toggle',
                description: 'Adds a dark mode toggle to websites',
                category: 'productivity',
                version: '1.0.0',
                enabled: false,
                isDefault: true,
                github: {
                    owner: 'CodysTools',
                    repo: 'dark-mode-mod',
                    branch: 'main'
                }
            },
            {
                id: 'ad-blocker',
                name: 'Simple Ad Blocker',
                description: 'Blocks common ad elements on websites',
                category: 'productivity',
                version: '1.0.0',
                enabled: false,
                isDefault: true,
                github: {
                    owner: 'CodysTools',
                    repo: 'ad-blocker-mod',
                    branch: 'main'
                }
            }
        ];

        for (const mod of defaultMods) {
            await this.modManager.installModFromConfig(mod);
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'installMod':
                    const result = await this.modManager.installModFromGitHub(
                        request.owner,
                        request.repo,
                        request.branch
                    );
                    sendResponse(result);
                    break;

                case 'updateMod':
                    const updateResult = await this.modManager.updateMod(request.modId);
                    sendResponse(updateResult);
                    break;

                case 'toggleMod':
                    await this.modManager.toggleMod(request.modId, request.enabled);
                    sendResponse({ success: true });
                    break;

                case 'checkUpdates':
                    const updates = await this.updateChecker.checkAllUpdates();
                    sendResponse({ success: true, updates });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Service worker error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    scheduleUpdateChecks() {
        // Check for updates every 24 hours
        chrome.alarms.create('checkUpdates', { periodInMinutes: 24 * 60 });
        
        chrome.alarms.onAlarm.addListener(async (alarm) => {
            if (alarm.name === 'checkUpdates') {
                await this.updateChecker.checkAllUpdates();
            }
        });
    }
}

// Initialize service worker
new ServiceWorker();
