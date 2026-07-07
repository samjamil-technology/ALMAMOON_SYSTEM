// نظام مركز المامون الطبي التشخيصي
class MamoonMedicalSystem {
    constructor() {
        this.currentUser = null;
        this.settings = {
            updateInterval: 10000,
            maxAccuracy: 100,
            dailyTarget: 5,
            mapCenter: [33.5138, 36.2765], // إحداثيات دمشق
            mapZoom: 12
        };
        
        this.hasUnsavedChanges = false;
        this.init();
    }

    init() {
        console.log('✅ نظام مركز المامون الطبي التشخيصي جاهز للعمل');
        this.checkAuthentication();
        
        // تهيئة بيانات تجريبية إذا لزم
        if (this.shouldInitializeSampleData()) {
            this.initializeSampleData();
        }

        // إعداد مستمعين للأحداث
        this.setupEventListeners();
    }

    setupEventListeners() {
        // مراقبة اتصال الإنترنت
        if (window.utils) {
            window.utils.onOnline(() => {
                this.showNotification('تم استعادة الاتصال بالإنترنت', 'success');
            });
            
            window.utils.onOffline(() => {
                this.showNotification('فقدان الاتصال بالإنترنت', 'warning');
            });
        }

        // منع إغلاق الصفحة إذا كان هناك عمليات غير محفوظة
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'لديك تغييرات غير محفوظة. هل تريد المغادرة بدون حفظ؟';
            }
        });
    }

    shouldInitializeSampleData() {
        try {
            const data = localStorage.getItem('mamoonMedicalData');
            return !data || (JSON.parse(data).employees && JSON.parse(data).employees.length === 0);
        } catch (error) {
            console.error('Error checking sample data:', error);
            return true;
        }
    }

    // بيانات أولية للتجربة
    initializeSampleData() {
        const sampleData = {
            employees: [
                {
                    id: 'emp-1',
                    name: 'أحمد محمد',
                    email: 'ahmed@mamoonmedical.com',
                    phone: '+963-111-1111',
                    area: 'دمشق',
                    title: 'مندوب ميداني',
                    department: 'قسم العلاقات العامة',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLocation: null,
                    lastActivity: new Date().toISOString(),
                    totalVisits: 3
                },
                {
                    id: 'emp-2',
                    name: 'محمد علي',
                    email: 'mohammed@mamoonmedical.com', 
                    phone: '+963-222-2222',
                    area: 'ريف دمشق',
                    title: 'مندوب ميداني',
                    department: 'قسم العلاقات العامة',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLocation: {
                        lat: 33.5150,
                        lng: 36.2780,
                        accuracy: 20,
                        timestamp: new Date().toISOString()
                    },
                    lastActivity: new Date().toISOString(),
                    totalVisits: 2
                }
            ],
            visits: [
                {
                    id: 'visit-1',
                    clientName: 'مستشفى المواساة',
                    visitType: 'متابعة دورية',
                    contactPerson: 'د. وائل أحمد',
                    duration: 45,
                    notes: 'متابعة اتفاقية التعاون والتدريب',
                    employeeId: 'emp-1',
                    employeeName: 'أحمد محمد',
                    location: {
                        lat: 33.5138,
                        lng: 36.2765,
                        accuracy: 15,
                        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                    },
                    status: 'completed',
                    recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    signature: 'سام جميل القدسي - أخصائي العلاقات العامة'
                },
                {
                    id: 'visit-2',
                    clientName: 'مستشفى الأسد الجامعي',
                    visitType: 'تسليم عينات',
                    contactPerson: 'م. علي حسن',
                    duration: 30,
                    notes: 'تسليم عينات طبية للتحليل',
                    employeeId: 'emp-2',
                    employeeName: 'محمد علي',
                    location: {
                        lat: 33.5150,
                        lng: 36.2780,
                        accuracy: 20,
                        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
                    },
                    status: 'completed',
                    recordedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    signature: 'سام جميل القدسي - أخصائي العلاقات العامة'
                }
            ],
            locations: [],
            settings: this.settings,
            lastUpdated: new Date().toISOString()
        };

        try {
            localStorage.setItem('mamoonMedicalData', JSON.stringify(sampleData));
            console.log('✅ تم تهيئة البيانات التجريبية');
        } catch (error) {
            console.error('❌ Error initializing sample data:', error);
        }
    }

    // التحقق من المصادقة
    checkAuthentication() {
        try {
            const savedUser = localStorage.getItem('currentUser');
            
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                
                // إذا كان المستخدم في صفحة الدخول، قم بتوجيهه
                if ((window.location.pathname.endsWith('index.html') || 
                    window.location.pathname.endsWith('/')) && this.currentUser) {
                    this.redirectToDashboard();
                }
            } else if (!window.location.pathname.endsWith('index.html') && 
                      !window.location.pathname.endsWith('/')) {
                // إذا لم يكن مسجلاً الدخول وليس في صفحة الدخول، قم بتوجيهه
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            // في حالة الخطأ، توجه إلى صفحة الدخول
            if (!window.location.pathname.endsWith('index.html') && 
                !window.location.pathname.endsWith('/')) {
                window.location.href = 'index.html';
            }
        }
    }

    redirectToDashboard() {
        if (this.currentUser && this.currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else if (this.currentUser && this.currentUser.role === 'employee') {
            window.location.href = 'employee.html';
        }
    }

    // الإشعارات
    showNotification(message, type = 'info', duration = 5000) {
        // إزالة أي إشعارات سابقة
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // إنشاء الإشعار الجديد
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${icons[type] || 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // إضافة حدث الإغلاق
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                notification.remove();
            });
        }

        // الإزالة التلقائية
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }

        // إضافة تأثير الظهور
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);

        return notification;
    }

    // أدوات مساعدة
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // نصف قطر الأرض بالكيلومتر
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI/180);
    }

    groupBy(array, key) {
        if (!array || !key) return {};
        
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    // التحقق من صلاحية البيانات
    validateUserData(userData) {
        const errors = [];
        
        if (!userData.username || userData.username.trim().length < 3) {
            errors.push('اسم المستخدم يجب أن يكون至少 3 أحرف');
        }
        
        if (!userData.password || userData.password.length < 6) {
            errors.push('كلمة المرور يجب أن تكون至少 6 أحرف');
        }
        
        if (!userData.role || !['admin', 'employee'].includes(userData.role)) {
            errors.push('نوع المستخدم غير صالح');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // تسجيل الخروج
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showNotification('تم تسجيل الخروج بنجاح', 'info');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    // التحقق من الصلاحيات
    hasPermission(requiredRole) {
        if (!this.currentUser) return false;
        
        if (requiredRole === 'admin') {
            return this.currentUser.role === 'admin';
        }
        
        if (requiredRole === 'employee') {
            return this.currentUser.role === 'employee' || this.currentUser.role === 'admin';
        }
        
        return true;
    }

    // تحميل الإعدادات
    loadSettings() {
        try {
            const settings = localStorage.getItem('mamoonSettings');
            if (settings) {
                this.settings = { ...this.settings, ...JSON.parse(settings) };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    // حفظ الإعدادات
    saveSettings() {
        try {
            localStorage.setItem('mamoonSettings', JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    // تنظيف البيانات القديمة
    cleanupOldData(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        try {
            const data = JSON.parse(localStorage.getItem('mamoonMedicalData'));
            if (data && data.visits) {
                data.visits = data.visits.filter(visit => 
                    new Date(visit.recordedAt) > cutoffDate
                );
                localStorage.setItem('mamoonMedicalData', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error cleaning up old data:', error);
        }
    }

    // الحصول على إحصائيات سريعة
    getQuickStats() {
        try {
            const data = JSON.parse(localStorage.getItem('mamoonMedicalData'));
            if (!data) return null;
            
            const today = new Date().toDateString();
            const todayVisits = data.visits.filter(visit => 
                new Date(visit.recordedAt).toDateString() === today
            );
            
            const activeEmployees = data.employees.filter(emp => 
                emp.lastActivity && 
                (new Date() - new Date(emp.lastActivity)) < 3600000
            );
            
            return {
                totalEmployees: data.employees.length,
                activeEmployees: activeEmployees.length,
                totalVisits: data.visits.length,
                todayVisits: todayVisits.length,
                lastUpdate: data.lastUpdated
            };
        } catch (error) {
            console.error('Error getting quick stats:', error);
            return null;
        }
    }
}

// إنشاء نموذج النظام
const mamoonSystem = new MamoonMedicalSystem();

// جعل النظام متاحاً globally
window.mamoonSystem = mamoonSystem;

// دوال مساعدة إضافية للتوافق
if (typeof window.formatDate === 'undefined') {
    window.formatDate = (date) => {
        if (!date) return 'غير محدد';
        const d = new Date(date);
        return d.toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
}

if (typeof window.formatTime === 'undefined') {
    window.formatTime = (date) => {
        if (!date) return 'غير محدد';
        const d = new Date(date);
        return d.toLocaleString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
}

if (typeof window.formatDuration === 'undefined') {
    window.formatDuration = (minutes) => {
        if (!minutes) return '0 دقيقة';
        if (minutes < 60) {
            return `${minutes} دقيقة`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours} س ${mins} د` : `${hours} ساعة`;
        }
    };
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 نظام مركز المامون الطبي التشخيصي محمل وجاهز للعمل');
    
    // التحقق من اتصال الإنترنت
    if (!navigator.onLine) {
        mamoonSystem.showNotification('أنت غير متصل بالإنترنت', 'warning');
    }
});