// نظام المزامنة مع GitHub - عبدالله للسيارات
(function() {
    'use strict';
    
    // إعدادات GitHub
    const GITHUB_CONFIG = {
        TOKEN: "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",
        USERNAME: "MHmooDhazm",
        REPO: "bitelazz-data",
        FILE: "site-data.json",
        BRANCH: "main",
        API_BASE: "https://api.github.com"
    };
    
    // حالة المزامنة الحالية
    let isSyncing = false;
    let lastSyncTime = null;
    let currentData = null;
    
    // إنشاء مؤشر المزامنة في الواجهة
    function createSyncIndicator() {
        if (document.getElementById('syncIndicator')) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'syncIndicator';
        indicator.className = 'sync-indicator';
        indicator.innerHTML = `
            <div class="sync-pulse"></div>
            <div class="sync-text">جاهز</div>
            <div class="sync-time"></div>
        `;
        document.body.appendChild(indicator);
        
        // إضافة الأنماط
        const style = document.createElement('style');
        style.textContent = `
            .sync-indicator {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                padding: 12px 16px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 9999;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                border: 2px solid #e2e8f0;
                transition: all 0.3s ease;
                font-family: 'Cairo', sans-serif;
                min-width: 180px;
            }
            
            .sync-pulse {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #38a169;
                position: relative;
            }
            
            .sync-pulse::after {
                content: '';
                position: absolute;
                top: -3px;
                left: -3px;
                right: -3px;
                bottom: -3px;
                border-radius: 50%;
                background: rgba(56, 161, 105, 0.3);
                animation: pulse 2s infinite;
            }
            
            .sync-indicator.syncing .sync-pulse {
                background: #ed8936;
            }
            
            .sync-indicator.syncing .sync-pulse::after {
                background: rgba(237, 137, 54, 0.3);
                animation: pulse 1s infinite;
            }
            
            .sync-indicator.error .sync-pulse {
                background: #e53e3e;
            }
            
            .sync-text {
                font-weight: 600;
                font-size: 14px;
                color: #2d3748;
                flex: 1;
            }
            
            .sync-time {
                font-size: 12px;
                color: #718096;
                white-space: nowrap;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
            }
            
            .sync-indicator:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
                border-color: #c53030;
            }
            
            .sync-indicator.clickable {
                cursor: pointer;
            }
            
            .sync-indicator.clickable:hover {
                background: rgba(197, 48, 48, 0.05);
            }
        `;
        document.head.appendChild(style);
    }
    
    // تحديث مؤشر المزامنة
    function updateSyncIndicator(message, status) {
        const indicator = document.getElementById('syncIndicator');
        if (!indicator) return;
        
        const textElement = indicator.querySelector('.sync-text');
        const pulseElement = indicator.querySelector('.sync-pulse');
        const timeElement = indicator.querySelector('.sync-time');
        
        if (textElement) textElement.textContent = message;
        
        // تحديث الحالة
        indicator.className = 'sync-indicator';
        if (status) {
            indicator.classList.add(status);
        }
        
        // تحديث الوقت
        if (timeElement && lastSyncTime) {
            const now = new Date();
            const diffMs = now - lastSyncTime;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            
            if (diffMins === 0) {
                timeElement.textContent = 'الآن';
            } else if (diffMins < 60) {
                timeElement.textContent = `قبل ${diffMins} دقيقة`;
            } else if (diffMins < 1440) {
                const hours = Math.floor(diffMins / 60);
                timeElement.textContent = `قبل ${hours} ساعة`;
            } else {
                const days = Math.floor(diffMins / 1440);
                timeElement.textContent = `قبل ${days} يوم`;
            }
        }
    }
    
    // عرض إشعار
    function showNotification(message, type = 'info') {
        // إزالة الإشعارات القديمة
        const oldNotifications = document.querySelectorAll('.git-notification');
        oldNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `git-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div class="notification-message">${message}</div>
            <div class="notification-close" onclick="this.parentElement.remove()">×</div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#3182ce'};
            color: white;
            padding: 16px 24px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
            animation: notificationSlide 0.3s ease;
            min-width: 300px;
            max-width: 500px;
            font-family: 'Cairo', sans-serif;
        `;
        
        document.body.appendChild(notification);
        
        // إضافة الأنماط إذا لم تكن موجودة
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes notificationSlide {
                    from {
                        transform: translateX(-50%) translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
                
                .git-notification {
                    transition: opacity 0.3s ease;
                }
                
                .notification-icon {
                    font-size: 20px;
                }
                
                .notification-message {
                    flex: 1;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .notification-close {
                    cursor: pointer;
                    font-size: 20px;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s ease;
                }
                
                .notification-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `;
            document.head.appendChild(style);
        }
        
        // إخفاء التلقائي بعد 5 ثواني
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
    
    // ترميز Base64 للنص العربي
    function encodeBase64(str) {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            console.error('Base64 encoding error:', e);
            return btoa(str);
        }
    }
    
    // فك ترميز Base64 للنص العربي
    function decodeBase64(base64) {
        try {
            return decodeURIComponent(escape(atob(base64)));
        } catch (e) {
            console.error('Base64 decoding error:', e);
            return atob(base64);
        }
    }
    
    // التحقق من اتصال الإنترنت
    async function checkInternetConnection() {
        try {
            const response = await fetch('https://api.github.com', { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    // التحقق من صحة بيانات GitHub
    function validateGitHubConfig() {
        if (!GITHUB_CONFIG.TOKEN || GITHUB_CONFIG.TOKEN.length < 10) {
            showNotification('❌ توكن GitHub غير صالح', 'error');
            return false;
        }
        
        if (!GITHUB_CONFIG.USERNAME || !GITHUB_CONFIG.REPO) {
            showNotification('❌ إعدادات GitHub غير مكتملة', 'error');
            return false;
        }
        
        return true;
    }
    
    // جلب البيانات من GitHub
    async function fetchFromGitHub() {
        if (!validateGitHubConfig()) {
            throw new Error('إعدادات GitHub غير صالحة');
        }
        
        if (isSyncing) {
            showNotification('⚠️ جاري المزامنة بالفعل...', 'warning');
            return currentData;
        }
        
        isSyncing = true;
        updateSyncIndicator('جاري تحميل البيانات...', 'syncing');
        
        try {
            // التحقق من اتصال الإنترنت أولاً
            const isOnline = await checkInternetConnection();
            if (!isOnline) {
                throw new Error('لا يوجد اتصال بالإنترنت');
            }
            
            const url = `${GITHUB_CONFIG.API_BASE}/repos/${GITHUB_CONFIG.USERNAME}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.FILE}?ref=${GITHUB_CONFIG.BRANCH}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Cache-Control': 'no-cache'
                },
                cache: 'no-store'
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    // الملف غير موجود، نعيد بيانات فارغة
                    showNotification('📝 لم يتم العثور على بيانات، سيتم إنشاء ملف جديد', 'info');
                    const emptyData = getEmptyData();
                    currentData = emptyData;
                    
                    // نحفظ البيانات الفارغة محلياً
                    localStorage.setItem('siteData', JSON.stringify(emptyData, null, 2));
                    localStorage.setItem('lastSync', new Date().toISOString());
                    
                    lastSyncTime = new Date();
                    updateSyncIndicator('جاهز (بيانات جديدة)', 'success');
                    showNotification('✅ تم تهيئة البيانات بنجاح', 'success');
                    
                    return emptyData;
                }
                
                throw new Error(`خطأ في GitHub: ${response.status} - ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.content) {
                throw new Error('لا توجد بيانات في الاستجابة');
            }
            
            // فك الترميز Base64
            const decodedContent = decodeBase64(result.content);
            let data;
            
            try {
                data = JSON.parse(decodedContent);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('خطأ في تحليل البيانات JSON');
            }
            
            // التحقق من صحة البيانات
            data = validateDataStructure(data);
            
            // حفظ البيانات محلياً
            localStorage.setItem('siteData', JSON.stringify(data, null, 2));
            localStorage.setItem('lastSync', new Date().toISOString());
            localStorage.setItem('lastCommitSha', result.sha);
            localStorage.setItem('dataVersion', '1.0');
            
            currentData = data;
            lastSyncTime = new Date();
            
            updateSyncIndicator('تم تحميل البيانات', 'success');
            showNotification('✅ تم تحديث البيانات من GitHub', 'success');
            
            // إطلاق حدث تحديث البيانات
            dispatchDataUpdateEvent(data);
            
            return data;
            
        } catch (error) {
            console.error('GitHub fetch error:', error);
            
            updateSyncIndicator('فشل التحميل', 'error');
            
            // محاولة تحميل البيانات المحلية
            try {
                const localData = localStorage.getItem('siteData');
                if (localData) {
                    const parsedData = JSON.parse(localData);
                    currentData = validateDataStructure(parsedData);
                    
                    updateSyncIndicator('جاهز (بيانات محلية)', 'success');
                    showNotification('⚠️ تم تحميل البيانات المحلية', 'warning');
                    
                    return currentData;
                }
            } catch (localError) {
                console.error('Local data load error:', localError);
            }
            
            // إذا فشل كل شيء، نعيد بيانات فارغة
            const emptyData = getEmptyData();
            currentData = emptyData;
            
            showNotification('❌ فشل التحميل، سيتم استخدام بيانات افتراضية', 'error');
            
            return emptyData;
            
        } finally {
            isSyncing = false;
        }
    }
    
    // إرسال البيانات إلى GitHub
    async function pushToGitHub(data, commitMessage = null) {
        if (!validateGitHubConfig()) {
            throw new Error('إعدادات GitHub غير صالحة');
        }
        
        if (isSyncing) {
            showNotification('⚠️ جاري المزامنة بالفعل...', 'warning');
            return false;
        }
        
        isSyncing = true;
        updateSyncIndicator('جاري حفظ البيانات...', 'syncing');
        
        try {
            // التحقق من اتصال الإنترنت
            const isOnline = await checkInternetConnection();
            if (!isOnline) {
                throw new Error('لا يوجد اتصال بالإنترنت');
            }
            
            // التحقق من صحة البيانات
            data = validateDataStructure(data);
            
            // الحصول على SHA الملف الحالي إن وجد
            let sha = null;
            try {
                const getUrl = `${GITHUB_CONFIG.API_BASE}/repos/${GITHUB_CONFIG.USERNAME}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.FILE}?ref=${GITHUB_CONFIG.BRANCH}`;
                const getResponse = await fetch(getUrl, {
                    headers: {
                        'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                }
            } catch (shaError) {
                console.log('File may not exist:', shaError);
            }
            
            // تحضير البيانات للإرسال
            const jsonData = JSON.stringify(data, null, 2);
            const encodedData = encodeBase64(jsonData);
            
            const commitMsg = commitMessage || `تحديث البيانات - ${new Date().toLocaleString('ar-SA')}`;
            
            const pushData = {
                message: commitMsg,
                content: encodedData,
                branch: GITHUB_CONFIG.BRANCH,
                committer: {
                    name: "عبدالله للسيارات",
                    email: "admin@abdullah-cars.com"
                }
            };
            
            if (sha) {
                pushData.sha = sha;
            }
            
            const pushUrl = `${GITHUB_CONFIG.API_BASE}/repos/${GITHUB_CONFIG.USERNAME}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.FILE}`;
            
            const response = await fetch(pushUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pushData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('GitHub push error details:', errorData);
                throw new Error(`خطأ في حفظ البيانات: ${response.status}`);
            }
            
            const result = await response.json();
            
            // حفظ البيانات محلياً
            localStorage.setItem('siteData', jsonData);
            localStorage.setItem('lastSync', new Date().toISOString());
            localStorage.setItem('lastCommitSha', result.commit.sha);
            
            currentData = data;
            lastSyncTime = new Date();
            
            updateSyncIndicator('تم الحفظ', 'success');
            showNotification('✅ تم حفظ البيانات في GitHub', 'success');
            
            // إطلاق حدث تحديث البيانات
            dispatchDataUpdateEvent(data);
            
            return result;
            
        } catch (error) {
            console.error('GitHub push error:', error);
            
            // محاولة الحفظ محلياً
            try {
                const jsonData = JSON.stringify(data, null, 2);
                localStorage.setItem('siteData', jsonData);
                localStorage.setItem('lastSync', new Date().toISOString());
                
                currentData = data;
                
                updateSyncIndicator('تم الحفظ محلياً', 'success');
                showNotification('⚠️ تم حفظ البيانات محلياً فقط', 'warning');
                
                return { success: false, savedLocally: true };
            } catch (localError) {
                console.error('Local save error:', localError);
                updateSyncIndicator('فشل الحفظ', 'error');
                showNotification('❌ فشل حفظ البيانات', 'error');
                
                throw error;
            }
            
        } finally {
            isSyncing = false;
        }
    }
    
    // التحقق من هيكل البيانات
    function validateDataStructure(data) {
        if (!data || typeof data !== 'object') {
            return getEmptyData();
        }
        
        // الهياكل الأساسية المطلوبة
        const requiredStructures = {
            categories: [],
            products: [],
            orders: [],
            sellRequests: [],
            exchangeRequests: [],
            messages: [],
            contact: {},
            site: {
                name: { ar: "", en: "" },
                currencySymbol: "ج.م"
            },
            admin: {
                password: "2845"
            },
            telegram: {
                enabled: false,
                token: "",
                chatId: "",
                message: "",
                logs: []
            }
        };
        
        // التأكد من وجود جميع الهياكل
        Object.keys(requiredStructures).forEach(key => {
            if (!data[key]) {
                data[key] = requiredStructures[key];
            } else if (typeof requiredStructures[key] === 'object' && !Array.isArray(requiredStructures[key])) {
                // دمج الكائنات الفرعية
                data[key] = { ...requiredStructures[key], ...data[key] };
            }
        });
        
        // التأكد من وجود خطط التقسيط في المنتجات
        if (data.products && Array.isArray(data.products)) {
            data.products = data.products.map(product => {
                if (!product.installmentPlans) {
                    product.installmentPlans = [];
                }
                return product;
            });
        }
        
        return data;
    }
    
    // بيانات فارغة
    function getEmptyData() {
        return {
            categories: [],
            products: [],
            users: [],
            orders: [],
            sellRequests: [],
            exchangeRequests: [],
            messages: [],
            contact: {},
            site: {
                name: { ar: "", en: "" },
                currencySymbol: "ج.م"
            },
            admin: {
                password: "2845",
                lastLogin: null
            },
            telegram: {
                enabled: false,
                token: "",
                chatId: "",
                message: "🎉 طلب جديد 🎉\n\n👤 العميل: {name}\n📞 الهاتف: {phone}\n🚗 المنتج: {product}\n💰 السعر: {price}\n📅 التاريخ: {date}",
                logs: []
            }
        };
    }
    
    // إرسال إشعار التلجرام
    async function sendTelegramNotification(orderData) {
        try {
            const siteData = currentData || JSON.parse(localStorage.getItem('siteData') || '{}');
            
            if (!siteData.telegram?.enabled || !siteData.telegram.token || !siteData.telegram.chatId) {
                return false;
            }
            
            const message = siteData.telegram.message
                .replace('{name}', orderData.customer?.fullName || 'غير معروف')
                .replace('{phone}', orderData.customer?.phone || 'غير معروف')
                .replace('{product}', orderData.product?.name || 'غير معروف')
                .replace('{price}', (orderData.totalAmount || orderData.product?.price || 0) + ' ' + (siteData.site?.currencySymbol || 'ج.م'))
                .replace('{date}', new Date(orderData.date || Date.now()).toLocaleString('ar-SA'));
            
            const response = await fetch(`https://api.telegram.org/bot${siteData.telegram.token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: siteData.telegram.chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
            
            const result = await response.json();
            
            // تحديث السجل
            if (siteData.telegram.logs) {
                siteData.telegram.logs.push({
                    timestamp: new Date().toISOString(),
                    type: 'order',
                    success: result.ok,
                    orderId: orderData.orderNumber || orderData.id
                });
                
                // حفظ البيانات المحدثة
                localStorage.setItem('siteData', JSON.stringify(siteData, null, 2));
            }
            
            return result.ok;
            
        } catch (error) {
            console.error('Telegram error:', error);
            return false;
        }
    }
    
    // مزامنة يدوية
    async function manualSync() {
        if (isSyncing) {
            showNotification('⚠️ جاري المزامنة بالفعل...', 'warning');
            return currentData;
        }
        
        try {
            // جلب أحدث البيانات أولاً
            const remoteData = await fetchFromGitHub();
            
            if (remoteData) {
                // مقارنة مع البيانات المحلية
                const localData = localStorage.getItem('siteData');
                if (localData) {
                    const parsedLocal = JSON.parse(localData);
                    
                    // يمكن إضافة منطق للدمج الذكي هنا إذا لزم الأمر
                    currentData = remoteData;
                    
                    showNotification('✅ تمت المزامنة بنجاح', 'success');
                    
                    // إعادة تحميل الصفحة إذا كانت صفحة الإدارة
                    if (window.location.pathname.includes('admin.html')) {
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }
                }
                
                return remoteData;
            }
            
        } catch (error) {
            console.error('Manual sync error:', error);
            showNotification('❌ فشلت المزامنة', 'error');
            throw error;
        }
    }
    
    // إطلاق حدث تحديث البيانات
    function dispatchDataUpdateEvent(data) {
        const event = new CustomEvent('siteDataUpdated', {
            detail: { data: data }
        });
        document.dispatchEvent(event);
    }
    
    // تهيئة نظام المزامنة
    async function initSyncSystem() {
        // إنشاء مؤشر المزامنة
        createSyncIndicator();
        
        // تحميل البيانات المحلية أولاً
        try {
            const localData = localStorage.getItem('siteData');
            if (localData) {
                currentData = JSON.parse(localData);
            }
            
            const lastSync = localStorage.getItem('lastSync');
            if (lastSync) {
                lastSyncTime = new Date(lastSync);
                updateSyncIndicator('جاهز', 'success');
            } else {
                updateSyncIndicator('جاري التحميل...', 'syncing');
            }
        } catch (error) {
            console.error('Initial local load error:', error);
            updateSyncIndicator('خطأ في التحميل', 'error');
        }
        
        // محاولة التحميل من GitHub
        setTimeout(async () => {
            try {
                const data = await fetchFromGitHub();
                currentData = data;
            } catch (error) {
                console.error('Initial GitHub load error:', error);
            }
        }, 1000);
        
        // جعل المؤشر قابل للنقر في صفحة الإدارة
        if (window.location.pathname.includes('admin.html')) {
            const indicator = document.getElementById('syncIndicator');
            if (indicator) {
                indicator.classList.add('clickable');
                indicator.title = 'انقر للمزامنة اليدوية';
                indicator.addEventListener('click', async () => {
                    await manualSync();
                });
            }
        }
        
        // مزامنة تلقائية كل 5 دقائق
        setInterval(async () => {
            try {
                if (!isSyncing) {
                    await fetchFromGitHub();
                }
            } catch (error) {
                console.error('Auto sync error:', error);
            }
        }, 5 * 60 * 1000);
        
        console.log('✅ نظام المزامنة مع GitHub جاهز');
    }
    
    // تصدير الوظائف
    window.gitHubSync = {
        // الوظائف الأساسية
        fetch: fetchFromGitHub,
        push: pushToGitHub,
        sync: manualSync,
        
        // الإشعارات
        showNotification: showNotification,
        sendTelegramNotification: sendTelegramNotification,
        
        // البيانات
        getData: () => currentData || JSON.parse(localStorage.getItem('siteData') || 'null'),
        setData: (data) => {
            currentData = data;
            localStorage.setItem('siteData', JSON.stringify(data, null, 2));
        },
        
        // المساعدات
        encodeBase64: encodeBase64,
        decodeBase64: decodeBase64,
        
        // الحالة
        isSyncing: () => isSyncing,
        getLastSyncTime: () => lastSyncTime,
        
        // التهيئة
        init: initSyncSystem
    };
    
    // التهيئة التلقائية
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSyncSystem);
    } else {
        initSyncSystem();
    }
    
})();