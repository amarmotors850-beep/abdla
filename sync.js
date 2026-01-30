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
        this.isInitialized = false;
        this.syncQueue = [];
        this.syncInterval = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🚀 نظام المزامنة يعمل...');
            
            // اختبار الاتصال
            const connected = await this.testConnection();
            
            if (connected) {
                // تحميل البيانات الأولية
                const data = await this.loadInitialData();
                
                if (data) {
                    this.isInitialized = true;
                    window.siteData = data;
                    
                    // بدء المزامنة التلقائية
                    this.startAutoSync();
                    
                    console.log('✅ نظام المزامنة جاهز');
                    this.dispatchEvent('initialized', { success: true });
                    return true;
                }
            }
            
            throw new Error('فشل التهيئة');
            
        } catch (error) {
            console.error('❌ فشل التهيئة:', error);
            this.handleInitializationError(error);
            return false;
        }
    }

    async testConnection() {
        try {
            console.log('🔗 اختبار الاتصال مع GitHub...');
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}`,
                { 
                    headers: this.headers,
                    cache: 'no-store'
                }
            );
            
            console.log('🔍 حالة الاتصال:', response.status);
            
            if (response.status === 401 || response.status === 403) {
                console.error('❌ التوكن غير صالح أو انتهت صلاحيته');
                throw new Error('التوكن غير صالح أو منتهي الصلاحية. يرجى تحديث التوكن.');
            }
            
            if (response.status === 404) {
                console.error('❌ المستودع غير موجود');
                throw new Error('المستودع غير موجود. يرجى التحقق من اسم المستودع.');
            }
            
            if (!response.ok) {
                console.error('❌ خطأ في الاتصال:', response.status, response.statusText);
                throw new Error(`خطأ في الاتصال: ${response.status} - ${response.statusText}`);
            }
            
            console.log('✅ الاتصال مع GitHub ناجح');
            return true;
            
        } catch (error) {
            console.error('❌ فشل اختبار الاتصال:', error.message);
            this.dispatchEvent('connectionError', { error: error.message });
            return false;
        }
    }

    async loadInitialData() {
        console.log('📥 جاري تحميل البيانات الأولية...');
        
        try {
            // المحاولة الأولى: جلب من GitHub
            const cloudData = await this.fetchFromGitHub();
            
            if (cloudData) {
                console.log('✅ تم تحميل البيانات من GitHub');
                this.saveDataLocally(cloudData, 'github');
                return cloudData;
            } else {
                console.log('📝 الملف غير موجود على GitHub، سيتم إنشاؤه');
                return null;
            }
            
        } catch (error) {
            console.log('⚠️ فشل تحميل من GitHub:', error.message);
        }
        
        // المحاولة الثانية: استخدام البيانات المحلية
        try {
            const localData = this.getLocalData();
            if (localData && localData.version) {
                console.log('✅ استخدام البيانات المحلية');
                return localData;
            }
        } catch (error) {
            console.log('⚠️ البيانات المحلية غير صالحة:', error.message);
        }
        
        // المحاولة الثالثة: إنشاء بيانات جديدة
        const newData = this.createNewData();
        console.log('🆕 إنشاء بيانات جديدة');
        this.saveDataLocally(newData, 'new');
        return newData;
    }

    async fetchFromGitHub() {
        try {
            console.log('⬇️ جاري جلب البيانات من GitHub...');
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}?ref=${this.config.branch}`,
                { 
                    headers: this.headers,
                    cache: 'no-store'
                }
            );

            console.log('🔍 حالة جلب البيانات:', response.status);
            
            if (response.status === 404) {
                console.log('📝 الملف غير موجود على GitHub');
                return null;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ خطأ في الاستجابة:', errorText);
                throw new Error(`فشل جلب البيانات: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.content) {
                throw new Error('لا يوجد محتوى في الملف');
            }

            // فك تشفير Base64
            const decodedContent = this.base64Decode(result.content);
            const data = JSON.parse(decodedContent);
            
            console.log('✅ تم جلب البيانات بنجاح');
            return data;
            
        } catch (error) {
            console.error('❌ فشل جلب البيانات:', error.message);
            throw error;
        }
    }

    async pushToGitHub(data) {
        if (this.isSyncing) {
            console.log('⏳ المزامنة قيد التشغيل بالفعل...');
            return { success: false, error: 'مشغول حالياً' };
        }
        
        this.isSyncing = true;
        
        try {
            console.log('⬆️ جاري رفع البيانات إلى GitHub...');
            
            // تحديث البيانات
            data = { ...data };
            data.lastUpdated = new Date().toISOString();
            data.version = data.version || "1.0.0";
            
            // تحويل البيانات إلى JSON
            const jsonStr = JSON.stringify(data, null, 2);
            const base64Content = this.base64Encode(jsonStr);
            
            // الحصول على SHA للملف الحالي
            let sha = null;
            try {
                const currentResponse = await fetch(
                    `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}?ref=${this.config.branch}`,
                    { headers: this.headers }
                );
                
                if (currentResponse.ok) {
                    const currentData = await currentResponse.json();
                    sha = currentData.sha;
                    console.log('📝 تحديث الملف الحالي');
                }
            } catch (error) {
                console.log('📝 سيتم إنشاء ملف جديد');
            }

            // رسالة الحفظ
            const commitMessage = `تحديث البيانات: ${new Date().toLocaleString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`;

            // إعداد طلب الرفع
            const requestBody = {
                message: commitMessage,
                content: base64Content,
                branch: this.config.branch,
                sha: sha
            };

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
                console.error('❌ خطأ في الرد:', errorData);
                throw new Error(`فشل الرفع: ${errorData.message || response.status}`);
            }

            // حفظ محلي
            this.saveDataLocally(data, 'github');
            
            console.log('✅ تم رفع البيانات بنجاح');
            
            // إطلاق حدث
            this.dispatchEvent('pushSuccess', {
                timestamp: new Date().toISOString(),
                message: commitMessage,
                data: data
            });
            
            this.retryCount = 0;
            
            return {
                success: true,
                message: commitMessage,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ فشل رفع البيانات:', error.message);
            
            // حفظ محلي على الأقل
            try {
                this.saveDataLocally(data, 'local');
                console.log('💾 تم الحفظ محلياً');
            } catch (e) {
                console.error('❌ فشل الحفظ المحلي:', e.message);
            }
            
            this.dispatchEvent('pushError', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            this.retryCount++;
            
            if (this.retryCount <= this.maxRetries) {
                console.log(`🔄 إعادة المحاولة (${this.retryCount}/${this.maxRetries})...`);
                setTimeout(() => this.pushToGitHub(data), 2000 * this.retryCount);
            }
            
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
        if (this.isSyncing) {
            console.log('⏳ المزامنة قيد التشغيل بالفعل...');
            return null;
        }

        if (!this.isInitialized) {
            console.log('🔄 تهيئة النظام أولاً...');
            const initialized = await this.initialize();
            if (!initialized) {
                return null;
            }
        }

        this.isSyncing = true;
        
        try {
            console.log('🔄 بدء المزامنة...');
            
            // جلب أحدث البيانات من GitHub
            const cloudData = await this.fetchFromGitHub();
            const localData = this.getLocalData();
            
            let finalData = localData;
            let operation = 'none';
            
            if (cloudData) {
                // مقارنة التاريخ
                const cloudTime = new Date(cloudData.lastUpdated || 0).getTime();
                const localTime = new Date(localData.lastUpdated || 0).getTime();
                
                console.log(`📅 تواريخ: السحابة ${new Date(cloudTime).toLocaleString()} | المحلي ${new Date(localTime).toLocaleString()}`);
                
                if (cloudTime > localTime) {
                    console.log('📥 تحديث البيانات من السحابة (السحابة أحدث)');
                    finalData = cloudData;
                    operation = 'pull';
                } else if (localTime > cloudTime) {
                    console.log('⬆️ رفع البيانات إلى السحابة (المحلي أحدث)');
                    await this.pushToGitHub(localData);
                    finalData = localData;
                    operation = 'push';
                } else {
                    console.log('✅ البيانات متزامنة بالفعل');
                    operation = 'sync';
                }
            } else {
                // رفع البيانات المحلية (الملف غير موجود على GitHub)
                console.log('⬆️ رفع البيانات المحلية إلى السحابة (ملف جديد)');
                await this.pushToGitHub(localData);
                finalData = localData;
                operation = 'create';
            }
            
            // تحديث البيانات
            this.saveDataLocally(finalData, 'github');
            
            // إطلاق حدث
            this.dispatchEvent('syncComplete', {
                data: finalData,
                timestamp: new Date().toISOString(),
                operation: operation
            });
            
            console.log(`✅ تمت المزامنة بنجاح (${operation})`);
            return finalData;
            
        } catch (error) {
            console.error('❌ فشل المزامنة:', error.message);
            
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

    saveDataLocally(data, source = 'local') {
        try {
            const jsonStr = JSON.stringify(data, null, 2);
            localStorage.setItem('siteData', jsonStr);
            localStorage.setItem('dataSource', source);
            localStorage.setItem('lastUpdate', new Date().toISOString());
            
            window.siteData = data;
            console.log(`💾 تم الحفظ محلياً (مصدر: ${source})`);
            return true;
        } catch (error) {
            console.error('❌ فشل الحفظ المحلي:', error.message);
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
            console.error('❌ خطأ في قراءة البيانات المحلية:', error.message);
        }
        
        const newData = this.createNewData();
        this.saveDataLocally(newData, 'new');
        return newData;
    }

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
                    active: true,
                    createdAt: new Date().toISOString()
                }
            ],
            brands: [],
            products: [],
            settings: {
                theme: "default",
                mainColor: "#c53030",
                enableWhatsapp: true,
                autoSync: true
            }
        };
    }

    base64Encode(str) {
        try {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode('0x' + p1);
            }));
        } catch (e) {
            console.error('❌ خطأ في الترميز:', e);
            return btoa(str);
        }
    }

    base64Decode(str) {
        try {
            return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        } catch (e) {
            console.error('❌ خطأ في فك الترميز:', e);
            return atob(str);
        }
    }

    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            if (!this.isSyncing) {
                this.sync();
            }
        }, 30000);
        
        console.log('⏰ تم تفعيل المزامنة التلقائية (كل 30 ثانية)');
    }

    handleInitializationError(error) {
        console.error('❌ خطأ في تهيئة النظام:', error.message);
        
        const defaultData = this.createNewData();
        this.saveDataLocally(defaultData, 'error');
        
        this.dispatchEvent('initError', {
            error: error.message,
            usingLocalData: true
        });
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
        const localData = this.getLocalData();
        const lastUpdate = localStorage.getItem('lastUpdate');
        
        return {
            isInitialized: this.isInitialized,
            isSyncing: this.isSyncing,
            retryCount: this.retryCount,
            lastUpdate: lastUpdate ? new Date(lastUpdate).toLocaleString('ar-EG') : 'غير متوفر',
            dataSource: localStorage.getItem('dataSource') || 'unknown',
            dataSize: localData ? JSON.stringify(localData).length : 0,
            products: localData?.products?.length || 0,
            brands: localData?.brands?.length || 0
        };
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
    // تأخير التهيئة قليلاً لضمان تحميل الصفحة
    setTimeout(() => {
        try {
            console.log('🎉 تحميل نظام المزامنة...');
            
            window.gitHubSync = new GitHubSync();
            
            // الانتظار للتأكد من التهيئة
            setTimeout(() => {
                if (!window.gitHubSync.isInitialized) {
                    console.warn('⚠️ لم يتم تهيئة النظام، استخدام البيانات المحلية');
                    
                    // استخدام البيانات المحلية
                    const sync = new GitHubSync();
                    const localData = sync.createNewData();
                    sync.saveDataLocally(localData, 'fallback');
                    
                    window.siteData = localData;
                    window.gitHubSync = sync;
                }
            }, 3000);
            
        } catch (error) {
            console.error('❌ خطأ في إنشاء النظام:', error);
            
            // خطة احتياطية
            const backupSync = new GitHubSync();
            const backupData = backupSync.createNewData();
            backupSync.saveDataLocally(backupData, 'backup');
            
            window.siteData = backupData;
            window.gitHubSync = backupSync;
        }
    }, 1000);
    
    // واجهة برمجة التطبيقات العامة
    window.GitHubSyncService = {
        fetch: () => window.gitHubSync?.sync() || Promise.resolve(null),
        push: (data) => window.gitHubSync?.pushToGitHub(data) || Promise.resolve(null),
        sync: () => window.gitHubSync?.sync() || Promise.resolve(null),
        getStatus: () => window.gitHubSync?.getStatus() || { error: 'System not initialized' },
        getData: () => window.siteData || window.gitHubSync?.getLocalData() || {},
        createId: () => 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        formatPrice: (price) => {
            return new Intl.NumberFormat('ar-EG').format(price || 0) + ' ج.م';
        }
    };
    
    console.log('🎉 نظام مزامنة GitHub جاهز للاستخدام');
}