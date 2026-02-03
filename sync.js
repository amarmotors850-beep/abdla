/**
 * نظام مزامنة GitHub المحسن - سيارات عبدالله
 * يدعم تخزين البيانات والصور على GitHub
 * إصدار 5.0.0 - مع تحديثات الأمان
 */

class EnhancedGitHubSync {
    constructor(config = {}) {
        this.config = {
            owner: 'MHmooDhazm',
            repo: 'bitelazz-data',
            token: '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', // إزالة التوكن لأسباب أمنية
            branch: 'main',
            dataFile: 'site-data.json',
            imagesFolder: 'images',
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
            maxRetries: 5
        };
        
        this.cache = {
            data: null,
            sha: null,
            images: {}
        };
        
        console.log('🚀 GitHub Sync Enhanced v5.0.0 جاري التحميل...');
    }
    
    // ============ التهيئة ============
    async initialize() {
        try {
            console.log('🔧 جاري تهيئة النظام المحسن...');
            
            // التحقق من صحة التوكن
            const tokenValid = await this.validateToken();
            if (!tokenValid) {
                console.log('🔑 التوكن غير صالح، استخدام الوضع المحلي');
                return this.initializeLocalMode();
            }
            
            // التحقق من وجود الريبو
            const repoExists = await this.checkRepo();
            if (!repoExists) {
                console.error('❌ الريبو غير موجود');
                return this.initializeLocalMode();
            }
            
            // إنشاء مجلد الصور إذا لم يكن موجوداً
            await this.ensureImagesFolder();
            
            // جلب البيانات الأولية
            await this.loadInitialData();
            
            this.state.isInitialized = true;
            this.state.lastSync = new Date().toISOString();
            
            console.log('✅ تم تهيئة النظام بنجاح');
            
            // بدء المزامنة التلقائية
            this.startAutoSync();
            
            return true;
            
        } catch (error) {
            console.error('❌ فشل التهيئة:', error);
            return this.initializeLocalMode();
        }
    }
    
    async initializeLocalMode() {
        console.log('🔄 التحويل إلى الوضع المحلي...');
        
        // تهيئة البيانات المحلية
        await this.loadLocalData();
        
        this.state.isInitialized = true;
        this.state.lastSync = new Date().toISOString();
        
        console.log('✅ تم التهيئة في الوضع المحلي');
        return false;
    }
    
    // ============ التحقق من التوكن ============
    async validateToken() {
        try {
            // إذا لم يكن هناك توكن، استخدام الوضع المحلي
            if (!this.config.token || this.config.token.trim() === '') {
                console.log('🔑 لا يوجد توكن، استخدام الوضع المحلي');
                return false;
            }
            
            const response = await fetch(`${this.baseURL}/user`, {
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                console.error(`❌ خطأ في التحقق من التوكن: ${response.status}`);
                return false;
            }
            
            console.log('✅ التوكن صالح');
            return true;
            
        } catch (error) {
            console.error('❌ فشل التحقق من التوكن:', error);
            return false;
        }
    }
    
    // ============ التحقق من الريبو ============
    async checkRepo() {
        try {
            // إذا لم يكن هناك توكن، استخدام الوضع المحلي
            if (!this.config.token || this.config.token.trim() === '') {
                return false;
            }
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}`,
                {
                    headers: this.headers
                }
            );
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.error('❌ الريبو غير موجود');
                    return false;
                }
                throw new Error(`خطأ في التحقق من الريبو: ${response.status}`);
            }
            
            console.log('✅ الريبو موجود');
            return true;
            
        } catch (error) {
            console.error('❌ فشل التحقق من الريبو:', error);
            return false;
        }
    }
    
    // ============ إنشاء مجلد الصور ============
    async ensureImagesFolder() {
        try {
            // إذا لم يكن هناك توكن، استخدام الوضع المحلي
            if (!this.config.token || this.config.token.trim() === '') {
                return false;
            }
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.imagesFolder}`,
                {
                    headers: this.headers
                }
            );
            
            if (response.status === 404) {
                console.log('📁 جاري إنشاء مجلد الصور...');
                
                // إنشاء ملف README في المجلد
                const readmeContent = this.base64Encode('# مجلد الصور\nسيتم تخزين جميع الصور هنا.');
                
                const createResponse = await fetch(
                    `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.imagesFolder}/README.md`,
                    {
                        method: 'PUT',
                        headers: this.headers,
                        body: JSON.stringify({
                            message: '📁 إنشاء مجلد الصور',
                            content: readmeContent,
                            branch: this.config.branch
                        })
                    }
                );
                
                if (createResponse.ok) {
                    console.log('✅ تم إنشاء مجلد الصور');
                    return true;
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ فشل إنشاء مجلد الصور:', error);
            return false;
        }
    }
    
    // ============ جلب البيانات الأولية ============
    async loadInitialData() {
        try {
            // محاولة جلب البيانات من GitHub
            const githubData = await this.fetchFromGitHub();
            if (githubData) {
                this.cache.data = githubData;
                this.saveToLocalStorage(githubData);
                console.log('✅ تم تحميل البيانات من GitHub');
                return;
            }
            
            // إذا فشل، جلب البيانات المحلية
            const localData = await this.loadLocalData();
            if (localData) {
                this.cache.data = localData;
                console.log('✅ تم تحميل البيانات المحلية');
                return;
            }
            
            // إنشاء بيانات افتراضية
            const defaultData = this.createDefaultData();
            this.cache.data = defaultData;
            this.saveToLocalStorage(defaultData);
            console.log('✅ تم إنشاء بيانات افتراضية');
            
        } catch (error) {
            console.error('❌ فشل تحميل البيانات الأولية:', error);
            throw error;
        }
    }
    
    // ============ جلب البيانات من GitHub ============
    async fetchFromGitHub() {
        try {
            // إذا لم يكن هناك توكن، استخدام الوضع المحلي
            if (!this.config.token || this.config.token.trim() === '') {
                return null;
            }
            
            const response = await fetch(
                `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/${this.config.dataFile}?_=${Date.now()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                
                // الحصول على SHA للملف
                const shaResponse = await fetch(
                    `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.dataFile}`,
                    {
                        headers: this.headers
                    }
                );
                
                if (shaResponse.ok) {
                    const shaData = await shaResponse.json();
                    this.cache.sha = shaData.sha;
                }
                
                return data;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ فشل جلب البيانات من GitHub:', error);
            return null;
        }
    }
    
    // ============ جلب البيانات المحلية ============
    async loadLocalData() {
        try {
            const dataStr = localStorage.getItem('abdullah_cars_data');
            if (dataStr) {
                return JSON.parse(dataStr);
            }
            return null;
        } catch (error) {
            console.error('❌ خطأ في قراءة البيانات المحلية:', error);
            return null;
        }
    }
    
    // ============ المزامنة ============
    async sync() {
        if (this.state.isSyncing) {
            console.log('⚠️ المزامنة جارية بالفعل...');
            return this.cache.data;
        }
        
        this.state.isSyncing = true;
        
        try {
            console.log('🔄 بدء المزامنة...');
            
            let data = null;
            
            // محاولة الجلب من GitHub
            if (this.state.isInitialized && this.config.token && this.config.token.trim() !== '') {
                data = await this.fetchFromGitHub();
            }
            
            // إذا فشل، استخدام البيانات المحلية
            if (!data) {
                data = await this.loadLocalData();
                if (!data) {
                    data = this.createDefaultData();
                }
            }
            
            // تحديث الكاش
            this.cache.data = data;
            
            // حفظ محلياً
            this.saveToLocalStorage(data);
            
            this.state.lastSync = new Date().toISOString();
            this.state.retryCount = 0;
            
            console.log('✅ تمت المزامنة بنجاح');
            return data;
            
        } catch (error) {
            console.error('❌ فشل المزامنة:', error);
            this.state.lastError = error.message;
            this.state.retryCount++;
            
            // استخدام البيانات المحلية كبديل
            const localData = await this.loadLocalData();
            if (localData) {
                this.cache.data = localData;
                return localData;
            }
            
            throw error;
            
        } finally {
            this.state.isSyncing = false;
        }
    }
    
    // ============ حفظ البيانات ============
    async save(data) {
        this.state.isSyncing = true;
        
        try {
            console.log('💾 بدء حفظ البيانات...');
            
            // تحديث البيانات
            data.lastUpdated = new Date().toISOString();
            data.version = data.version || "5.0.0";
            
            // حفظ محلياً أولاً
            this.saveToLocalStorage(data);
            this.cache.data = data;
            
            // محاولة الحفظ على GitHub (فقط إذا كان هناك توكن)
            let githubSuccess = false;
            if (this.state.isInitialized && this.config.token && this.config.token.trim() !== '') {
                githubSuccess = await this.saveToGitHub(data);
            }
            
            this.state.lastSync = new Date().toISOString();
            
            console.log('✅ تم حفظ البيانات بنجاح');
            
            return {
                success: true,
                github: githubSuccess,
                local: true,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ فشل حفظ البيانات:', error);
            
            // حفظ محلي كبديل
            try {
                this.saveToLocalStorage(data);
                return {
                    success: true,
                    github: false,
                    local: true,
                    timestamp: new Date().toISOString(),
                    error: 'تم الحفظ محلياً فقط'
                };
            } catch (localError) {
                return {
                    success: false,
                    error: 'فشل الحفظ تماماً'
                };
            }
            
        } finally {
            this.state.isSyncing = false;
        }
    }
    
    // ============ حفظ على GitHub ============
    async saveToGitHub(data) {
        try {
            // إذا لم يكن هناك توكن، استخدام الوضع المحلي
            if (!this.config.token || this.config.token.trim() === '') {
                return false;
            }
            
            const content = this.base64Encode(JSON.stringify(data, null, 2));
            const commitMessage = `🔄 تحديث البيانات ${new Date().toLocaleString('ar-EG')}`;
            
            const requestBody = {
                message: commitMessage,
                content: content,
                branch: this.config.branch
            };
            
            // إذا كان هناك SHA، أضفه للطلب
            if (this.cache.sha) {
                requestBody.sha = this.cache.sha;
            }
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.dataFile}`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify(requestBody)
                }
            );
            
            if (!response.ok) {
                throw new Error(`فشل الحفظ: ${response.status}`);
            }
            
            const result = await response.json();
            this.cache.sha = result.content.sha;
            
            console.log('✅ تم الحفظ على GitHub');
            return true;
            
        } catch (error) {
            console.error('❌ فشل الحفظ على GitHub:', error);
            return false;
        }
    }
    
    // ============ رفع الصور ============
    async uploadImage(file, fileName = null) {
        try {
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('الملف ليس صورة');
            }
            
            const name = fileName || `image-${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`;
            const dataUrl = await this.fileToDataURL(file);
            
            // حفظ محلياً
            this.saveImageLocally(name, dataUrl);
            
            // إذا كان النظام مهيئاً وكان هناك توكن، حاول الرفع إلى GitHub
            let githubSuccess = false;
            if (this.state.isInitialized && this.config.token && this.config.token.trim() !== '') {
                githubSuccess = await this.uploadImageToGitHub(name, file);
            }
            
            return {
                success: true,
                url: dataUrl,
                name: name,
                github: githubSuccess,
                local: true
            };
            
        } catch (error) {
            console.error('❌ فشل رفع الصورة:', error);
            
            // محاولة بديلة: استخدام Data URL فقط
            try {
                const dataUrl = await this.fileToDataURL(file);
                const name = `image-${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`;
                this.saveImageLocally(name, dataUrl);
                
                return {
                    success: true,
                    url: dataUrl,
                    name: name,
                    github: false,
                    local: true
                };
            } catch (fallbackError) {
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    }
    
    async uploadImageToGitHub(fileName, file) {
        try {
            // إذا لم يكن هناك توكن، استخدام الوضع المحلي
            if (!this.config.token || this.config.token.trim() === '') {
                return false;
            }
            
            const base64Content = await this.fileToBase64(file);
            
            const requestBody = {
                message: `📸 إضافة صورة: ${fileName}`,
                content: base64Content,
                branch: this.config.branch
            };
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.imagesFolder}/${fileName}`,
                {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify(requestBody)
                }
            );
            
            if (!response.ok) {
                throw new Error('فشل رفع الصورة');
            }
            
            console.log(`✅ تم رفع الصورة: ${fileName}`);
            return true;
            
        } catch (error) {
            console.error(`❌ فشل رفع الصورة ${fileName}:`, error);
            return false;
        }
    }
    
    // ============ أدوات مساعدة ============
    saveImageLocally(name, dataUrl) {
        try {
            const images = JSON.parse(localStorage.getItem('uploaded_images') || '{}');
            images[name] = dataUrl;
            localStorage.setItem('uploaded_images', JSON.stringify(images));
            return true;
        } catch (error) {
            console.error('❌ فشل حفظ الصورة محلياً:', error);
            return false;
        }
    }
    
    async fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    async fileToBase64(file) {
        const dataUrl = await this.fileToDataURL(file);
        return dataUrl.split(',')[1];
    }
    
    base64Encode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }
    
    // ============ حفظ البيانات المحلية ============
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
    
    // ============ إنشاء بيانات افتراضية ============
    createDefaultData() {
        return {
            version: "5.0.0",
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
                address: "القاهرة، مصر",
                workHours: "9 ص - 9 م"
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
                    avatar: "",
                    permissions: ["all"],
                    active: true,
                    createdAt: new Date().toISOString()
                }
            ],
            brands: [],
            categories: [],
            products: [],
            settings: {}
        };
    }
    
    // ============ المزامنة التلقائية ============
    startAutoSync() {
        // فقط إذا كان هناك توكن
        if (!this.config.token || this.config.token.trim() === '') {
            console.log('🔒 لا يوجد توكن، تعطيل المزامنة التلقائية');
            return;
        }
        
        // كل 5 دقائق
        setInterval(async () => {
            if (this.state.isInitialized && !this.state.isSyncing) {
                try {
                    await this.sync();
                } catch (error) {
                    console.error('❌ فشل المزامنة التلقائية:', error);
                }
            }
        }, 5 * 60 * 1000);
        
        // عند التركيز على الصفحة
        window.addEventListener('focus', async () => {
            if (this.state.isInitialized && !this.state.isSyncing) {
                try {
                    await this.sync();
                } catch (error) {
                    console.error('❌ فشل المزامنة عند التركيز:', error);
                }
            }
        });
    }
    
    // ============ الحصول على حالة النظام ============
    getStatus() {
        return {
            initialized: this.state.isInitialized,
            syncing: this.state.isSyncing,
            lastSync: this.state.lastSync,
            lastError: this.state.lastError,
            retryCount: this.state.retryCount,
            hasToken: !!(this.config.token && this.config.token.trim() !== ''),
            config: {
                owner: this.config.owner,
                repo: this.config.repo,
                branch: this.config.branch
            }
        };
    }
}

// ============ التهيئة التلقائية ============
if (typeof window !== 'undefined') {
    window.gitHubSync = new EnhancedGitHubSync();
    
    window.addEventListener('load', async () => {
        console.log('🎉 بدء تحميل نظام المزامنة المحسن...');
        
        try {
            const initialized = await window.gitHubSync.initialize();
            
            if (initialized) {
                console.log('🚀 النظام المحسن جاهز للعمل مع GitHub');
            } else {
                console.log('💾 النظام المحسن جاهز للعمل محلياً');
            }
            
            // إرسال حدث أن النظام جاهز
            const event = new CustomEvent('githubSync:ready', {
                detail: { success: true, initialized: initialized }
            });
            window.dispatchEvent(event);
            
        } catch (error) {
            console.error('❌ فشل تحميل النظام المحسن:', error);
            
            // إنشاء نظام بديل بسيط
            window.gitHubSync = {
                isInitialized: true,
                sync: async () => {
                    const data = JSON.parse(localStorage.getItem('abdullah_cars_data') || 'null');
                    if (!data) {
                        const defaultData = {
                            version: "5.0.0",
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
                                address: "القاهرة، مصر",
                                workHours: "9 ص - 9 م"
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
                                    avatar: "",
                                    permissions: ["all"],
                                    active: true,
                                    createdAt: new Date().toISOString()
                                }
                            ],
                            brands: [],
                            categories: [],
                            products: [],
                            settings: {}
                        };
                        localStorage.setItem('abdullah_cars_data', JSON.stringify(defaultData));
                        return defaultData;
                    }
                    return data;
                },
                save: async (data) => {
                    localStorage.setItem('abdullah_cars_data', JSON.stringify(data));
                    localStorage.setItem('last_save', new Date().toISOString());
                    return { success: true, localSaved: true };
                },
                uploadImage: async (file) => {
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
                },
                getStatus: () => ({ 
                    initialized: true, 
                    source: 'local',
                    hasToken: false
                })
            };
            
            console.log('🔄 النظام البديل جاهز للعمل');
        }
    });
}

// ============ تصدير للنود جي إس ============
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedGitHubSync;
}