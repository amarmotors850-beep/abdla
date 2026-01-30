/**
 * نظام مزامنة البيانات المحسن - سيارات عبدالله
 * يعمل مع GitHub + LocalStorage
 */

class GitHubSync {
    constructor() {
        this.config = {
            owner: 'MHmooDhazm',
            repo: 'bitelazz-data',
            token: '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', // التوكن الصحيح
            branch: 'main',
            filePath: 'site-data.json'
        };
        
        this.baseURL = 'https://api.github.com';
        // الـ headers يجب أن تكون بهذا الشكل للتوكنات الكلاسيكية:
        this.headers = {
            'Authorization': 'token ' + this.config.token, // تغيير مهم: 'token ' وليس 'Bearer '
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        this.isSyncing = false;
        this.isInitialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        console.log('🔧 تهيئة النظام مع التوكن:', this.config.token.substring(0, 10) + '...');
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🚀 بدء تهيئة النظام...');
            
            // اختبار الاتصال أولاً
            const connected = await this.testConnection();
            
            if (connected) {
                // تحميل البيانات
                const data = await this.loadInitialData();
                
                if (data) {
                    this.isInitialized = true;
                    window.siteData = data;
                    
                    console.log('✅ تم تهيئة النظام بنجاح');
                    this.dispatchEvent('initialized', { success: true });
                    return true;
                }
            }
            
            // إذا فشل، استخدام البيانات المحلية
            console.log('⚠️ استخدام البيانات المحلية');
            const localData = this.getLocalData();
            window.siteData = localData;
            this.isInitialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ فشل التهيئة:', error);
            
            // خطط احتياطية
            const fallbackData = this.createNewData();
            window.siteData = fallbackData;
            this.saveDataLocally(fallbackData, 'fallback');
            this.isInitialized = true;
            
            return true;
        }
    }

    async testConnection() {
        try {
            console.log('🔗 اختبار الاتصال مع GitHub...');
            
            const response = await fetch(
                `${this.baseURL}/user`,
                { 
                    headers: this.headers,
                    cache: 'no-store'
                }
            );
            
            console.log('📡 حالة الاتصال:', response.status, response.statusText);
            
            if (response.status === 401) {
                console.error('❌ التوكن غير صالح');
                this.dispatchEvent('tokenError', { message: 'التوكن غير صالح' });
                return false;
            }
            
            if (response.status === 403) {
                console.error('❌ التوكن منتهي الصلاحية');
                this.dispatchEvent('tokenError', { message: 'التوكن منتهي الصلاحية' });
                return false;
            }
            
            if (response.ok) {
                console.log('✅ الاتصال ناجح');
                return true;
            }
            
            console.warn('⚠️ حالة اتصال غير متوقعة:', response.status);
            return false;
            
        } catch (error) {
            console.error('❌ فشل اختبار الاتصال:', error.message);
            return false;
        }
    }

    async loadInitialData() {
        console.log('📥 جاري تحميل البيانات...');
        
        try {
            // المحاولة الأولى: من GitHub
            const githubData = await this.fetchFromGitHub();
            if (githubData) {
                console.log('✅ تم تحميل البيانات من GitHub');
                this.saveDataLocally(githubData, 'github');
                return githubData;
            }
            
            // المحاولة الثانية: من LocalStorage
            const localData = this.getLocalData();
            if (localData && localData.version) {
                console.log('✅ استخدام البيانات المحلية');
                return localData;
            }
            
            // المحاولة الثالثة: بيانات جديدة
            console.log('🆕 إنشاء بيانات جديدة');
            const newData = this.createNewData();
            this.saveDataLocally(newData, 'new');
            return newData;
            
        } catch (error) {
            console.error('❌ فشل تحميل البيانات:', error);
            return this.getLocalData();
        }
    }

    async fetchFromGitHub() {
        try {
            console.log('⬇️ جلب البيانات من GitHub...');
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                { 
                    headers: this.headers,
                    cache: 'no-store'
                }
            );
            
            console.log('📊 حالة الجلب:', response.status);
            
            if (response.status === 404) {
                console.log('📝 الملف غير موجود على GitHub');
                return null;
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ خطأ:', errorText);
                return null;
            }
            
            const result = await response.json();
            
            if (!result.content) {
                console.error('❌ لا يوجد محتوى');
                return null;
            }
            
            // فك Base64
            const decodedContent = atob(result.content);
            const data = JSON.parse(decodedContent);
            
            console.log('✅ تم جلب البيانات بنجاح');
            return data;
            
        } catch (error) {
            console.error('❌ فشل جلب البيانات:', error.message);
            return null;
        }
    }

    async pushToGitHub(data) {
        if (this.isSyncing) {
            console.log('⏳ النظام مشغول حالياً');
            return { success: false, error: 'مشغول' };
        }
        
        this.isSyncing = true;
        
        try {
            console.log('⬆️ رفع البيانات إلى GitHub...');
            
            // تحديث البيانات
            data = { ...data };
            data.lastUpdated = new Date().toISOString();
            data.version = data.version || "1.0.0";
            
            // تحويل إلى JSON
            const jsonStr = JSON.stringify(data, null, 2);
            const base64Content = btoa(jsonStr);
            
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
                    console.log('📝 تحديث ملف موجود');
                }
            } catch (error) {
                console.log('📝 إنشاء ملف جديد');
            }
            
            // رسالة الحفظ
            const commitMessage = `تحديث البيانات: ${new Date().toLocaleString('ar-EG')}`;
            
            // إعداد الطلب
            const requestBody = {
                message: commitMessage,
                content: base64Content,
                branch: this.config.branch
            };
            
            if (sha) {
                requestBody.sha = sha;
            }
            
            console.log('📤 إرسال الطلب...');
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
                console.error('❌ خطأ في الرفع:', errorData);
                throw new Error(errorData.message || 'فشل الرفع');
            }
            
            // حفظ محلي
            this.saveDataLocally(data, 'github');
            
            console.log('✅ تم الرفع بنجاح');
            
            this.dispatchEvent('pushSuccess', {
                success: true,
                timestamp: new Date().toISOString(),
                message: commitMessage
            });
            
            return {
                success: true,
                message: commitMessage,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ فشل الرفع:', error.message);
            
            // حفظ محلي على الأقل
            try {
                this.saveDataLocally(data, 'local');
                console.log('💾 تم الحفظ محلياً');
            } catch (e) {
                console.error('❌ فشل الحفظ المحلي:', e);
            }
            
            this.dispatchEvent('pushError', {
                success: false,
                error: error.message,
                localSaved: true
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

    async sync() {
        try {
            console.log('🔄 بدء المزامنة...');
            
            // جلب من GitHub
            const githubData = await this.fetchFromGitHub();
            const localData = this.getLocalData();
            
            let finalData = localData;
            
            if (githubData) {
                // مقارنة التواريخ
                const githubTime = new Date(githubData.lastUpdated || 0).getTime();
                const localTime = new Date(localData.lastUpdated || 0).getTime();
                
                if (githubTime > localTime) {
                    console.log('📥 GitHub أحدث - تحميل');
                    finalData = githubData;
                } else if (localTime > githubTime) {
                    console.log('⬆️ المحلي أحدث - رفع');
                    await this.pushToGitHub(localData);
                    finalData = localData;
                } else {
                    console.log('✅ البيانات متساوية');
                }
            } else {
                // لا يوجد بيانات على GitHub، رفع المحلي
                console.log('⬆️ رفع البيانات المحلية');
                await this.pushToGitHub(localData);
            }
            
            // حفظ النتيجة
            this.saveDataLocally(finalData, 'sync');
            
            console.log('✅ تمت المزامنة');
            
            this.dispatchEvent('syncComplete', {
                data: finalData,
                timestamp: new Date().toISOString()
            });
            
            return finalData;
            
        } catch (error) {
            console.error('❌ فشل المزامنة:', error);
            
            this.dispatchEvent('syncError', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            return this.getLocalData();
        }
    }

    // ============ دوال مساعدة ============
    
    saveDataLocally(data, source = 'local') {
        try {
            const jsonStr = JSON.stringify(data, null, 2);
            localStorage.setItem('siteData', jsonStr);
            localStorage.setItem('lastUpdate', new Date().toISOString());
            localStorage.setItem('dataSource', source);
            
            this.localData = data;
            window.siteData = data;
            
            console.log(`💾 تم الحفظ (${source})`);
            return true;
        } catch (error) {
            console.error('❌ فشل الحفظ المحلي:', error);
            return false;
        }
    }

    getLocalData() {
        try {
            const localData = localStorage.getItem('siteData');
            if (localData) {
                return JSON.parse(localData);
            }
        } catch (error) {
            console.error('❌ خطأ في قراءة البيانات:', error);
        }
        
        return this.createNewData();
    }

    createNewData() {
        return {
            version: "2.0.0",
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
                theme: "light"
            }
        };
    }

    dispatchEvent(eventName, detail) {
        try {
            const event = new CustomEvent(`githubSync:${eventName}`, { 
                bubbles: true,
                detail 
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('❌ خطأ في إرسال الحدث:', error);
        }
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isSyncing: this.isSyncing,
            token: this.config.token ? '***' + this.config.token.slice(-4) : 'غير موجود',
            lastUpdate: localStorage.getItem('lastUpdate') || 'غير معروف',
            dataSource: localStorage.getItem('dataSource') || 'غير معروف'
        };
    }
}

// ============ التهيئة التلقائية ============

if (typeof window !== 'undefined') {
    setTimeout(() => {
        try {
            console.log('🎉 تحميل نظام المزامنة...');
            window.gitHubSync = new GitHubSync();
            
            // واجهة التطبيق
            window.GitHubSyncService = {
                fetch: () => window.gitHubSync?.sync() || Promise.resolve(null),
                push: (data) => window.gitHubSync?.pushToGitHub(data) || Promise.resolve(null),
                sync: () => window.gitHubSync?.sync() || Promise.resolve(null),
                getStatus: () => window.gitHubSync?.getStatus() || {},
                getData: () => window.siteData || {},
                formatPrice: (price) => new Intl.NumberFormat('ar-EG').format(price || 0) + ' ج.م'
            };
            
            console.log('🚀 النظام جاهز');
            
        } catch (error) {
            console.error('❌ خطأ في التحميل:', error);
            
            // بديل احتياطي
            window.gitHubSync = {
                isInitialized: true,
                sync: async () => {
                    const data = JSON.parse(localStorage.getItem('siteData') || '{}');
                    window.siteData = data;
                    return data;
                },
                pushToGitHub: async (data) => {
                    localStorage.setItem('siteData', JSON.stringify(data));
                    window.siteData = data;
                    return { success: true, localSaved: true };
                }
            };
        }
    }, 500);
}