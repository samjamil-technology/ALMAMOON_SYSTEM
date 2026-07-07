// نظام التخزين والبيانات
class StorageSystem {
    constructor() {
        this.dataKey = 'mamoonMedicalData';
        this.init();
    }

    init() {
        // التأكد من وجود البيانات الأساسية
        if (!this.loadData()) {
            this.initializeEmptyData();
        }
    }

    initializeEmptyData() {
        const emptyData = {
            employees: [],
            visits: [],
            locations: [],
            settings: {
                updateInterval: 10000,
                maxAccuracy: 100,
                dailyTarget: 5
            },
            lastUpdated: new Date().toISOString()
        };
        
        this.saveData(emptyData);
        return emptyData;
    }

    loadData() {
        try {
            const data = localStorage.getItem(this.dataKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    saveData(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.dataKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            if (typeof window.mamoonSystem !== 'undefined') {
                window.mamoonSystem.showNotification('خطأ في حفظ البيانات', 'error');
            }
            return false;
        }
    }

    // إدارة المندوبين
    getEmployees() {
        const data = this.loadData();
        return data ? data.employees : [];
    }

    addEmployee(employeeData) {
        const data = this.loadData();
        if (!data) return null;

        // التحقق من صحة البريد الإلكتروني
        if (employeeData.email && !this.isValidEmail(employeeData.email)) {
            if (typeof window.mamoonSystem !== 'undefined') {
                window.mamoonSystem.showNotification('البريد الإلكتروني غير صالح', 'error');
            }
            return null;
        }

        const employee = {
            id: 'emp-' + Date.now(),
            ...employeeData,
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLocation: null,
            lastActivity: new Date().toISOString(),
            totalVisits: 0
        };
        
        data.employees.push(employee);
        const success = this.saveData(data);
        
        if (success) {
            if (typeof window.mamoonSystem !== 'undefined') {
                window.mamoonSystem.showNotification('تم إضافة المندوب بنجاح', 'success');
            }
            return employee;
        } else {
            if (typeof window.mamoonSystem !== 'undefined') {
                window.mamoonSystem.showNotification('خطأ في إضافة المندوب', 'error');
            }
            return null;
        }
    }

    updateEmployeeLocation(employeeId, location) {
        const data = this.loadData();
        if (!data) return false;

        const employee = data.employees.find(emp => emp.id === employeeId);
        if (employee) {
            employee.lastLocation = {
                ...location,
                timestamp: new Date().toISOString()
            };
            employee.lastActivity = new Date().toISOString();
            
            // حفظ الموقع في السجل
            const locationRecord = {
                id: 'loc-' + Date.now(),
                employeeId,
                ...location,
                timestamp: new Date().toISOString()
            };
            
            data.locations.push(locationRecord);
            return this.saveData(data);
        }
        
        return false;
    }

    // إدارة الزيارات
    getVisits() {
        const data = this.loadData();
        return data ? data.visits : [];
    }

    addVisit(visitData) {
        const data = this.loadData();
        if (!data) return null;

        const visit = {
            id: 'visit-' + Date.now(),
            ...visitData,
            status: 'completed',
            recordedAt: new Date().toISOString(),
            signature: 'سام جميل القدسي - أخصائي العلاقات العامة'
        };
        
        data.visits.push(visit);
        
        // تحديث إحصائيات المندوب
        const employee = data.employees.find(emp => emp.id === visitData.employeeId);
        if (employee) {
            employee.totalVisits = (employee.totalVisits || 0) + 1;
            employee.lastActivity = new Date().toISOString();
        }
        
        const success = this.saveData(data);
        
        if (success) {
            if (typeof window.mamoonSystem !== 'undefined') {
                window.mamoonSystem.showNotification('تم تسجيل الزيارة بنجاح', 'success');
            }
            return visit;
        } else {
            if (typeof window.mamoonSystem !== 'undefined') {
                window.mamoonSystem.showNotification('خطأ في تسجيل الزيارة', 'error');
            }
            return null;
        }
    }

    // الإعدادات
    getSettings() {
        const data = this.loadData();
        return data ? data.settings : {
            updateInterval: 10000,
            maxAccuracy: 100,
            dailyTarget: 5
        };
    }

    updateSettings(newSettings) {
        const data = this.loadData();
        if (!data) return false;

        data.settings = { ...data.settings, ...newSettings };
        return this.saveData(data);
    }

    // التقارير
    generateReport(period = 'today') {
        const now = new Date();
        let startDate;

        switch(period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            default:
                startDate = new Date(0);
        }

        const visits = this.getVisits().filter(visit => 
            new Date(visit.recordedAt) >= startDate
        );

        const employees = this.getEmployees();
        const activeEmployees = employees.filter(emp => 
            emp.lastActivity && 
            (new Date() - new Date(emp.lastActivity)) < 3600000
        );

        // إحصائيات متقدمة
        const stats = {
            totalVisits: visits.length,
            totalEmployees: employees.length,
            activeEmployees: activeEmployees.length,
            visitsByType: this.groupBy(visits, 'visitType'),
            visitsByEmployee: this.groupBy(visits, 'employeeId'),
            totalDistance: this.calculateTotalDistance(visits),
            averageDuration: this.calculateAverageDuration(visits),
            completionRate: this.calculateCompletionRate(visits, employees)
        };

        return {
            period,
            generatedAt: new Date().toISOString(),
            stats,
            visits,
            employees: activeEmployees,
            signature: {
                name: 'سام جميل القدسي',
                title: 'أخصائي العلاقات العامة',
                department: 'قسم العلاقات العامة',
                center: 'مركز المامون الطبي التشخيصي'
            }
        };
    }

    calculateTotalDistance(visits) {
        let total = 0;
        const visitedLocations = visits.filter(v => v.location).map(v => v.location);
        
        if (visitedLocations.length < 2) return 0;
        
        for (let i = 1; i < visitedLocations.length; i++) {
            const prev = visitedLocations[i-1];
            const curr = visitedLocations[i];
            total += this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        }
        
        return total;
    }

    calculateAverageDuration(visits) {
        if (visits.length === 0) return 0;
        const durations = visits.map(v => v.duration || 30);
        return durations.reduce((a, b) => a + b, 0) / durations.length;
    }

    calculateCompletionRate(visits, employees) {
        const settings = this.getSettings();
        const target = settings.dailyTarget * employees.length;
        return target > 0 ? Math.min((visits.length / target) * 100, 100) : 0;
    }

    // أدوات مساعدة
    groupBy(array, key) {
        if (!array || !array.length) return {};
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
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

    isValidEmail(email) {
        if (!email) return true; // السماح بفراغ إذا لم يكن مطلوباً
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // نسخ احتياطي
    backupData() {
        const data = this.loadData();
        if (!data) {
            if (typeof window.mamoonSystem !== 'undefined') {
                window.mamoonSystem.showNotification('لا توجد بيانات للنسخ الاحتياطي', 'warning');
            }
            return false;
        }

        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            a.download = `mamoon_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            if (typeof window.mamoonSystem !== 'undefined') {
                window.mamoonSystem.showNotification('تم إنشاء نسخة احتياطية بنجاح', 'success');
            }
            return true;
        } catch (error) {
            console.error('Error creating backup:', error);
            if (typeof window.mamoonSystem !== 'undefined') {
                window.mamoonSystem.showNotification('خطأ في إنشاء النسخة الاحتياطية', 'error');
            }
            return false;
        }
    }

    restoreData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (this.isValidData(data)) {
                        this.saveData(data);
                        resolve(true);
                    } else {
                        reject(new Error('بيانات غير صالحة'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
            reader.readAsText(file);
        });
    }

    isValidData(data) {
        return data && 
               Array.isArray(data.employees) && 
               Array.isArray(data.visits) && 
               Array.isArray(data.locations) && 
               data.settings;
    }

    clearAllData() {
        try {
            localStorage.removeItem(this.dataKey);
            this.initializeEmptyData();
            if (typeof window.mamoonSystem !== 'undefined') {
                window.mamoonSystem.showNotification('تم مسح جميع البيانات بنجاح', 'success');
            }
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            if (typeof window.mamoonSystem !== 'undefined') {
                window.mamoonSystem.showNotification('خطأ في مسح البيانات', 'error');
            }
            return false;
        }
    }

    // الحصول على بيانات محددة
    getEmployeeById(employeeId) {
        const employees = this.getEmployees();
        return employees.find(emp => emp.id === employeeId);
    }

    getVisitsByEmployee(employeeId) {
        const visits = this.getVisits();
        return visits.filter(visit => visit.employeeId === employeeId);
    }

    getTodayVisits() {
        const today = new Date().toDateString();
        const visits = this.getVisits();
        return visits.filter(visit => 
            new Date(visit.recordedAt).toDateString() === today
        );
    }

    // تحديث بيانات المندوب
    updateEmployee(employeeId, updates) {
        const data = this.loadData();
        if (!data) return false;

        const employeeIndex = data.employees.findIndex(emp => emp.id === employeeId);
        if (employeeIndex !== -1) {
            data.employees[employeeIndex] = { ...data.employees[employeeIndex], ...updates };
            return this.saveData(data);
        }
        return false;
    }

    // حذف المندوب
    deleteEmployee(employeeId) {
        const data = this.loadData();
        if (!data) return false;

        const employeeIndex = data.employees.findIndex(emp => emp.id === employeeId);
        if (employeeIndex !== -1) {
            data.employees.splice(employeeIndex, 1);
            
            // حذف زيارات المندوب أيضاً
            data.visits = data.visits.filter(visit => visit.employeeId !== employeeId);
            
            return this.saveData(data);
        }
        return false;
    }
}

// إنشاء نظام التخزين
const storageSystem = new StorageSystem();
window.storageSystem = storageSystem;

// دوال مساعدة إضافية
window.isValidEmail = (email) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};