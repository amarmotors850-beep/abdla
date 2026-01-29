
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
        
        console.log('🚀 GitHubSync initialized with token:', this.config.token.substring(0, 8) + '...');
    }

    async initialize() {
        try {
            console.log('🔧 GitHub Sync Initializing...');
            
            // تحميل البيانات المحلية أولاً
            const localData = localStorage.getItem('siteData');
            if (localData) {
                try {
                    window.siteData = JSON.parse(localData);
                    console.log('📦 Loaded from localStorage');
                } catch (e) {
                    console.warn('Invalid local data, creating default');
                    window.siteData = this.createDefaultData();
                }
            } else {
                window.siteData = this.createDefaultData();
            }

            // محاولة المزامنة بعد ثانية
            setTimeout(() => this.sync(), 1000);
            
            // المزامنة التلقائية كل 30 ثانية
            this.syncInterval = setInterval(() => this.sync(), 30000);
            
        } catch (error) {
            console.error('Initialization error:', error);
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
                    "createdAt": "2024-01-01T00:00:00.000Z"
                }
            ],
            site: {
                name: {
                    ar: "سيارات عبدالله",
                    en: "Abdullah Cars"
                },
                description: {
                    ar: "معرض السيارات الفاخرة",
                    en: "Luxury Car Showroom"
                },
                currencySymbol: "ج.م"
            },
            contact: {
                phone: "",
                whatsapp: "",
                email: "",
                address: "",
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
            console.log('⏳ Already syncing, queuing fetch');
            return new Promise(resolve => {
                this.syncQueue.push(() => this.fetch().then(resolve));
            });
        }

        this.isSyncing = true;
        console.log('⬇️ Fetching from GitHub...');
        
        try {
            // أولاً: تحقق مما إذا كان الملف موجوداً
            const url = `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`;
            console.log('🌐 Fetch URL:', url);
            
            const response = await fetch(url, {
                headers: this.headers,
                cache: 'no-cache'
            });

            console.log('📊 Response status:', response.status);

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('📭 File not found on GitHub, creating initial file');
                    const defaultData = this.createDefaultData();
                    await this.push(defaultData);
                    return defaultData;
                }
                
                const errorText = await response.text();
                console.error('❌ GitHub API Error:', errorText);
                throw new Error(`GitHub API Error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            
            if (!result.content) {
                throw new Error('No content in response');
            }

            // فك Base64
            const decodedContent = atob(result.content.replace(/\n/g, ''));
            const data = JSON.parse(decodedContent);
            
            console.log('✅ Fetch successful! Data loaded:', data.products?.length || 0, 'products');
            
            // حفظ محلياً
            localStorage.setItem('siteData', decodedContent);
            localStorage.setItem('lastFetch', new Date().toISOString());
            
            window.siteData = data;
            
            // إطلاق حدث تحديث البيانات
            this.triggerEvent('dataChanged', data);
            
            return data;
            
        } catch (error) {
            console.error('❌ Fetch error:', error);
            
            // استخدام البيانات المحلية كحل بديل
            const localData = localStorage.getItem('siteData');
            if (localData) {
                try {
                    return JSON.parse(localData);
                } catch (e) {
                    console.warn('Failed to parse local data');
                }
            }
            
            return this.createDefaultData();
            
        } finally {
            this.isSyncing = false;
            
            // معالجة الطلبات في قائمة الانتظار
            if (this.syncQueue.length > 0) {
                const next = this.syncQueue.shift();
                setTimeout(next, 100);
            }
        }
    }

    async push(data) {
        if (this.isSyncing) {
            console.log('⏳ Already syncing, queuing push');
            return new Promise((resolve, reject) => {
                this.syncQueue.push(() => this.push(data).then(resolve).catch(reject));
            });
        }

        this.isSyncing = true;
        console.log('⬆️ Pushing to GitHub...');
        
        try {
            // تحديث وقت المزامنة
            if (!data.system) data.system = {};
            data.system.lastSync = new Date().toISOString();
            
            const jsonStr = JSON.stringify(data, null, 2);
            console.log('📊 Data size:', jsonStr.length, 'characters');
            
            // تحويل إلى Base64
            const base64Content = btoa(unescape(encodeURIComponent(jsonStr)));
            
            // الحصول على SHA للملف الحالي إن وجد
            let sha = null;
            try {
                const currentResponse = await fetch(
                    `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                    { headers: this.headers }
                );
                
                if (currentResponse.ok) {
                    const currentData = await currentResponse.json();
                    sha = currentData.sha;
                    console.log('🔑 Got existing file SHA');
                }
            } catch (error) {
                console.log('📭 No existing file found - will create new');
            }

            const commitMessage = `Auto-update: ${new Date().toLocaleString('ar-EG')}`;
            
            const requestBody = {
                message: commitMessage,
                content: base64Content,
                branch: this.config.branch
            };

            if (sha) {
                requestBody.sha = sha;
            }

            console.log('📤 Sending update to GitHub...');
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify(requestBody)
                }
            );

            const responseText = await response.text();
            
            if (!response.ok) {
                console.error('❌ Push failed:', responseText);
                
                // حاول حفظ البيانات محلياً فقط
                localStorage.setItem('siteData', jsonStr);
                window.siteData = data;
                
                throw new Error(`Push failed: ${response.status}`);
            }

            console.log('✅ Push successful!');
            
            // حفظ محلياً
            localStorage.setItem('siteData', jsonStr);
            localStorage.setItem('lastPush', new Date().toISOString());
            
            window.siteData = data;
            
            // إطلاق حدث
            this.triggerEvent('dataPushed', data);
            
            return { 
                success: true, 
                timestamp: new Date().toISOString(),
                message: commitMessage
            };
            
        } catch (error) {
            console.error('❌ Push error:', error);
            
            // حاول حفظ البيانات محلياً على الأقل
            try {
                const jsonStr = JSON.stringify(data, null, 2);
                localStorage.setItem('siteData', jsonStr);
                window.siteData = data;
                console.log('💾 Saved locally despite GitHub error');
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
            
            // معالجة الطلبات في قائمة الانتظار
            if (this.syncQueue.length > 0) {
                const next = this.syncQueue.shift();
                setTimeout(next, 100);
            }
        }
    }

    async sync() {
        try {
            console.log('🔄 Starting sync...');
            const data = await this.fetch();
            console.log('✅ Sync completed');
            return data;
        } catch (error) {
            console.error('❌ Sync error:', error);
            return null;
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
    
    console.log('🎉 GitHub Sync Service Ready!');
}