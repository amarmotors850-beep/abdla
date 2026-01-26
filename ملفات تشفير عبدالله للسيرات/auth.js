// نظام المصادقة والإحالات

(function() {
    'use strict';
    
    // تخزين البيانات المحلي
    let siteData = null;
    let currentUser = null;
    
    // تهيئة نظام المصادقة
    async function initAuth() {
        try {
            // تحميل بيانات الموقع
            await loadSiteData();
            
            // التحقق من وجود مستخدم مسجل دخول
            checkUserLogin();
            
            // تتبع الإحالات
            trackReferral();
            
        } catch (error) {
            console.error('Error initializing auth system:', error);
        }
    }
    
    // تحميل بيانات الموقع
    async function loadSiteData() {
        try {
            if (window.gitHubSync && window.gitHubSync.fetch) {
                siteData = await window.gitHubSync.fetch();
            } else {
                const savedData = localStorage.getItem('siteData');
                if (savedData) {
                    siteData = JSON.parse(savedData);
                }
            }
            
            if (!siteData) {
                siteData = await getDefaultData();
            }
            
        } catch (error) {
            console.error('Error loading site data:', error);
            siteData = await getDefaultData();
        }
    }
    
    // البيانات الافتراضية
    async function getDefaultData() {
        return {
            users: [],
            settings: {
                referralSystem: true,
                pointsPerVisit: 1,
                referralRewards: true,
                preventDuplicateVisits: true,
                visitCooldown: 24,
                trackIP: true
            }
        };
    }
    
    // التحقق من تسجيل دخول المستخدم
    function checkUserLogin() {
        const userToken = localStorage.getItem('userToken');
        const userData = localStorage.getItem('userData');
        
        if (userToken && userData) {
            try {
                currentUser = JSON.parse(userData);
                updateUserInterface();
            } catch (error) {
                console.error('Error parsing user data:', error);
                logout();
            }
        }
    }
    
    // تحديث واجهة المستخدم
    function updateUserInterface() {
        const loginBtn = document.getElementById('loginBtn');
        const userProfile = document.getElementById('userProfile');
        const userName = document.getElementById('userName');
        
        if (currentUser && loginBtn && userProfile && userName) {
            loginBtn.style.display = 'none';
            userProfile.style.display = 'block';
            userName.textContent = currentUser.name;
            
            // تحديث لوحة التحكم إذا كانت موجودة
            updateDashboard();
        } else if (loginBtn) {
            loginBtn.style.display = 'block';
            if (userProfile) userProfile.style.display = 'none';
        }
    }
    
    // تسجيل الدخول
    async function login(email, password) {
        try {
            // البحث عن المستخدم
            const user = siteData.users?.find(u => 
                u.email === email && u.password === password
            );
            
            if (user) {
                // تحديث بيانات المستخدم
                currentUser = user;
                currentUser.lastLogin = new Date().toISOString();
                
                // حفظ في التخزين المحلي
                localStorage.setItem('userToken', user.id);
                localStorage.setItem('userData', JSON.stringify(currentUser));
                
                // تحديث الواجهة
                updateUserInterface();
                
                // حفظ البيانات
                await saveSiteData();
                
                return {
                    success: true,
                    user: currentUser
                };
            } else {
                return {
                    success: false,
                    message: 'بيانات الدخول غير صحيحة'
                };
            }
            
        } catch (error) {
            console.error('Error during login:', error);
            return {
                success: false,
                message: 'حدث خطأ أثناء تسجيل الدخول'
            };
        }
    }
    
    // تسجيل مستخدم جديد
    async function register(userData) {
        try {
            // التحقق من عدم وجود مستخدم بنفس البريد
            const existingUser = siteData.users?.find(u => u.email === userData.email);
            if (existingUser) {
                return {
                    success: false,
                    message: 'البريد الإلكتروني مسجل مسبقاً'
                };
            }
            
            // إنشاء معرف فريد
            const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // إنشاء كود إحالة فريد
            const referralCode = generateReferralCode();
            
            // إنشاء المستخدم الجديد
            const newUser = {
                id: userId,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                referralCode: referralCode,
                views: 0,
                referrals: 0,
                points: 0,
                rank: 'مبتدئ',
                active: true,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                lastVisit: new Date().toISOString()
            };
            
            // إضافة المستخدم إلى البيانات
            if (!siteData.users) siteData.users = [];
            siteData.users.push(newUser);
            
            // تسجيل الدخول تلقائياً
            currentUser = newUser;
            localStorage.setItem('userToken', userId);
            localStorage.setItem('userData', JSON.stringify(newUser));
            
            // تحديث الواجهة
            updateUserInterface();
            
            // حفظ البيانات
            await saveSiteData();
            
            return {
                success: true,
                user: newUser
            };
            
        } catch (error) {
            console.error('Error during registration:', error);
            return {
                success: false,
                message: 'حدث خطأ أثناء إنشاء الحساب'
            };
        }
    }
    
    // تسجيل الخروج
    function logout() {
        currentUser = null;
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        updateUserInterface();
        
        // إعادة توجيه إلى الصفحة الرئيسية
        window.location.hash = '';
        
        return {
            success: true,
            message: 'تم تسجيل الخروج بنجاح'
        };
    }
    
    // تحديث لوحة التحكم
    function updateDashboard() {
        if (!currentUser) return;
        
        // تحديث الإحصائيات
        const userViews = document.getElementById('userViews');
        const userReferrals = document.getElementById('userReferrals');
        const userPoints = document.getElementById('userPoints');
        const userRank = document.getElementById('userRank');
        const referralLink = document.getElementById('referralLink');
        
        if (userViews) userViews.textContent = currentUser.views || 0;
        if (userReferrals) userReferrals.textContent = currentUser.referrals || 0;
        if (userPoints) userPoints.textContent = currentUser.points || 0;
        if (userRank) userRank.textContent = currentUser.rank || 'مبتدئ';
        
        if (referralLink) {
            const link = `${window.location.origin}${window.location.pathname}?ref=${currentUser.id}`;
            referralLink.textContent = link;
            
            // إضافة زر النسخ
            const copyBtn = document.getElementById('copyReferralBtn');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(link).then(() => {
                        showToast('تم نسخ الرابط بنجاح');
                    });
                };
            }
        }
        
        // تحديث التحديات
        updateChallenges();
    }
    
    // تحديث التحديات
    function updateChallenges() {
        const challengesContainer = document.getElementById('challengesContainer');
        if (!challengesContainer || !siteData.challenges) return;
        
        const userReferrals = currentUser?.referrals || 0;
        
        const challengesHtml = siteData.challenges.map(challenge => {
            const progress = Math.min((userReferrals / challenge.required) * 100, 100);
            const completed = userReferrals >= challenge.required;
            
            return `
                <div class="challenge-item" style="
                    background: ${completed ? '#c6f6d5' : '#fed7d7'};
                    padding: 1rem;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                    border: 2px solid ${completed ? '#38a169' : '#c53030'};
                ">
                    <h4 style="margin-bottom: 0.5rem; color: var(--secondary);">
                        ${challenge.title?.ar || challenge.title}
                    </h4>
                    <p style="color: var(--dark-gray); margin-bottom: 1rem; font-size: 0.9rem;">
                        ${challenge.description?.ar || challenge.description}
                    </p>
                    <div style="background: #e2e8f0; height: 10px; border-radius: 5px; margin-bottom: 1rem; overflow: hidden;">
                        <div style="
                            background: ${completed ? '#38a169' : '#c53030'};
                            height: 100%;
                            width: ${progress}%;
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.9rem; color: var(--dark-gray);">
                            ${userReferrals}/${challenge.required} ${'إحالة'}
                        </span>
                        <span style="
                            background: ${completed ? '#38a169' : '#c53030'};
                            color: white;
                            padding: 5px 10px;
                            border-radius: 20px;
                            font-size: 0.8rem;
                            font-weight: 600;
                        ">
                            ${challenge.reward}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        challengesContainer.innerHTML = challengesHtml;
    }
    
    // تتبع الإحالات
    function trackReferral() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const refCode = urlParams.get('ref');
            
            if (!refCode) return;
            
            // البحث عن المستخدم الذي قام بالإحالة
            const referrer = siteData.users?.find(u => u.id === refCode || u.referralCode === refCode);
            if (!referrer) return;
            
            // التحقق من إعدادات الحماية من الاحتيال
            const settings = siteData.settings || {};
            const now = new Date();
            
            // التحقق من منع الزيارات المتكررة
            if (settings.preventDuplicateVisits) {
                const lastVisit = localStorage.getItem('lastReferralVisit');
                const visitCooldown = (settings.visitCooldown || 24) * 60 * 60 * 1000; // تحويل إلى مللي ثانية
                
                if (lastVisit && (now - new Date(lastVisit)) < visitCooldown) {
                    console.log('زيارة سريعة جداً، تم تجاهلها');
                    return;
                }
            }
            
            // التحقق من تتبع IP
            if (settings.trackIP) {
                const visitorIP = localStorage.getItem('visitorIP') || '';
                // في تطبيق حقيقي، هنا يتم الحصول على IP الزائر من الخادم
            }
            
            // تحديث إحصائيات المستخدم الذي قام بالإحالة
            referrer.views = (referrer.views || 0) + 1;
            
            // إذا كان هناك مستخدم مسجل دخول، إضافة إحالة
            if (currentUser && currentUser.id !== referrer.id) {
                referrer.referrals = (referrer.referrals || 0) + 1;
                referrer.points = (referrer.points || 0) + (settings.pointsPerVisit || 1);
                
                // تحديث نقاط المستخدم الحالي أيضاً
                currentUser.points = (currentUser.points || 0) + 1;
                
                // حفظ بيانات المستخدم الحالي
                localStorage.setItem('userData', JSON.stringify(currentUser));
            }
            
            // تحديث آخر زيارة
            referrer.lastVisit = now.toISOString();
            
            // حفظ وقت الزيارة الأخير
            localStorage.setItem('lastReferralVisit', now.toISOString());
            
            // حفظ البيانات
            saveSiteData();
            
        } catch (error) {
            console.error('Error tracking referral:', error);
        }
    }
    
    // توليد كود إحالة فريد
    function generateReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    // حفظ بيانات الموقع
    async function saveSiteData() {
        try {
            if (window.gitHubSync && window.gitHubSync.push) {
                await window.gitHubSync.push(siteData, `تحديث بيانات المستخدمين - ${new Date().toLocaleString('ar-SA')}`);
            } else {
                localStorage.setItem('siteData', JSON.stringify(siteData));
            }
        } catch (error) {
            console.error('Error saving site data:', error);
        }
    }
    
    // عرض إشعار
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 1rem 2rem;
            background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#3182ce'};
            color: white;
            border-radius: 10px;
            z-index: 10000;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
    
    // إضافة أنماط الـ Toast
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(-50%) translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
            to {
                transform: translateX(-50%) translateY(-100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // جعل الدوال متاحة في كائن window
    window.authSystem = {
        init: initAuth,
        login: login,
        register: register,
        logout: logout,
        updateDashboard: updateDashboard,
        trackReferral: trackReferral,
        getCurrentUser: () => currentUser,
        setCurrentUser: (user) => { currentUser = user; updateUserInterface(); }
    };
    
    // التهيئة عند تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
    
    console.log('✅ نظام المصادقة والإحالات جاهز للاستخدام');
    
})();