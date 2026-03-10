/**
 * JSONStorage.net Client - سيارات عبدالله
 * الإصدار: 2.0.0 - نسخة نهائية
 */

class JSONStorageService {
  constructor() {
    // البيانات بتاعتك من jsonstorage.net
    this.readUrl = 'https://api.jsonstorage.net/v1/json/6cbc7501-04fc-406d-912c-43e49580c1e4/c440f016-ada9-4891-8d3a-82b75b75f968';
    this.writeUrl = 'https://api.jsonstorage.net/v1/json/6cbc7501-04fc-406d-912c-43e49580c1e4/c440f016-ada9-4891-8d3a-82b75b75f968?apiKey=3a56ccfb-5326-404c-a7ee-df5ba7f68ca2';
    this.cache = null;
  }

  // ============ دوال أساسية ============

  async fetchData() {
    try {
      if (this.cache) {
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

  async getBrands() {
    const result = await this.fetchData();
    if (!result.success) return { success: false, data: [] };
    return { success: true, data: result.data.brands || [] };
  }

  async addBrand(brand) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    if (!data.brands) data.brands = [];
    
    const newBrand = {
      id: 'brand_' + Date.now(),
      name_ar: brand.nameAr || brand.name_ar,
      name_en: brand.nameEn || brand.name_en,
      logo: brand.logo || '',
      active: true,
      created_at: new Date().toISOString()
    };
    
    data.brands.push(newBrand);
    return await this.saveData(data);
  }

  async updateBrand(id, updates) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    const index = data.brands.findIndex(b => b.id === id);
    
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
    data.brands = (data.brands || []).filter(b => b.id !== id);
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
    if (filters.maxPrice) products = products.filter(p => p.price <= filters.maxPrice);
    
    return { success: true, data: products };
  }

  async addProduct(product) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    if (!data.products) data.products = [];
    
    const newProduct = {
      id: 'prod_' + Date.now(),
      name_ar: product.nameAr || product.name_ar,
      name_en: product.nameEn || product.name_en,
      brand_id: product.brandId || product.brand_id,
      category_id: product.categoryId || product.category_id,
      model: product.model || '',
      year: product.year ? parseInt(product.year) : null,
      price: parseFloat(product.price) || 0,
      old_price: product.oldPrice ? parseFloat(product.oldPrice) : null,
      type: product.type || 'new',
      fuel: product.fuel || '',
      engine: product.engine || '',
      mileage: product.mileage ? parseInt(product.mileage) : null,
      colors: product.colors || [],
      description: product.description || '',
      images: product.images || [],
      featured: product.featured || false,
      installment: product.installment || false,
      active: true,
      created_at: new Date().toISOString()
    };
    
    data.products.push(newProduct);
    return await this.saveData(data);
  }

  async updateProduct(id, updates) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    const index = data.products.findIndex(p => p.id === id);
    
    if (index === -1) {
      return { success: false, error: 'المنتج غير موجود' };
    }
    
    data.products[index] = {
      ...data.products[index],
      ...updates
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

  // ============ طلبات البيع ============

  async addSellRequest(request) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    if (!data.sellRequests) data.sellRequests = [];
    
    const newRequest = {
      id: 'sell_' + Date.now(),
      customer_name: request.customerName || request.customer_name,
      customer_phone: request.customerPhone || request.customer_phone,
      customer_email: request.customerEmail || request.customer_email || '',
      customer_city: request.customerCity || request.customer_city,
      car_brand: request.carBrand || request.car_brand,
      car_model: request.carModel || request.car_model,
      car_year: request.carYear || request.car_year,
      car_condition: request.carCondition || request.car_condition,
      car_mileage: parseInt(request.carMileage || request.car_mileage) || 0,
      expected_price: parseFloat(request.expectedPrice || request.expected_price) || 0,
      car_description: request.carDescription || request.car_description || '',
      car_images: request.carImages || request.car_images || [],
      contact_method: request.contactMethod || request.contact_method || 'phone',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    data.sellRequests.push(newRequest);
    return await this.saveData(data);
  }

  async getSellRequests() {
    const result = await this.fetchData();
    if (!result.success) return { success: false, data: [] };
    return { success: true, data: result.data.sellRequests || [] };
  }

  async updateSellRequestStatus(id, status) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    const index = (data.sellRequests || []).findIndex(r => r.id === id);
    
    if (index === -1) {
      return { success: false, error: 'الطلب غير موجود' };
    }
    
    data.sellRequests[index].status = status;
    return await this.saveData(data);
  }

  // ============ طلبات الشراء ============

  async addOrder(order) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    if (!data.orders) data.orders = [];
    
    const newOrder = {
      id: 'order_' + Date.now(),
      product_id: order.productId || order.product_id,
      customer_name: order.customerName || order.customer_name,
      customer_phone: order.customerPhone || order.customer_phone,
      customer_email: order.customerEmail || order.customer_email || '',
      customer_city: order.customerCity || order.customer_city,
      payment_method: order.paymentMethod || order.payment_method || 'cash',
      notes: order.notes || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    data.orders.push(newOrder);
    return await this.saveData(data);
  }

  async getOrders() {
    const result = await this.fetchData();
    if (!result.success) return { success: false, data: [] };
    return { success: true, data: result.data.orders || [] };
  }

  async updateOrderStatus(id, status) {
    const result = await this.fetchData();
    if (!result.success) return result;
    
    const data = result.data;
    const index = (data.orders || []).findIndex(o => o.id === id);
    
    if (index === -1) {
      return { success: false, error: 'الطلب غير موجود' };
    }
    
    data.orders[index].status = status;
    return await this.saveData(data);
  }
}

// إنشاء الكائن العام
window.db = new JSONStorageService();
console.log('✅ JSONStorage Service initialized');
console.log('📦 Container ID:', '6cbc7501-04fc-406d-912c-43e49580c1e4');
console.log('📦 Item ID:', 'c440f016-ada9-4891-8d3a-82b75b75f968');