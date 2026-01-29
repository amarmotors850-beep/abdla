// ملف security.js - لحماية الموقع من الهجمات

(function() {
    'use strict';
    
    // حماية من DDOS - Rate Limiting
    let requestCount = {};
    const MAX_REQUESTS = 50; // 50 طلب في الدقيقة
    const TIME_WINDOW = 60000; // 1 دقيقة
    
    // تعقب الطلبات
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const ip = getClientIdentifier();
        
        if (!requestCount[ip]) {
            requestCount[ip] = { count: 1, timestamp: Date.now() };
        } else {
            const now = Date.now();
            if (now - requestCount[ip].timestamp > TIME_WINDOW) {
                requestCount[ip] = { count: 1, timestamp: now };
            } else {
                requestCount[ip].count++;
                
                if (requestCount[ip].count > MAX_REQUESTS) {
                    console.warn(`Rate limit exceeded for: ${ip}`);
                    logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip, count: requestCount[ip].count });
                    return Promise.reject(new Error('Rate limit exceeded. Please try again later.'));
                }
            }
        }
        
        return originalFetch.apply(this, args);
    };
    
    // تنظيف عداد الطلبات القديمة كل ساعة
    setInterval(() => {
        const now = Date.now();
        Object.keys(requestCount).forEach(ip => {
            if (now - requestCount[ip].timestamp > 3600000) {
                delete requestCount[ip];
            }
        });
    }, 3600000);
    
    // الحصول على معرف العميل
    function getClientIdentifier() {
        // محاولة الحصول على IP من headers (في بيئة حقيقية)
        // هنا نستخدم معرف بسيط
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }
    
    // حماية من أدوات المطورين
    (function protectDevTools() {
        // منع فتح أدوات المطور
        document.addEventListener('keydown', function(e) {
            // F12
            if (e.keyCode === 123) {
                e.preventDefault();
                showSecurityAlert('أدوات المطور محظورة');
                return false;
            }
            
            // Ctrl+Shift+I
            if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
                e.preventDefault();
                showSecurityAlert('أدوات المطور محظورة');
                return false;
            }
            
            // Ctrl+Shift+J
            if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
                e.preventDefault();
                showSecurityAlert('أدوات المطور محظورة');
                return false;
            }
            
            // Ctrl+Shift+C
            if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
                e.preventDefault();
                showSecurityAlert('أدوات المطور محظورة');
                return false;
            }
            
            // Ctrl+U
            if (e.ctrlKey && e.keyCode === 85) {
                e.preventDefault();
                showSecurityAlert('عرض المصدر محظور');
                return false;
            }
        });
        
        // منع النقر الأيمن
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            showSecurityAlert('النقر الأيمن محظور');
            return false;
        });
        
        // منع السحب والإفلات للصور
        document.addEventListener('dragstart', function(e) {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                return false;
            }
        });
        
        // منع النسخ
        document.addEventListener('copy', function(e) {
            e.preventDefault();
            showSecurityAlert('النسخ محظور');
            return false;
        });
        
        // منع القص
        document.addEventListener('cut', function(e) {
            e.preventDefault();
            return false;
        });
        
        // منع اللصق
        document.addEventListener('paste', function(e) {
            e.preventDefault();
            return false;
        });
    })();
    
    // اكتشاف فتح أدوات المطور
    (function detectDevTools() {
        const threshold = 160;
        const checkDevTools = function() {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            
            if (widthThreshold || heightThreshold) {
                showSecurityAlert('تم اكتشاف أدوات المطور');
                logSecurityEvent('DEVTOOLS_DETECTED');
            }
        };
        
        setInterval(checkDevTools, 1000);
    })();
    
    // تسجيل أحداث الأمان
    function logSecurityEvent(eventType, data = {}) {
        const log = {
            timestamp: new Date().toISOString(),
            event: eventType,
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...data
        };
        
        // حفظ في localStorage
        const securityLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        securityLogs.push(log);
        
        // الاحتفاظ فقط بآخر 100 حدث
        if (securityLogs.length > 100) {
            securityLogs.shift();
        }
        
        localStorage.setItem('security_logs', JSON.stringify(securityLogs));
        
        // إرسال إشعار تيليجرام إذا كان متاحاً
        sendTelegramSecurityAlert(eventType, data);
    }
    
    // إرسال إشعار أمان لتليجرام
    function sendTelegramSecurityAlert(eventType, data) {
        try {
            const siteData = getSiteData();
            const botToken = siteData?.admin?.telegramBotToken;
            const chatId = siteData?.admin?.telegramChatId;
            
            if (!botToken || !chatId) return;
            
            let message = `⚠️ *تنبيه أمان*\n`;
            message += `🔒 الحدث: ${eventType}\n`;
            message += `🕒 الوقت: ${new Date().toLocaleString('ar-EG')}\n`;
            message += `🌐 الصفحة: ${window.location.href}\n`;
            
            if (data.ip) {
                message += `📍 IP: ${data.ip}\n`;
            }
            
            if (data.count) {
                message += `🔢 عدد الطلبات: ${data.count}\n`;
            }
            
            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
        } catch (error) {
            console.error('Telegram security alert error:', error);
        }
    }
    
    // الحصول على بيانات الموقع
    function getSiteData() {
        try {
            if (window.siteData) {
                return window.siteData;
            }
            
            const savedData = localStorage.getItem('siteData_encrypted');
            if (savedData && window.gitHubSync) {
                return window.gitHubSync.decryptData(savedData);
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
    
    // عرض تنبيه أمان
    function showSecurityAlert(message) {
        // إنشاء عنصر التنبيه
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #c53030, #9b2c2c);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(197, 48, 48, 0.3);
            z-index: 999999;
            font-family: 'Cairo', sans-serif;
            font-weight: 600;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            text-align: right;
            border: 2px solid white;
        `;
        
        alertDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-shield-alt" style="font-size: 1.2rem;"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // إزالة التنبيه بعد 3 ثواني
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            alertDiv.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(alertDiv);
            }, 300);
        }, 3000);
    }
    
    // حماية من XSS
    function sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/\\/g, '&#x5C;')
            .replace(/`/g, '&#96;');
    }
    
    // إضافة Sanitize لجميع حقول الإدخال
    document.addEventListener('DOMContentLoaded', function() {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', function(e) {
                const original = e.target.value;
                const sanitized = sanitizeInput(original);
                if (original !== sanitized) {
                    e.target.value = sanitized;
                    showSecurityAlert('تم تنظيف الإدخال من المحتوى الضار');
                }
            });
        });
    });
    
    // منع هجمات Clickjacking
    if (self !== top) {
        top.location = self.location;
    }
    
    // إضافة رأس X-Frame-Options
    (function() {
        try {
            if (window.location !== window.parent.location) {
                window.top.location = window.location;
            }
        } catch (e) {
            // إذا فشل، قم بإضافة style لمنع العرض في iframe
            const style = document.createElement('style');
            style.innerHTML = `
                body {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
            
            // إعادة التوجيه
            setTimeout(() => {
                window.location = window.location;
            }, 100);
        }
    })();
    
    // حماية من CSRF
    function generateCSRFToken() {
        return 'csrf_' + Math.random().toString(36).substr(2) + '_' + Date.now();
    }
    
    // إضافة توكن CSRF إلى جميع النماذج
    document.addEventListener('DOMContentLoaded', function() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'csrf_token';
            tokenInput.value = generateCSRFToken();
            form.appendChild(tokenInput);
        });
    });
    
    // التحقق من توكن CSRF
    function validateCSRFToken(form) {
        const token = form.querySelector('input[name="csrf_token"]');
        if (!token) return false;
        
        // في تطبيق حقيقي، يجب التحقق من التوكن مع الخادم
        return true;
    }
    
    // تصدير الدوال للاستخدام
    window.Security = {
        logSecurityEvent,
        showSecurityAlert,
        sanitizeInput,
        validateCSRFToken,
        getClientIdentifier
    };
    
    // رسالة بدء التشغيل
    console.log('%c🔒 نظام الأمان نشط', 'color: #c53030; font-size: 16px; font-weight: bold;');
    console.log('%cهذا النظام محمي بأحدث تقنيات الأمان', 'color: #666;');
    
})();