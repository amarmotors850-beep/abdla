/**
 * JSONBin.io Client - سيارات عبدالله
 * الإصدار: 10.0.0 - تم التحويل من Supabase إلى JSONBin.io
 */

// ==================== فئة التعامل مع JSONBin.io ====================
class JSONBinService {
    constructor() {
        // بيانات JSONBin.io الصحيحة
        this.binId = '69adc10143b1c97be9c1cfe6';
        this.masterKey = '$2a$10$ZwU8rOGrE8B.TJj8d8olvOexbq42F75IzKnOYAl55dC4XTNHUOm5G';
        this.accessKey = '$2a$10$7K2sm8j3C90xXy1ltw0gVeWRTpygbouubjJDFuDDaX35OiGMVjwNK';
        
        // الروابط
        this.readUrl = `https://api.jsonbin.io/v3/b/${this.binId}`;
        this.writeUrl = `https://api.jsonbin.io/v3/b/${this.binId}`;
        
        // الهيكل الافتراضي للبيانات
        this.defaultData = {
            settings: {
                site_name_ar: 'سيارات عبدالله',
                site_name_en: 'Abdullah Cars',
                site_description_ar: 'ريادة وخبرة في عالم السيارات منذ 1993',
                site_description_en: 'Leadership and experience in the automotive world since 1993',
                contact_phone: '01121811110',
                contact_whatsapp: '01121811110',
                contact_email: 'amarmotors850@gmail.com',
                contact_address: 'الجيزة، مصر',
                social_facebook: 'https://www.facebook.com/share/1SdkvcBynu',
                social_instagram: 'https://www.instagram.com/abdullah_auto_',
                social_tiktok: 'https://www.tiktok.com/@abdullah.auto0',
                social_twitter: '',
                social_youtube: ''
            },
            brands: [],
            categories: [],
            products: [],
            users: [
                {
                    id: 'admin_001',
                    username: 'admin',
                    password: '2845',
                    full_name: 'المدير الرئيسي',
                    email: 'admin@abdullah-cars.com',
                    phone: '01121811110',
                    role: 'admin',
                    permissions: ['all'],
                    avatar: '',
                    active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 'user1',
                    username: 'user1',
                    password: '123456',
                    full_name: 'مستخدم عادي',
                    email: 'user1@example.com',
                    phone: '01234567890',
                    role: 'viewer',
                    permissions: ['view_cars'],
                    avatar: '',
                    active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 'sales1',
                    username: 'sales1',
                    password: '123456',
                    full_name: 'مدير مبيعات',
                    email: 'sales@example.com',
                    phone: '01234567891',
                    role: 'sales',
                    permissions: ['view_cars', 'view_sell', 'update_sell', 'view_orders', 'update_orders'],
                    avatar: '',
                    active: true,
                    created_at: new Date().toISOString()
                }
            ],
            sellRequests: [],
            exchangeRequests: [],
            orders: []
        };
        
        this.cache = null;
        this.lastFetch = 0;
        this.cacheDuration = 5 * 60 * 1000; // 5 دقائق
    }

    // ==================== دوال أساسية ====================
    async fetchData(force = false) {
        try {
            // التحقق من الكاش
            const now = Date.now();
            if (!force && this.cache && (now - this.lastFetch) < this.cacheDuration) {
                console.log('✅ استخدام البيانات المخزنة مؤقتاً');
                return { success: true, data: this.cache };
            }

            console.log('🔄 جاري تحميل البيانات من JSONBin.io...');
            
            const response = await fetch(this.readUrl, {
                method: 'GET',
                headers: {
                    'X-Master-Key': this.masterKey,
                    'X-Access-Key': this.accessKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // التحقق من وجود البيانات
            let data = result.record;
            
            // إذا كانت البيانات فارغة، استخدم البيانات الافتراضية
            if (!data || Object.keys(data).length === 0) {
                console.log('⚠️ البيانات فارغة، جاري تهيئة البيانات الافتراضية...');
                await this.initData();
                return this.fetchData(true);
            }
            
            // تحديث الكاش
            this.cache = data;
            this.lastFetch = now;
            
            console.log('✅ تم تحميل البيانات بنجاح');
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
            
            // استخدام البيانات الافتراضية في حالة الخطأ
            if (!this.cache) {
                this.cache = this.defaultData;
            }
            
            return { 
                success: true, 
                data: this.cache,
                warning: 'استخدام البيانات المحلية بسبب خطأ في الاتصال'
            };
        }
    }

    async saveData(data) {
        try {
            console.log('🔄 جاري حفظ البيانات في JSONBin.io...');
            
            const response = await fetch(this.writeUrl, {
                method: 'PUT',
                headers: {
                    'X-Master-Key': this.masterKey,
                    'X-Access-Key': this.accessKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // تحديث الكاش
            this.cache = data;
            this.lastFetch = Date.now();
            
            console.log('✅ تم حفظ البيانات بنجاح');
            return { success: true };
            
        } catch (error) {
            console.error('❌ خطأ في حفظ البيانات:', error);
            
            // حفظ محلي في حالة الفشل
            this.cache = data;
            
            return { 
                success: true, 
                warning: 'تم الحفظ محلياً فقط بسبب خطأ في الاتصال'
            };
        }
    }

    async initData() {
        try {
            console.log('🔄 جاري تهيئة البيانات الافتراضية...');
            
            // إضافة بعض المنتجات الافتراضية
            const defaultProducts = [
                {
                    id: 'prod_001',
                    name_ar: 'تويوتا كورولا 2024',
                    name_en: 'Toyota Corolla 2024',
                    brand_id: 'brand_001',
                    category_id: 'cat_001',
                    model: 'Corolla',
                    year: 2024,
                    price: 750000,
                    old_price: null,
                    type: 'new',
                    fuel: 'بنزين',
                    engine: '1.8 لتر',
                    mileage: 0,
                    colors: ['أبيض', 'أسود', 'فضي'],
                    description: 'سيارة تويوتا كورولا موديل 2024 بحالة الوكالة، كاملة المواصفات، فتحة سقف، شاشة تعمل باللمس، كاميرا خلفية، حساسات أمامية وخلفية.',
                    images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
                    featured: true,
                    installment: true,
                    active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 'prod_002',
                    name_ar: 'هيونداي توسان 2024',
                    name_en: 'Hyundai Tucson 2024',
                    brand_id: 'brand_002',
                    category_id: 'cat_001',
                    model: 'Tucson',
                    year: 2024,
                    price: 850000,
                    old_price: 900000,
                    type: 'new',
                    fuel: 'بنزين',
                    engine: '2.0 لتر',
                    mileage: 0,
                    colors: ['أبيض', 'أسود', 'رمادي'],
                    description: 'سيارة هيونداي توسان موديل 2024، فئة عالية، كاملة المواصفات، مقاعد جلد، فتحة سقف بانوراما، شاشة 10.25 بوصة.',
                    images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
                    featured: true,
                    installment: true,
                    active: true,
                    created_at: new Date().toISOString()
                }
            ];
            
            // إضافة بعض الماركات الافتراضية
            const defaultBrands = [
                {
                    id: 'brand_001',
                    name_ar: 'تويوتا',
                    name_en: 'Toyota',
                    logo: '',
                    active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 'brand_002',
                    name_ar: 'هيونداي',
                    name_en: 'Hyundai',
                    logo: '',
                    active: true,
                    created_at: new Date().toISOString()
                }
            ];
            
            // إضافة بعض الأقسام الافتراضية
            const defaultCategories = [
                {
                    id: 'cat_001',
                    name_ar: 'سيدان',
                    name_en: 'Sedan',
                    description: 'سيارات سيدان عائلية',
                    image: '',
                    active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 'cat_002',
                    name_ar: 'دفع رباعي',
                    name_en: 'SUV',
                    description: 'سيارات دفع رباعي',
                    image: '',
                    active: true,
                    created_at: new Date().toISOString()
                }
            ];
            
            // بناء البيانات الكاملة
            const fullData = {
                ...this.defaultData,
                brands: defaultBrands,
                categories: defaultCategories,
                products: defaultProducts
            };
            
            // حفظ البيانات
            await this.saveData(fullData);
            
            console.log('✅ تم تهيئة البيانات الافتراضية بنجاح');
            
        } catch (error) {
            console.error('❌ خطأ في تهيئة البيانات:', error);
        }
    }

    // ==================== المنتجات ====================
    async getProducts(filters = {}) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات', data: [] };
            
            let products = result.data.products || [];
            
            // تطبيق الفلاتر
            if (filters.brandId) {
                products = products.filter(p => p.brand_id === filters.brandId);
            }
            if (filters.categoryId) {
                products = products.filter(p => p.category_id === filters.categoryId);
            }
            if (filters.type) {
                products = products.filter(p => p.type === filters.type);
            }
            if (filters.minPrice) {
                products = products.filter(p => p.price >= filters.minPrice);
            }
            if (filters.maxPrice && filters.maxPrice !== Infinity) {
                products = products.filter(p => p.price <= filters.maxPrice);
            }
            if (filters.featured) {
                products = products.filter(p => p.featured === true);
            }
            if (filters.installment) {
                products = products.filter(p => p.installment === true);
            }
            if (filters.active === true) {
                products = products.filter(p => p.active === true);
            }
            
            // ترتيب النتائج
            products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            return { success: true, data: products };
            
        } catch (error) {
            console.error('❌ خطأ في جلب المنتجات:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async getProductById(id) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const product = result.data.products?.find(p => p.id === id);
            
            if (!product) {
                return { success: false, error: 'المنتج غير موجود' };
            }
            
            // إضافة معلومات الماركة والقسم
            const brand = result.data.brands?.find(b => b.id === product.brand_id);
            const category = result.data.categories?.find(c => c.id === product.category_id);
            
            const productWithDetails = {
                ...product,
                brand: brand || null,
                category: category || null
            };
            
            return { success: true, data: productWithDetails };
            
        } catch (error) {
            console.error('❌ خطأ في جلب المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    async addProduct(product) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            // إنشاء ID جديد
            const newId = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const newProduct = {
                id: newId,
                name_ar: product.nameAr || product.name_ar,
                name_en: product.nameEn || product.name_en,
                brand_id: product.brandId || product.brand_id,
                category_id: product.categoryId || product.category_id,
                model: product.model || null,
                year: product.year ? parseInt(product.year) : null,
                price: parseFloat(product.price) || 0,
                old_price: product.oldPrice ? parseFloat(product.oldPrice) : (product.old_price || null),
                type: product.type || 'new',
                fuel: product.fuel || null,
                engine: product.engine || null,
                mileage: product.mileage ? parseInt(product.mileage) : null,
                colors: product.colors || [],
                description: product.description || '',
                images: product.images || [],
                featured: product.featured || false,
                installment: product.installment || false,
                active: product.active !== false,
                created_at: new Date().toISOString()
            };
            
            // إضافة للمصفوفة
            if (!data.products) data.products = [];
            data.products.push(newProduct);
            
            // حفظ البيانات
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true, data: newProduct };
            } else {
                return { success: false, error: 'فشل حفظ المنتج' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في إضافة المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProduct(id, updates) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            // البحث عن المنتج
            const index = data.products?.findIndex(p => p.id === id);
            
            if (index === -1 || index === undefined) {
                return { success: false, error: 'المنتج غير موجود' };
            }
            
            // تحديث البيانات
            data.products[index] = {
                ...data.products[index],
                name_ar: updates.nameAr || updates.name_ar || data.products[index].name_ar,
                name_en: updates.nameEn || updates.name_en || data.products[index].name_en,
                brand_id: updates.brandId || updates.brand_id || data.products[index].brand_id,
                category_id: updates.categoryId || updates.category_id || data.products[index].category_id,
                model: updates.model !== undefined ? updates.model : data.products[index].model,
                year: updates.year !== undefined ? parseInt(updates.year) : data.products[index].year,
                price: updates.price !== undefined ? parseFloat(updates.price) : data.products[index].price,
                old_price: updates.oldPrice !== undefined ? parseFloat(updates.oldPrice) : (updates.old_price !== undefined ? updates.old_price : data.products[index].old_price),
                type: updates.type || data.products[index].type,
                fuel: updates.fuel !== undefined ? updates.fuel : data.products[index].fuel,
                engine: updates.engine !== undefined ? updates.engine : data.products[index].engine,
                mileage: updates.mileage !== undefined ? parseInt(updates.mileage) : data.products[index].mileage,
                colors: updates.colors || data.products[index].colors,
                description: updates.description || data.products[index].description,
                images: updates.images || data.products[index].images,
                featured: updates.featured !== undefined ? updates.featured : data.products[index].featured,
                installment: updates.installment !== undefined ? updates.installment : data.products[index].installment,
                active: updates.active !== undefined ? updates.active : data.products[index].active
            };
            
            // حفظ البيانات
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true, data: data.products[index] };
            } else {
                return { success: false, error: 'فشل تحديث المنتج' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في تحديث المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteProduct(id) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            // حذف المنتج
            data.products = data.products?.filter(p => p.id !== id) || [];
            
            // حفظ البيانات
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true };
            } else {
                return { success: false, error: 'فشل حذف المنتج' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في حذف المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الماركات ====================
    async getBrands(activeOnly = false) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات', data: [] };
            
            let brands = result.data.brands || [];
            
            if (activeOnly) {
                brands = brands.filter(b => b.active === true);
            }
            
            brands.sort((a, b) => a.name_ar.localeCompare(b.name_ar));
            
            return { success: true, data: brands };
            
        } catch (error) {
            console.error('❌ خطأ في جلب الماركات:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async addBrand(brand) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            const newId = 'brand_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const newBrand = {
                id: newId,
                name_ar: brand.nameAr || brand.name_ar,
                name_en: brand.nameEn || brand.name_en,
                logo: brand.logo || null,
                active: brand.active !== false,
                created_at: new Date().toISOString()
            };
            
            if (!data.brands) data.brands = [];
            data.brands.push(newBrand);
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true, data: newBrand };
            } else {
                return { success: false, error: 'فشل حفظ الماركة' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في إضافة الماركة:', error);
            return { success: false, error: error.message };
        }
    }

    async updateBrand(id, updates) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            const index = data.brands?.findIndex(b => b.id === id);
            
            if (index === -1 || index === undefined) {
                return { success: false, error: 'الماركة غير موجودة' };
            }
            
            data.brands[index] = {
                ...data.brands[index],
                name_ar: updates.nameAr || updates.name_ar || data.brands[index].name_ar,
                name_en: updates.nameEn || updates.name_en || data.brands[index].name_en,
                logo: updates.logo !== undefined ? updates.logo : data.brands[index].logo,
                active: updates.active !== undefined ? updates.active : data.brands[index].active
            };
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true, data: data.brands[index] };
            } else {
                return { success: false, error: 'فشل تحديث الماركة' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في تحديث الماركة:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteBrand(id) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            // التحقق من عدم وجود منتجات مرتبطة
            const hasProducts = data.products?.some(p => p.brand_id === id);
            
            if (hasProducts) {
                return { success: false, error: 'لا يمكن حذف الماركة لارتباطها بمنتجات' };
            }
            
            data.brands = data.brands?.filter(b => b.id !== id) || [];
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true };
            } else {
                return { success: false, error: 'فشل حذف الماركة' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في حذف الماركة:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الأقسام ====================
    async getCategories(activeOnly = false) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات', data: [] };
            
            let categories = result.data.categories || [];
            
            if (activeOnly) {
                categories = categories.filter(c => c.active === true);
            }
            
            categories.sort((a, b) => a.name_ar.localeCompare(b.name_ar));
            
            return { success: true, data: categories };
            
        } catch (error) {
            console.error('❌ خطأ في جلب الأقسام:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async addCategory(category) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            const newId = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const newCategory = {
                id: newId,
                name_ar: category.nameAr || category.name_ar,
                name_en: category.nameEn || category.name_en,
                description: category.description || null,
                image: category.image || null,
                active: category.active !== false,
                created_at: new Date().toISOString()
            };
            
            if (!data.categories) data.categories = [];
            data.categories.push(newCategory);
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true, data: newCategory };
            } else {
                return { success: false, error: 'فشل حفظ القسم' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في إضافة القسم:', error);
            return { success: false, error: error.message };
        }
    }

    async updateCategory(id, updates) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            const index = data.categories?.findIndex(c => c.id === id);
            
            if (index === -1 || index === undefined) {
                return { success: false, error: 'القسم غير موجود' };
            }
            
            data.categories[index] = {
                ...data.categories[index],
                name_ar: updates.nameAr || updates.name_ar || data.categories[index].name_ar,
                name_en: updates.nameEn || updates.name_en || data.categories[index].name_en,
                description: updates.description !== undefined ? updates.description : data.categories[index].description,
                image: updates.image !== undefined ? updates.image : data.categories[index].image,
                active: updates.active !== undefined ? updates.active : data.categories[index].active
            };
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true, data: data.categories[index] };
            } else {
                return { success: false, error: 'فشل تحديث القسم' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في تحديث القسم:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteCategory(id) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            // التحقق من عدم وجود منتجات مرتبطة
            const hasProducts = data.products?.some(p => p.category_id === id);
            
            if (hasProducts) {
                return { success: false, error: 'لا يمكن حذف القسم لارتباطه بمنتجات' };
            }
            
            data.categories = data.categories?.filter(c => c.id !== id) || [];
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true };
            } else {
                return { success: false, error: 'فشل حذف القسم' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في حذف القسم:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== المستخدمين ====================
    async getUsers() {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات', data: [] };
            
            const users = result.data.users || [];
            
            return { success: true, data: users };
            
        } catch (error) {
            console.error('❌ خطأ في جلب المستخدمين:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async login(username, password) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const user = result.data.users?.find(u => 
                u.username === username && 
                u.password === password && 
                u.active === true
            );
            
            if (!user) {
                return { success: false, error: 'بيانات الدخول غير صحيحة' };
            }
            
            // إزالة كلمة المرور من النتيجة
            const { password: _, ...userWithoutPassword } = user;
            
            return { success: true, data: userWithoutPassword };
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل الدخول:', error);
            return { success: false, error: 'بيانات الدخول غير صحيحة' };
        }
    }

    async addUser(user) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            // التحقق من عدم تكرار اسم المستخدم
            const existing = data.users?.find(u => u.username === user.username);
            if (existing) {
                return { success: false, error: 'اسم المستخدم موجود بالفعل' };
            }
            
            const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const newUser = {
                id: newId,
                username: user.username,
                password: user.password,
                full_name: user.fullName || user.full_name,
                email: user.email,
                phone: user.phone || null,
                role: user.role || 'viewer',
                permissions: user.permissions || [],
                avatar: user.avatar || null,
                active: user.active !== false,
                created_at: new Date().toISOString()
            };
            
            if (!data.users) data.users = [];
            data.users.push(newUser);
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                const { password, ...userWithoutPassword } = newUser;
                return { success: true, data: userWithoutPassword };
            } else {
                return { success: false, error: 'فشل حفظ المستخدم' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في إضافة المستخدم:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(id, updates) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            const index = data.users?.findIndex(u => u.id === id);
            
            if (index === -1 || index === undefined) {
                return { success: false, error: 'المستخدم غير موجود' };
            }
            
            data.users[index] = {
                ...data.users[index],
                full_name: updates.fullName || updates.full_name || data.users[index].full_name,
                email: updates.email || data.users[index].email,
                phone: updates.phone !== undefined ? updates.phone : data.users[index].phone,
                avatar: updates.avatar !== undefined ? updates.avatar : data.users[index].avatar,
                active: updates.active !== undefined ? updates.active : data.users[index].active
            };
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                const { password, ...userWithoutPassword } = data.users[index];
                return { success: true, data: userWithoutPassword };
            } else {
                return { success: false, error: 'فشل تحديث المستخدم' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في تحديث المستخدم:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteUser(id) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            data.users = data.users?.filter(u => u.id !== id) || [];
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true };
            } else {
                return { success: false, error: 'فشل حذف المستخدم' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في حذف المستخدم:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== طلبات البيع ====================
    async getSellRequests() {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات', data: [] };
            
            const requests = result.data.sellRequests || [];
            requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            return { success: true, data: requests };
            
        } catch (error) {
            console.error('❌ خطأ في جلب طلبات البيع:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async addSellRequest(request) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            const newId = 'sell_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const newRequest = {
                id: newId,
                customer_name: request.customerName || request.customer_name,
                customer_phone: request.customerPhone || request.customer_phone,
                customer_email: request.customerEmail || request.customer_email || null,
                customer_city: request.customerCity || request.customer_city,
                car_brand: request.carBrand || request.car_brand,
                car_model: request.carModel || request.car_model,
                car_year: request.carYear || request.car_year,
                car_trim: request.carTrim || request.car_trim || null,
                car_condition: request.carCondition || request.car_condition,
                car_mileage: request.carMileage ? parseInt(request.carMileage) : (request.car_mileage || null),
                expected_price: parseFloat(request.expectedPrice || request.expected_price) || 0,
                car_fuel: request.carFuel || request.car_fuel || null,
                car_description: request.carDescription || request.car_description || '',
                car_images: request.carImages || request.car_images || [],
                contact_method: request.contactMethod || request.contact_method || 'phone',
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            if (!data.sellRequests) data.sellRequests = [];
            data.sellRequests.push(newRequest);
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true, data: newRequest };
            } else {
                return { success: false, error: 'فشل حفظ الطلب' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في إضافة طلب البيع:', error);
            return { success: false, error: error.message };
        }
    }

    async updateSellRequestStatus(id, status) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            const index = data.sellRequests?.findIndex(r => r.id === id);
            
            if (index === -1 || index === undefined) {
                return { success: false, error: 'الطلب غير موجود' };
            }
            
            data.sellRequests[index].status = status;
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true };
            } else {
                return { success: false, error: 'فشل تحديث الطلب' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في تحديث حالة الطلب:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== طلبات الاستبدال ====================
    async getExchangeRequests() {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات', data: [] };
            
            const requests = result.data.exchangeRequests || [];
            requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            return { success: true, data: requests };
            
        } catch (error) {
            console.error('❌ خطأ في جلب طلبات الاستبدال:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async addExchangeRequest(request) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            const newId = 'exchange_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const newRequest = {
                id: newId,
                customer_name: request.customerName || request.customer_name,
                customer_phone: request.customerPhone || request.customer_phone,
                customer_email: request.customerEmail || request.customer_email || null,
                customer_city: request.customerCity || request.customer_city,
                current_car: request.currentCar || request.current_car,
                desired_car: request.desiredCar || request.desired_car,
                current_car_details: request.currentCarDetails || request.current_car_details || null,
                current_car_images: request.currentCarImages || request.current_car_images || [],
                contact_method: request.contactMethod || request.contact_method || 'phone',
                notes: request.notes || null,
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            if (!data.exchangeRequests) data.exchangeRequests = [];
            data.exchangeRequests.push(newRequest);
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true, data: newRequest };
            } else {
                return { success: false, error: 'فشل حفظ الطلب' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في إضافة طلب الاستبدال:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الطلبات (الشراء) ====================
    async getOrders() {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات', data: [] };
            
            const orders = result.data.orders || [];
            
            // إضافة معلومات المنتج لكل طلب
            const ordersWithProducts = orders.map(order => {
                const product = result.data.products?.find(p => p.id === order.product_id);
                return {
                    ...order,
                    product_name: product?.name_ar || null,
                    product_price: product?.price || 0
                };
            });
            
            ordersWithProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            return { success: true, data: ordersWithProducts };
            
        } catch (error) {
            console.error('❌ خطأ في جلب الطلبات:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async getOrderById(id) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const order = result.data.orders?.find(o => o.id === id);
            
            if (!order) {
                return { success: false, error: 'الطلب غير موجود' };
            }
            
            // إضافة معلومات المنتج
            const product = result.data.products?.find(p => p.id === order.product_id);
            
            const orderWithProduct = {
                ...order,
                product_name: product?.name_ar || null,
                product_price: product?.price || 0
            };
            
            return { success: true, data: orderWithProduct };
            
        } catch (error) {
            console.error('❌ خطأ في جلب الطلب:', error);
            return { success: false, error: error.message };
        }
    }

    async addOrder(order) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            const newId = 'order_' + Date.now();
            
            const newOrder = {
                id: newId,
                product_id: order.productId || order.product_id,
                customer_name: order.customerName || order.customer_name,
                customer_phone: order.customerPhone || order.customer_phone,
                customer_email: order.customerEmail || order.customer_email || null,
                customer_city: order.customerCity || order.customer_city,
                payment_method: order.paymentMethod || order.payment_method || 'cash',
                notes: order.notes || null,
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            if (!data.orders) data.orders = [];
            data.orders.push(newOrder);
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true, data: newOrder };
            } else {
                return { success: false, error: 'فشل حفظ الطلب' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في إضافة الطلب:', error);
            return { success: false, error: error.message };
        }
    }

    async updateOrderStatus(id, status) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            const index = data.orders?.findIndex(o => o.id === id);
            
            if (index === -1 || index === undefined) {
                return { success: false, error: 'الطلب غير موجود' };
            }
            
            data.orders[index].status = status;
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true };
            } else {
                return { success: false, error: 'فشل تحديث الطلب' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في تحديث حالة الطلب:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الإعدادات ====================
    async getSettings() {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات', data: this.defaultData.settings };
            
            const settings = result.data.settings || this.defaultData.settings;
            
            return { success: true, data: settings };
            
        } catch (error) {
            console.error('❌ خطأ في جلب الإعدادات:', error);
            return { success: true, data: this.defaultData.settings };
        }
    }

    async updateSettings(settings) {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            data.settings = {
                site_name_ar: settings.siteNameAr || settings.site_name_ar || data.settings?.site_name_ar,
                site_name_en: settings.siteNameEn || settings.site_name_en || data.settings?.site_name_en,
                site_description_ar: settings.siteDescriptionAr || settings.site_description_ar || data.settings?.site_description_ar,
                site_description_en: settings.siteDescriptionEn || settings.site_description_en || data.settings?.site_description_en,
                contact_phone: settings.contactPhone || settings.contact_phone || data.settings?.contact_phone,
                contact_whatsapp: settings.contactWhatsapp || settings.contact_whatsapp || data.settings?.contact_whatsapp,
                contact_email: settings.contactEmail || settings.contact_email || data.settings?.contact_email,
                contact_address: settings.contactAddress || settings.contact_address || data.settings?.contact_address,
                social_facebook: settings.socialFacebook || settings.social_facebook || data.settings?.social_facebook,
                social_instagram: settings.socialInstagram || settings.social_instagram || data.settings?.social_instagram,
                social_tiktok: settings.socialTiktok || settings.social_tiktok || data.settings?.social_tiktok,
                social_twitter: settings.socialTwitter || settings.social_twitter || data.settings?.social_twitter,
                social_youtube: settings.socialYoutube || settings.social_youtube || data.settings?.social_youtube
            };
            
            const saveResult = await this.saveData(data);
            
            if (saveResult.success) {
                return { success: true };
            } else {
                return { success: false, error: 'فشل حفظ الإعدادات' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في تحديث الإعدادات:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== رفع الصور (محاكاة) ====================
    async uploadImage(file) {
        try {
            // محاكاة رفع الصور - تحويل لـ base64
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve({
                        success: true,
                        url: reader.result
                    });
                };
                reader.onerror = () => {
                    resolve({
                        success: false,
                        error: 'فشل قراءة الملف'
                    });
                };
                reader.readAsDataURL(file);
            });
            
        } catch (error) {
            console.error('❌ خطأ في رفع الصورة:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الإحصائيات ====================
    async getDashboardStats() {
        try {
            const result = await this.fetchData();
            if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
            
            const data = result.data;
            
            return {
                success: true,
                data: {
                    products: data.products?.length || 0,
                    brands: data.brands?.length || 0,
                    categories: data.categories?.length || 0,
                    users: data.users?.length || 0,
                    sellRequests: data.sellRequests?.length || 0,
                    exchangeRequests: data.exchangeRequests?.length || 0,
                    orders: data.orders?.length || 0
                }
            };
            
        } catch (error) {
            console.error('❌ خطأ في جلب الإحصائيات:', error);
            return { success: false, error: error.message };
        }
    }
}

// تهيئة الكائن العام
window.db = new JSONBinService();

// للتصحيح
console.log('✅ JSONBin.io Client initialized (Version 10.0.0)');