/**
 * Supabase Client - سيارات عبدالله
 * الإصدار: 6.0.0
 */

// تهيئة Supabase
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

            // تطبيق الفلاتر
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
            return { success: true, data };
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
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    async addProduct(product) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.products)
                .insert([{
                    name_ar: product.nameAr,
                    name_en: product.nameEn,
                    brand_id: product.brandId,
                    category_id: product.categoryId,
                    sub_category_id: product.subCategoryId,
                    model: product.model,
                    year: product.year,
                    price: product.price,
                    old_price: product.oldPrice,
                    type: product.type,
                    fuel: product.fuel,
                    engine: product.engine,
                    mileage: product.mileage,
                    colors: product.colors,
                    description: product.description,
                    images: product.images,
                    featured: product.featured || false,
                    installment: product.installment || false,
                    active: product.active !== false,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في إضافة المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProduct(id, updates) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.products)
                .update({
                    name_ar: updates.nameAr,
                    name_en: updates.nameEn,
                    brand_id: updates.brandId,
                    category_id: updates.categoryId,
                    sub_category_id: updates.subCategoryId,
                    model: updates.model,
                    year: updates.year,
                    price: updates.price,
                    old_price: updates.oldPrice,
                    type: updates.type,
                    fuel: updates.fuel,
                    engine: updates.engine,
                    mileage: updates.mileage,
                    colors: updates.colors,
                    description: updates.description,
                    images: updates.images,
                    featured: updates.featured,
                    installment: updates.installment,
                    active: updates.active,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
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
            return { success: true, data };
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
            return { success: true, data: data[0] };
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
            return { success: true, data: data[0] };
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
            return { success: true, data };
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
            return { success: true, data: data[0] };
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
            return { success: true, data };
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
            return { success: true, data };
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
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('خطأ في إضافة المستخدم:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(id, updates) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.users)
                .update({
                    full_name: updates.fullName,
                    email: updates.email,
                    phone: updates.phone,
                    avatar: updates.avatar,
                    active: updates.active,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
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
            return { success: true, data };
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
            return { success: true, data };
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
            return { success: true, data: data[0] };
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
            return { success: true, data };
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
            return { success: true, data: data[0] };
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
            return { success: true, data };
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
            return { success: true, data };
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
            return { success: true, data: data[0] };
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
            return { success: true, data: data[0] };
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
            return { success: true, data };
        } catch (error) {
            // إنشاء إعدادات افتراضية
            const defaultSettings = {
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
            };
            return { success: true, data: defaultSettings, isDefault: true };
        }
    }

    async updateSettings(settings) {
        try {
            // التحقق من وجود الإعدادات
            const { data: existing } = await this.supabase
                .from(this.tables.settings)
                .select('id')
                .maybeSingle();

            if (existing) {
                // تحديث
                const { error } = await this.supabase
                    .from(this.tables.settings)
                    .update({
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
                    })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                // إدراج
                const { error } = await this.supabase
                    .from(this.tables.settings)
                    .insert([{
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
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
            }

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
