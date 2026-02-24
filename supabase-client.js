/**
 * Supabase Client - سيارات عبدالله
 * الإصدار: 7.0.0 - مصحح بالكامل
 */

// تهيئة Supabase - استخدم Anon Key وليس Service Key!
const SUPABASE_URL = 'https://epeghbnpumoxdebupndh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwZWdoYm5wdW1veGRlYnVwbmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODk1NzgsImV4cCI6MjA4NzQ2NTU3OH0.iiW7XbQ6QKoax9NvuPtCMNKR1hwii6bB6TieatVAS7w';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// فئة التعامل مع قاعدة البيانات
class DatabaseService {
    constructor() {
        this.supabase = supabase;
        this.tables = {
            products: 'products',
            brands: 'brands',
            categories: 'categories',
            users: 'users',
            orders: 'orders',
            sellRequests: 'sell_requests',
            exchangeRequests: 'exchange_requests',
            inquiries: 'inquiries',
            settings: 'settings'
        };
    }

    // ==================== المنتجات ====================
    async getProducts(filters = {}) {
        try {
            let query = this.supabase
                .from(this.tables.products)
                .select(`
                    *,
                    brands(name_ar, name_en),
                    categories(name_ar, name_en)
                `);

            // تطبيق الفلاتر - استخدم أسماء الحقول الصحيحة من قاعدة البيانات
            if (filters.brandId) {
                query = query.eq('brand_id', filters.brandId);
            }
            if (filters.categoryId) {
                query = query.eq('category_id', filters.categoryId);
            }
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            if (filters.minPrice) {
                query = query.gte('price', filters.minPrice);
            }
            if (filters.maxPrice) {
                query = query.lte('price', filters.maxPrice);
            }
            if (filters.featured) {
                query = query.eq('featured', true);
            }
            if (filters.installment) {
                query = query.eq('installment', true);
            }
            if (filters.active) {
                query = query.eq('active', true);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            
            // تحويل أسماء الحقول من underscore إلى camelCase للتطبيق
            const formattedData = data?.map(item => this.formatProductFromDB(item)) || [];
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في جلب المنتجات:', error);
            return { success: false, error: error.message };
        }
    }

    async getProductById(id) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.products)
                .select(`
                    *,
                    brands(name_ar, name_en),
                    categories(name_ar, name_en)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            
            // تحويل أسماء الحقول
            const formattedData = this.formatProductFromDB(data);
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في جلب المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    // دالة مساعدة لتحويل البيانات من قاعدة البيانات إلى التطبيق
    formatProductFromDB(dbProduct) {
        if (!dbProduct) return null;
        
        return {
            id: dbProduct.id,
            nameAr: dbProduct.name_ar,
            nameEn: dbProduct.name_en,
            brandId: dbProduct.brand_id,
            categoryId: dbProduct.category_id,
            subCategoryId: dbProduct.sub_category_id,
            model: dbProduct.model,
            year: dbProduct.year,
            price: dbProduct.price,
            oldPrice: dbProduct.old_price,
            type: dbProduct.type,
            fuel: dbProduct.fuel,
            engine: dbProduct.engine,
            mileage: dbProduct.mileage,
            colors: dbProduct.colors,
            description: dbProduct.description,
            images: dbProduct.images,
            featured: dbProduct.featured,
            installment: dbProduct.installment,
            active: dbProduct.active,
            createdAt: dbProduct.created_at,
            updatedAt: dbProduct.updated_at,
            brand: dbProduct.brands ? {
                nameAr: dbProduct.brands.name_ar,
                nameEn: dbProduct.brands.name_en
            } : null,
            category: dbProduct.categories ? {
                nameAr: dbProduct.categories.name_ar,
                nameEn: dbProduct.categories.name_en
            } : null
        };
    }

    // دالة مساعدة لتحويل البيانات من التطبيق إلى قاعدة البيانات
    formatProductForDB(appProduct) {
        return {
            name_ar: appProduct.nameAr,
            name_en: appProduct.nameEn,
            brand_id: appProduct.brandId,
            category_id: appProduct.categoryId,
            sub_category_id: appProduct.subCategoryId,
            model: appProduct.model,
            year: appProduct.year,
            price: appProduct.price,
            old_price: appProduct.oldPrice,
            type: appProduct.type,
            fuel: appProduct.fuel,
            engine: appProduct.engine,
            mileage: appProduct.mileage,
            colors: appProduct.colors,
            description: appProduct.description,
            images: appProduct.images,
            featured: appProduct.featured || false,
            installment: appProduct.installment || false,
            active: appProduct.active !== false,
            created_at: appProduct.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    async addProduct(product) {
        try {
            // تحويل البيانات لصيغة قاعدة البيانات
            const dbProduct = this.formatProductForDB(product);
            
            const { data, error } = await this.supabase
                .from(this.tables.products)
                .insert([dbProduct])
                .select();

            if (error) throw error;
            
            // تحويل النتيجة لصيغة التطبيق
            const formattedData = this.formatProductFromDB(data[0]);
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في إضافة المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProduct(id, updates) {
        try {
            // تحويل البيانات لصيغة قاعدة البيانات
            const dbUpdates = this.formatProductForDB(updates);
            delete dbUpdates.created_at; // لا نحدث تاريخ الإنشاء
            delete dbUpdates.id; // لا نحدث المعرف
            
            const { data, error } = await this.supabase
                .from(this.tables.products)
                .update(dbUpdates)
                .eq('id', id)
                .select();

            if (error) throw error;
            
            // تحويل النتيجة لصيغة التطبيق
            const formattedData = this.formatProductFromDB(data[0]);
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في تحديث المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteProduct(id) {
        try {
            const { error } = await this.supabase
                .from(this.tables.products)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('خطأ في حذف المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الماركات ====================
    async getBrands() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.brands)
                .select('*')
                .order('name_ar');

            if (error) throw error;
            
            // تحويل أسماء الحقول
            const formattedData = data?.map(brand => ({
                id: brand.id,
                nameAr: brand.name_ar,
                nameEn: brand.name_en,
                logo: brand.logo,
                active: brand.active,
                createdAt: brand.created_at,
                updatedAt: brand.updated_at
            })) || [];
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في جلب الماركات:', error);
            return { success: false, error: error.message };
        }
    }

    async addBrand(brand) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.brands)
                .insert([{
                    name_ar: brand.nameAr,
                    name_en: brand.nameEn,
                    logo: brand.logo || null,
                    active: brand.active !== false,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            
            // تحويل النتيجة
            const formattedData = {
                id: data[0].id,
                nameAr: data[0].name_ar,
                nameEn: data[0].name_en,
                logo: data[0].logo,
                active: data[0].active,
                createdAt: data[0].created_at,
                updatedAt: data[0].updated_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في إضافة الماركة:', error);
            return { success: false, error: error.message };
        }
    }

    async updateBrand(id, updates) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.brands)
                .update({
                    name_ar: updates.nameAr,
                    name_en: updates.nameEn,
                    logo: updates.logo,
                    active: updates.active,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();

            if (error) throw error;
            
            // تحويل النتيجة
            const formattedData = {
                id: data[0].id,
                nameAr: data[0].name_ar,
                nameEn: data[0].name_en,
                logo: data[0].logo,
                active: data[0].active,
                createdAt: data[0].created_at,
                updatedAt: data[0].updated_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في تحديث الماركة:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteBrand(id) {
        try {
            // التحقق من عدم وجود منتجات مرتبطة
            const { count, error: countError } = await this.supabase
                .from(this.tables.products)
                .select('*', { count: 'exact', head: true })
                .eq('brand_id', id);

            if (countError) throw countError;

            if (count > 0) {
                return { success: false, error: 'لا يمكن حذف الماركة لارتباطها بمنتجات' };
            }

            const { error } = await this.supabase
                .from(this.tables.brands)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('خطأ في حذف الماركة:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الأقسام ====================
    async getCategories() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.categories)
                .select('*')
                .order('name_ar');

            if (error) throw error;
            
            // تحويل أسماء الحقول
            const formattedData = data?.map(cat => ({
                id: cat.id,
                nameAr: cat.name_ar,
                nameEn: cat.name_en,
                parentId: cat.parent_id,
                description: cat.description,
                image: cat.image,
                active: cat.active,
                createdAt: cat.created_at,
                updatedAt: cat.updated_at
            })) || [];
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في جلب الأقسام:', error);
            return { success: false, error: error.message };
        }
    }

    async addCategory(category) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.categories)
                .insert([{
                    name_ar: category.nameAr,
                    name_en: category.nameEn,
                    parent_id: category.parentId || null,
                    description: category.description || null,
                    image: category.image || null,
                    active: category.active !== false,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            
            // تحويل النتيجة
            const formattedData = {
                id: data[0].id,
                nameAr: data[0].name_ar,
                nameEn: data[0].name_en,
                parentId: data[0].parent_id,
                description: data[0].description,
                image: data[0].image,
                active: data[0].active,
                createdAt: data[0].created_at,
                updatedAt: data[0].updated_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في إضافة القسم:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== المستخدمين ====================
    async getUsers() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.users)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // تحويل أسماء الحقول (مع إخفاء كلمة المرور)
            const formattedData = data?.map(user => ({
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                permissions: user.permissions,
                avatar: user.avatar,
                active: user.active,
                createdAt: user.created_at,
                updatedAt: user.updated_at
                // لا نرسل password أبداً!
            })) || [];
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في جلب المستخدمين:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserByUsername(username) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.users)
                .select('*')
                .eq('username', username)
                .single();

            if (error) throw error;
            
            // تحويل أسماء الحقول (مع إخفاء كلمة المرور)
            const formattedData = {
                id: data.id,
                username: data.username,
                fullName: data.full_name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                permissions: data.permissions,
                avatar: data.avatar,
                active: data.active,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async addUser(user) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.users)
                .insert([{
                    username: user.username,
                    password: user.password, // يجب تشفيرها لاحقاً
                    full_name: user.fullName,
                    email: user.email,
                    phone: user.phone || null,
                    role: user.role || 'viewer',
                    permissions: user.permissions || [],
                    avatar: user.avatar || null,
                    active: user.active !== false,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            
            // تحويل النتيجة (بدون كلمة المرور)
            const formattedData = {
                id: data[0].id,
                username: data[0].username,
                fullName: data[0].full_name,
                email: data[0].email,
                phone: data[0].phone,
                role: data[0].role,
                permissions: data[0].permissions,
                avatar: data[0].avatar,
                active: data[0].active,
                createdAt: data[0].created_at,
                updatedAt: data[0].updated_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في إضافة المستخدم:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(id, updates) {
        try {
            const dbUpdates = {
                full_name: updates.fullName,
                email: updates.email,
                phone: updates.phone,
                avatar: updates.avatar,
                active: updates.active,
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await this.supabase
                .from(this.tables.users)
                .update(dbUpdates)
                .eq('id', id)
                .select();

            if (error) throw error;
            
            // تحويل النتيجة
            const formattedData = {
                id: data[0].id,
                username: data[0].username,
                fullName: data[0].full_name,
                email: data[0].email,
                phone: data[0].phone,
                role: data[0].role,
                permissions: data[0].permissions,
                avatar: data[0].avatar,
                active: data[0].active,
                createdAt: data[0].created_at,
                updatedAt: data[0].updated_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في تحديث المستخدم:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUserPassword(id, newPassword) {
        try {
            const { error } = await this.supabase
                .from(this.tables.users)
                .update({
                    password: newPassword,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('خطأ في تحديث كلمة المرور:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteUser(id) {
        try {
            const { error } = await this.supabase
                .from(this.tables.users)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('خطأ في حذف المستخدم:', error);
            return { success: false, error: error.message };
        }
    }

    async login(username, password) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.users)
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .eq('active', true)
                .single();

            if (error) throw error;
            
            // تحويل النتيجة (بدون كلمة المرور)
            const formattedData = {
                id: data.id,
                username: data.username,
                fullName: data.full_name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                permissions: data.permissions,
                avatar: data.avatar,
                active: data.active,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            return { success: false, error: 'بيانات الدخول غير صحيحة' };
        }
    }

    // ==================== طلبات البيع ====================
    async getSellRequests(filters = {}) {
        try {
            let query = this.supabase
                .from(this.tables.sellRequests)
                .select('*')
                .order('created_at', { ascending: false });

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query;

            if (error) throw error;
            
            // تحويل أسماء الحقول
            const formattedData = data?.map(req => ({
                id: req.id,
                customerName: req.customer_name,
                customerPhone: req.customer_phone,
                customerEmail: req.customer_email,
                customerCity: req.customer_city,
                carBrand: req.car_brand,
                carModel: req.car_model,
                carYear: req.car_year,
                carTrim: req.car_trim,
                carCondition: req.car_condition,
                carMileage: req.car_mileage,
                expectedPrice: req.expected_price,
                carFuel: req.car_fuel,
                carDescription: req.car_description,
                carImages: req.car_images,
                contactMethod: req.contact_method,
                status: req.status,
                createdAt: req.created_at,
                updatedAt: req.updated_at
            })) || [];
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في جلب طلبات البيع:', error);
            return { success: false, error: error.message };
        }
    }

    async addSellRequest(request) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.sellRequests)
                .insert([{
                    customer_name: request.customerName,
                    customer_phone: request.customerPhone,
                    customer_email: request.customerEmail || null,
                    customer_city: request.customerCity,
                    car_brand: request.carBrand,
                    car_model: request.carModel,
                    car_year: request.carYear,
                    car_trim: request.carTrim || null,
                    car_condition: request.carCondition,
                    car_mileage: request.carMileage,
                    expected_price: request.expectedPrice,
                    car_fuel: request.carFuel || null,
                    car_description: request.carDescription,
                    car_images: request.carImages || [],
                    contact_method: request.contactMethod,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            
            // تحويل النتيجة
            const formattedData = {
                id: data[0].id,
                customerName: data[0].customer_name,
                customerPhone: data[0].customer_phone,
                customerEmail: data[0].customer_email,
                customerCity: data[0].customer_city,
                carBrand: data[0].car_brand,
                carModel: data[0].car_model,
                carYear: data[0].car_year,
                carTrim: data[0].car_trim,
                carCondition: data[0].car_condition,
                carMileage: data[0].car_mileage,
                expectedPrice: data[0].expected_price,
                carFuel: data[0].car_fuel,
                carDescription: data[0].car_description,
                carImages: data[0].car_images,
                contactMethod: data[0].contact_method,
                status: data[0].status,
                createdAt: data[0].created_at,
                updatedAt: data[0].updated_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في إضافة طلب البيع:', error);
            return { success: false, error: error.message };
        }
    }

    async updateSellRequestStatus(id, status) {
        try {
            const { error } = await this.supabase
                .from(this.tables.sellRequests)
                .update({
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('خطأ في تحديث حالة طلب البيع:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== طلبات الاستبدال ====================
    async getExchangeRequests() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.exchangeRequests)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // تحويل أسماء الحقول
            const formattedData = data?.map(req => ({
                id: req.id,
                customerName: req.customer_name,
                customerPhone: req.customer_phone,
                customerEmail: req.customer_email,
                customerCity: req.customer_city,
                currentCar: req.current_car,
                desiredCar: req.desired_car,
                currentCarDetails: req.current_car_details,
                currentCarImages: req.current_car_images,
                contactMethod: req.contact_method,
                notes: req.notes,
                status: req.status,
                createdAt: req.created_at,
                updatedAt: req.updated_at
            })) || [];
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في جلب طلبات الاستبدال:', error);
            return { success: false, error: error.message };
        }
    }

    async addExchangeRequest(request) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.exchangeRequests)
                .insert([{
                    customer_name: request.customerName,
                    customer_phone: request.customerPhone,
                    customer_email: request.customerEmail || null,
                    customer_city: request.customerCity,
                    current_car: request.currentCar,
                    desired_car: request.desiredCar,
                    current_car_details: request.currentCarDetails,
                    current_car_images: request.currentCarImages || [],
                    contact_method: request.contactMethod,
                    notes: request.notes || null,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            
            // تحويل النتيجة
            const formattedData = {
                id: data[0].id,
                customerName: data[0].customer_name,
                customerPhone: data[0].customer_phone,
                customerEmail: data[0].customer_email,
                customerCity: data[0].customer_city,
                currentCar: data[0].current_car,
                desiredCar: data[0].desired_car,
                currentCarDetails: data[0].current_car_details,
                currentCarImages: data[0].current_car_images,
                contactMethod: data[0].contact_method,
                notes: data[0].notes,
                status: data[0].status,
                createdAt: data[0].created_at,
                updatedAt: data[0].updated_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في إضافة طلب الاستبدال:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الطلبات ====================
    async getOrders() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.orders)
                .select(`
                    *,
                    products(name_ar, price)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // تحويل أسماء الحقول
            const formattedData = data?.map(order => ({
                id: order.id,
                productId: order.product_id,
                productName: order.product_name,
                productPrice: order.product_price,
                customerName: order.customer_name,
                customerPhone: order.customer_phone,
                customerEmail: order.customer_email,
                customerCity: order.customer_city,
                paymentMethod: order.payment_method,
                notes: order.notes,
                status: order.status,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                product: order.products ? {
                    nameAr: order.products.name_ar,
                    price: order.products.price
                } : null
            })) || [];
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في جلب الطلبات:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrderById(id) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.orders)
                .select(`
                    *,
                    products(name_ar, price, images)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            
            // تحويل أسماء الحقول
            const formattedData = {
                id: data.id,
                productId: data.product_id,
                productName: data.product_name,
                productPrice: data.product_price,
                customerName: data.customer_name,
                customerPhone: data.customer_phone,
                customerEmail: data.customer_email,
                customerCity: data.customer_city,
                paymentMethod: data.payment_method,
                notes: data.notes,
                status: data.status,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                product: data.products ? {
                    nameAr: data.products.name_ar,
                    price: data.products.price,
                    images: data.products.images
                } : null
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في جلب الطلب:', error);
            return { success: false, error: error.message };
        }
    }

    async addOrder(order) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.orders)
                .insert([{
                    product_id: order.productId,
                    product_name: order.productName,
                    product_price: order.productPrice,
                    customer_name: order.customerName,
                    customer_phone: order.customerPhone,
                    customer_email: order.customerEmail || null,
                    customer_city: order.customerCity,
                    payment_method: order.paymentMethod,
                    notes: order.notes || null,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            
            // تحويل النتيجة
            const formattedData = {
                id: data[0].id,
                productId: data[0].product_id,
                productName: data[0].product_name,
                productPrice: data[0].product_price,
                customerName: data[0].customer_name,
                customerPhone: data[0].customer_phone,
                customerEmail: data[0].customer_email,
                customerCity: data[0].customer_city,
                paymentMethod: data[0].payment_method,
                notes: data[0].notes,
                status: data[0].status,
                createdAt: data[0].created_at,
                updatedAt: data[0].updated_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في إضافة الطلب:', error);
            return { success: false, error: error.message };
        }
    }

    async updateOrderStatus(id, status) {
        try {
            const { error } = await this.supabase
                .from(this.tables.orders)
                .update({
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('خطأ في تحديث حالة الطلب:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الاستفسارات ====================
    async addInquiry(inquiry) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.inquiries)
                .insert([{
                    name: inquiry.name,
                    phone: inquiry.phone,
                    email: inquiry.email || null,
                    message: inquiry.message,
                    product_id: inquiry.productId || null,
                    status: 'new',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            
            // تحويل النتيجة
            const formattedData = {
                id: data[0].id,
                name: data[0].name,
                phone: data[0].phone,
                email: data[0].email,
                message: data[0].message,
                productId: data[0].product_id,
                status: data[0].status,
                createdAt: data[0].created_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('خطأ في إضافة الاستفسار:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الإعدادات ====================
    async getSettings() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.settings)
                .select('*')
                .single();

            if (error) throw error;
            
            // تحويل أسماء الحقول
            const formattedData = {
                id: data.id,
                siteNameAr: data.site_name_ar,
                siteNameEn: data.site_name_en,
                siteDescriptionAr: data.site_description_ar,
                siteDescriptionEn: data.site_description_en,
                contactPhone: data.contact_phone,
                contactWhatsapp: data.contact_whatsapp,
                contactEmail: data.contact_email,
                contactAddress: data.contact_address,
                socialFacebook: data.social_facebook,
                socialInstagram: data.social_instagram,
                socialTiktok: data.social_tiktok,
                socialTwitter: data.social_twitter,
                socialYoutube: data.social_youtube,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            // إنشاء إعدادات افتراضية
            const defaultSettings = {
                id: 1,
                siteNameAr: 'سيارات عبدالله',
                siteNameEn: 'Abdullah Cars',
                siteDescriptionAr: 'ريادة وخبرة في عالم السيارات منذ 1993',
                siteDescriptionEn: 'Leadership and experience since 1993',
                contactPhone: '01121811110',
                contactWhatsapp: '01121811110',
                contactEmail: 'amarmotors850@gmail.com',
                contactAddress: 'الجيزة، مصر',
                socialFacebook: 'https://www.facebook.com/share/1SdkvcBynu',
                socialInstagram: 'https://www.instagram.com/abdullah_auto_',
                socialTiktok: 'https://www.tiktok.com/@abdullah.auto0',
                socialTwitter: '',
                socialYoutube: ''
            };
            return { success: true, data: defaultSettings, isDefault: true };
        }
    }

    async updateSettings(settings) {
        try {
            // تحويل البيانات لصيغة قاعدة البيانات
            const dbSettings = {
                site_name_ar: settings.siteNameAr,
                site_name_en: settings.siteNameEn,
                site_description_ar: settings.siteDescriptionAr,
                site_description_en: settings.siteDescriptionEn,
                contact_phone: settings.contactPhone,
                contact_whatsapp: settings.contactWhatsapp,
                contact_email: settings.contactEmail,
                contact_address: settings.contactAddress,
                social_facebook: settings.socialFacebook,
                social_instagram: settings.socialInstagram,
                social_tiktok: settings.socialTiktok,
                social_twitter: settings.socialTwitter,
                social_youtube: settings.socialYoutube,
                updated_at: new Date().toISOString()
            };
            
            // التحقق من وجود الإعدادات
            const { data: existing } = await this.supabase
                .from(this.tables.settings)
                .select('id')
                .maybeSingle();

            let error;
            if (existing) {
                // تحديث
                const result = await this.supabase
                    .from(this.tables.settings)
                    .update(dbSettings)
                    .eq('id', existing.id);
                error = result.error;
            } else {
                // إدراج
                const result = await this.supabase
                    .from(this.tables.settings)
                    .insert([{
                        ...dbSettings,
                        created_at: new Date().toISOString()
                    }]);
                error = result.error;
            }

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('خطأ في تحديث الإعدادات:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== رفع الصور ====================
    async uploadImage(file, bucket = 'images') {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return { success: true, url: publicUrl };
        } catch (error) {
            console.error('خطأ في رفع الصورة:', error);
            
            // استخدام FileReader كبديل
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve({
                        success: true,
                        url: reader.result,
                        local: true
                    });
                };
                reader.readAsDataURL(file);
            });
        }
    }

    async uploadMultipleImages(files, bucket = 'images') {
        const urls = [];
        for (let i = 0; i < files.length; i++) {
            const result = await this.uploadImage(files[i], bucket);
            if (result.success) {
                urls.push(result.url);
            }
        }
        return { success: true, urls };
    }

    // ==================== الإحصائيات ====================
    async getDashboardStats() {
        try {
            const [
                products,
                brands,
                categories,
                users,
                sellRequests,
                exchangeRequests,
                orders
            ] = await Promise.all([
                this.supabase.from(this.tables.products).select('*', { count: 'exact', head: true }),
                this.supabase.from(this.tables.brands).select('*', { count: 'exact', head: true }),
                this.supabase.from(this.tables.categories).select('*', { count: 'exact', head: true }),
                this.supabase.from(this.tables.users).select('*', { count: 'exact', head: true }),
                this.supabase.from(this.tables.sellRequests).select('*', { count: 'exact', head: true }),
                this.supabase.from(this.tables.exchangeRequests).select('*', { count: 'exact', head: true }),
                this.supabase.from(this.tables.orders).select('*', { count: 'exact', head: true })
            ]);

            return {
                success: true,
                data: {
                    products: products.count || 0,
                    brands: brands.count || 0,
                    categories: categories.count || 0,
                    users: users.count || 0,
                    sellRequests: sellRequests.count || 0,
                    exchangeRequests: exchangeRequests.count || 0,
                    orders: orders.count || 0
                }
            };
        } catch (error) {
            console.error('خطأ في جلب الإحصائيات:', error);
            return { success: false, error: error.message };
        }
    }
}

// تهيئة الكائن العام
window.db = new DatabaseService();

// للتصحيح - يمكن إزالته في الإنتاج
console.log('✅ Database service initialized with Anon Key');