/**
 * JSONStorage.net Client - سيارات عبدالله
 * الإصدار: 3.0.0 - كامل ومتكامل لجميع الصفحات
 */

class JSONStorageService {
  constructor() {
    this.readUrl = 'https://api.jsonstorage.net/v1/json/6cbc7501-04fc-406d-912c-43e49580c1e4/c440f016-ada9-4891-8d3a-82b75b75f968';
    this.writeUrl = 'https://api.jsonstorage.net/v1/json/6cbc7501-04fc-406d-912c-43e49580c1e4/c440f016-ada9-4891-8d3a-82b75b75f968?apiKey=3a56ccfb-5326-404c-a7ee-df5ba7f68ca2';
    this.cache = null;
  }

  // ============ دوال أساسية ============

  async fetchData(force = false) {
    try {
      if (!force && this.cache) {
        return { success: true, data: this.cache };
      }

      console.log('🔄 جاري تحميل البيانات...');
      const response = await fetch(this.readUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.cache = data;
      console.log('✅ تم تحميل البيانات');
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ خطأ:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async saveData(data) {
    try {
      console.log('🔄 جاري حفظ البيانات...');
      
      const response = await fetch(this.writeUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.cache = data;
      console.log('✅ تم حفظ البيانات');
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ خطأ:', error);
      return { success: false, error: error.message };
    }
  }

  // ============ الماركات ============

  async getBrands(activeOnly = false) {
    const result = await this.fetchData();
    if (!result.success) return { success: false, data: [] };
    
    let brands = result.data.brands || [];
    if (activeOnly) brands = brands.filter(b => b.active === true);
    
    return { success: true, data: brands };
  }

  async getBrandById(id) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const brand = (result.data.brands || []).find(b => b.id === id);
    if (!brand) return { success: false, error: 'الماركة غير موجودة' };
    
    return { success: true, data: brand };
  }

  async addBrand(brand) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    if (!data.brands) data.brands = [];
    
    const newBrand = {
      id: 'brand_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name_ar: brand.nameAr || brand.name_ar || '',
      name_en: brand.nameEn || brand.name_en || '',
      logo: brand.logo || '',
      active: brand.active !== false,
      created_at: new Date().toISOString()
    };
    
    data.brands.push(newBrand);
    return await this.saveData(data);
  }

  async updateBrand(id, updates) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    const index = (data.brands || []).findIndex(b => b.id === id);
    
    if (index === -1) {
      return { success: false, error: 'الماركة غير موجودة' };
    }
    
    data.brands[index] = {
      ...data.brands[index],
      name_ar: updates.nameAr || updates.name_ar || data.brands[index].name_ar,
      name_en: updates.nameEn || updates.name_en || data.brands[index].name_en,
      logo: updates.logo !== undefined ? updates.logo : data.brands[index].logo,
      active: updates.active !== undefined ? updates.active : data.brands[index].active
    };
    
    return await this.saveData(data);
  }

  async deleteBrand(id) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    
    // التحقق من عدم وجود منتجات مرتبطة
    const hasProducts = (data.products || []).some(p => p.brand_id === id);
    if (hasProducts) {
      return { success: false, error: 'لا يمكن حذف الماركة لارتباطها بمنتجات' };
    }
    
    data.brands = (data.brands || []).filter(b => b.id !== id);
    return await this.saveData(data);
  }

  // ============ الفئات (Categories) ============

  async getCategories(activeOnly = false, brandId = null) {
    const result = await this.fetchData();
    if (!result.success) return { success: false, data: [] };
    
    let categories = result.data.categories || [];
    if (activeOnly) categories = categories.filter(c => c.active === true);
    if (brandId) categories = categories.filter(c => c.brand_id === brandId);
    
    return { success: true, data: categories };
  }

  async getCategoryById(id) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const category = (result.data.categories || []).find(c => c.id === id);
    if (!category) return { success: false, error: 'الفئة غير موجودة' };
    
    return { success: true, data: category };
  }

  async addCategory(category) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    if (!data.categories) data.categories = [];
    
    const newCategory = {
      id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      brand_id: category.brandId || category.brand_id || '',
      name_ar: category.nameAr || category.name_ar || '',
      name_en: category.nameEn || category.name_en || '',
      description: category.description || '',
      image: category.image || '',
      active: category.active !== false,
      created_at: new Date().toISOString()
    };
    
    data.categories.push(newCategory);
    return await this.saveData(data);
  }

  async updateCategory(id, updates) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    const index = (data.categories || []).findIndex(c => c.id === id);
    
    if (index === -1) {
      return { success: false, error: 'الفئة غير موجودة' };
    }
    
    data.categories[index] = {
      ...data.categories[index],
      brand_id: updates.brandId || updates.brand_id || data.categories[index].brand_id,
      name_ar: updates.nameAr || updates.name_ar || data.categories[index].name_ar,
      name_en: updates.nameEn || updates.name_en || data.categories[index].name_en,
      description: updates.description !== undefined ? updates.description : data.categories[index].description,
      image: updates.image !== undefined ? updates.image : data.categories[index].image,
      active: updates.active !== undefined ? updates.active : data.categories[index].active
    };
    
    return await this.saveData(data);
  }

  async deleteCategory(id) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    
    // التحقق من عدم وجود منتجات مرتبطة
    const hasProducts = (data.products || []).some(p => p.category_id === id);
    if (hasProducts) {
      return { success: false, error: 'لا يمكن حذف الفئة لارتباطها بمنتجات' };
    }
    
    data.categories = (data.categories || []).filter(c => c.id !== id);
    return await this.saveData(data);
  }

  // ============ المنتجات ============

  async getProducts(filters = {}) {
    const result = await this.fetchData();
    if (!result.success) return { success: false, data: [] };
    
    let products = result.data.products || [];
    
    if (filters.brandId) products = products.filter(p => p.brand_id === filters.brandId);
    if (filters.categoryId) products = products.filter(p => p.category_id === filters.categoryId);
    if (filters.type) products = products.filter(p => p.type === filters.type);
    if (filters.minPrice) products = products.filter(p => p.price >= filters.minPrice);
    if (filters.maxPrice && filters.maxPrice !== Infinity) products = products.filter(p => p.price <= filters.maxPrice);
    if (filters.featured) products = products.filter(p => p.featured === true);
    if (filters.installment) products = products.filter(p => p.installment === true);
    if (filters.active === true) products = products.filter(p => p.active === true);
    
    products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return { success: true, data: products };
  }

  async getProductById(id) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const product = (result.data.products || []).find(p => p.id === id);
    if (!product) return { success: false, error: 'المنتج غير موجود' };
    
    const brand = (result.data.brands || []).find(b => b.id === product.brand_id);
    const category = (result.data.categories || []).find(c => c.id === product.category_id);
    
    return { success: true, data: { ...product, brand, category } };
  }

  async addProduct(product) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    if (!data.products) data.products = [];
    
    const newProduct = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name_ar: product.nameAr || product.name_ar || '',
      name_en: product.nameEn || product.name_en || '',
      brand_id: product.brandId || product.brand_id || '',
      category_id: product.categoryId || product.category_id || '',
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
    
    data.products.push(newProduct);
    return await this.saveData(data);
  }

  async updateProduct(id, updates) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    const index = (data.products || []).findIndex(p => p.id === id);
    
    if (index === -1) {
      return { success: false, error: 'المنتج غير موجود' };
    }
    
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
    
    return await this.saveData(data);
  }

  async deleteProduct(id) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    data.products = (data.products || []).filter(p => p.id !== id);
    return await this.saveData(data);
  }

  // ============ المستخدمين ============

  async getUsers() {
    const result = await this.fetchData();
    if (!result.success) return { success: false, data: [] };
    return { success: true, data: result.data.users || [] };
  }

  async login(username, password) {
    const result = await this.fetchData();
    if (!result.success) return { success: false, error: 'فشل تحميل البيانات' };
    
    const user = (result.data.users || []).find(u => u.username === username && u.password === password && u.active === true);
    
    if (!user) return { success: false, error: 'بيانات الدخول غير صحيحة' };
    
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword };
  }

  async addUser(user) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    if (!data.users) data.users = [];
    
    // التحقق من عدم تكرار اسم المستخدم
    const existing = (data.users || []).find(u => u.username === user.username);
    if (existing) return { success: false, error: 'اسم المستخدم موجود بالفعل' };
    
    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      username: user.username,
      password: user.password,
      full_name: user.fullName || user.full_name || '',
      email: user.email || '',
      phone: user.phone || null,
      role: user.role || 'viewer',
      permissions: user.permissions || [],
      avatar: user.avatar || null,
      active: user.active !== false,
      created_at: new Date().toISOString()
    };
    
    data.users.push(newUser);
    const saveResult = await this.saveData(data);
    
    if (saveResult.success) {
      const { password, ...userWithoutPassword } = newUser;
      return { success: true, data: userWithoutPassword };
    }
    return saveResult;
  }

  async updateUser(id, updates) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    const index = (data.users || []).findIndex(u => u.id === id);
    
    if (index === -1) return { success: false, error: 'المستخدم غير موجود' };
    
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
    }
    return saveResult;
  }

  async deleteUser(id) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    data.users = (data.users || []).filter(u => u.id !== id);
    return await this.saveData(data);
  }

  // ============ طلبات البيع ============

  async getSellRequests() {
    const result = await this.fetchData();
    if (!result.success) return { success: false, data: [] };
    
    const requests = result.data.sellRequests || [];
    requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return { success: true, data: requests };
  }

  async addSellRequest(request) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    if (!data.sellRequests) data.sellRequests = [];
    
    const newRequest = {
      id: 'sell_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      customer_name: request.customerName || request.customer_name || '',
      customer_phone: request.customerPhone || request.customer_phone || '',
      customer_email: request.customerEmail || request.customer_email || null,
      customer_city: request.customerCity || request.customer_city || '',
      car_brand: request.carBrand || request.car_brand || '',
      car_model: request.carModel || request.car_model || '',
      car_year: request.carYear || request.car_year || null,
      car_trim: request.carTrim || request.car_trim || null,
      car_condition: request.carCondition || request.car_condition || '',
      car_mileage: request.carMileage ? parseInt(request.carMileage) : (request.car_mileage || null),
      expected_price: parseFloat(request.expectedPrice || request.expected_price) || 0,
      car_fuel: request.carFuel || request.car_fuel || null,
      car_description: request.carDescription || request.car_description || '',
      car_images: request.carImages || request.car_images || [],
      contact_method: request.contactMethod || request.contact_method || 'phone',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    data.sellRequests.push(newRequest);
    return await this.saveData(data);
  }

  async updateSellRequestStatus(id, status) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    const index = (data.sellRequests || []).findIndex(r => r.id === id);
    
    if (index === -1) return { success: false, error: 'الطلب غير موجود' };
    
    data.sellRequests[index].status = status;
    return await this.saveData(data);
  }

  async deleteSellRequest(id) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    data.sellRequests = (data.sellRequests || []).filter(r => r.id !== id);
    return await this.saveData(data);
  }

  // ============ طلبات الاستبدال ============

  async getExchangeRequests() {
    const result = await this.fetchData();
    if (!result.success) return { success: false, data: [] };
    
    const requests = result.data.exchangeRequests || [];
    requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return { success: true, data: requests };
  }

  async addExchangeRequest(request) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    if (!data.exchangeRequests) data.exchangeRequests = [];
    
    const newRequest = {
      id: 'exchange_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      customer_name: request.customerName || request.customer_name || '',
      customer_phone: request.customerPhone || request.customer_phone || '',
      customer_email: request.customerEmail || request.customer_email || null,
      customer_city: request.customerCity || request.customer_city || '',
      current_car: request.currentCar || request.current_car || '',
      desired_car: request.desiredCar || request.desired_car || '',
      current_car_details: request.currentCarDetails || request.current_car_details || null,
      current_car_images: request.currentCarImages || request.current_car_images || [],
      contact_method: request.contactMethod || request.contact_method || 'phone',
      notes: request.notes || null,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    data.exchangeRequests.push(newRequest);
    return await this.saveData(data);
  }

  async updateExchangeRequestStatus(id, status) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    const index = (data.exchangeRequests || []).findIndex(r => r.id === id);
    
    if (index === -1) return { success: false, error: 'الطلب غير موجود' };
    
    data.exchangeRequests[index].status = status;
    return await this.saveData(data);
  }

  async deleteExchangeRequest(id) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    data.exchangeRequests = (data.exchangeRequests || []).filter(r => r.id !== id);
    return await this.saveData(data);
  }

  // ============ الطلبات (الشراء) ============

  async getOrders() {
    const result = await this.fetchData();
    if (!result.success) return { success: false, data: [] };
    
    const orders = result.data.orders || [];
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return { success: true, data: orders };
  }

  async getOrderById(id) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const order = (result.data.orders || []).find(o => o.id === id);
    if (!order) return { success: false, error: 'الطلب غير موجود' };
    
    const product = (result.data.products || []).find(p => p.id === order.product_id);
    return { success: true, data: { ...order, product_name: product?.name_ar || null, product_price: product?.price || 0 } };
  }

  async addOrder(order) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    if (!data.orders) data.orders = [];
    
    const newOrder = {
      id: 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      product_id: order.productId || order.product_id || '',
      customer_name: order.customerName || order.customer_name || '',
      customer_phone: order.customerPhone || order.customer_phone || '',
      customer_email: order.customerEmail || order.customer_email || null,
      customer_city: order.customerCity || order.customer_city || '',
      payment_method: order.paymentMethod || order.payment_method || 'cash',
      notes: order.notes || null,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    data.orders.push(newOrder);
    return await this.saveData(data);
  }

  async updateOrderStatus(id, status) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    const index = (data.orders || []).findIndex(o => o.id === id);
    
    if (index === -1) return { success: false, error: 'الطلب غير موجود' };
    
    data.orders[index].status = status;
    return await this.saveData(data);
  }

  async deleteOrder(id) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    data.orders = (data.orders || []).filter(o => o.id !== id);
    return await this.saveData(data);
  }

  // ============ الإعدادات ============

  async getSettings() {
    const result = await this.fetchData();
    if (!result.success) return { success: false, data: {} };
    return { success: true, data: result.data.settings || {} };
  }

  async updateSettings(settings) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
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
      social_youtube: settings.socialYoutube || settings.social_youtube || data.settings?.social_youtube,
      telegram_bot_token: settings.telegramBotToken || settings.telegram_bot_token || data.settings?.telegram_bot_token || '',
      telegram_chat_id: settings.telegramChatId || settings.telegram_chat_id || data.settings?.telegram_chat_id || ''
    };
    
    return await this.saveData(data);
  }

  // ============ رفع الصور ============

  async uploadImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ success: true, url: reader.result });
      reader.onerror = () => resolve({ success: false, error: 'فشل قراءة الملف' });
      reader.readAsDataURL(file);
    });
  }

  // ============ الإحصائيات ============

  async getDashboardStats() {
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
  }
}

// إنشاء الكائن العام
window.db = new JSONStorageService();

// للتصحيح
console.log('✅ JSONStorage Service initialized');
console.log('📦 Container ID:', '6cbc7501-04fc-406d-912c-43e49580c1e4');
console.log('📦 Item ID:', 'c440f016-ada9-4891-8d3a-82b75b75f968');