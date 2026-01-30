/**
 * نظام مزامنة GitHub المتقدم - سيارات عبدالله
 * نظام متكامل للقراءة، الكتابة، التعديل، والحذف مع GitHub
 * إصدار 3.0.0
 */

class AdvancedGitHubSync {
    constructor(config = {}) {
        this.config = {
            owner: 'MHmooDhazm',
            repo: 'bitelazz-data',
            token: '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',
            branch: 'main',
            filePath: 'site-data.json',
            ...config
        };
        
        this.baseURL = 'https://api.github.com';
        this.headers = {
            'Authorization': `Bearer ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        this.state = {
            isInitialized: false,
            isSyncing: false,
            lastSync: null,
            lastError: null,
            retryCount: 0,
            maxRetries: 3
        };
        
        this.cache = {
            data: null,
            sha: null,
            etag: null
        };
        
        this.events = {
            onSyncStart: [],
            onSyncComplete: [],
            onSyncError: [],
            onDataChanged: []
        };
        
        console.log('🚀 GitHub Sync Pro جاري التحميل...');
    }
    
    // ============ التهيئة ============
    async initialize() {
        try {
            console.log('🔧 جاري تهيئة النظام المتقدم...');
            
            // التحقق من التوكن
            const isValid = await this.validateToken();
            if (!isValid) {
                throw new Error('التوكن غير صالح أو انتهت صلاحيته');
            }
            
            // جلب البيانات الأولية
            await this.fetchData();
            
            this.state.isInitialized = true;
            this.state.lastSync = new Date().toISOString();
            
            console.log('✅ تم تهيئة النظام بنجاح');
            this.dispatchEvent('initialized', { success: true });
            
            // بدء المزامنة التلقائية
            this.startAutoSync();
            
            return true;
            
        } catch (error) {
            console.error('❌ فشل التهيئة:', error);
            this.state.lastError = error.message;
            
            // محاولة استخدام البيانات المحلية
            await this.loadFromLocalStorage();
            
            return false;
        }
    }
    
    // ============ التحقق من التوكن ============
    async validateToken() {
        try {
            const response = await this.request('/user');
            return response.ok;
        } catch (error) {
            console.error('❌ خطأ في التحقق من التوكن:', error);
            return false;
        }
    }
    
    // ============ جلب البيانات ============
    async fetchData() {
        this.state.isSyncing = true;
        this.dispatchEvent('syncStart', { type: 'fetch' });
        
        try {
            console.log('📥 جاري جلب البيانات من GitHub...');
            
            // المحاولة 1: جلب من GitHub
            const githubData = await this.fetchFromGitHub();
            
            if (githubData) {
                this.cache.data = githubData.data;
                this.cache.sha = githubData.sha;
                this.cache.etag = githubData.etag;
                
                // حفظ محلياً
                this.saveToLocalStorage(githubData.data);
                
                console.log('✅ تم جلب البيانات من GitHub:', {
                    products: githubData.data.products?.length || 0,
                    brands: githubData.data.brands?.length || 0,
                    users: githubData.data.users?.length || 0
                });
                
                this.dispatchEvent('syncComplete', {
                    type: 'fetch',
                    source: 'github',
                    data: githubData.data
                });
                
                return githubData.data;
            }
            
            // المحاولة 2: إنشاء ملف جديد
            console.log('📝 إنشاء ملف بيانات جديد...');
            const defaultData = this.createDefaultData();
            const created = await this.createFile(defaultData);
            
            if (created) {
                this.cache.data = defaultData;
                this.saveToLocalStorage(defaultData);
                
                console.log('✅ تم إنشاء ملف جديد على GitHub');
                
                this.dispatchEvent('syncComplete', {
                    type: 'create',
                    source: 'github',
                    data: defaultData
                });
                
                return defaultData;
            }
            
            throw new Error('فشل في جلب أو إنشاء البيانات');
            
        } catch (error) {
            console.error('❌ فشل جلب البيانات:', error);
            
            // المحاولة 3: استخدام البيانات المحلية
            const localData = await this.loadFromLocalStorage();
            if (localData) {
                this.cache.data = localData;
                
                this.dispatchEvent('syncComplete', {
                    type: 'fetch',
                    source: 'local',
                    data: localData,
                    warning: 'استخدام البيانات المحلية'
                });
                
                return localData;
            }
            
            // المحاولة 4: استخدام بيانات افتراضية
            const defaultData = this.createDefaultData();
            this.cache.data = defaultData;
            this.saveToLocalStorage(defaultData);
            
            this.dispatchEvent('syncError', {
                type: 'fetch',
                error: error.message,
                fallback: 'default'
            });
            
            return defaultData;
            
        } finally {
            this.state.isSyncing = false;
            this.state.lastSync = new Date().toISOString();
        }
    }
    
    async fetchFromGitHub() {
        try {
            const response = await this.request(
                `/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    headers: {
                        'If-None-Match': this.cache.etag || ''
                    }
                }
            );
            
            if (response.status === 304) {
                console.log('📦 البيانات لم تتغير (304)');
                return null;
            }
            
            if (response.status === 404) {
                console.log('📝 الملف غير موجود على GitHub');
                return null;
            }
            
            if (!response.ok) {
                throw new Error(`فشل الجلب: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.content) {
                throw new Error('لا يوجد محتوى في الملف');
            }
            
            // فك الترميز
            const decodedContent = this.base64Decode(result.content);
            const data = JSON.parse(decodedContent);
            
            return {
                data: data,
                sha: result.sha,
                etag: response.headers.get('etag')
            };
            
        } catch (error) {
            console.error('❌ خطأ في جلب البيانات من GitHub:', error);
            return null;
        }
    }
    
    // ============ حفظ البيانات ============
    async save(data) {
        if (this.state.isSyncing) {
            return await this.queueSave(data);
        }
        
        this.state.isSyncing = true;
        this.dispatchEvent('syncStart', { type: 'save' });
        
        try {
            console.log('💾 جاري حفظ البيانات على GitHub...');
            
            // تحديث البيانات
            data.lastUpdated = new Date().toISOString();
            data.version = data.version || "2.0.0";
            
            // التحقق من البيانات
            this.validateData(data);
            
            // إعداد طلب الحفظ
            const commitMessage = `🔄 تحديث البيانات: ${new Date().toLocaleString('ar-EG')}
            
تم التحديث بواسطة: ${currentUser?.fullName || 'النظام'}
الوقت: ${new Date().toLocaleString('ar-EG')}
التغييرات: ${this.getChangesSummary(this.cache.data, data)}`;
            
            const requestBody = {
                message: commitMessage,
                content: this.base64Encode(JSON.stringify(data, null, 2)),
                branch: this.config.branch,
                sha: this.cache.sha
            };
            
            // إرسال الطلب
            console.log('📤 جاري رفع البيانات...');
            const response = await this.request(
                `/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(requestBody)
                }
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'فشل الحفظ');
            }
            
            const result = await response.json();
            
            // تحديث الكاش
            this.cache.data = data;
            this.cache.sha = result.content.sha;
            window.siteData = data;
            
            // حفظ محلياً
            this.saveToLocalStorage(data);
            
            console.log('✅ تم الحفظ على GitHub بنجاح');
            
            this.dispatchEvent('syncComplete', {
                type: 'save',
                source: 'github',
                data: data,
                commit: result.commit
            });
            
            this.dispatchEvent('dataChanged', {
                type: 'update',
                data: data
            });
            
            return {
                success: true,
                github: true,
                local: true,
                commit: result.commit,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ فشل الحفظ على GitHub:', error);
            
            // حفظ محلي كبديل
            try {
                this.saveToLocalStorage(data);
                this.cache.data = data;
                window.siteData = data;
                
                console.log('💾 تم الحفظ محلياً كبديل');
                
                this.dispatchEvent('syncComplete', {
                    type: 'save',
                    source: 'local',
                    data: data,
                    warning: 'تم الحفظ محلياً فقط'
                });
                
                this.dispatchEvent('dataChanged', {
                    type: 'update',
                    data: data
                });
                
                return {
                    success: true,
                    github: false,
                    local: true,
                    timestamp: new Date().toISOString()
                };
                
            } catch (localError) {
                console.error('❌ فشل الحفظ المحلي:', localError);
                
                this.dispatchEvent('syncError', {
                    type: 'save',
                    error: `${error.message} | ${localError.message}`,
                    data: data
                });
                
                return {
                    success: false,
                    error: 'فشل الحفظ على GitHub والمحلي'
                };
            }
            
        } finally {
            this.state.isSyncing = false;
            this.state.lastSync = new Date().toISOString();
            this.state.retryCount = 0;
        }
    }
    
    async queueSave(data) {
        return new Promise((resolve) => {
            const attemptSave = async () => {
                if (!this.state.isSyncing) {
                    const result = await this.save(data);
                    resolve(result);
                } else {
                    setTimeout(attemptSave, 1000);
                }
            };
            attemptSave();
        });
    }
    
    // ============ المزامنة ============
    async sync() {
        console.log('🔄 جاري المزامنة...');
        
        try {
            // جلب البيانات من GitHub
            const githubData = await this.fetchFromGitHub();
            
            if (!githubData) {
                console.log('⚠️ لا توجد بيانات على GitHub');
                return this.cache.data || await this.loadFromLocalStorage();
            }
            
            // مقارنة البيانات
            const localData = this.cache.data || await this.loadFromLocalStorage();
            
            if (localData) {
                const githubTime = new Date(githubData.data.lastUpdated || 0).getTime();
                const localTime = new Date(localData.lastUpdated || 0).getTime();
                
                // إذا كانت البيانات المحلية أحدث
                if (localTime > githubTime) {
                    console.log('⬆️ البيانات المحلية أحدث، جاري الرفع...');
                    const saveResult = await this.save(localData);
                    
                    if (saveResult.success) {
                        return localData;
                    }
                }
            }
            
            // استخدام بيانات GitHub
            this.cache.data = githubData.data;
            this.cache.sha = githubData.sha;
            this.cache.etag = githubData.etag;
            
            window.siteData = githubData.data;
            this.saveToLocalStorage(githubData.data);
            
            console.log('✅ تمت المزامنة بنجاح');
            
            this.dispatchEvent('dataChanged', {
                type: 'sync',
                data: githubData.data
            });
            
            return githubData.data;
            
        } catch (error) {
            console.error('❌ فشل المزامنة:', error);
            
            const localData = await this.loadFromLocalStorage();
            if (localData) {
                this.cache.data = localData;
                return localData;
            }
            
            throw error;
        }
    }
    
    // ============ إنشاء ملف جديد ============
    async createFile(data) {
        try {
            const requestBody = {
                message: '🚀 إنشاء ملف البيانات الأولي - سيارات عبدالله\n\nتم الإنشاء بواسطة النظام الآلي',
                content: this.base64Encode(JSON.stringify(data, null, 2)),
                branch: this.config.branch
            };
            
            const response = await this.request(
                `/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(requestBody)
                }
            );
            
            return response.ok;
            
        } catch (error) {
            console.error('❌ فشل إنشاء الملف:', error);
            return false;
        }
    }
    
    // ============ إدارة الكاش ============
    async loadFromLocalStorage() {
        try {
            const dataStr = localStorage.getItem('abdullah_cars_data');
            if (dataStr) {
                const data = JSON.parse(dataStr);
                console.log('📦 تحميل البيانات من التخزين المحلي');
                return data;
            }
        } catch (error) {
            console.error('❌ خطأ في قراءة البيانات المحلية:', error);
        }
        return null;
    }
    
    saveToLocalStorage(data) {
        try {
            localStorage.setItem('abdullah_cars_data', JSON.stringify(data));
            localStorage.setItem('last_sync', new Date().toISOString());
            return true;
        } catch (error) {
            console.error('❌ خطأ في حفظ البيانات المحلية:', error);
            return false;
        }
    }
    
    clearCache() {
        this.cache = {
            data: null,
            sha: null,
            etag: null
        };
        localStorage.removeItem('abdullah_cars_data');
        console.log('🗑️ تم مسح الكاش');
    }
    
    // ============ أدوات مساعدة ============
    base64Encode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }
    
    base64Decode(str) {
        return decodeURIComponent(escape(atob(str.replace(/\n/g, ''))));
    }
    
    validateData(data) {
        const requiredFields = ['site', 'products', 'brands', 'users'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`بيانات غير كاملة. الحقول المفقودة: ${missingFields.join(', ')}`);
        }
        
        return true;
    }
    
    getChangesSummary(oldData, newData) {
        const changes = [];
        
        // تعداد المنتجات
        const oldProducts = oldData?.products?.length || 0;
        const newProducts = newData?.products?.length || 0;
        if (newProducts !== oldProducts) {
            changes.push(`المنتجات: ${oldProducts} → ${newProducts}`);
        }
        
        // تعداد الماركات
        const oldBrands = oldData?.brands?.length || 0;
        const newBrands = newData?.brands?.length || 0;
        if (newBrands !== oldBrands) {
            changes.push(`الماركات: ${oldBrands} → ${newBrands}`);
        }
        
        // تعداد المستخدمين
        const oldUsers = oldData?.users?.length || 0;
        const newUsers = newData?.users?.length || 0;
        if (newUsers !== oldUsers) {
            changes.push(`المستخدمين: ${oldUsers} → ${newUsers}`);
        }
        
        return changes.length > 0 ? changes.join(' | ') : 'تحديثات طفيفة';
    }
    
    // ============ الطلبات ============
    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        const config = {
            headers: { ...this.headers, ...options.headers },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            // تحديث معدل المحاولات
            if (response.status === 429) {
                this.state.retryCount++;
                if (this.state.retryCount <= this.state.maxRetries) {
                    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
                    console.log(`⏳ معدل الطلبات تجاوز الحد، إعادة المحاولة بعد ${retryAfter} ثانية`);
                    await this.delay(retryAfter * 1000);
                    return this.request(endpoint, options);
                }
            }
            
            return response;
            
        } catch (error) {
            console.error('❌ خطأ في الطلب:', error);
            throw error;
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ============ المزامنة التلقائية ============
    startAutoSync() {
        // مزامنة كل 5 دقائق
        setInterval(async () => {
            if (this.state.isInitialized && !this.state.isSyncing) {
                try {
                    await this.sync();
                } catch (error) {
                    console.error('❌ فشل المزامنة التلقائية:', error);
                }
            }
        }, 5 * 60 * 1000); // 5 دقائق
        
        // مزامنة عند التركيز على النافذة
        window.addEventListener('focus', async () => {
            if (this.state.isInitialized && !this.state.isSyncing) {
                try {
                    await this.sync();
                } catch (error) {
                    console.error('❌ فشل المزامنة عند التركيز:', error);
                }
            }
        });
        
        console.log('⏰ تم تفعيل المزامنة التلقائية');
    }
    
    // ============ الأحداث ============
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
    
    dispatchEvent(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ خطأ في معالج الحدث ${event}:`, error);
                }
            });
        }
        
        // إرسال حدث DOM
        try {
            const customEvent = new CustomEvent(`githubSync:${event}`, {
                bubbles: true,
                detail: data
            });
            window.dispatchEvent(customEvent);
        } catch (error) {
            console.error('❌ خطأ في إرسال حدث DOM:', error);
        }
    }
    
    // ============ معلومات النظام ============
    getStatus() {
        return {
            initialized: this.state.isInitialized,
            syncing: this.state.isSyncing,
            lastSync: this.state.lastSync,
            lastError: this.state.lastError,
            retryCount: this.state.retryCount,
            cache: {
                hasData: !!this.cache.data,
                dataSize: this.cache.data ? JSON.stringify(this.cache.data).length : 0,
                items: {
                    products: this.cache.data?.products?.length || 0,
                    brands: this.cache.data?.brands?.length || 0,
                    users: this.cache.data?.users?.length || 0
                }
            }
        };
    }
    
    // ============ إنشاء بيانات افتراضية ============
    createDefaultData() {
        return {
            version: "2.0.0",
            lastUpdated: new Date().toISOString(),
            site: {
                name: { ar: "سيارات عبدالله", en: "Abdullah Cars" },
                description: { 
                    ar: "أفضل عروض السيارات الجديدة والمستعملة في مصر", 
                    en: "Best offers for new and used cars in Egypt" 
                },
                logo: "",
                language: "ar",
                timezone: "Africa/Cairo",
                currency: "EGP"
            },
            contact: {
                phone: "01121811110",
                whatsapp: "01121811110",
                email: "amarmotors850@gmail.com",
                address: "القاهرة، مصر"
            },
            social: {
                facebook: "https://www.facebook.com/share/1SdkvcBynu",
                instagram: "https://www.instagram.com/abdullah_auto_",
                tiktok: "https://www.tiktok.com/@abdullah.auto0"
            },
            users: [
                {
                    id: "admin_001",
                    username: "admin",
                    password: "2845",
                    fullName: "المدير الرئيسي",
                    email: "admin@abdullah-cars.com",
                    role: "admin",
                    permissions: ["all"],
                    active: true,
                    createdAt: new Date().toISOString()
                }
            ],
            brands: [],
            categories: [],
            products: []
        };
    }
}

// ============ التهيئة التلقائية ============
if (typeof window !== 'undefined') {
    window.gitHubSync = new AdvancedGitHubSync();
    
    // بدء التهيئة بعد تحميل الصفحة
    window.addEventListener('load', async () => {
        setTimeout(async () => {
            console.log('🎉 بدء تحميل نظام المزامنة المتقدم...');
            
            try {
                await window.gitHubSync.initialize();
                console.log('🚀 النظام المتقدم جاهز للعمل');
            } catch (error) {
                console.error('❌ فشل تحميل النظام المتقدم:', error);
                
                // بديل محلي
                window.gitHubSync = {
                    isInitialized: true,
                    sync: async () => {
                        const data = JSON.parse(localStorage.getItem('abdullah_cars_data') || '{}');
                        window.siteData = data;
                        return data;
                    },
                    save: async (data) => {
                        localStorage.setItem('abdullah_cars_data', JSON.stringify(data));
                        window.siteData = data;
                        return { success: true, localSaved: true };
                    },
                    getStatus: () => ({ initialized: true, source: 'local' })
                };
            }
        }, 1000);
    });
    
    // ============ واجهة API ============
    window.GitHubSyncAPI = {
        // القراءة
        getData: () => {
            return window.siteData || window.gitHubSync?.cache?.data || {};
        },
        
        // الكتابة
        save: async (data) => {
            if (window.gitHubSync && window.gitHubSync.isInitialized) {
                return await window.gitHubSync.save(data);
            }
            return { success: false, error: 'النظام غير جاهز' };
        },
        
        // المزامنة
        sync: async () => {
            if (window.gitHubSync) {
                return await window.gitHubSync.sync();
            }
            return null;
        },
        
        // الحالة
        getStatus: () => {
            if (window.gitHubSync) {
                return window.gitHubSync.getStatus();
            }
            return { initialized: false };
        },
        
        // الإدارة
        clearCache: () => {
            if (window.gitHubSync) {
                window.gitHubSync.clearCache();
                return true;
            }
            return false;
        },
        
        // الأحداث
        on: (event, callback) => {
            if (window.gitHubSync) {
                window.gitHubSync.on(event, callback);
                return true;
            }
            return false;
        },
        
        off: (event, callback) => {
            if (window.gitHubSync) {
                window.gitHubSync.off(event, callback);
                return true;
            }
            return false;
        }
    };
    
    console.log('🎯 واجهة API المتقدمة جاهزة');
}

// ============ تصدير للنود جي إس ============
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedGitHubSync;
}