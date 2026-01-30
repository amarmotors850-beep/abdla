/**
 * نظام مزامنة GitHub الكامل - سيارات عبدالله
 * يعمل مع الإضافة، التعديل، الحذف، والمزامنة الفورية
 */

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
            'Authorization': 'token ' + this.config.token,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        this.isSyncing = false;
        this.isInitialized = false;
        this.lastData = null;
        
        console.log('🚀 تحميل نظام GitHub Sync...');
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🔧 تهيئة النظام...');
            
            // اختبار التوكن أولاً
            const tokenValid = await this.validateToken();
            if (!tokenValid) {
                throw new Error('التوكن غير صالح');
            }
            
            // جلب البيانات من GitHub
            const data = await this.fetchFromGitHub();
            
            if (data) {
                // حفظ البيانات محلياً
                this.saveToLocalStorage(data);
                this.lastData = data;
                window.siteData = data;
                
                console.log('✅ تم تحميل البيانات من GitHub', {
                    products: data.products?.length || 0,
                    brands: data.brands?.length || 0
                });
            } else {
                // إنشاء ملف جديد على GitHub
                console.log('📝 إنشاء ملف جديد على GitHub...');
                const newData = this.createNewData();
                const created = await this.createFileOnGitHub(newData);
                
                if (created) {
                    this.saveToLocalStorage(newData);
                    this.lastData = newData;
                    window.siteData = newData;
                    console.log('✅ تم إنشاء الملف على GitHub');
                } else {
                    throw new Error('فشل إنشاء الملف على GitHub');
                }
            }
            
            this.isInitialized = true;
            console.log('🎉 النظام جاهز للاستخدام');
            
            // إرسال حدث التهيئة
            this.dispatchEvent('initialized', { 
                success: true, 
                source: 'github' 
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ فشل التهيئة:', error.message);
            
            // استخدام البيانات المحلية كبديل
            const localData = this.loadFromLocalStorage();
            this.lastData = localData;
            window.siteData = localData;
            this.isInitialized = true;
            
            console.log('⚠️ استخدام البيانات المحلية', {
                products: localData.products?.length || 0,
                brands: localData.brands?.length || 0
            });
            
            this.dispatchEvent('initialized', { 
                success: true, 
                source: 'local',
                warning: 'تم استخدام البيانات المحلية'
            });
            
            return true;
        }
    }

    // ============ دوال التحقق ============
    
    async validateToken() {
        try {
            console.log('🔑 التحقق من صحة التوكن...');
            
            const response = await fetch(`${this.baseURL}/user`, {
                headers: this.headers
            });
            
            if (response.status === 401 || response.status === 403) {
                console.error('❌ التوكن غير صالح:', response.status);
                return false;
            }
            
            if (response.ok) {
                const user = await response.json();
                console.log('✅ التوكن صالح للمستخدم:', user.login);
                return true;
            }
            
            console.warn('⚠️ حالة غير متوقعة:', response.status);
            return false;
            
        } catch (error) {
            console.error('❌ خطأ في التحقق:', error.message);
            return false;
        }
    }

    // ============ عمليات GitHub الرئيسية ============
    
    async fetchFromGitHub() {
        try {
            console.log('⬇️ جاري جلب البيانات من GitHub...');
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                { headers: this.headers }
            );
            
            console.log('📡 حالة الاستجابة:', response.status);
            
            if (response.status === 404) {
                console.log('📝 الملف غير موجود على GitHub');
                return null;
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ خطأ في الجلب:', errorText);
                throw new Error(`فشل الجلب: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.content) {
                throw new Error('لا يوجد محتوى في الملف');
            }
            
            // فك تشفير Base64
            const decodedContent = atob(result.content.replace(/\n/g, ''));
            const data = JSON.parse(decodedContent);
            
            console.log('✅ تم جلب البيانات بنجاح من GitHub');
            return data;
            
        } catch (error) {
            console.error('❌ فشل جلب البيانات:', error.message);
            throw error;
        }
    }

    async saveToGitHub(data) {
        if (this.isSyncing) {
            console.log('⏳ النظام مشغول، جاري إضافة الطلب للانتظار...');
            return await this.queueSave(data);
        }
        
        this.isSyncing = true;
        
        try {
            console.log('💾 جاري حفظ البيانات على GitHub...');
            
            // تحديث بيانات الوقت
            data.lastUpdated = new Date().toISOString();
            data.version = data.version || "1.0.0";
            
            // الحصول على SHA للملف الحالي
            let sha = null;
            try {
                const currentResponse = await fetch(
                    `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                    { headers: this.headers }
                );
                
                if (currentResponse.ok) {
                    const currentData = await currentResponse.json();
                    sha = currentData.sha;
                    console.log('📝 تحديث الملف الحالي');
                }
            } catch (error) {
                console.log('📝 إنشاء ملف جديد');
            }
            
            // تحويل البيانات إلى JSON ثم Base64
            const jsonStr = JSON.stringify(data, null, 2);
            const base64Content = btoa(jsonStr);
            
            // رسالة الحفظ
            const commitMessage = `تحديث البيانات: ${new Date().toLocaleString('ar-EG')}`;
            
            // إعداد طلب الحفظ
            const requestBody = {
                message: commitMessage,
                content: base64Content,
                branch: this.config.branch
            };
            
            if (sha) {
                requestBody.sha = sha;
            }
            
            console.log('📤 إرسال البيانات إلى GitHub...');
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify(requestBody)
                }
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ خطأ في الحفظ:', errorData);
                throw new Error(errorData.message || 'فشل الحفظ');
            }
            
            // حفظ محلي
            this.saveToLocalStorage(data);
            this.lastData = data;
            window.siteData = data;
            
            console.log('✅ تم الحفظ بنجاح على GitHub');
            
            // إرسال حدث النجاح
            this.dispatchEvent('saveSuccess', {
                success: true,
                data: data,
                timestamp: new Date().toISOString(),
                message: commitMessage
            });
            
            return {
                success: true,
                message: 'تم الحفظ بنجاح على GitHub',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ فشل الحفظ على GitHub:', error.message);
            
            // محاولة الحفظ محلياً
            try {
                this.saveToLocalStorage(data);
                this.lastData = data;
                window.siteData = data;
                console.log('💾 تم الحفظ محلياً كنسخة احتياطية');
            } catch (e) {
                console.error('❌ فشل الحفظ المحلي:', e.message);
            }
            
            // إرسال حدث الخطأ
            this.dispatchEvent('saveError', {
                success: false,
                error: error.message,
                localSaved: true,
                timestamp: new Date().toISOString()
            });
            
            return {
                success: false,
                error: error.message,
                localSaved: true
            };
            
        } finally {
            this.isSyncing = false;
        }
    }

    async createFileOnGitHub(data) {
        try {
            console.log('📄 جاري إنشاء الملف على GitHub...');
            
            // تحديث البيانات
            data.lastUpdated = new Date().toISOString();
            data.version = "1.0.0";
            
            // تحويل إلى Base64
            const jsonStr = JSON.stringify(data, null, 2);
            const base64Content = btoa(jsonStr);
            
            // رسالة الإنشاء
            const commitMessage = 'إنشاء ملف البيانات الأولي - سيارات عبدالله';
            
            // إنشاء الملف
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify({
                        message: commitMessage,
                        content: base64Content,
                        branch: this.config.branch
                    })
                }
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ فشل إنشاء الملف:', errorData);
                return false;
            }
            
            console.log('✅ تم إنشاء الملف على GitHub');
            return true;
            
        } catch (error) {
            console.error('❌ فشل إنشاء الملف:', error.message);
            return false;
        }
    }

    async sync() {
        try {
            console.log('🔄 جاري المزامنة مع GitHub...');
            
            // جلب أحدث نسخة من GitHub
            const githubData = await this.fetchFromGitHub();
            
            if (!githubData) {
                console.log('⚠️ لا توجد بيانات على GitHub');
                return this.lastData;
            }
            
            // مقارنة مع البيانات المحلية
            if (this.lastData) {
                const githubTime = new Date(githubData.lastUpdated || 0).getTime();
                const localTime = new Date(this.lastData.lastUpdated || 0).getTime();
                
                if (githubTime > localTime) {
                    console.log('📥 GitHub أحدث - تحميل النسخة الجديدة');
                    this.saveToLocalStorage(githubData);
                    this.lastData = githubData;
                    window.siteData = githubData;
                    
                    this.dispatchEvent('syncUpdated', {
                        source: 'github',
                        data: githubData,
                        timestamp: new Date().toISOString()
                    });
                    
                    return githubData;
                } else if (localTime > githubTime) {
                    console.log('⬆️ البيانات المحلية أحدث - رفع إلى GitHub');
                    await this.saveToGitHub(this.lastData);
                    return this.lastData;
                } else {
                    console.log('✅ البيانات متطابقة');
                    return this.lastData;
                }
            } else {
                // لا توجد بيانات محلية
                console.log('📥 تحميل البيانات من GitHub');
                this.saveToLocalStorage(githubData);
                this.lastData = githubData;
                window.siteData = githubData;
                return githubData;
            }
            
        } catch (error) {
            console.error('❌ فشل المزامنة:', error.message);
            
            // استخدام البيانات المحلية
            const localData = this.loadFromLocalStorage();
            this.lastData = localData;
            window.siteData = localData;
            
            return localData;
        }
    }

    // ============ نظام الطابور ============
    
    async queueSave(data) {
        return new Promise((resolve) => {
            const attemptSave = async () => {
                if (!this.isSyncing) {
                    const result = await this.saveToGitHub(data);
                    resolve(result);
                } else {
                    setTimeout(attemptSave, 1000);
                }
            };
            attemptSave();
        });
    }

    // ============ إدارة التخزين المحلي ============
    
    saveToLocalStorage(data) {
        try {
            const jsonStr = JSON.stringify(data, null, 2);
            localStorage.setItem('abdullah_cars_data', jsonStr);
            localStorage.setItem('last_sync', new Date().toISOString());
            console.log('💾 تم الحفظ في التخزين المحلي');
            return true;
        } catch (error) {
            console.error('❌ فشل الحفظ المحلي:', error);
            return false;
        }
    }

    loadFromLocalStorage() {
        try {
            const dataStr = localStorage.getItem('abdullah_cars_data');
            if (dataStr) {
                const data = JSON.parse(dataStr);
                console.log('📂 تحميل من التخزين المحلي', {
                    products: data.products?.length || 0,
                    brands: data.brands?.length || 0
                });
                return data;
            }
        } catch (error) {
            console.error('❌ خطأ في قراءة التخزين المحلي:', error);
        }
        
        // إنشاء بيانات جديدة
        const newData = this.createNewData();
        console.log('🆕 إنشاء بيانات جديدة');
        return newData;
    }

    // ============ بيانات افتراضية ============
    
    createNewData() {
        return {
            version: "1.0.0",
            lastUpdated: new Date().toISOString(),
            site: {
                name: { ar: "سيارات عبدالله", en: "Abdullah Cars" },
                description: { 
                    ar: "أفضل عروض السيارات الجديدة والمستعملة في مصر", 
                    en: "Best offers for new and used cars in Egypt" 
                }
            },
            contact: {
                phone: "01121811110",
                whatsapp: "01121811110",
                email: "amarmotors850@gmail.com",
                address: "القاهرة، مصر",
                workingHours: "9 ص - 9 م"
            },
            social: {
                facebook: "https://www.facebook.com/share/1SdkvcBynu/?mibextid=wwXIfr",
                instagram: "https://www.instagram.com/abdullah_auto_?igsh=Nm5hNnJtMjM2ZDEw&utm_source=qr",
                tiktok: "https://www.tiktok.com/@abdullah.auto0?_r=1&_t=ZS-93NEKHAJ5TJ"
            },
            users: [
                {
                    id: "admin_001",
                    username: "admin",
                    password: "2845",
                    role: "ADMIN",
                    fullName: "المدير الرئيسي",
                    permissions: ["all"],
                    createdAt: new Date().toISOString()
                }
            ],
            brands: [],
            products: [],
            settings: {
                autoSync: true,
                theme: "light",
                currency: "ج.م"
            }
        };
    }

    // ============ نظام الأحداث ============
    
    dispatchEvent(eventName, detail) {
        try {
            const event = new CustomEvent(`githubSync:${eventName}`, {
                bubbles: true,
                detail: detail
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('❌ خطأ في إرسال الحدث:', error);
        }
    }

    // ============ معلومات النظام ============
    
    getStatus() {
        return {
            initialized: this.isInitialized,
            syncing: this.isSyncing,
            token: this.config.token ? '***' + this.config.token.slice(-4) : 'غير موجود',
            lastSync: localStorage.getItem('last_sync') || 'لم تتم المزامنة',
            data: this.lastData ? {
                products: this.lastData.products?.length || 0,
                brands: this.lastData.brands?.length || 0,
                users: this.lastData.users?.length || 0
            } : null
        };
    }
}

// ============ تهيئة النظام التلقائية ============

if (typeof window !== 'undefined') {
    // تأخير قليل لتحميل الصفحة
    setTimeout(async () => {
        console.log('🎉 بدء تحميل نظام المزامنة...');
        
        try {
            // إنشاء النظام
            window.gitHubSync = new GitHubSync();
            
            // الانتظار حتى التهيئة
            await new Promise(resolve => {
                const checkInitialized = () => {
                    if (window.gitHubSync.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInitialized, 100);
                    }
                };
                checkInitialized();
            });
            
            console.log('🚀 نظام المزامنة جاهز للاستخدام');
            
        } catch (error) {
            console.error('❌ خطأ في تحميل النظام:', error);
            
            // بديل احتياطي
            window.gitHubSync = {
                isInitialized: true,
                sync: async () => {
                    const data = JSON.parse(localStorage.getItem('abdullah_cars_data') || '{}');
                    window.siteData = data;
                    return data;
                },
                saveToGitHub: async (data) => {
                    localStorage.setItem('abdullah_cars_data', JSON.stringify(data));
                    window.siteData = data;
                    return { success: true, message: 'تم الحفظ محلياً' };
                },
                getStatus: () => ({ initialized: true, source: 'local' })
            };
            
            console.log('⚠️ استخدام النظام المحلي');
        }
        
        // ============ واجهة برمجة التطبيقات ============
        
        window.GitHubSyncAPI = {
            // حفظ بيانات
            save: async (data) => {
                console.log('💾 طلب حفظ البيانات...');
                
                if (!window.gitHubSync || !window.gitHubSync.isInitialized) {
                    console.error('❌ النظام غير جاهز');
                    return { success: false, error: 'النظام غير جاهز' };
                }
                
                try {
                    const result = await window.gitHubSync.saveToGitHub(data);
                    
                    if (result.success) {
                        console.log('✅ تم حفظ البيانات بنجاح');
                        
                        // تحديث البيانات على جميع الصفحات
                        window.siteData = data;
                        
                        // إرسال حدث تحديث البيانات
                        const updateEvent = new CustomEvent('dataUpdated', {
                            detail: { data: data, source: 'github' }
                        });
                        window.dispatchEvent(updateEvent);
                        
                        return result;
                    } else {
                        console.error('❌ فشل حفظ البيانات:', result.error);
                        return result;
                    }
                    
                } catch (error) {
                    console.error('❌ خطأ في حفظ البيانات:', error);
                    return { success: false, error: error.message };
                }
            },
            
            // مزامنة
            sync: async () => {
                if (window.gitHubSync) {
                    return await window.gitHubSync.sync();
                }
                return null;
            },
            
            // الحصول على البيانات
            getData: () => {
                return window.siteData || window.gitHubSync?.lastData || {};
            },
            
            // حالة النظام
            getStatus: () => {
                if (window.gitHubSync) {
                    return window.gitHubSync.getStatus();
                }
                return { initialized: false };
            },
            
            // دوال مساعدة
            helpers: {
                generateId: () => 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                formatPrice: (price) => new Intl.NumberFormat('ar-EG').format(price || 0) + ' ج.م',
                formatDate: (date) => new Date(date).toLocaleString('ar-EG')
            }
        };
        
        console.log('🎯 واجهة API جاهزة للاستخدام');
        
    }, 1000);
}