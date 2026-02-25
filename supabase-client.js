/**
 * Supabase Client - سيارات عبدالله
 * الإصدار: 9.0.0 - تم إصلاح مشكلة عرض المنتجات بالكامل
 */

// تهيئة Supabase - استخدام Anon Key الآمن
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
            console.log('🔄 جاري تحميل المنتجات من Supabase...');
            
            let query = this.supabase
                .from(this.tables.products)
                .select(`
                    *,
                    brand:brands(id, name_ar, name_en, logo),
                    category:categories(id, name_ar, name_en)
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
            if (filters.active === true) {
                query = query.eq('active', true);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('❌ خطأ من Supabase:', error);
                throw error;
            }

            console.log(`✅ تم تحميل ${data?.length || 0} منتج بنجاح`, data);
            
            // تنسيق البيانات لتكون متوافقة مع الواجهة
            const formattedData = (data || []).map(item => ({
                ...item,
                brand_name: item.brand?.name_ar || null,
                category_name: item.category?.name_ar || null
            }));

            return { success: true, data: formattedData };
        } catch (error) {
            console.error('❌ خطأ في جلب المنتجات:', error);
            return { 
                success: false, 
                error: error.message || 'حدث خطأ في تحميل المنتجات', 
                data: [] 
            };
        }
    }

    async getProductById(id) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.products)
                .select(`
                    *,
                    brand:brands(id, name_ar, name_en, logo),
                    category:categories(id, name_ar, name_en)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            
            const formattedData = {
                ...data,
                brand_name: data.brand?.name_ar || null,
                category_name: data.category?.name_ar || null
            };
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('❌ خطأ في جلب المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    async addProduct(product) {
        try {
            console.log('🔄 جاري إضافة منتج جديد:', product);
            
            // تحويل أسماء الحقول لصيغة قاعدة البيانات
            const dbProduct = {
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
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from(this.tables.products)
                .insert([dbProduct])
                .select();

            if (error) throw error;
            
            console.log('✅ تم إضافة المنتج بنجاح:', data[0]);
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ خطأ في إضافة المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProduct(id, updates) {
        try {
            console.log('🔄 جاري تحديث المنتج:', id, updates);
            
            // تحويل أسماء الحقول لصيغة قاعدة البيانات
            const dbUpdates = {
                name_ar: updates.nameAr || updates.name_ar,
                name_en: updates.nameEn || updates.name_en,
                brand_id: updates.brandId || updates.brand_id,
                category_id: updates.categoryId || updates.category_id,
                model: updates.model || null,
                year: updates.year ? parseInt(updates.year) : null,
                price: parseFloat(updates.price) || 0,
                old_price: updates.oldPrice ? parseFloat(updates.oldPrice) : (updates.old_price || null),
                type: updates.type || 'new',
                fuel: updates.fuel || null,
                engine: updates.engine || null,
                mileage: updates.mileage ? parseInt(updates.mileage) : null,
                colors: updates.colors || [],
                description: updates.description || '',
                images: updates.images || [],
                featured: updates.featured || false,
                installment: updates.installment || false,
                active: updates.active !== false,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from(this.tables.products)
                .update(dbUpdates)
                .eq('id', id)
                .select();

            if (error) throw error;
            
            console.log('✅ تم تحديث المنتج بنجاح:', data[0]);
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ خطأ في تحديث المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteProduct(id) {
        try {
            console.log('🔄 جاري حذف المنتج:', id);
            
            const { error } = await this.supabase
                .from(this.tables.products)
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            console.log('✅ تم حذف المنتج بنجاح');
            return { success: true };
        } catch (error) {
            console.error('❌ خطأ في حذف المنتج:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الماركات ====================
    async getBrands(activeOnly = false) {
        try {
            let query = this.supabase
                .from(this.tables.brands)
                .select('*');
            
            if (activeOnly) {
                query = query.eq('active', true);
            }
            
            const { data, error } = await query.order('name_ar');

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('❌ خطأ في جلب الماركات:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async addBrand(brand) {
        try {
            const dbBrand = {
                name_ar: brand.nameAr || brand.name_ar,
                name_en: brand.nameEn || brand.name_en,
                logo: brand.logo || null,
                active: brand.active !== false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from(this.tables.brands)
                .insert([dbBrand])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ خطأ في إضافة الماركة:', error);
            return { success: false, error: error.message };
        }
    }

    async updateBrand(id, updates) {
        try {
            const dbUpdates = {
                name_ar: updates.nameAr || updates.name_ar,
                name_en: updates.nameEn || updates.name_en,
                logo: updates.logo,
                active: updates.active,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from(this.tables.brands)
                .update(dbUpdates)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ خطأ في تحديث الماركة:', error);
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
            console.error('❌ خطأ في حذف الماركة:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الأقسام ====================
    async getCategories(activeOnly = false) {
        try {
            let query = this.supabase
                .from(this.tables.categories)
                .select('*');
            
            if (activeOnly) {
                query = query.eq('active', true);
            }
            
            const { data, error } = await query.order('name_ar');

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('❌ خطأ في جلب الأقسام:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async addCategory(category) {
        try {
            const dbCategory = {
                name_ar: category.nameAr || category.name_ar,
                name_en: category.nameEn || category.name_en,
                description: category.description || null,
                image: category.image || null,
                active: category.active !== false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from(this.tables.categories)
                .insert([dbCategory])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ خطأ في إضافة القسم:', error);
            return { success: false, error: error.message };
        }
    }

    async updateCategory(id, updates) {
        try {
            const dbUpdates = {
                name_ar: updates.nameAr || updates.name_ar,
                name_en: updates.nameEn || updates.name_en,
                description: updates.description,
                image: updates.image,
                active: updates.active,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from(this.tables.categories)
                .update(dbUpdates)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ خطأ في تحديث القسم:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteCategory(id) {
        try {
            // التحقق من عدم وجود منتجات مرتبطة
            const { count, error: countError } = await this.supabase
                .from(this.tables.products)
                .select('*', { count: 'exact', head: true })
                .eq('category_id', id);

            if (countError) throw countError;

            if (count > 0) {
                return { success: false, error: 'لا يمكن حذف القسم لارتباطه بمنتجات' };
            }

            const { error } = await this.supabase
                .from(this.tables.categories)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('❌ خطأ في حذف القسم:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== المستخدمين ====================
    async getUsers() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.users)
                .select('id, username, full_name, email, phone, role, permissions, avatar, active, created_at, updated_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('❌ خطأ في جلب المستخدمين:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async login(username, password) {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.users)
                .select('id, username, full_name, email, phone, role, permissions, avatar, active')
                .eq('username', username)
                .eq('password', password)
                .eq('active', true)
                .maybeSingle();

            if (error) throw error;
            
            if (!data) {
                return { success: false, error: 'بيانات الدخول غير صحيحة' };
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تسجيل الدخول:', error);
            return { success: false, error: 'بيانات الدخول غير صحيحة' };
        }
    }

    async addUser(user) {
        try {
            const dbUser = {
                username: user.username,
                password: user.password,
                full_name: user.fullName || user.full_name,
                email: user.email,
                phone: user.phone || null,
                role: user.role || 'viewer',
                permissions: user.permissions || [],
                avatar: user.avatar || null,
                active: user.active !== false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from(this.tables.users)
                .insert([dbUser])
                .select('id, username, full_name, email, phone, role, permissions, avatar, active, created_at');

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ خطأ في إضافة المستخدم:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(id, updates) {
        try {
            const dbUpdates = {
                full_name: updates.fullName || updates.full_name,
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
                .select('id, username, full_name, email, phone, role, permissions, avatar, active, created_at');

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ خطأ في تحديث المستخدم:', error);
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
            console.error('❌ خطأ في حذف المستخدم:', error);
            return { success: false, error: error.message };
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
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('❌ خطأ في جلب طلبات البيع:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async addSellRequest(request) {
        try {
            const dbRequest = {
                customer_name: request.customerName || request.customer_name,
                customer_phone: request.customerPhone || request.customer_phone,
                customer_email: request.customerEmail || request.customer_email || null,
                customer_city: request.customerCity || request.customer_city,
                car_brand: request.carBrand || request.car_brand,
                car_model: request.carModel || request.car_model,
                car_year: request.carYear || request.car_year,
                car_condition: request.carCondition || request.car_condition,
                car_mileage: request.carMileage ? parseInt(request.carMileage) : (request.car_mileage || null),
                expected_price: parseFloat(request.expectedPrice || request.expected_price) || 0,
                car_description: request.carDescription || request.car_description || '',
                car_images: request.carImages || request.car_images || [],
                contact_method: request.contactMethod || request.contact_method || 'phone',
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from(this.tables.sellRequests)
                .insert([dbRequest])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ خطأ في إضافة طلب البيع:', error);
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
            console.error('❌ خطأ في تحديث حالة طلب البيع:', error);
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
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('❌ خطأ في جلب طلبات الاستبدال:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async addExchangeRequest(request) {
        try {
            const dbRequest = {
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
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from(this.tables.exchangeRequests)
                .insert([dbRequest])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ خطأ في إضافة طلب الاستبدال:', error);
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
                    product:products(name_ar, price)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const formattedData = (data || []).map(item => ({
                ...item,
                product_name: item.product?.name_ar || null
            }));
            
            return { success: true, data: formattedData };
        } catch (error) {
            console.error('❌ خطأ في جلب الطلبات:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    async addOrder(order) {
        try {
            const dbOrder = {
                product_id: order.productId || order.product_id,
                customer_name: order.customerName || order.customer_name,
                customer_phone: order.customerPhone || order.customer_phone,
                customer_email: order.customerEmail || order.customer_email || null,
                customer_city: order.customerCity || order.customer_city,
                payment_method: order.paymentMethod || order.payment_method || 'cash',
                notes: order.notes || null,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from(this.tables.orders)
                .insert([dbOrder])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ خطأ في إضافة الطلب:', error);
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
            console.error('❌ خطأ في تحديث حالة الطلب:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== الإعدادات ====================
    async getSettings() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.settings)
                .select('*')
                .maybeSingle();

            if (error) throw error;
            
            if (!data) {
                // إعدادات افتراضية
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
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في جلب الإعدادات:', error);
            
            // إعدادات افتراضية في حالة الخطأ
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
            // تحويل أسماء الحقول لصيغة قاعدة البيانات
            const dbSettings = {
                site_name_ar: settings.siteNameAr || settings.site_name_ar,
                site_name_en: settings.siteNameEn || settings.site_name_en,
                site_description_ar: settings.siteDescriptionAr || settings.site_description_ar,
                site_description_en: settings.siteDescriptionEn || settings.site_description_en,
                contact_phone: settings.contactPhone || settings.contact_phone,
                contact_whatsapp: settings.contactWhatsapp || settings.contact_whatsapp,
                contact_email: settings.contactEmail || settings.contact_email,
                contact_address: settings.contactAddress || settings.contact_address,
                social_facebook: settings.socialFacebook || settings.social_facebook,
                social_instagram: settings.socialInstagram || settings.social_instagram,
                social_tiktok: settings.socialTiktok || settings.social_tiktok,
                social_twitter: settings.socialTwitter || settings.social_twitter,
                social_youtube: settings.socialYoutube || settings.social_youtube,
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
            console.error('❌ خطأ في تحديث الإعدادات:', error);
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
            console.error('❌ خطأ في رفع الصورة:', error);
            
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
            console.error('❌ خطأ في جلب الإحصائيات:', error);
            return { success: false, error: error.message };
        }
    }
}

// تهيئة الكائن العام
window.db = new DatabaseService();

// للتصحيح
console.log('✅ Database service initialized with Anon Key (Version 9.0.0)');