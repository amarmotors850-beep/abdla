[file name]: sync.js
[file content begin]
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
        this.lastSyncTime = null;
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🚀 GitHub Sync Initializing...');
            console.log('📁 Repository:', `${this.config.owner}/${this.config.repo}`);
            console.log('📄 File:', this.config.filePath);
            
            // تحميل البيانات المحلية أولاً
            const localData = localStorage.getItem('siteData');
            if (localData) {
                try {
                    window.siteData = JSON.parse(localData);
                    console.log('📂 Loaded from localStorage');
                } catch (e) {
                    console.warn('⚠️ Invalid local data, using default');
                    window.siteData = this.createDefaultData();
                }
            } else {
                window.siteData = this.createDefaultData();
            }

            // محاولة المزامنة فوراً
            await this.sync();
            
            // جدولة المزامنة التلقائية كل 30 ثانية
            this.syncInterval = setInterval(() => {
                this.sync();
            }, 30000);
            
            // المزامنة عند اتصال الإنترنت
            window.addEventListener('online', () => {
                console.log('🌐 Online - Syncing...');
                this.sync();
            });
            
            // حفظ البيانات قبل إغلاق الصفحة
            window.addEventListener('beforeunload', () => {
                if (window.siteData) {
                    localStorage.setItem('siteData', JSON.stringify(window.siteData));
                    console.log('💾 Auto-saved to localStorage');
                }
            });
            
            console.log('✅ GitHub Sync Initialized');
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            window.siteData = this.createDefaultData();
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
                    "createdAt": "2024-01-01T00:00:00.000Z"
                }
            ],
            site: {
                "name": {
                    "ar": "سيارات عبدالله",
                    "en": "Abdullah Cars"
                },
                "description": {
                    "ar": "معرض السيارات الفاخرة الأول في مصر",
                    "en": "The first luxury car showroom in Egypt"
                },
                "currencySymbol": "ج.م"
            },
            contact: {
                "phone": "01012345678",
                "whatsapp": "01012345678",
                "email": "info@abdullahcars.com",
                "address": "القاهرة، مصر",
                "workingHours": "9 ص - 9 م"
            },
            system: {
                "lastSync": new Date().toISOString(),
                "createdAt": "2024-01-01T00:00:00.000Z",
                "version": "1.0.0"
            }
        };
    }

    async fetch() {
        if (this.isSyncing) {
            console.log('⏳ Already syncing, queuing request');
            return new Promise(resolve => {
                this.syncQueue.push(() => this.fetch().then(resolve));
            });
        }

        this.isSyncing = true;
        
        try {
            console.log('⬇️ Fetching from GitHub...');
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                { 
                    headers: this.headers,
                    cache: 'no-cache'
                }
            );

            console.log('📡 GitHub Response Status:', response.status);

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('📭 File not found on GitHub - Creating new file');
                    const defaultData = this.createDefaultData();
                    // محاولة إنشاء الملف إذا لم يكن موجوداً
                    await this.push(defaultData);
                    return defaultData;
                }
                const errorText = await response.text();
                console.error('❌ GitHub Error:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            
            if (!result.content) {
                throw new Error('No content in response');
            }

            // فك Base64 بدون تشفير
            const decodedContent = atob(result.content.replace(/\n/g, ''));
            const data = JSON.parse(decodedContent);
            
            console.log('✅ Fetch successful - Data size:', decodedContent.length, 'bytes');
            
            // حفظ محلياً
            localStorage.setItem('siteData', decodedContent);
            localStorage.setItem('lastFetch', new Date().toISOString());
            
            window.siteData = data;
            this.lastSyncTime = new Date();
            
            this.triggerEvent('dataChanged', data);
            
            return data;
            
        } catch (error) {
            console.error('❌ Fetch error:', error);
            
            // استخدام البيانات المحلية في حالة الفشل
            const localData = localStorage.getItem('siteData');
            if (localData) {
                try {
                    console.log('📂 Falling back to local data');
                    return JSON.parse(localData);
                } catch (e) {
                    console.warn('⚠️ Invalid local data, using default');
                }
            }
            
            const defaultData = this.createDefaultData();
            window.siteData = defaultData;
            return defaultData;
            
        } finally {
            this.isSyncing = false;
            
            // معالجة الطلبات في قائمة الانتظار
            if (this.syncQueue.length > 0) {
                const next = this.syncQueue.shift();
                setTimeout(() => next(), 100);
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
        
        try {
            console.log('⬆️ Pushing to GitHub...');
            
            // تحديث وقت المزامنة
            if (!data.system) data.system = {};
            data.system.lastSync = new Date().toISOString();
            data.system.lastPush = new Date().toISOString();
            
            const jsonStr = JSON.stringify(data, null, 2);
            console.log('📊 Data to push:', jsonStr.length, 'bytes');
            
            // تحويل إلى Base64 بدون تشفير
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
                console.log('📭 No existing file found - Will create new file');
            }

            const commitMessage = data.system && data.system.lastPush 
                ? `Auto-update: ${new Date().toLocaleString('ar-EG')}`
                : `Initial commit: ${new Date().toLocaleString('ar-EG')}`;

            const requestBody = {
                message: commitMessage,
                content: base64Content,
                branch: this.config.branch
            };

            // إضافة SHA فقط إذا كان الملف موجوداً
            if (sha) {
                requestBody.sha = sha;
            }

            console.log('📤 Sending to GitHub...');
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify(requestBody)
                }
            );

            const responseText = await response.text();
            console.log('📡 Push Response Status:', response.status);
            
            if (!response.ok) {
                console.error('❌ Push failed:', responseText);
                throw new Error(`Push failed: ${response.status}`);
            }

            console.log('✅ Push successful');
            
            // حفظ محلياً
            localStorage.setItem('siteData', jsonStr);
            localStorage.setItem('lastPush', new Date().toISOString());
            
            window.siteData = data;
            this.lastSyncTime = new Date();
            
            this.triggerEvent('dataPushed', data);
            
            return { 
                success: true, 
                timestamp: new Date().toISOString(),
                commitMessage: commitMessage
            };
            
        } catch (error) {
            console.error('❌ Push error:', error);
            
            // حفظ محلياً حتى لو فشلت المزامنة مع GitHub
            const jsonStr = JSON.stringify(data, null, 2);
            localStorage.setItem('siteData', jsonStr);
            window.siteData = data;
            
            console.log('💾 Saved locally despite GitHub error');
            
            return { 
                success: false, 
                error: error.message,
                localSaved: true,
                timestamp: new Date().toISOString()
            };
            
        } finally {
            this.isSyncing = false;
            
            // معالجة الطلبات في قائمة الانتظار
            if (this.syncQueue.length > 0) {
                const next = this.syncQueue.shift();
                setTimeout(() => next(), 100);
            }
        }
    }

    async sync() {
        try {
            console.log('🔄 Starting sync process...');
            const data = await this.fetch();
            
            // المقارنة مع البيانات المحلية
            const localData = localStorage.getItem('siteData');
            if (localData) {
                try {
                    const localParsed = JSON.parse(localData);
                    const localStr = JSON.stringify(localParsed);
                    const remoteStr = JSON.stringify(data);
                    
                    if (localStr !== remoteStr) {
                        console.log('🔄 Data changed, updating locally...');
                        this.triggerEvent('dataChanged', data);
                    }
                } catch (e) {
                    console.warn('⚠️ Could not compare data:', e);
                }
            }
            
            console.log('✅ Sync completed');
            return data;
            
        } catch (error) {
            console.error('❌ Sync error:', error);
            throw error;
        }
    }

    triggerEvent(eventName, detail) {
        const event = new CustomEvent(`githubSync:${eventName}`, { detail });
        window.dispatchEvent(event);
        console.log(`🔔 Event triggered: githubSync:${eventName}`);
    }

    getStatus() {
        return {
            isSyncing: this.isSyncing,
            queueLength: this.syncQueue.length,
            lastSync: this.lastSyncTime,
            lastFetch: localStorage.getItem('lastFetch'),
            lastPush: localStorage.getItem('lastPush'),
            hasLocalData: !!localStorage.getItem('siteData'),
            dataSize: localStorage.getItem('siteData') ? localStorage.getItem('siteData').length : 0
        };
    }

    clearLocalData() {
        localStorage.removeItem('siteData');
        localStorage.removeItem('lastFetch');
        localStorage.removeItem('lastPush');
        window.siteData = this.createDefaultData();
        console.log('🗑️ Local data cleared');
    }

    cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            console.log('🛑 Sync interval cleared');
        }
    }

    async forceSync() {
        console.log('⚡ Force sync requested');
        return await this.sync();
    }

    async createBackup() {
        try {
            const data = window.siteData || await this.fetch();
            const backupName = `backup-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
            
            const backupData = JSON.stringify(data, null, 2);
            const base64Backup = btoa(unescape(encodeURIComponent(backupData)));
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/backups/${backupName}`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify({
                        message: `Backup: ${backupName}`,
                        content: base64Backup,
                        branch: this.config.branch
                    })
                }
            );
            
            if (response.ok) {
                console.log(`✅ Backup created: ${backupName}`);
                return true;
            } else {
                console.error('❌ Backup failed:', await response.text());
                return false;
            }
        } catch (error) {
            console.error('❌ Backup error:', error);
            
            // حفظ نسخة احتياطية محلياً
            try {
                const data = window.siteData || await this.fetch();
                const backupName = `backup-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
                const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = backupName;
                a.click();
                URL.revokeObjectURL(url);
                console.log(`💾 Local backup created: ${backupName}`);
                return true;
            } catch (e) {
                console.error('❌ Local backup failed:', e);
                return false;
            }
        }
    }
}

// تهيئة النظام عند تحميل الصفحة
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.gitHubSync = new GitHubSync();
        
        // واجهة برمجة تطبيقات عامة
        window.GitHubSyncService = {
            fetch: () => window.gitHubSync.fetch(),
            push: (data) => window.gitHubSync.push(data),
            sync: () => window.gitHubSync.sync(),
            getStatus: () => window.gitHubSync.getStatus(),
            forceSync: () => window.gitHubSync.forceSync(),
            createBackup: () => window.gitHubSync.createBackup(),
            clearLocalData: () => window.gitHubSync.clearLocalData()
        };
        
        console.log('🎉 GitHub Sync Service Ready');
    });
}
[file content end]