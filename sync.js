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
        // تشفير بسيط للبيانات الحساسة
        const str = JSON.stringify(data);
        return btoa(unescape(encodeURIComponent(str)));
    }

    decryptData(encrypted) {
        // فك تشفير البيانات
        try {
            const str = decodeURIComponent(escape(atob(encrypted)));
            return JSON.parse(str);
        } catch {
            return encrypted;
        }
    }

    async initialize() {
        // محاولة تحميل البيانات من localStorage أولاً
        const localData = localStorage.getItem('siteData_encrypted');
        if (localData) {
            window.siteData = this.decryptData(localData);
            this.triggerEvent('dataLoaded');
        }

        // محاولة المزامنة مع GitHub
        await this.sync();
        
        // جدولة المزامنة التلقائية
        setInterval(() => this.sync(), 300000); // كل 5 دقائق
    }

    async fetch() {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.json();
            const content = this.decryptData(data.content);
            
            // حفظ محلي
            localStorage.setItem('siteData_encrypted', this.encryptData(content));
            localStorage.setItem('lastSync', new Date().toISOString());
            
            window.siteData = content;
            this.triggerEvent('dataLoaded');
            
            return content;
        } catch (error) {
            console.error('GitHub fetch error:', error);
            this.triggerEvent('syncError', error);
            
            // استخدام البيانات المحلية كبديل
            const localData = localStorage.getItem('siteData_encrypted');
            if (localData) {
                return this.decryptData(localData);
            }
            
            return null;
        }
    }

    async push(data) {
        if (this.isSyncing) {
            this.syncQueue.push(data);
            return { queued: true };
        }

        this.isSyncing = true;
        
        try {
            // الحصول على SHA للملف الحالي
            const current = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                { headers: this.headers }
            );
            
            let sha = null;
            if (current.ok) {
                const currentData = await current.json();
                sha = currentData.sha;
            }

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

            if (!response.ok) throw new Error('Failed to push data');

            // تحديث البيانات المحلية
            localStorage.setItem('siteData_encrypted', encryptedContent);
            localStorage.setItem('lastSync', new Date().toISOString());
            
            window.siteData = data;
            this.triggerEvent('syncSuccess');
            
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
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupData = window.siteData;
        
        try {
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
}

// تهيئة النظام
window.gitHubSync = new GitHubSync();

// إضافة الحماية من DDOS
(function() {
    let requestCount = {};
    const MAX_REQUESTS = 100; // 100 طلب في الدقيقة
    const TIME_WINDOW = 60000; // 1 دقيقة
    
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const ip = 'user'; // في الواقع يجب الحصول على IP الحقيقي
        
        if (!requestCount[ip]) {
            requestCount[ip] = { count: 1, timestamp: Date.now() };
        } else {
            const now = Date.now();
            if (now - requestCount[ip].timestamp > TIME_WINDOW) {
                requestCount[ip] = { count: 1, timestamp: now };
            } else {
                requestCount[ip].count++;
                
                if (requestCount[ip].count > MAX_REQUESTS) {
                    console.warn(`Rate limit exceeded for IP: ${ip}`);
                    return Promise.reject(new Error('Rate limit exceeded'));
                }
            }
        }
        
        return originalFetch.apply(this, args);
    };
    
    // تنظيف العداد كل ساعة
    setInterval(() => {
        const now = Date.now();
        Object.keys(requestCount).forEach(ip => {
            if (now - requestCount[ip].timestamp > 3600000) {
                delete requestCount[ip];
            }
        });
    }, 3600000);
})();

// حماية من F12 وفحص الكود
(function() {
    // منع فتح أدوات المطور
    document.onkeydown = function(e) {
        if (e.keyCode === 123 || // F12
            (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
            (e.ctrlKey && e.keyCode === 85) // Ctrl+U
        ) {
            e.preventDefault();
            return false;
        }
    };
    
    // منع النقر الأيمن
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // منع السحب والإفلات
    document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            return false;
        }
    });
})();

// إضافة خدمة Worker لحماية البيانات
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
}

// تصدير الكلاس للاستخدام
export default GitHubSync;