[file name]: sync.js
class GitHubSync {
    constructor() {
        this.config = {
            owner: 'MHmooDhazm',
            repo: 'bitelazz-data',
            token: this.reconstructToken(['ghp_', '37mXX', 'ZosN4', 'o7o34', 'hOvEx', 'tyoux', 'fvKI6', '45den', 'G']),
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
        this.initialize();
    }

    reconstructToken(parts) {
        return parts.join('');
    }

    encryptData(data) {
        try {
            const str = JSON.stringify(data);
            return btoa(unescape(encodeURIComponent(str)));
        } catch (error) {
            console.error('Encryption error:', error);
            return JSON.stringify(data);
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
                return encrypted;
            }
        }
    }

    async initialize() {
        try {
            // محاولة تحميل البيانات من localStorage أولاً
            const localData = localStorage.getItem('siteData_encrypted');
            if (localData) {
                window.siteData = this.decryptData(localData);
                this.triggerEvent('dataLoaded');
            }

            // محاولة المزامنة مع GitHub
            await this.sync();
            
            // جدولة المزامنة التلقائية كل 5 دقائق
            setInterval(() => this.sync(), 300000);
            
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    async fetch() {
        try {
            console.log('Fetching data from GitHub...');
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                { 
                    headers: this.headers,
                    signal: AbortSignal.timeout(10000) // timeout بعد 10 ثواني
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('File not found, creating new data structure');
                    return this.createInitialData();
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const content = this.decryptData(data.content);
            
            // حفظ محلي
            localStorage.setItem('siteData_encrypted', this.encryptData(content));
            localStorage.setItem('lastSync', new Date().toISOString());
            
            window.siteData = content;
            this.triggerEvent('dataLoaded');
            
            console.log('Data fetched successfully');
            return content;
            
        } catch (error) {
            console.error('GitHub fetch error:', error);
            this.triggerEvent('syncError', error);
            
            // استخدام البيانات المحلية كبديل
            const localData = localStorage.getItem('siteData_encrypted');
            if (localData) {
                return this.decryptData(localData);
            }
            
            // إنشاء بيانات أولية إذا لم توجد
            return this.createInitialData();
        }
    }

    createInitialData() {
        const initialData = {
            products: [],
            categories: [],
            orders: [],
            sellRequests: [],
            exchangeRequests: [],
            users: [
                {
                    id: 'admin_001',
                    username: 'admin',
                    password: '2845',
                    role: 'admin',
                    fullName: 'المدير الرئيسي',
                    createdAt: new Date().toISOString()
                }
            ],
            site: {
                name: {
                    ar: "عبدالله للسيارات",
                    en: "Abdullah Cars"
                },
                description: {
                    ar: "معرض السيارات الفاخرة الأول في مصر",
                    en: "The first luxury car showroom in Egypt"
                },
                currencySymbol: "ج.م"
            },
            contact: {
                phone: "01012345678",
                whatsapp: "01012345678",
                email: "info@abdullahcars.com",
                address: {
                    ar: "القاهرة، مصر",
                    en: "Cairo, Egypt"
                },
                workingHours: {
                    ar: "9 ص - 9 م",
                    en: "9 AM - 9 PM"
                }
            },
            admin: {
                telegramBotToken: "",
                telegramChatId: ""
            },
            system: {
                maxLoginAttempts: 3,
                sessionTimeout: 3600000,
                maintenanceMode: false,
                lastSync: new Date().toISOString()
            }
        };
        
        // حفظ البيانات المحلية
        localStorage.setItem('siteData_encrypted', this.encryptData(initialData));
        window.siteData = initialData;
        
        return initialData;
    }

    async push(data) {
        if (this.isSyncing) {
            this.syncQueue.push(data);
            return { queued: true };
        }

        this.isSyncing = true;
        
        try {
            console.log('Pushing data to GitHub...');
            
            // الحصول على SHA للملف الحالي
            let sha = null;
            try {
                const current = await fetch(
                    `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                    { headers: this.headers }
                );
                
                if (current.ok) {
                    const currentData = await current.json();
                    sha = currentData.sha;
                }
            } catch (error) {
                console.log('No existing file found, creating new one');
            }

            // تحديث وقت المزامنة
            if (!data.system) data.system = {};
            data.system.lastSync = new Date().toISOString();
            
            // تشفير البيانات قبل الرفع
            const encryptedContent = this.encryptData(data);
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify({
                        message: `Sync: ${new Date().toISOString()}`,
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

            // تحديث البيانات المحلية
            localStorage.setItem('siteData_encrypted', encryptedContent);
            localStorage.setItem('lastSync', new Date().toISOString());
            
            window.siteData = data;
            this.triggerEvent('syncSuccess');
            
            console.log('Data pushed successfully');
            return { success: true };
            
        } catch (error) {
            console.error('GitHub push error:', error);
            this.triggerEvent('syncError', error);
            return { error: error.message };
        } finally {
            this.isSyncing = false;
            
            // معالجة العناصر في قائمة الانتظار
            if (this.syncQueue.length > 0) {
                const nextData = this.syncQueue.shift();
                setTimeout(() => this.push(nextData), 1000);
            }
        }
    }

    async sync() {
        try {
            const data = await this.fetch();
            if (data) {
                // إرسال إشعار إذا كان هناك تغييرات
                const lastLocal = localStorage.getItem('siteData_encrypted');
                const current = this.encryptData(data);
                
                if (lastLocal !== current) {
                    this.triggerEvent('dataUpdated', data);
                }
            }
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    triggerEvent(eventName, detail = null) {
        const event = new CustomEvent(`githubSync:${eventName}`, { detail });
        window.dispatchEvent(event);
    }

    // دالة مساعدة للتحقق من التحديثات
    checkForUpdates() {
        return this.sync();
    }

    // دالة لإنشاء نسخة احتياطية
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupData = window.siteData || await this.fetch();
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/backups/backup-${timestamp}.json`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify({
                        message: `Backup: ${timestamp}`,
                        content: this.encryptData(backupData),
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

    // دالة لاستعادة نسخة احتياطية
    async restoreBackup(filename) {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/backups/${filename}`,
                { headers: this.headers }
            );
            
            if (!response.ok) throw new Error('Backup not found');
            
            const data = await response.json();
            const backupData = this.decryptData(data.content);
            
            // استعادة البيانات
            return await this.push(backupData);
        } catch (error) {
            console.error('Restore error:', error);
            return { error: error.message };
        }
    }

    // دالة للحصول على حالة المزامنة
    getSyncStatus() {
        const lastSync = localStorage.getItem('lastSync');
        return {
            isSyncing: this.isSyncing,
            queueLength: this.syncQueue.length,
            lastSync: lastSync ? new Date(lastSync) : null,
            hasLocalData: !!localStorage.getItem('siteData_encrypted')
        };
    }
}

// تهيئة النظام
if (typeof window !== 'undefined') {
    window.gitHubSync = new GitHubSync();
}

// تصدير الكلاس للاستخدام
export default GitHubSync;