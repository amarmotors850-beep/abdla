/**
 * نظام مزامنة GitHub - سيارات عبدالله
 * بدون تشفير - يعمل عبر صفحة الإعدادات فقط
 * الإصدار: 6.0.0
 */

class GitHubSync {
    constructor() {
        this.config = {
            owner: '',
            repo: '',
            branch: 'main',
            dataFile: 'site-data.json',
            token: ''
        };
        this.baseURL = 'https://api.github.com';
        this.state = {
            isInitialized: false,
            isSyncing: false,
            lastSync: null,
            lastError: null
        };
        this.cache = {
            data: null,
            sha: null
        };
    }

    // تهيئة الإعدادات من localStorage
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('github_sync_config');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsed };
                return true;
            }
        } catch (e) {
            console.error('خطأ في تحميل الإعدادات:', e);
        }
        return false;
    }

    // حفظ الإعدادات
    saveConfig(config) {
        try {
            this.config = { ...this.config, ...config };
            localStorage.setItem('github_sync_config', JSON.stringify(this.config));
            return true;
        } catch (e) {
            console.error('خطأ في حفظ الإعدادات:', e);
            return false;
        }
    }

    // التحقق من صحة التوكن
    async validateToken(token) {
        if (!token || token.trim() === '') {
            return { valid: false, error: 'التوكن مطلوب' };
        }

        try {
            const response = await fetch(`https://api.github.com/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                return { valid: false, error: `خطأ في التوكن: ${response.status}` };
            }

            const user = await response.json();
            return { valid: true, username: user.login };
        } catch (error) {
            return { valid: false, error: 'فشل الاتصال: ' + error.message };
        }
    }

    // جلب البيانات من GitHub
    async fetchFromGitHub() {
        if (!this.config.token || !this.config.owner || !this.config.repo) {
            throw new Error('إعدادات GitHub غير مكتملة');
        }

        const url = `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/${this.config.dataFile}?_=${Date.now()}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`فشل الجلب: ${response.status}`);
            }

            const data = await response.json();

            // الحصول على SHA للملف
            const shaResponse = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.dataFile}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (shaResponse.ok) {
                const shaData = await shaResponse.json();
                this.cache.sha = shaData.sha;
            }

            return data;
        } catch (error) {
            throw new Error('فشل الاتصال بـ GitHub: ' + error.message);
        }
    }

    // دفع البيانات إلى GitHub
    async pushToGitHub(data) {
        if (!this.config.token || !this.config.owner || !this.config.repo) {
            throw new Error('إعدادات GitHub غير مكتملة');
        }

        try {
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
            const commitMessage = `تحديث البيانات ${new Date().toLocaleString('ar-EG')}`;

            const requestBody = {
                message: commitMessage,
                content: content,
                branch: this.config.branch
            };

            if (this.cache.sha) {
                requestBody.sha = this.cache.sha;
            }

            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.dataFile}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                throw new Error(`فشل الدفع: ${response.status}`);
            }

            const result = await response.json();
            this.cache.sha = result.content.sha;
            return true;
        } catch (error) {
            throw new Error('فشل الحفظ على GitHub: ' + error.message);
        }
    }

    // مزامنة البيانات (جلب)
    async sync() {
        if (this.state.isSyncing) return this.cache.data;
        
        this.state.isSyncing = true;
        
        try {
            this.loadConfig();
            
            if (!this.config.token) {
                throw new Error('لا يوجد توكن');
            }

            const data = await this.fetchFromGitHub();
            
            // حفظ محلياً
            localStorage.setItem('abdullah_cars_data', JSON.stringify(data));
            this.cache.data = data;
            
            this.state.lastSync = new Date().toISOString();
            this.state.lastError = null;
            
            return data;
        } catch (error) {
            this.state.lastError = error.message;
            
            // محاولة قراءة البيانات المحلية
            const localData = localStorage.getItem('abdullah_cars_data');
            if (localData) {
                this.cache.data = JSON.parse(localData);
                return this.cache.data;
            }
            
            throw error;
        } finally {
            this.state.isSyncing = false;
        }
    }

    // حفظ البيانات (دفع)
    async save(data) {
        this.state.isSyncing = true;
        
        try {
            this.loadConfig();
            
            if (!this.config.token) {
                throw new Error('لا يوجد توكن');
            }

            data.lastUpdated = new Date().toISOString();
            data.version = "6.0.0";
            
            // حفظ محلياً أولاً
            localStorage.setItem('abdullah_cars_data', JSON.stringify(data));
            this.cache.data = data;
            
            // دفع إلى GitHub
            const success = await this.pushToGitHub(data);
            
            this.state.lastSync = new Date().toISOString();
            
            return { success, local: true, github: success };
        } catch (error) {
            this.state.lastError = error.message;
            
            // حفظ محلياً فقط
            localStorage.setItem('abdullah_cars_data', JSON.stringify(data));
            this.cache.data = data;
            
            return { success: false, local: true, github: false, error: error.message };
        } finally {
            this.state.isSyncing = false;
        }
    }

    // رفع صورة
    async uploadImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve({
                    success: true,
                    url: reader.result,
                    name: file.name,
                    local: true
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // الحصول على حالة النظام
    getStatus() {
        this.loadConfig();
        return {
            initialized: !!this.config.token,
            syncing: this.state.isSyncing,
            lastSync: this.state.lastSync,
            lastError: this.state.lastError,
            config: {
                owner: this.config.owner,
                repo: this.config.repo,
                branch: this.config.branch,
                hasToken: !!this.config.token
            }
        };
    }

    // جلب البيانات من localStorage
    getLocalData() {
        const data = localStorage.getItem('abdullah_cars_data');
        return data ? JSON.parse(data) : null;
    }
}

// تهيئة النظام
window.GitHubSync = new GitHubSync();

// تحميل الإعدادات عند بدء التشغيل
window.GitHubSync.loadConfig();