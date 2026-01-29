[file name]: sync.js
class GitHubSync {
    constructor() {
        this.config = {
            owner: 'MHmooDhazm',
            repo: 'bitelazz-data',
            token: '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',
            branch: 'main',
            filePath: 'site-data.json'
        };
        
        this.baseURL = 'https://api.github.com';
        this.headers = {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        this.isSyncing = false;
        this.syncQueue = [];
        this.syncInterval = null;
        this.initialize();
    }

    encryptData(data) {
        try {
            const str = JSON.stringify(data);
            return btoa(unescape(encodeURIComponent(str)));
        } catch (error) {
            console.error('Encryption error:', error);
            return str;
        }
    }

    decryptData(encrypted) {
        try {
            const str = decodeURIComponent(escape(atob(encrypted)));
            return JSON.parse(str);
        } catch (error) {
            console.error('Decryption error:', error);
            try {
                return JSON.parse(encrypted);
            } catch {
                console.error('Failed to parse data');
                return this.createDefaultData();
            }
        }
    }

    createDefaultData() {
        return {
            products: [],
            brands: [],
            orders: [],
            sellRequests: [],
            exchangeRequests: [],
            users: [],
            site: {
                name: { ar: "سيارات عبدالله", en: "Abdullah Cars" },
                description: { ar: "معرض السيارات الفاخرة", en: "Luxury Car Showroom" },
                currencySymbol: "ج.م"
            },
            contact: {
                phone: "",
                whatsapp: "",
                email: "",
                address: { ar: "", en: "" },
                workingHours: { ar: "9 ص - 9 م", en: "9 AM - 9 PM" }
            },
            system: { lastSync: new Date().toISOString() }
        };
    }

    async initialize() {
        try {
            console.log('GitHub Sync Initializing...');
            
            const localData = localStorage.getItem('siteData_encrypted');
            if (localData) {
                window.siteData = this.decryptData(localData);
                console.log('Loaded from localStorage');
            }

            await this.sync();
            
            this.syncInterval = setInterval(() => this.sync(), 300000);
            
            window.addEventListener('online', () => this.sync());
            window.addEventListener('beforeunload', () => this.cleanup());
            
        } catch (error) {
            console.error('Initialization error:', error);
            window.siteData = this.createDefaultData();
        }
    }

    async fetch() {
        if (this.isSyncing) {
            console.log('Already syncing, queuing request');
            return new Promise(resolve => {
                this.syncQueue.push(() => this.fetch().then(resolve));
            });
        }

        this.isSyncing = true;
        
        try {
            console.log('Fetching from GitHub...');
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                { 
                    headers: this.headers,
                    cache: 'no-cache'
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('File not found on GitHub');
                    return this.createDefaultData();
                }
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const result = await response.json();
            
            if (!result.content) {
                throw new Error('No content in response');
            }

            const data = this.decryptData(result.content);
            
            localStorage.setItem('siteData_encrypted', this.encryptData(data));
            localStorage.setItem('lastSync', new Date().toISOString());
            
            window.siteData = data;
            
            console.log('Fetch successful');
            return data;
            
        } catch (error) {
            console.error('Fetch error:', error);
            
            const localData = localStorage.getItem('siteData_encrypted');
            if (localData) {
                return this.decryptData(localData);
            }
            
            return this.createDefaultData();
            
        } finally {
            this.isSyncing = false;
            
            if (this.syncQueue.length > 0) {
                const next = this.syncQueue.shift();
                setTimeout(next, 1000);
            }
        }
    }

    async push(data) {
        if (this.isSyncing) {
            console.log('Already syncing, queuing push');
            return new Promise((resolve, reject) => {
                this.syncQueue.push(() => this.push(data).then(resolve).catch(reject));
            });
        }

        this.isSyncing = true;
        
        try {
            console.log('Pushing to GitHub...');
            
            let sha = null;
            try {
                const currentResponse = await fetch(
                    `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                    { headers: this.headers }
                );
                
                if (currentResponse.ok) {
                    const currentData = await currentResponse.json();
                    sha = currentData.sha;
                }
            } catch (error) {
                console.log('No existing file found');
            }

            if (!data.system) data.system = {};
            data.system.lastSync = new Date().toISOString();
            
            const encryptedContent = this.encryptData(data);
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify({
                        message: `Auto-sync: ${new Date().toISOString()}`,
                        content: encryptedContent,
                        sha: sha,
                        branch: this.config.branch
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Push failed: ${response.status} - ${errorText}`);
            }

            localStorage.setItem('siteData_encrypted', encryptedContent);
            localStorage.setItem('lastPush', new Date().toISOString());
            
            window.siteData = data;
            
            console.log('Push successful');
            return { success: true, timestamp: new Date().toISOString() };
            
        } catch (error) {
            console.error('Push error:', error);
            
            localStorage.setItem('siteData_encrypted', this.encryptData(data));
            window.siteData = data;
            
            return { 
                success: false, 
                error: error.message,
                localSaved: true 
            };
            
        } finally {
            this.isSyncing = false;
            
            if (this.syncQueue.length > 0) {
                const next = this.syncQueue.shift();
                setTimeout(next, 1000);
            }
        }
    }

    async sync() {
        try {
            const data = await this.fetch();
            
            if (window.siteData && data) {
                const localEncrypted = localStorage.getItem('siteData_encrypted');
                const remoteEncrypted = this.encryptData(data);
                
                if (localEncrypted !== remoteEncrypted) {
                    console.log('Data changed, updating...');
                    this.triggerEvent('dataChanged', data);
                }
            }
            
            return data;
            
        } catch (error) {
            console.error('Sync error:', error);
            throw error;
        }
    }

    triggerEvent(eventName, detail) {
        const event = new CustomEvent(`githubSync:${eventName}`, { detail });
        window.dispatchEvent(event);
    }

    getStatus() {
        return {
            isSyncing: this.isSyncing,
            queueLength: this.syncQueue.length,
            lastSync: localStorage.getItem('lastSync'),
            lastPush: localStorage.getItem('lastPush'),
            hasLocalData: !!localStorage.getItem('siteData_encrypted')
        };
    }

    clearLocalData() {
        localStorage.removeItem('siteData_encrypted');
        localStorage.removeItem('lastSync');
        localStorage.removeItem('lastPush');
        window.siteData = null;
    }

    cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }

    async forceSync() {
        return await this.sync();
    }

    async createBackup() {
        try {
            const data = window.siteData || await this.fetch();
            const backupName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/backups/${backupName}`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify({
                        message: `Backup: ${backupName}`,
                        content: this.encryptData(data),
                        branch: this.config.branch
                    })
                }
            );
            
            return response.ok;
        } catch (error) {
            console.error('Backup error:', error);
            return false;
        }
    }
}

if (typeof window !== 'undefined') {
    window.gitHubSync = new GitHubSync();
    
    window.GitHubSyncService = {
        fetch: () => window.gitHubSync.fetch(),
        push: (data) => window.gitHubSync.push(data),
        sync: () => window.gitHubSync.sync(),
        getStatus: () => window.gitHubSync.getStatus(),
        forceSync: () => window.gitHubSync.forceSync(),
        createBackup: () => window.gitHubSync.createBackup()
    };
}