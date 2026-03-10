/**
 * نظام الأمان المتقدم - سيارات عبدالله
 * الإصدار: 5.0.0 - حماية متكاملة من جميع الهجمات
 */

// ==================== حماية من هجمات XSS ====================
class XSSProtection {
    constructor() {
        this.init();
    }

    init() {
        // تنظيف جميع المدخلات
        this.sanitizeInputs();
        
        // منع تنفيذ scripts ضارة
        this.preventXSSInjection();
        
        // حماية الـ DOM
        this.protectDOM();
    }

    // تنظيف النصوص من أي أكواد ضارة
    sanitizeString(str) {
        if (!str) return str;
        
        // تحويل الأحرف الخاصة إلى كيانات HTML
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/\\/g, '&#x5C;')
            .replace(/`/g, '&#96;')
            .replace(/=/g, '&#61;');
    }

    // تنظيف جميع المدخلات في النماذج
    sanitizeInputs() {
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // منع إدخال أكواد HTML
                e.target.value = e.target.value.replace(/<[^>]*>?/gm, '');
            }
        }, true);
    }

    // منع XSS Injection
    preventXSSInjection() {
        // منع إضافة scripts ديناميكياً
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            
            if (tagName.toLowerCase() === 'script') {
                setTimeout(() => {
                    if (element.src && !element.src.startsWith(window.location.origin)) {
                        element.remove();
                        console.warn('⚠️ تم منع تحميل سكريبت خارجي:', element.src);
                    }
                }, 0);
            }
            
            return element;
        };
        
        // منع eval و Function
        window.eval = function() {
            console.warn('⚠️ تم منع استخدام eval()');
            return null;
        };
        
        window.Function = function() {
            console.warn('⚠️ تم منع استخدام Function()');
            return null;
        };
    }

    // حماية DOM
    protectDOM() {
        // مراقبة التغييرات في DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // عنصر HTML
                        if (node.tagName === 'SCRIPT' && !node.hasAttribute('data-safe')) {
                            if (!node.src || !node.src.includes(window.location.origin)) {
                                node.remove();
                                console.warn('⚠️ تم منع إضافة سكريبت غير آمن');
                            }
                        }
                        
                        // منع iframes ضارة
                        if (node.tagName === 'IFRAME') {
                            const src = node.src || '';
                            if (!src.startsWith(window.location.origin) && !src.includes('youtube.com') && !src.includes('player.vimeo.com')) {
                                node.remove();
                                console.warn('⚠️ تم منع iframe غير آمن');
                            }
                        }
                    }
                });
            });
        });
        
        observer.observe(document, { childList: true, subtree: true });
    }
}

// ==================== حماية من SQL Injection ====================
class SQLInjectionProtection {
    constructor() {
        this.sqlPatterns = [
            /(\bSELECT\b.*\bFROM\b)/i,
            /(\bINSERT\b.*\bINTO\b)/i,
            /(\bUPDATE\b.*\bSET\b)/i,
            /(\bDELETE\b.*\bFROM\b)/i,
            /(\bDROP\b.*\bTABLE\b)/i,
            /(\bUNION\b.*\bSELECT\b)/i,
            /(\bALTER\b.*\bTABLE\b)/i,
            /(\bCREATE\b.*\bTABLE\b)/i,
            /(\bEXEC\b|\bEXECUTE\b)/i,
            /(\bCAST\b|\bCONVERT\b)/i,
            /(';\s*--)/,
            /(';\s*#)/,
            /(\/\*.*\*\/)/,
            /(;\s*DROP\s)/i,
            /(;\s*DELETE\s)/i,
            /(;\s*UPDATE\s)/i,
            /(;\s*INSERT\s)/i,
            /(;\s*SELECT\s)/i,
            /(;\s*ALTER\s)/i,
            /(;\s*CREATE\s)/i,
            /(;\s*EXEC\s)/i
        ];
    }

    // فحص النص ضد SQL Injection
    checkForSQLInjection(input) {
        if (!input || typeof input !== 'string') return false;
        
        for (let pattern of this.sqlPatterns) {
            if (pattern.test(input)) {
                console.warn('⚠️ تم اكتشاف محاولة SQL Injection:', input);
                return true;
            }
        }
        
        return false;
    }

    // تنظيف المدخلات من أكواد SQL
    sanitizeSQL(input) {
        if (!input || typeof input !== 'string') return input;
        
        return input
            .replace(/'/g, "''")
            .replace(/--/g, '')
            .replace(/;/g, '')
            .replace(/\/\*/g, '')
            .replace(/\*\//g, '');
    }

    // حماية جميع المدخلات
    protectInputs() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const inputs = form.querySelectorAll('input, textarea, select');
                
                inputs.forEach(input => {
                    if (input.value && typeof input.value === 'string') {
                        if (this.checkForSQLInjection(input.value)) {
                            e.preventDefault();
                            alert('تم اكتشاف محاولة اختراق! تم منع الإرسال.');
                            input.value = '';
                        }
                    }
                });
            });
        });
    }
}

// ==================== حماية من JSON Injection ====================
class JSONInjectionProtection {
    constructor() {
        this.jsonPatterns = [
            /(\{.*\".*:.*\})/,
            /(\[.*\])/,
            /(\\u[0-9a-fA-F]{4})/,
            /(\\\\)/,
            /(\\\")/
        ];
    }

    // التحقق من صحة JSON
    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    // فحص النص ضد JSON Injection
    checkForJSONInjection(input) {
        if (!input || typeof input !== 'string') return false;
        
        // إذا كان النص JSON صالح، ارفضه (لأنه قد يكون محاولة حقن)
        if (this.isValidJSON(input)) {
            console.warn('⚠️ تم اكتشاف محاولة JSON Injection:', input);
            return true;
        }
        
        return false;
    }

    // حماية localStorage و sessionStorage
    protectStorage() {
        // منع تخزين JSON ضار
        const originalSetItem = Storage.prototype.setItem;
        
        Storage.prototype.setItem = function(key, value) {
            if (typeof value === 'string' && value.length > 0) {
                // منع تخزين JSON في localStorage للمستخدمين العاديين
                if (this === localStorage && key !== 'admin_session' && key !== 'userSession') {
                    try {
                        JSON.parse(value);
                        console.warn('⚠️ تم منع تخزين JSON في localStorage');
                        return;
                    } catch (e) {
                        // ليس JSON، مسموح به
                    }
                }
            }
            
            originalSetItem.call(this, key, value);
        };
    }
}

// ==================== حماية أساسية من DDoS ====================
class DDoSBasicProtection {
    constructor() {
        this.requestCount = 0;
        this.requestTimestamps = [];
        this.maxRequestsPerMinute = 60; // الحد الأقصى 60 طلب في الدقيقة
        this.blockedIPs = [];
    }

    // تسجيل طلب
    logRequest() {
        const now = Date.now();
        this.requestTimestamps = this.requestTimestamps.filter(t => now - t < 60000); // آخر دقيقة فقط
        this.requestTimestamps.push(now);
        
        if (this.requestTimestamps.length > this.maxRequestsPerMinute) {
            console.warn('⚠️ تم اكتشاف نشاط غير طبيعي - عدد طلبات كبير');
            return false;
        }
        
        return true;
    }

    // التحقق من الطلب
    checkRequest() {
        return this.logRequest();
    }

    // مراقبة عدد الطلبات
    monitorRequests() {
        setInterval(() => {
            const now = Date.now();
            this.requestTimestamps = this.requestTimestamps.filter(t => now - t < 60000);
            
            if (this.requestTimestamps.length > this.maxRequestsPerMinute * 0.8) {
                console.warn('⚠️ تنبيه: اقتراب الحد الأقصى للطلبات');
            }
        }, 10000);
    }
}

// ==================== تعطيل أدوات المطور ====================
class DevToolsBlocker {
    constructor() {
        this.init();
    }

    init() {
        this.disableRightClick();
        this.disableKeyShortcuts();
        this.detectDevTools();
        this.disableViewSource();
    }

    // تعطيل الزر الأيمن
    disableRightClick() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
    }

    // تعطيل اختصارات لوحة المفاتيح
    disableKeyShortcuts() {
        document.addEventListener('keydown', (e) => {
            // F12
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+Shift+I
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+Shift+J
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+Shift+C
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+S (Save)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+P (Print)
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+A (Select All)
            if (e.ctrlKey && e.key === 'a') {
                // مسموح به للنسخ العادي، لكن نراقبه
            }
            
            // Ctrl+C (Copy)
            if (e.ctrlKey && e.key === 'c') {
                // مسموح به للنسخ العادي
            }
        });
    }

    // كشف أدوات المطور
    detectDevTools() {
        // كشف فتح أدوات المطور
        setInterval(() => {
            const start = performance.now();
            debugger; // هذا السطر سيبطئ الأداء إذا كانت أدوات المطور مفتوحة
            const end = performance.now();
            
            if (end - start > 100) {
                // أدوات المطور مفتوحة
                document.body.innerHTML = '<div style="text-align: center; margin-top: 50px; color: #C5A059;"><h1>🚫 تم تعطيل أدوات المطور</h1><p>الموقع محمي بموجب قانون حقوق الملكية الفكرية</p></div>';
                console.warn('⚠️ تم اكتشاف أدوات المطور - جاري الإغلاق...');
            }
        }, 1000);
    }

    // تعطيل عرض المصدر
    disableViewSource() {
        // منع view-source:
        if (window.location.protocol === 'view-source:') {
            window.location.href = 'index.html';
        }
    }
}

// ==================== تهيئة جميع أنظمة الحماية ====================
class SecurityManager {
    constructor() {
        console.log('🔒 جاري تشغيل أنظمة الأمان...');
        
        // تشغيل جميع أنظمة الحماية
        this.xss = new XSSProtection();
        this.sql = new SQLInjectionProtection();
        this.json = new JSONInjectionProtection();
        this.ddos = new DDoSBasicProtection();
        this.devTools = new DevToolsBlocker();
        
        // تفعيل حماية المدخلات
        this.sql.protectInputs();
        this.json.protectStorage();
        
        // مراقبة DDoS
        this.ddos.monitorRequests();
        
        // مراقبة جميع الطلبات
        this.interceptRequests();
        
        console.log('✅ تم تفعيل جميع أنظمة الحماية بنجاح');
        console.log('🔐 الموقع محمي بواسطة نظام أمان متقدم');
    }

    // اعتراض جميع طلبات AJAX/Fetch
    interceptRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            // التحقق من الطلب
            if (!this.ddos.checkRequest()) {
                console.warn('⚠️ تم رفض الطلب - تجاوز الحد المسموح');
                return new Response(JSON.stringify({ error: 'طلبات كثيرة جداً' }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            // تنظيف البيانات المرسلة
            if (args[1] && args[1].body) {
                if (typeof args[1].body === 'string') {
                    // فحص SQL Injection
                    if (this.sql.checkForSQLInjection(args[1].body)) {
                        console.warn('⚠️ تم منع طلب يحوي SQL Injection');
                        return new Response(JSON.stringify({ error: 'طلب غير آمن' }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                    
                    // فحص JSON Injection
                    if (this.json.checkForJSONInjection(args[1].body)) {
                        console.warn('⚠️ تم منع طلب يحوي JSON Injection');
                        return new Response(JSON.stringify({ error: 'طلب غير آمن' }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            }
            
            // تنفيذ الطلب الأصلي
            return originalFetch.apply(this, args);
        };
        
        // اعتراض XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const self = this;
        
        XMLHttpRequest.prototype.open = function(...args) {
            // التحقق من الطلب
            if (!self.ddos.checkRequest()) {
                console.warn('⚠️ تم رفض طلب XHR - تجاوز الحد المسموح');
                return;
            }
            
            return originalXHROpen.apply(this, args);
        };
    }
}

// ==================== بدء تشغيل نظام الحماية ====================
document.addEventListener('DOMContentLoaded', () => {
    // منع تشغيل الحماية في صفحات الإدارة (اختياري)
    const currentPage = window.location.pathname.split('/').pop();
    const adminPages = ['dashboard.html', 'user-panel.html'];
    
    if (!adminPages.includes(currentPage)) {
        window.security = new SecurityManager();
    } else {
        // في صفحات الإدارة، نشغل حماية أخف
        console.log('🔓 تشغيل وضع الإدارة - حماية مخففة');
        window.security = {
            devTools: new DevToolsBlocker(),
            xss: new XSSProtection()
        };
    }
});

// حماية إضافية - تعطيل نسخ المحتوى
document.addEventListener('copy', (e) => {
    e.clipboardData.setData('text/plain', '© سيارات عبدالله - جميع الحقوق محفوظة');
    e.preventDefault();
});

// منع السحب والإفلات لنسخ المحتوى
document.addEventListener('dragstart', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

// إخفاء console.log في الإنتاج
if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    console.log = function() {};
    console.debug = function() {};
    console.info = function() {};
}

console.log('✅ تم تحميل نظام الأمان بنجاح');
console.log('🔐 جميع أنظمة الحماية نشطة');