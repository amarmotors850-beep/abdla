/**
 * الملف الرئيسي لموقع سيارات عبدالله
 * يحتوي على جميع الوظائف الأساسية والتحسينات
 * إصدار 3.0.0
 */

// ============ تهيئة النظام ============
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 جاري تحميل موقع سيارات عبدالله...');
    
    // تهيئة النظام
    await initializeSystem();
    
    // تحميل البيانات
    await loadData();
    
    // تهيئة المكونات
    initializeComponents();
    
    // إعداد المستمعين للأحداث
    setupEventListeners();
    
    // تحسينات الأداء
    setupPerformanceOptimizations();
    
    console.log('✅ تم تحميل الموقع بنجاح');
});

// ============ تهيئة النظام ============
async function initializeSystem() {
    // إخفاء شاشة التحميل
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }, 2000);
    
    // التحقق من دعم المتصفح
    checkBrowserSupport();
    
    // إعداد Service Worker (إن وجد)
    setupServiceWorker();
}

// ============ تحميل البيانات ============
async function loadData() {
    try {
        // محاولة جلب البيانات من GitHub Sync
        if (window.gitHubSync && window.gitHubSync.isInitialized) {
            const data = await window.gitHubSync.sync();
            if (data) {
                window.siteData = data;
                updateSiteContent(data);
                return true;
            }
        }
        
        // استخدام البيانات المحلية
        const localData = localStorage.getItem('abdullah_cars_data');
        if (localData) {
            window.siteData = JSON.parse(localData);
            updateSiteContent(window.siteData);
            return true;
        }
        
        // استخدام بيانات افتراضية
        window.siteData = createDefaultData();
        updateSiteContent(window.siteData);
        
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        window.siteData = createDefaultData();
        updateSiteContent(window.siteData);
        return false;
    }
}

// ============ تحديث محتوى الموقع ============
function updateSiteContent(data) {
    if (!data) return;
    
    // تحديث العلامة الوصفية
    updateMetaTags(data);
    
    // تحديث العنوان والوصف
    updatePageTitle(data);
    
    // تحديث المحتوى الديناميكي
    updateDynamicContent(data);
    
    // تحديث معلومات الاتصال
    updateContactInfo(data);
    
    // تحديث روابط التواصل الاجتماعي
    updateSocialLinks(data);
}

// ============ تحديث العلامات الوصفية ============
function updateMetaTags(data) {
    const meta = data.settings?.seo || {};
    
    // العنوان
    document.title = meta.metaTitle || data.site.name?.ar || 'سيارات عبدالله';
    
    // الوصف
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
        descMeta.content = meta.metaDescription || data.site.description?.ar || '';
    }
    
    // الكلمات المفتاحية
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
        keywordsMeta.content = meta.metaKeywords || '';
    }
    
    // المؤلف
    const authorMeta = document.querySelector('meta[name="author"]');
    if (authorMeta) {
        authorMeta.content = meta.metaAuthor || 'سيارات عبدالله';
    }
    
    // Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.content = meta.ogTitle || document.title;
    }
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
        ogDesc.content = meta.ogDescription || descMeta?.content || '';
    }
    
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && meta.ogImage) {
        ogImage.content = meta.ogImage;
    }
}

// ============ تحديث عنوان الصفحة ============
function updatePageTitle(data) {
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        pageTitle.textContent = data.site.name?.ar || 'سيارات عبدالله';
    }
    
    const pageDesc = document.querySelector('.page-description');
    if (pageDesc) {
        pageDesc.textContent = data.site.description?.ar || '';
    }
}

// ============ تحديث المحتوى الديناميكي ============
function updateDynamicContent(data) {
    // تحديث المنتجات
    updateProducts(data.products || []);
    
    // تحديث الماركات
    updateBrands(data.brands || []);
    
    // تحديث الإحصائيات
    updateStatistics(data);
    
    // تحديث قسم عن الشركة
    updateAboutSection(data);
}

// ============ تحديث المنتجات ============
function updateProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-car"></i>
                <h3>لا توجد سيارات متاحة حالياً</h3>
                <p>سيتم إضافة السيارات قريباً</p>
            </div>
        `;
        return;
    }
    
    // عرض المنتجات
    container.innerHTML = products.map(product => `
        <div class="product-card ${product.featured ? 'featured' : ''}" data-id="${product.id}">
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name?.ar || product.name}" loading="lazy">` : 
                    `<div class="no-image"><i class="fas fa-car"></i></div>`}
                ${product.featured ? `<span class="featured-badge">مميز</span>` : ''}
            </div>
            <div class="product-info">
                <h3>${product.name?.ar || product.name}</h3>
                <p class="product-model">${product.brand} • ${product.model} • ${product.year}</p>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="viewProduct('${product.id}')">
                        <i class="fas fa-eye"></i> عرض التفاصيل
                    </button>
                    <button class="btn btn-secondary" onclick="contactAboutProduct('${product.id}')">
                        <i class="fas fa-phone"></i> استفسار
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============ تحديث الماركات ============
function updateBrands(brands) {
    const container = document.getElementById('brandsContainer');
    if (!container) return;
    
    if (brands.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tags"></i>
                <h3>لا توجد ماركات متاحة</h3>
                <p>سيتم إضافة الماركات قريباً</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = brands.map(brand => `
        <div class="brand-card" data-id="${brand.id}">
            <div class="brand-logo">
                ${brand.logo ? 
                    `<img src="${brand.logo}" alt="${brand.name?.ar || brand.name}" loading="lazy">` : 
                    `<div class="no-logo"><i class="fas fa-tag"></i></div>`}
            </div>
            <h3>${brand.name?.ar || brand.name}</h3>
            <button class="btn btn-outline" onclick="filterByBrand('${brand.id}')">
                عرض السيارات
            </button>
        </div>
    `).join('');
}

// ============ تحديث الإحصائيات ============
function updateStatistics(data) {
    const stats = {
        years: data.site?.establishedYear ? new Date().getFullYear() - data.site.establishedYear : 30,
        products: data.products?.length || 0,
        brands: data.brands?.length || 0,
        customers: data.statistics?.totalCustomers || 5000
    };
    
    const statsContainer = document.getElementById('statsContainer');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-number">${stats.years}+</div>
                <div class="stat-label">سنة خبرة</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.products}+</div>
                <div class="stat-label">سيارة</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.brands}+</div>
                <div class="stat-label">ماركة</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.customers}+</div>
                <div class="stat-label">عميل راضٍ</div>
            </div>
        `;
    }
}

// ============ تحديث قسم عن الشركة ============
function updateAboutSection(data) {
    const aboutSection = document.querySelector('.about-section');
    if (!aboutSection) return;
    
    const aboutData = data.site?.about || {};
    
    // تحديث العنوان
    const title = aboutSection.querySelector('.section-title');
    if (title) {
        title.textContent = aboutData.title || 'عن شركتنا';
    }
    
    // تحديث المحتوى
    const content = aboutSection.querySelector('.about-content');
    if (content && aboutData.content) {
        content.innerHTML = aboutData.content;
    }
}

// ============ تحديث معلومات الاتصال ============
function updateContactInfo(data) {
    const contact = data.contact || {};
    
    // تحديث الهاتف
    const phoneElements = document.querySelectorAll('.phone-number');
    phoneElements.forEach(el => {
        el.textContent = contact.phone || '01121811110';
        el.href = `tel:${contact.phone || '01121811110'}`;
    });
    
    // تحديث الواتساب
    const whatsappElements = document.querySelectorAll('.whatsapp-number');
    whatsappElements.forEach(el => {
        el.textContent = contact.whatsapp || '01121811110';
        el.href = `https://wa.me/${contact.whatsapp || '01121811110'}`;
    });
    
    // تحديث البريد
    const emailElements = document.querySelectorAll('.email-address');
    emailElements.forEach(el => {
        el.textContent = contact.email || 'amarmotors850@gmail.com';
        el.href = `mailto:${contact.email || 'amarmotors850@gmail.com'}`;
    });
    
    // تحديث العنوان
    const addressElements = document.querySelectorAll('.site-address');
    addressElements.forEach(el => {
        el.textContent = contact.address || 'القاهرة، مصر';
    });
    
    // تحديث ساعات العمل
    const hoursElements = document.querySelectorAll('.work-hours');
    hoursElements.forEach(el => {
        el.textContent = contact.workHours || '9 ص - 9 م';
    });
}

// ============ تحديث روابط التواصل الاجتماعي ============
function updateSocialLinks(data) {
    const social = data.social || {};
    
    // فيسبوك
    const facebookLinks = document.querySelectorAll('.social-facebook');
    facebookLinks.forEach(link => {
        if (social.facebook) {
            link.href = social.facebook;
            link.style.display = 'inline-block';
        } else {
            link.style.display = 'none';
        }
    });
    
    // انستجرام
    const instagramLinks = document.querySelectorAll('.social-instagram');
    instagramLinks.forEach(link => {
        if (social.instagram) {
            link.href = social.instagram;
            link.style.display = 'inline-block';
        } else {
            link.style.display = 'none';
        }
    });
    
    // تيك توك
    const tiktokLinks = document.querySelectorAll('.social-tiktok');
    tiktokLinks.forEach(link => {
        if (social.tiktok) {
            link.href = social.tiktok;
            link.style.display = 'inline-block';
        } else {
            link.style.display = 'none';
        }
    });
    
    // تويتر
    const twitterLinks = document.querySelectorAll('.social-twitter');
    twitterLinks.forEach(link => {
        if (social.twitter) {
            link.href = social.twitter;
            link.style.display = 'inline-block';
        } else {
            link.style.display = 'none';
        }
    });
    
    // يوتيوب
    const youtubeLinks = document.querySelectorAll('.social-youtube');
    youtubeLinks.forEach(link => {
        if (social.youtube) {
            link.href = social.youtube;
            link.style.display = 'inline-block';
        } else {
            link.style.display = 'none';
        }
    });
}

// ============ تهيئة المكونات ============
function initializeComponents() {
    // تهيئة شريط التنقل
    initNavigation();
    
    // تهيئة البحث
    initSearch();
    
    // تهيئة الفلاتر
    initFilters();
    
    // تهيئة الفيديو الخلفي
    initBackgroundVideo();
    
    // تهيئة الشريط التقدمي
    initProgressBar();
    
    // تهيئة التنقل السلس
    initSmoothScroll();
    
    // تهيئة التحميل الكسول
    initLazyLoading();
    
    // تهيئة التحكم في الفيديو
    initVideoControls();
}

// ============ إعداد المستمعين للأحداث ============
function setupEventListeners() {
    // البحث
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // الفلاتر
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilter);
    });
    
    // النماذج
    const forms = document.querySelectorAll('form:not(#searchForm)');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
    
    // الأحداث المخصصة
    window.addEventListener('githubSync:dataChanged', handleDataChanged);
    window.addEventListener('githubSync:syncComplete', handleSyncComplete);
    window.addEventListener('githubSync:syncError', handleSyncError);
    
    // تحميل الصفحة
    window.addEventListener('load', handlePageLoad);
    
    // التمرير
    window.addEventListener('scroll', handleScroll);
    
    // إعادة الحجم
    window.addEventListener('resize', handleResize);
}

// ============ معالجات الأحداث ============
function handleSearch(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const searchTerm = formData.get('search');
    
    // تنفيذ البحث
    performSearch(searchTerm);
}

function handleFilter(event) {
    const filterType = event.target.dataset.filter;
    
    // تطبيق الفلتر
    applyFilter(filterType);
    
    // تحديث الأزرار النشطة
    document.querySelectorAll('.filter-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const formType = form.dataset.type;
    
    // معالجة النموذج حسب النوع
    switch(formType) {
        case 'contact':
            handleContactForm(formData);
            break;
        case 'newsletter':
            handleNewsletterForm(formData);
            break;
        case 'appointment':
            handleAppointmentForm(formData);
            break;
        default:
            handleGeneralForm(formData);
    }
}

function handleDataChanged(event) {
    console.log('🔄 تم تحديث البيانات:', event.detail);
    updateSiteContent(event.detail.data);
    showNotification('تم تحديث البيانات بنجاح', 'success');
}

function handleSyncComplete(event) {
    console.log('✅ تمت المزامنة:', event.detail);
    if (event.detail.source === 'github') {
        showNotification('تمت المزامنة مع GitHub', 'success');
    }
}

function handleSyncError(event) {
    console.error('❌ خطأ في المزامنة:', event.detail);
    showNotification('حدث خطأ في المزامنة', 'error');
}

function handlePageLoad() {
    // تنفيذ بعد تحميل الصفحة
    animateElements();
    trackPageView();
}

function handleScroll() {
    // التحكم في شريط التنقل
    const nav = document.querySelector('.main-nav');
    if (nav) {
        if (window.scrollY > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }
    
    // إظهار زر العودة للأعلى
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }
    
    // تفعيل الرسوم المتحركة عند التمرير
    triggerScrollAnimations();
}

function handleResize() {
    // تحديث التخطيط حسب الحجم
    updateLayout();
}

// ============ تهيئة المكونات التفصيلية ============
function initNavigation() {
    const nav = document.querySelector('.main-nav');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // إغلاق القائمة عند النقر على رابط
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
}

function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');
    
    if (searchInput && searchResults) {
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                const results = performLiveSearch(query);
                displaySearchResults(results, searchResults);
                searchResults.style.display = 'block';
            }, 300);
        });
        
        // إغلاق النتائج عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }
}

function initFilters() {
    // تهيئة أزرار الفلتر
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterValue = this.dataset.filter;
            filterProducts(filterValue);
        });
    });
    
    // تهيئة أزرار الفرز
    const sortButtons = document.querySelectorAll('.sort-button');
    sortButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sortBy = this.dataset.sort;
            sortProducts(sortBy);
        });
    });
}

function initBackgroundVideo() {
    const video = document.getElementById('backgroundVideo');
    if (video) {
        // التحكم في صوت الفيديو
        const muteButton = document.querySelector('.video-mute');
        if (muteButton) {
            muteButton.addEventListener('click', () => {
                video.muted = !video.muted;
                muteButton.innerHTML = video.muted ? 
                    '<i class="fas fa-volume-mute"></i>' : 
                    '<i class="fas fa-volume-up"></i>';
            });
        }
        
        // إعادة التشغيل عند الانتهاء
        video.addEventListener('ended', () => {
            video.currentTime = 0;
            video.play();
        });
    }
}

function initProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
            progressBar.style.width = scrollPercent + '%';
        });
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

function initVideoControls() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        // التحكم في التشغيل
        video.addEventListener('click', () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });
        
        // إضافة عناصر تحكم مخصصة
        const controls = document.createElement('div');
        controls.className = 'video-controls';
        controls.innerHTML = `
            <button class="play-pause"><i class="fas fa-play"></i></button>
            <button class="mute"><i class="fas fa-volume-up"></i></button>
            <input type="range" class="volume" min="0" max="1" step="0.1" value="1">
        `;
        
        video.parentNode.appendChild(controls);
        
        // إضافة التحكم في الأزرار
        const playBtn = controls.querySelector('.play-pause');
        const muteBtn = controls.querySelector('.mute');
        const volumeSlider = controls.querySelector('.volume');
        
        playBtn.addEventListener('click', () => {
            if (video.paused) {
                video.play();
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                video.pause();
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
        
        muteBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            muteBtn.innerHTML = video.muted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
        });
        
        volumeSlider.addEventListener('input', (e) => {
            video.volume = e.target.value;
            video.muted = e.target.value === '0';
        });
    });
}

// ============ تحسينات الأداء ============
function setupPerformanceOptimizations() {
    // تفعيل الكاش
    enableCaching();
    
    // تحسين الصور
    optimizeImages();
    
    // تقليل حجم الملفات
    minifyAssets();
    
    // التحكم في الذاكرة
    manageMemory();
    
    // مراقبة الأداء
    monitorPerformance();
}

function enableCaching() {
    // استخدام localStorage للتخزين المؤقت
    if (!localStorage.getItem('site_cache_version')) {
        localStorage.setItem('site_cache_version', '1.0.0');
    }
    
    // مسح الكاش القديم
    const cacheVersion = localStorage.getItem('site_cache_version');
    const oldVersion = localStorage.getItem('old_cache_version');
    
    if (oldVersion !== cacheVersion) {
        localStorage.clear();
        localStorage.setItem('site_cache_version', cacheVersion);
    }
}

function optimizeImages() {
    // تحسين تحميل الصور
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // إضافة أبعاد ثابتة
        if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
            img.width = img.naturalWidth || 300;
            img.height = img.naturalHeight || 200;
        }
        
        // استخدام التحميل الكسول
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // استخدام تنسيقات حديثة
        if (img.src.endsWith('.png') || img.src.endsWith('.jpg')) {
            img.src = img.src.replace(/\.(png|jpg)$/, '.webp');
        }
    });
}

function minifyAssets() {
    // تقليل حجم CSS و JS
    if (process.env.NODE_ENV === 'production') {
        // إزالة التعليقات والمسافات البيضاء
        const styles = document.querySelectorAll('style');
        styles.forEach(style => {
            style.textContent = style.textContent
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/\s+/g, ' ')
                .trim();
        });
    }
}

function manageMemory() {
    // إدارة استخدام الذاكرة
    window.addEventListener('beforeunload', () => {
        // تنظيف المتغيرات المؤقتة
        window.tempData = null;
    });
    
    // مراقبة استخدام الذاكرة
    setInterval(() => {
        if (performance.memory) {
            const usedMemory = performance.memory.usedJSHeapSize;
            const totalMemory = performance.memory.totalJSHeapSize;
            
            if (usedMemory / totalMemory > 0.9) {
                console.warn('⚠️ استخدام مرتفع للذاكرة:', Math.round(usedMemory / 1024 / 1024), 'MB');
                // تنظيف الذاكرة
                if (window.gc) {
                    window.gc();
                }
            }
        }
    }, 60000); // كل دقيقة
}

function monitorPerformance() {
    // مراقبة أداء الصفحة
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log('📊 أداء الصفحة:', {
                    'زمن التحميل': Math.round(perfData.loadEventEnd) + 'ms',
                    'زمن الاستجابة الأول': Math.round(perfData.responseStart - perfData.requestStart) + 'ms',
                    'زمن التصيير': Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart) + 'ms'
                });
                
                // إرسال البيانات للتحليلات
                if (window.analytics) {
                    window.analytics.track('page_load', perfData);
                }
            }
        }, 0);
    });
}

// ============ وظائف البحث ============
function performSearch(query) {
    if (!query || query.length < 2) return [];
    
    const data = window.siteData || {};
    const products = data.products || [];
    const brands = data.brands || [];
    
    const results = {
        products: [],
        brands: []
    };
    
    // البحث في المنتجات
    results.products = products.filter(product => {
        const searchText = `${product.name?.ar || ''} ${product.name?.en || ''} ${product.model || ''} ${product.brand || ''} ${product.description || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
    });
    
    // البحث في الماركات
    results.brands = brands.filter(brand => {
        const searchText = `${brand.name?.ar || ''} ${brand.name?.en || ''} ${brand.description || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
    });
    
    return results;
}

function performLiveSearch(query) {
    return performSearch(query);
}

function displaySearchResults(results, container) {
    if (!results.products.length && !results.brands.length) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>لا توجد نتائج للبحث</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    if (results.products.length > 0) {
        html += '<div class="results-section"><h4>السيارات</h4>';
        results.products.slice(0, 5).forEach(product => {
            html += `
                <a href="#product-${product.id}" class="result-item" onclick="viewProduct('${product.id}')">
                    <div class="result-image">
                        ${product.image ? `<img src="${product.image}" alt="${product.name?.ar}">` : `<i class="fas fa-car"></i>`}
                    </div>
                    <div class="result-info">
                        <h5>${product.name?.ar || product.name}</h5>
                        <p>${product.brand} • ${product.model} • ${product.year}</p>
                        <span class="price">${formatPrice(product.price)}</span>
                    </div>
                </a>
            `;
        });
        html += '</div>';
    }
    
    if (results.brands.length > 0) {
        html += '<div class="results-section"><h4>الماركات</h4>';
        results.brands.slice(0, 3).forEach(brand => {
            html += `
                <a href="#brand-${brand.id}" class="result-item" onclick="filterByBrand('${brand.id}')">
                    <div class="result-image">
                        ${brand.logo ? `<img src="${brand.logo}" alt="${brand.name?.ar}">` : `<i class="fas fa-tag"></i>`}
                    </div>
                    <div class="result-info">
                        <h5>${brand.name?.ar || brand.name}</h5>
                    </div>
                </a>
            `;
        });
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// ============ وظائف الفلترة ============
function filterProducts(filterType) {
    const products = window.siteData?.products || [];
    let filteredProducts = [];
    
    switch(filterType) {
        case 'new':
            filteredProducts = products.filter(p => p.type === 'new');
            break;
        case 'used':
            filteredProducts = products.filter(p => p.type === 'used');
            break;
        case 'featured':
            filteredProducts = products.filter(p => p.featured);
            break;
        case 'electric':
            filteredProducts = products.filter(p => p.fuel === 'electric' || p.type === 'electric');
            break;
        default:
            filteredProducts = products;
    }
    
    updateProducts(filteredProducts);
    showNotification(`تم عرض ${filteredProducts.length} سيارة`, 'info');
}

function filterByBrand(brandId) {
    const products = window.siteData?.products || [];
    const brand = window.siteData?.brands?.find(b => b.id === brandId);
    
    if (!brand) return;
    
    const filteredProducts = products.filter(p => p.brandId === brandId || p.brand === brand.name?.ar);
    updateProducts(filteredProducts);
    
    showNotification(`تم عرض سيارات ${brand.name?.ar}`, 'info');
}

function sortProducts(sortBy) {
    const products = [...(window.siteData?.products || [])];
    
    switch(sortBy) {
        case 'price-low':
            products.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-high':
            products.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'newest':
            products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
        case 'oldest':
            products.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
            break;
        case 'popular':
            products.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
    }
    
    updateProducts(products);
    showNotification(`تم ترتيب السيارات حسب ${getSortText(sortBy)}`, 'info');
}

function getSortText(sortBy) {
    const sorts = {
        'price-low': 'السعر (من الأقل)',
        'price-high': 'السعر (من الأعلى)',
        'newest': 'الأحدث',
        'oldest': 'الأقدم',
        'popular': 'الأكثر مشاهدة'
    };
    return sorts[sortBy] || sortBy;
}

// ============ وظائف المنتجات ============
function viewProduct(productId) {
    const product = window.siteData?.products?.find(p => p.id === productId);
    if (!product) {
        showNotification('السيارة غير موجودة', 'error');
        return;
    }
    
    // زيادة عدد المشاهدات
    product.views = (product.views || 0) + 1;
    
    // عرض تفاصيل المنتج
    showProductModal(product);
}

function contactAboutProduct(productId) {
    const product = window.siteData?.products?.find(p => p.id === productId);
    const whatsapp = window.siteData?.contact?.whatsapp || '01121811110';
    
    if (product && whatsapp) {
        const message = `مرحباً، أريد الاستفسار عن السيارة: ${product.name?.ar || product.name} (${product.model} - ${product.year})`;
        window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
        showNotification('يرجى الاتصال بنا للاستفسار', 'error');
    }
}

function showProductModal(product) {
    // إنشاء وتظهر مودال المنتج
    const modalHtml = `
        <div class="product-modal-overlay">
            <div class="product-modal">
                <button class="modal-close" onclick="closeProductModal()">×</button>
                <div class="product-modal-content">
                    <div class="product-gallery">
                        ${product.images && product.images.length > 0 ? product.images.map(img => `
                            <img src="${img}" alt="${product.name?.ar}" class="product-image">
                        `).join('') : `
                            <div class="no-image"><i class="fas fa-car"></i></div>
                        `}
                    </div>
                    <div class="product-details">
                        <h2>${product.name?.ar || product.name}</h2>
                        <div class="product-meta">
                            <span class="brand">${product.brand}</span>
                            <span class="model">${product.model}</span>
                            <span class="year">${product.year}</span>
                        </div>
                        <div class="product-price">
                            <span class="current">${formatPrice(product.price)}</span>
                            ${product.oldPrice ? `<span class="old">${formatPrice(product.oldPrice)}</span>` : ''}
                        </div>
                        <div class="product-specs">
                            <div class="spec">
                                <i class="fas fa-gas-pump"></i>
                                <span>${getFuelText(product.fuel)}</span>
                            </div>
                            <div class="spec">
                                <i class="fas fa-cog"></i>
                                <span>${product.engine || 'غير محدد'}</span>
                            </div>
                            <div class="spec">
                                <i class="fas fa-tachometer-alt"></i>
                                <span>${product.transmission || 'أوتوماتيك'}</span>
                            </div>
                        </div>
                        <div class="product-description">
                            <h3>الوصف</h3>
                            <p>${product.description || 'لا يوجد وصف'}</p>
                        </div>
                        <div class="product-actions">
                            <button class="btn btn-primary btn-lg" onclick="contactAboutProduct('${product.id}')">
                                <i class="fas fa-phone"></i> اتصل الآن
                            </button>
                            <button class="btn btn-secondary btn-lg" onclick="shareProduct('${product.id}')">
                                <i class="fas fa-share"></i> مشاركة
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // إضافة المودال للصفحة
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // إظهار المودال
    setTimeout(() => {
        modalContainer.querySelector('.product-modal-overlay').classList.add('active');
    }, 10);
}

function closeProductModal() {
    const modal = document.querySelector('.product-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.parentNode.remove();
        }, 300);
    }
}

function shareProduct(productId) {
    const product = window.siteData?.products?.find(p => p.id === productId);
    if (!product) return;
    
    const shareData = {
        title: product.name?.ar || product.name,
        text: `شاهد ${product.name?.ar} - ${product.brand} ${product.model} ${product.year}`,
        url: window.location.href.split('#')[0] + `#product-${productId}`
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('تمت المشاركة بنجاح'))
            .catch(error => console.log('خطأ في المشاركة:', error));
    } else {
        // نسخ الرابط
        navigator.clipboard.writeText(shareData.url)
            .then(() => showNotification('تم نسخ الرابط', 'success'))
            .catch(() => {
                // طريقة بديلة
                const tempInput = document.createElement('input');
                tempInput.value = shareData.url;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                showNotification('تم نسخ الرابط', 'success');
            });
    }
}

// ============ وظائف النماذج ============
function handleContactForm(formData) {
    const data = Object.fromEntries(formData);
    
    // التحقق من البيانات
    if (!data.name || !data.email || !data.message) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // إرسال البيانات
    sendFormData('contact', data)
        .then(response => {
            showNotification('تم إرسال الرسالة بنجاح', 'success');
            document.getElementById('contactForm').reset();
        })
        .catch(error => {
            console.error('خطأ في إرسال النموذج:', error);
            showNotification('حدث خطأ في إرسال الرسالة', 'error');
        });
}

function handleNewsletterForm(formData) {
    const email = formData.get('email');
    
    if (!validateEmail(email)) {
        showNotification('يرجى إدخال بريد إلكتروني صحيح', 'error');
        return;
    }
    
    // حفظ البريد
    const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
    if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
    }
    
    showNotification('تم الاشتراك في النشرة البريدية', 'success');
    document.getElementById('newsletterForm').reset();
}

function handleAppointmentForm(formData) {
    const data = Object.fromEntries(formData);
    
    // التحقق من البيانات
    if (!data.name || !data.phone || !data.date || !data.time) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // إرسال البيانات
    sendFormData('appointment', data)
        .then(response => {
            showNotification('تم حجز الموعد بنجاح', 'success');
            document.getElementById('appointmentForm').reset();
        })
        .catch(error => {
            console.error('خطأ في حجز الموعد:', error);
            showNotification('حدث خطأ في حجز الموعد', 'error');
        });
}

function handleGeneralForm(formData) {
    const data = Object.fromEntries(formData);
    console.log('بيانات النموذج:', data);
    showNotification('تم إرسال النموذج بنجاح', 'success');
}

async function sendFormData(type, data) {
    // محاكاة إرسال البيانات
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // في الواقع، هنا سنرسل البيانات للخادم
            console.log(`إرسال بيانات ${type}:`, data);
            resolve({ success: true, message: 'تم الإرسال' });
        }, 1000);
    });
}

// ============ وظائف التحقق ============
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[0-9\-\s\(\)]{10,}$/;
    return re.test(phone);
}

// ============ وظائف التنسيق ============
function formatPrice(price) {
    if (!price && price !== 0) return 'غير متوفر';
    return new Intl.NumberFormat('ar-EG').format(price) + ' ج.م';
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getFuelText(fuel) {
    const fuels = {
        'gasoline': 'بنزين',
        'diesel': 'ديزل',
        'electric': 'كهرباء',
        'hybrid': 'هايبرد'
    };
    return fuels[fuel] || fuel || 'غير محدد';
}

// ============ وظائف الرسوم المتحركة ============
function animateElements() {
    // تفعيل الرسوم المتحركة للعناصر
    const animateOnScroll = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    };
    
    const observer = new IntersectionObserver(animateOnScroll, {
        threshold: 0.1
    });
    
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });
}

function triggerScrollAnimations() {
    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach(element => {
        const position = element.getBoundingClientRect();
        
        if (position.top < window.innerHeight * 0.8) {
            element.classList.add('animate');
        }
    });
}

// ============ وظائف التنبيهات ============
function showNotification(message, type = 'info') {
    // إنشاء عنصر التنبيه
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // إضافة التنبيه للصفحة
    document.body.appendChild(notification);
    
    // إظهار التنبيه
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // إخفاء التنبيه بعد 5 ثواني
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

// ============ وظائف التتبع ============
function trackPageView() {
    // تتبع مشاهدة الصفحة
    const pageData = {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString()
    };
    
    // حفظ في localStorage
    const pageViews = JSON.parse(localStorage.getItem('page_views') || '[]');
    pageViews.push(pageData);
    localStorage.setItem('page_views', JSON.stringify(pageViews.slice(-100))); // حفظ آخر 100 مشاهدة
    
    // إرسال للتحليلات (إن وجد)
    if (window.analytics) {
        window.analytics.track('page_view', pageData);
    }
}

function trackEvent(eventName, eventData = {}) {
    // تتبع الأحداث
    const event = {
        name: eventName,
        data: eventData,
        timestamp: new Date().toISOString()
    };
    
    // حفظ في localStorage
    const events = JSON.parse(localStorage.getItem('tracked_events') || '[]');
    events.push(event);
    localStorage.setItem('tracked_events', JSON.stringify(events.slice(-500))); // حفظ آخر 500 حدث
    
    // إرسال للتحليلات
    if (window.analytics) {
        window.analytics.track(eventName, eventData);
    }
}

// ============ وظائف Service Worker ============
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker مسجل:', registration);
            })
            .catch(error => {
                console.error('❌ خطأ في تسجيل Service Worker:', error);
            });
    }
}

// ============ التحقق من دعم المتصفح ============
function checkBrowserSupport() {
    const unsupportedFeatures = [];
    
    // التحقق من الميزات المطلوبة
    if (!window.Promise) unsupportedFeatures.push('Promises');
    if (!window.fetch) unsupportedFeatures.push('Fetch API');
    if (!window.localStorage) unsupportedFeatures.push('Local Storage');
    
    if (unsupportedFeatures.length > 0) {
        showNotification(
            `متصفحك لا يدعم بعض الميزات: ${unsupportedFeatures.join(', ')}. يرجى تحديث المتصفح.`,
            'warning'
        );
    }
}

// ============ إنشاء بيانات افتراضية ============
function createDefaultData() {
    return {
        version: "2.0.0",
        lastUpdated: new Date().toISOString(),
        site: {
            name: { ar: "سيارات عبدالله", en: "Abdullah Cars" },
            description: { 
                ar: "أفضل عروض السيارات الجديدة والمستعملة في مصر", 
                en: "Best offers for new and used cars in Egypt" 
            },
            establishedYear: 1993
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
        products: [],
        brands: [],
        categories: []
    };
}

// ============ تحديث التخطيط ============
function updateLayout() {
    const width = window.innerWidth;
    
    // تعديل التخطيط حسب الحجم
    if (width < 768) {
        document.body.classList.add('mobile-view');
        document.body.classList.remove('tablet-view', 'desktop-view');
    } else if (width < 1024) {
        document.body.classList.add('tablet-view');
        document.body.classList.remove('mobile-view', 'desktop-view');
    } else {
        document.body.classList.add('desktop-view');
        document.body.classList.remove('mobile-view', 'tablet-view');
    }
    
    // تعديل عدد المنتجات في الصف
    const productGrid = document.querySelector('.products-grid');
    if (productGrid) {
        let columns = 4;
        if (width < 768) columns = 1;
        else if (width < 1024) columns = 2;
        else if (width < 1400) columns = 3;
        
        productGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }
}

// ============ جعل الدوال متاحة عالمياً ============
window.initializeSystem = initializeSystem;
window.loadData = loadData;
window.updateSiteContent = updateSiteContent;
window.performSearch = performSearch;
window.filterProducts = filterProducts;
window.filterByBrand = filterByBrand;
window.sortProducts = sortProducts;
window.viewProduct = viewProduct;
window.contactAboutProduct = contactAboutProduct;
window.showProductModal = showProductModal;
window.closeProductModal = closeProductModal;
window.shareProduct = shareProduct;
window.showNotification = showNotification;
window.trackEvent = trackEvent;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.updateLayout = updateLayout;

console.log('🎯 النظام الرئيسي جاهز');