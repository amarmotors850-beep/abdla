
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
            'Authorization': `Bearer ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        this.isSyncing = false;
        this.syncQueue = [];
        this.syncInterval = null;
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🚀 GitHub Sync Starting...');
            
            // اختبار الاتصال أولاً
            await this.testConnection();
            
            // تحميل البيانات المحلية
            const localData = localStorage.getItem('siteData');
            if (localData) {
                try {
                    const parsedData = JSON.parse(localData);
                    window.siteData = parsedData;
                    console.log('📦 Loaded from localStorage');
                } catch (e) {
                    console.warn('⚠️ Invalid local data, fetching from GitHub');
                    await this.fetch();
                }
            } else {
                await this.fetch();
            }
            
            // بدء المزامنة التلقائية كل 30 ثانية
            this.syncInterval = setInterval(() => this.sync(), 30000);
            
            console.log('✅ GitHub Sync Ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            window.siteData = this.createDefaultData();
        }
    }

    async testConnection() {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}`,
                { headers: this.headers }
            );
            
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status}`);
            }
            
            console.log('✅ Connected to GitHub');
            return true;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            throw error;
        }
    }

    createDefaultData() {
        return {
            products: [],
            brands: [],
            orders: [],
            sellRequests: [],
            exchangeRequests: [],
            users: [
                {
                    "id": "admin_001",
                    "username": "admin",
                    "password": "2845",
                    "role": "admin",
                    "fullName": "المدير الرئيسي",
                    "permissions": ["all"],
                    "createdAt": new Date().toISOString()
                }
            ],
            site: {
                name: { ar: "سيارات عبدالله", en: "Abdullah Cars" },
                description: { ar: "معرض السيارات الفاخرة", en: "Luxury Car Showroom" },
                currencySymbol: "ج.م"
            },
            contact: {
                phone: "01012345678",
                whatsapp: "01012345678",
                email: "info@abdullahcars.com",
                address: "القاهرة، مصر",
                workingHours: "9 ص - 9 م"
            },
            system: {
                lastSync: new Date().toISOString(),
                version: "1.0.0"
            }
        };
    }

    async fetch() {
        if (this.isSyncing) {
            return new Promise(resolve => {
                this.syncQueue.push(() => this.fetch().then(resolve));
            });
        }

        this.isSyncing = true;
        
        try {
            console.log('⬇️ Fetching from GitHub...');
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                { headers: this.headers }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('📝 Creating initial data file...');
                    const defaultData = this.createDefaultData();
                    const result = await this.push(defaultData);
                    if (result.success) {
                        return defaultData;
                    }
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.content) {
                throw new Error('No content received');
            }

            // فك Base64
            const decodedContent = atob(result.content);
            const data = JSON.parse(decodedContent);
            
            // حفظ محلياً
            localStorage.setItem('siteData', decodedContent);
            localStorage.setItem('lastFetch', new Date().toISOString());
            
            window.siteData = data;
            console.log('✅ Fetched successfully:', {
                products: data.products?.length || 0,
                brands: data.brands?.length || 0,
                users: data.users?.length || 0
            });
            
            // إطلاق حدث تحديث البيانات
            this.triggerEvent('dataChanged', data);
            
            return data;
            
        } catch (error) {
            console.error('❌ Fetch failed:', error);
            
            // استخدام البيانات المحلية
            const localData = localStorage.getItem('siteData');
            if (localData) {
                try {
                    return JSON.parse(localData);
                } catch (e) {
                    console.warn('⚠️ Local data corrupted');
                }
            }
            
            return this.createDefaultData();
            
        } finally {
            this.isSyncing = false;
            this.processQueue();
        }
    }

    async push(data) {
        if (this.isSyncing) {
            return new Promise((resolve, reject) => {
                this.syncQueue.push(() => this.push(data).then(resolve).catch(reject));
            });
        }

        this.isSyncing = true;
        
        try {
            console.log('⬆️ Pushing to GitHub...');
            
            // تحديث وقت المزامنة
            if (!data.system) data.system = {};
            data.system.lastSync = new Date().toISOString();
            data.system.lastPush = new Date().toISOString();
            
            const jsonStr = JSON.stringify(data, null, 2);
            const base64Content = btoa(unescape(encodeURIComponent(jsonStr)));
            
            // الحصول على SHA الحالي
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
                console.log('📝 Creating new file');
            }

            const commitMessage = `Update: ${new Date().toLocaleString('ar-EG')}`;
            
            const requestBody = {
                message: commitMessage,
                content: base64Content,
                branch: this.config.branch
            };

            if (sha) {
                requestBody.sha = sha;
            }

            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Push failed: ${response.status} - ${errorText}`);
            }

            // حفظ محلياً
            localStorage.setItem('siteData', jsonStr);
            localStorage.setItem('lastPush', new Date().toISOString());
            
            window.siteData = data;
            
            console.log('✅ Push successful');
            
            this.triggerEvent('dataPushed', data);
            
            return { 
                success: true, 
                timestamp: new Date().toISOString(),
                message: commitMessage 
            };
            
        } catch (error) {
            console.error('❌ Push failed:', error);
            
            // حفظ محلياً على الأقل
            try {
                const jsonStr = JSON.stringify(data, null, 2);
                localStorage.setItem('siteData', jsonStr);
                window.siteData = data;
                console.log('💾 Saved locally');
            } catch (e) {
                console.error('Failed to save locally:', e);
            }
            
            return { 
                success: false, 
                error: error.message,
                localSaved: true 
            };
            
        } finally {
            this.isSyncing = false;
            this.processQueue();
        }
    }

    async sync() {
        try {
            const data = await this.fetch();
            
            // المقارنة مع البيانات المحلية
            const localData = localStorage.getItem('siteData');
            if (localData) {
                const localParsed = JSON.parse(localData);
                if (JSON.stringify(localParsed) !== JSON.stringify(data)) {
                    console.log('🔄 Data changed, updating...');
                    this.triggerEvent('dataChanged', data);
                }
            }
            
            return data;
        } catch (error) {
            console.error('❌ Sync failed:', error);
            return null;
        }
    }

    processQueue() {
        if (this.syncQueue.length > 0 && !this.isSyncing) {
            const next = this.syncQueue.shift();
            setTimeout(next, 100);
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
            lastFetch: localStorage.getItem('lastFetch'),
            lastPush: localStorage.getItem('lastPush'),
            dataSize: localStorage.getItem('siteData') ? localStorage.getItem('siteData').length : 0
        };
    }

    cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }
}

// التهيئة التلقائية
if (typeof window !== 'undefined') {
    window.gitHubSync = new GitHubSync();
    
    window.GitHubSyncService = {
        fetch: () => window.gitHubSync.fetch(),
        push: (data) => window.gitHubSync.push(data),
        sync: () => window.gitHubSync.sync(),
        getStatus: () => window.gitHubSync.getStatus(),
        forceSync: () => window.gitHubSync.sync()
    };
    
    console.log('🎉 GitHub Sync Service Ready');
}