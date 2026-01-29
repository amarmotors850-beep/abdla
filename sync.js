/**
 * GitHub Sync System - سيارات عبدالله
 * نظام مزامنة البيانات مع GitHub
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
            console.log('🚀 نظام المزامنة يعمل...');
            
            // اختبار الاتصال
            await this.testConnection();
            
            // تحميل البيانات الأولية
            await this.loadInitialData();
            
            // بدء المزامنة التلقائية
            this.startAutoSync();
            
            console.log('✅ نظام المزامنة جاهز');
            
        } catch (error) {
            console.error('❌ فشل التهيئة:', error);
            this.handleInitializationError(error);
        }
    }

    async testConnection() {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}`,
                { 
                    headers: this.headers,
                    cache: 'no-cache'
                }
            );
            
            if (response.status === 401) {
                throw new Error('التوكن غير صالح أو منتهي الصلاحية');
            }
            
            if (response.status === 404) {
                throw new Error('المستودع غير موجود');
            }
            
            if (!response.ok) {
                throw new Error(`خطأ في الاتصال: ${response.status}`);
            }
            
            console.log('✅ الاتصال مع GitHub ناجح');
            return true;
            
        } catch (error) {
            console.error('❌ فشل اختبار الاتصال:', error);
            throw error;
        }
    }

    async loadInitialData() {
        try {
            // محاولة جلب البيانات من GitHub
            const cloudData = await this.fetchFromGitHub();
            
            if (cloudData) {
                // حفظ البيانات في localStorage
                localStorage.setItem('siteData', JSON.stringify(cloudData));
                localStorage.setItem('dataSource', 'github');
                localStorage.setItem('lastSync', new Date().toISOString());
                
                window.siteData = cloudData;
                console.log('📥 تم تحميل البيانات من GitHub');
                return cloudData;
            }
            
        } catch (error) {
            console.log('⚠️ استخدام البيانات المحلية');
            
            // استخدام البيانات المحلية
            const localData = localStorage.getItem('siteData');
            
            if (localData) {
                try {
                    const parsedData = JSON.parse(localData);
                    window.siteData = parsedData;
                    localStorage.setItem('dataSource', 'local');
                    return parsedData;
                } catch (e) {
                    console.warn('❌ بيانات localStorage تالفة');
                }
            }
            
            // إنشاء بيانات جديدة
            const newData = this.createNewData();
            localStorage.setItem('siteData', JSON.stringify(newData));
            localStorage.setItem('dataSource', 'new');
            window.siteData = newData;
            
            return newData;
        }
    }

    async fetchFromGitHub() {
        try {
            console.log('⬇️ جاري جلب البيانات من GitHub...');
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                { 
                    headers: this.headers,
                    cache: 'no-cache'
                }
            );

            if (response.status === 404) {
                console.log('📝 الملف غير موجود، سيتم إنشاؤه');
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.content) {
                throw new Error('لا يوجد محتوى في الرد');
            }

            // فك تشفير Base64
            const decodedContent = this.base64Decode(result.content);
            const data = JSON.parse(decodedContent);
            
            console.log('✅ تم جلب البيانات بنجاح');
            return data;
            
        } catch (error) {
            console.error('❌ فشل جلب البيانات:', error);
            throw error;
        }
    }

    async pushToGitHub(data) {
        try {
            console.log('⬆️ جاري رفع البيانات إلى GitHub...');
            
            // تحديث الوقت
            data.lastUpdated = new Date().toISOString();
            
            // تحويل البيانات إلى JSON
            const jsonStr = JSON.stringify(data, null, 2);
            const base64Content = this.base64Encode(jsonStr);
            
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
                }
            } catch (error) {
                console.log('📝 سيتم إنشاء ملف جديد');
            }

            // رسالة الحفظ
            const commitMessage = `تحديث البيانات: ${new Date().toLocaleString('ar-EG', {
                dateStyle: 'full',
                timeStyle: 'medium'
            })}`;

            // إعداد طلب الرفع
            const requestBody = {
                message: commitMessage,
                content: base64Content,
                branch: this.config.branch,
                sha: sha
            };

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
                throw new Error(`فشل الرفع: ${errorData.message || response.status}`);
            }

            // حفظ محلي
            localStorage.setItem('siteData', jsonStr);
            localStorage.setItem('lastPush', new Date().toISOString());
            localStorage.setItem('dataSource', 'github');
            
            window.siteData = data;
            
            console.log('✅ تم رفع البيانات بنجاح');
            
            // إطلاق حدث
            this.dispatchEvent('pushSuccess', {
                timestamp: new Date().toISOString(),
                message: commitMessage,
                data: data
            });
            
            return {
                success: true,
                message: commitMessage,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ فشل رفع البيانات:', error);
            
            // حفظ محلي على الأقل
            try {
                const jsonStr = JSON.stringify(data, null, 2);
                localStorage.setItem('siteData', jsonStr);
                localStorage.setItem('lastError', new Date().toISOString());
                window.siteData = data;
                console.log('💾 تم الحفظ محلياً');
            } catch (e) {
                console.error('❌ فشل الحفظ المحلي:', e);
            }
            
            this.dispatchEvent('pushError', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            return {
                success: false,
                error: error.message,
                localSaved: true
            };
        }
    }

    async sync() {
        if (this.isSyncing) {
            console.log('⏳ المزامنة قيد التشغيل بالفعل...');
            return;
        }

        this.isSyncing = true;
        
        try {
            console.log('🔄 بدء المزامنة...');
            
            // جلب أحدث البيانات
            const cloudData = await this.fetchFromGitHub();
            const localData = this.getLocalData();
            
            let finalData = localData;
            
            if (cloudData) {
                // دمج البيانات (الأحدث يفوز)
                const cloudTime = new Date(cloudData.lastUpdated || 0);
                const localTime = new Date(localData.lastUpdated || 0);
                
                if (cloudTime > localTime) {
                    console.log('📥 تحديث البيانات من السحابة');
                    finalData = cloudData;
                } else if (localTime > cloudTime) {
                    console.log('⬆️ رفع البيانات إلى السحابة');
                    await this.pushToGitHub(localData);
                    finalData = localData;
                } else {
                    console.log('✅ البيانات متزامنة بالفعل');
                }
            } else {
                // رفع البيانات المحلية
                console.log('⬆️ رفع البيانات المحلية إلى السحابة');
                await this.pushToGitHub(localData);
            }
            
            // تحديث البيانات
            window.siteData = finalData;
            localStorage.setItem('siteData', JSON.stringify(finalData));
            localStorage.setItem('lastSync', new Date().toISOString());
            
            // إطلاق حدث
            this.dispatchEvent('syncComplete', {
                data: finalData,
                timestamp: new Date().toISOString(),
                source: cloudData ? 'github' : 'local'
            });
            
            console.log('✅ تمت المزامنة بنجاح');
            return finalData;
            
        } catch (error) {
            console.error('❌ فشل المزامنة:', error);
            
            this.dispatchEvent('syncError', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            return null;
            
        } finally {
            this.isSyncing = false;
        }
    }

    // ============ دوال مساعدة ============

    createNewData() {
        return {
            version: "1.0.0",
            lastUpdated: new Date().toISOString(),
            site: {
                name: { ar: "سيارات عبدالله", en: "Abdullah Cars" },
                description: { 
                    ar: "أفضل عروض السيارات الجديدة والمستعملة في مصر", 
                    en: "Best offers for new and used cars in Egypt" 
                },
                currency: "ج.م"
            },
            contact: {
                phone: "01012345678",
                whatsapp: "01012345678",
                email: "info@abdullahcars.com",
                address: "القاهرة، مصر",
                workingHours: "9 ص - 9 م"
            },
            users: [
                {
                    id: "admin_001",
                    username: "admin",
                    password: "2845",
                    role: "ADMIN",
                    fullName: "المدير الرئيسي",
                    permissions: ["all"],
                    active: true,
                    createdAt: new Date().toISOString()
                }
            ],
            brands: [],
            products: [],
            categories: [],
            settings: {
                theme: "default",
                mainColor: "#c53030",
                enableWhatsapp: true,
                autoSync: true
            }
        };
    }

    getLocalData() {
        try {
            const localData = localStorage.getItem('siteData');
            if (localData) {
                return JSON.parse(localData);
            }
        } catch (e) {
            console.error('❌ خطأ في قراءة البيانات المحلية:', e);
        }
        return this.createNewData();
    }

    base64Encode(str) {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            return btoa(str);
        }
    }

    base64Decode(str) {
        try {
            return decodeURIComponent(escape(atob(str)));
        } catch (e) {
            return atob(str);
        }
    }

    startAutoSync() {
        // إيقاف المزامنة التلقائية السابقة
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // بدء مزامنة جديدة كل 30 ثانية
        this.syncInterval = setInterval(() => {
            this.sync();
        }, 30000);
        
        console.log('⏰ تم تفعيل المزامنة التلقائية (كل 30 ثانية)');
    }

    handleInitializationError(error) {
        console.error('❌ خطأ في تهيئة النظام:', error);
        
        // إنشاء بيانات افتراضية
        const defaultData = this.createNewData();
        localStorage.setItem('siteData', JSON.stringify(defaultData));
        window.siteData = defaultData;
        
        // إعلام المستخدم
        this.dispatchEvent('initError', {
            error: error.message,
            usingLocalData: true
        });
    }

    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(`githubSync:${eventName}`, { detail });
        window.dispatchEvent(event);
    }

    getStatus() {
        return {
            isSyncing: this.isSyncing,
            lastSync: localStorage.getItem('lastSync'),
            lastPush: localStorage.getItem('lastPush'),
            dataSource: localStorage.getItem('dataSource') || 'unknown',
            dataSize: localStorage.getItem('siteData') ? 
                Math.round(localStorage.getItem('siteData').length / 1024) + ' KB' : '0 KB'
        };
    }

    // ============ API عامة ============

    async fetch() {
        return await this.sync();
    }

    async push(data) {
        return await this.pushToGitHub(data);
    }

    forceSync() {
        return this.sync();
    }

    cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('🧹 تم تنظيف نظام المزامنة');
    }
}

// ============ التهيئة التلقائية ============

if (typeof window !== 'undefined') {
    // تهيئة النظام
    window.gitHubSync = new GitHubSync();
    
    // واجهة برمجة التطبيقات العامة
    window.GitHubSyncService = {
        // عمليات البيانات
        fetch: () => window.gitHubSync.fetch(),
        push: (data) => window.gitHubSync.push(data),
        sync: () => window.gitHubSync.sync(),
        forceSync: () => window.gitHubSync.forceSync(),
        
        // معلومات النظام
        getStatus: () => window.gitHubSync.getStatus(),
        getData: () => window.siteData || window.gitHubSync.getLocalData(),
        
        // إدارة النظام
        cleanup: () => window.gitHubSync.cleanup(),
        restart: () => {
            window.gitHubSync.cleanup();
            window.gitHubSync = new GitHubSync();
        },
        
        // دوال مساعدة
        createId: () => 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        formatPrice: (price) => {
            return new Intl.NumberFormat('ar-EG', {
                style: 'currency',
                currency: 'EGP',
                minimumFractionDigits: 0
            }).format(price).replace('EGP', 'ج.م');
        }
    };
    
    console.log('🎉 نظام مزامنة GitHub جاهز للاستخدام');
    
    // إضافة مستمع للأخطاء العامة
    window.addEventListener('unhandledrejection', (event) => {
        console.error('❌ خطأ غير معالج:', event.reason);
    });
}