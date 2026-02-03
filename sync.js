/**
 * نظام مزامنة GitHub المحسن - سيارات عبدالله
 * يدعم تخزين الصور على GitHub وعمليات CRUD الكاملة
 * إصدار 4.0.0
 */

class EnhancedGitHubSync {
    constructor(config = {}) {
        this.config = {
            owner: 'MHmooDhazm',
            repo: 'bitelazz-data',
            token: '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',
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
            maxRetries: 3
        };
        
        this.cache = {
            data: null,
            sha: null,
            images: {}
        };
        
        this.imageCache = new Map();
        this.pendingUploads = [];
        
        console.log('🚀 GitHub Sync Enhanced جاري التحميل...');
    }
    
    // ============ التهيئة ============
    async initialize() {
        try {
            console.log('🔧 جاري تهيئة النظام المحسن...');
            
            // التحقق من التوكن
            const isValid = await this.validateToken();
            if (!isValid) {
                throw new Error('التوكن غير صالح أو انتهت صلاحيته');
            }
            
            // جلب البيانات
            await this.loadFullData();
            
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
            
            // استخدام البيانات المحلية
            await this.loadFromLocalStorage();
            this.state.isInitialized = true;
            
            return false;
        }
    }
    
    // ============ جلب البيانات الكاملة ============
    async loadFullData() {
        try {
            // جلب البيانات الرئيسية
            const data = await this.fetchData();
            
            // جلب الصور المخزنة
            await this.loadStoredImages();
            
            // تحديث الكاش
            this.cache.data = data;
            window.siteData = data;
            
            // حفظ محلياً
            this.saveToLocalStorage(data);
            
            return data;
            
        } catch (error) {
            console.error('❌ فشل تحميل البيانات الكاملة:', error);
            throw error;
        }
    }
    
    // ============ جلب البيانات ============
    async fetchData() {
        this.state.isSyncing = true;
        this.dispatchEvent('syncStart', { type: 'fetch' });
        
        try {
            const response = await this.request(
                `/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.dataFile}`
            );
            
            if (response.status === 404) {
                console.log('📝 إنشاء ملف بيانات جديد...');
                const defaultData = this.createDefaultData();
                const created = await this.createFile(this.config.dataFile, defaultData);
                
                if (created) {
                    return defaultData;
                }
                throw new Error('فشل إنشاء الملف');
            }
            
            if (!response.ok) {
                throw new Error(`فشل الجلب: ${response.status}`);
            }
            
            const result = await response.json();
            const decodedContent = this.base64Decode(result.content);
            const data = JSON.parse(decodedContent);
            
            this.cache.sha = result.sha;
            
            return data;
            
        } catch (error) {
            console.error('❌ فشل جلب البيانات:', error);
            
            // استخدام البيانات المحلية
            const localData = await this.loadFromLocalStorage();
            if (localData) return localData;
            
            // استخدام بيانات افتراضية
            return this.createDefaultData();
            
        } finally {
            this.state.isSyncing = false;
            this.state.lastSync = new Date().toISOString();
        }
    }
    
    // ============ تحميل الصور المخزنة ============
    async loadStoredImages() {
        try {
            const response = await this.request(
                `/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.imagesFolder}`
            );
            
            if (response.ok) {
                const files = await response.json();
                
                // تحميل كل صورة
                for (const file of files) {
                    if (file.type === 'file' && this.isImageFile(file.name)) {
                        const imageResponse = await fetch(file.download_url);
                        const blob = await imageResponse.blob();
                        const dataUrl = await this.blobToDataURL(blob);
                        
                        this.cache.images[file.name] = dataUrl;
                    }
                }
                
                console.log(`✅ تم تحميل ${Object.keys(this.cache.images).length} صورة`);
            }
        } catch (error) {
            console.log('⚠️ لا يوجد مجلد صور أو خطأ في التحميل');
        }
    }
    
    // ============ حفظ البيانات ============
    async save(data) {
        if (this.state.isSyncing) {
            return await this.queueOperation(() => this.saveData(data));
        }
        
        return await this.saveData(data);
    }
    
    async saveData(data) {
        this.state.isSyncing = true;
        this.dispatchEvent('syncStart', { type: 'save' });
        
        try {
            // تحديث البيانات
            data.lastUpdated = new Date().toISOString();
            data.version = data.version || "3.0.0";
            
            // التحقق من البيانات
            this.validateData(data);
            
            // رفع الصور المعلقة أولاً
            await this.processPendingUploads();
            
            // حفظ البيانات
            const commitMessage = this.generateCommitMessage(data);
            const content = this.base64Encode(JSON.stringify(data, null, 2));
            
            const requestBody = {
                message: commitMessage,
                content: content,
                branch: this.config.branch,
                sha: this.cache.sha
            };
            
            const response = await this.request(
                `/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.dataFile}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(requestBody)
                }
            );
            
            if (!response.ok) {
                throw new Error('فشل الحفظ على GitHub');
            }
            
            const result = await response.json();
            
            // تحديث الكاش
            this.cache.data = data;
            this.cache.sha = result.content.sha;
            window.siteData = data;
            
            // حفظ محلياً
            this.saveToLocalStorage(data);
            
            console.log('✅ تم الحفظ بنجاح');
            
            this.dispatchEvent('syncComplete', {
                type: 'save',
                data: data
            });
            
            return {
                success: true,
                github: true,
                local: true,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ فشل الحفظ:', error);
            
            // حفظ محلي كبديل
            try {
                this.saveToLocalStorage(data);
                this.cache.data = data;
                window.siteData = data;
                
                console.log('💾 تم الحفظ محلياً');
                
                return {
                    success: true,
                    github: false,
                    local: true,
                    timestamp: new Date().toISOString()
                };
                
            } catch (localError) {
                console.error('❌ فشل الحفظ المحلي:', localError);
                return {
                    success: false,
                    error: 'فشل الحفظ تماماً'
                };
            }
            
        } finally {
            this.state.isSyncing = false;
            this.state.lastSync = new Date().toISOString();
        }
    }
    
    // ============ رفع الصور ============
    async uploadImage(file, fileName = null) {
        try {
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('الملف ليس صورة');
            }
            
            const name = fileName || `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`;
            const dataUrl = await this.fileToDataURL(file);
            
            // تخزين مؤقت
            this.imageCache.set(name, dataUrl);
            
            // إضافة للقائمة المعلقة
            this.pendingUploads.push({
                name: name,
                dataUrl: dataUrl,
                file: file
            });
            
            // رفع فوري
            await this.uploadImageToGitHub(name, file);
            
            return {
                success: true,
                url: this.getImageUrl(name),
                name: name,
                dataUrl: dataUrl
            };
            
        } catch (error) {
            console.error('❌ فشل رفع الصورة:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async uploadImageToGitHub(fileName, file) {
        try {
            // تحويل إلى base64
            const base64Content = await this.fileToBase64(file);
            
            const requestBody = {
                message: `📸 إضافة صورة: ${fileName}`,
                content: base64Content,
                branch: this.config.branch
            };
            
            const response = await this.request(
                `/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.imagesFolder}/${fileName}`,
                {
                    method: 'PUT',
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
            throw error;
        }
    }
    
    async uploadMultipleImages(files) {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.uploadImage(file);
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    fileName: file.name,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    async processPendingUploads() {
        if (this.pendingUploads.length === 0) return;
        
        console.log(`📤 جاري رفع ${this.pendingUploads.length} صورة...`);
        
        const uploads = [...this.pendingUploads];
        this.pendingUploads = [];
        
        for (const upload of uploads) {
            try {
                await this.uploadImageToGitHub(upload.name, upload.file);
            } catch (error) {
                console.error(`❌ فشل رفع ${upload.name}:`, error);
            }
        }
    }
    
    // ============ الحصول على رابط الصورة ============
    getImageUrl(fileName) {
        if (this.imageCache.has(fileName)) {
            return this.imageCache.get(fileName);
        }
        
        if (this.cache.images[fileName]) {
            return this.cache.images[fileName];
        }
        
        // رابط GitHub المباشر
        return `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/${this.config.imagesFolder}/${fileName}`;
    }
    
    // ============ حذف الصورة ============
    async deleteImage(fileName) {
        try {
            // الحصول على SHA للصورة
            const response = await this.request(
                `/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.imagesFolder}/${fileName}`
            );
            
            if (!response.ok) {
                throw new Error('الصورة غير موجودة');
            }
            
            const fileInfo = await response.json();
            
            const deleteBody = {
                message: `🗑️ حذف صورة: ${fileName}`,
                sha: fileInfo.sha,
                branch: this.config.branch
            };
            
            const deleteResponse = await this.request(
                `/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.imagesFolder}/${fileName}`,
                {
                    method: 'DELETE',
                    body: JSON.stringify(deleteBody)
                }
            );
            
            if (!deleteResponse.ok) {
                throw new Error('فشل حذف الصورة');
            }
            
            // إزالة من الكاش
            this.imageCache.delete(fileName);
            delete this.cache.images[fileName];
            
            console.log(`✅ تم حذف الصورة: ${fileName}`);
            return true;
            
        } catch (error) {
            console.error('❌ فشل حذف الصورة:', error);
            return false;
        }
    }
    
    // ============ المزامنة ============
    async sync() {
        try {
            const data = await this.fetchData();
            
            // تحديث الكاش
            this.cache.data = data;
            window.siteData = data;
            
            // تحميل الصور الجديدة
            await this.loadStoredImages();
            
            this.dispatchEvent('dataChanged', {
                type: 'sync',
                data: data
            });
            
            return data;
            
        } catch (error) {
            console.error('❌ فشل المزامنة:', error);
            throw error;
        }
    }
    
    // ============ أدوات مساعدة ============
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
        return dataUrl.split(',')[1]; // إزالة البادئة
    }
    
    async blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    base64Encode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }
    
    base64Decode(str) {
        return decodeURIComponent(escape(atob(str.replace(/\n/g, ''))));
    }
    
    isImageFile(fileName) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    }
    
    // ============ إنشاء ملف جديد ============
    async createFile(filePath, data) {
        try {
            const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            
            const requestBody = {
                message: '🚀 إنشاء ملف جديد',
                content: this.base64Encode(content),
                branch: this.config.branch
            };
            
            const response = await this.request(
                `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`,
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
                return JSON.parse(dataStr);
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
            images: {}
        };
        this.imageCache.clear();
        localStorage.removeItem('abdullah_cars_data');
        console.log('🗑️ تم مسح الكاش');
    }
    
    // ============ أدوات مساعدة ============
    validateData(data) {
        const requiredSections = ['site', 'products', 'brands', 'categories', 'users'];
        const missing = requiredSections.filter(section => !data[section]);
        
        if (missing.length > 0) {
            console.warn('⚠️ أقسام مفقودة في البيانات:', missing);
        }
        
        return true;
    }
    
    generateCommitMessage(data) {
        const changes = [];
        
        if (data.products) changes.push(`${data.products.length} منتج`);
        if (data.brands) changes.push(`${data.brands.length} ماركة`);
        if (data.categories) changes.push(`${data.categories.length} قسم`);
        if (data.users) changes.push(`${data.users.length} مستخدم`);
        
        return `🔄 تحديث البيانات: ${changes.join(' | ')}\n\nالتاريخ: ${new Date().toLocaleString('ar-EG')}`;
    }
    
    async queueOperation(operation) {
        return new Promise((resolve) => {
            const attempt = async () => {
                if (!this.state.isSyncing) {
                    const result = await operation();
                    resolve(result);
                } else {
                    setTimeout(attempt, 500);
                }
            };
            attempt();
        });
    }
    
    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        const config = {
            headers: { ...this.headers, ...options.headers },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (response.status === 429) {
                this.state.retryCount++;
                if (this.state.retryCount <= this.state.maxRetries) {
                    const waitTime = Math.pow(2, this.state.retryCount) * 1000;
                    await this.delay(waitTime);
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
        // كل 10 دقائق
        setInterval(async () => {
            if (this.state.isInitialized && !this.state.isSyncing) {
                try {
                    await this.sync();
                } catch (error) {
                    console.error('❌ فشل المزامنة التلقائية:', error);
                }
            }
        }, 10 * 60 * 1000);
        
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
    
    // ============ الأحداث ============
    on(event, callback) {
        window.addEventListener(`githubSync:${event}`, (e) => callback(e.detail));
    }
    
    dispatchEvent(event, data) {
        const customEvent = new CustomEvent(`githubSync:${event}`, {
            detail: data
        });
        window.dispatchEvent(customEvent);
    }
    
    // ============ معلومات النظام ============
    getStatus() {
        return {
            initialized: this.state.isInitialized,
            syncing: this.state.isSyncing,
            lastSync: this.state.lastSync,
            lastError: this.state.lastError,
            cache: {
                data: !!this.cache.data,
                products: this.cache.data?.products?.length || 0,
                brands: this.cache.data?.brands?.length || 0,
                categories: this.cache.data?.categories?.length || 0,
                users: this.cache.data?.users?.length || 0,
                images: Object.keys(this.cache.images).length
            }
        };
    }
    
    // ============ إنشاء بيانات افتراضية ============
    createDefaultData() {
        return {
            version: "3.0.0",
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
}

// ============ التهيئة التلقائية ============
if (typeof window !== 'undefined') {
    window.gitHubSync = new EnhancedGitHubSync();
    
    window.addEventListener('load', async () => {
        console.log('🎉 بدء تحميل نظام المزامنة المحسن...');
        
        try {
            await window.gitHubSync.initialize();
            console.log('🚀 النظام المحسن جاهز للعمل');
        } catch (error) {
            console.error('❌ فشل تحميل النظام المحسن:', error);
            
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
                uploadImage: async (file) => {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve({
                                success: true,
                                url: reader.result,
                                name: file.name
                            });
                        };
                        reader.readAsDataURL(file);
                    });
                },
                getStatus: () => ({ initialized: true, source: 'local' })
            };
        }
    });
}

// ============ تصدير للنود جي إس ============
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedGitHubSync;
}