// نظام التتبع والموقع
class TrackingSystem {
    constructor() {
        this.watchId = null;
        this.isTracking = false;
        this.currentLocation = null;
        this.callbacks = new Map();
        this.trackingOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        
        this.init();
    }

    init() {
        console.log('✅ نظام التتبع جاهز للعمل');
        this.checkPermissions();
    }

    // التحقق من الصلاحيات
    async checkPermissions() {
        if (!navigator.geolocation) {
            console.warn('⚠️ المتصفح لا يدعم تحديد الموقع');
            return false;
        }

        try {
            if (navigator.permissions && navigator.permissions.query) {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                console.log('📍 حالة صلاحيات الموقع:', result.state);
                return result.state === 'granted';
            }
            return true;
        } catch (error) {
            console.error('Error checking permissions:', error);
            return true;
        }
    }

    // الحصول على الموقع الحالي
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                const error = new Error('المتصفح لا يدعم تحديد الموقع');
                this.handleLocationError(error);
                reject(error);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = this.formatPosition(position);
                    this.currentLocation = location;
                    resolve(location);
                },
                (error) => {
                    const formattedError = this.handleLocationError(error);
                    reject(formattedError);
                },
                this.trackingOptions
            );
        });
    }

    // بدء التتبع المستمر
    startTracking(callback, options = {}) {
        if (this.isTracking) {
            mamoonSystem.showNotification('التتبع يعمل بالفعل', 'warning');
            return this.watchId;
        }

        if (!navigator.geolocation) {
            const error = new Error('المتصفح لا يدعم التتبع المباشر');
            this.handleLocationError(error);
            return null;
        }

        const trackingOptions = {
            ...this.trackingOptions,
            ...options
        };

        try {
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const location = this.formatPosition(position);
                    this.currentLocation = location;
                    
                    // استدعاء callback إذا تم توفيره
                    if (callback && typeof callback === 'function') {
                        callback(location);
                    }
                    
                    // استدعاء جميع callbacks المسجلة
                    this.callbacks.forEach(cb => {
                        if (typeof cb === 'function') {
                            cb(location);
                        }
                    });
                },
                (error) => {
                    this.handleLocationError(error);
                },
                trackingOptions
            );

            this.isTracking = true;
            mamoonSystem.showNotification('تم بدء التتبع المباشر', 'success');
            return this.watchId;
            
        } catch (error) {
            this.handleLocationError(error);
            return null;
        }
    }

    // إيقاف التتبع
    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        this.isTracking = false;
        this.currentLocation = null;
        mamoonSystem.showNotification('تم إيقاف التتبع', 'warning');
    }

    // تسجيل callback للتتبع
    onLocationUpdate(callbackId, callback) {
        if (typeof callback === 'function') {
            this.callbacks.set(callbackId, callback);
        }
    }

    // إلغاء تسجيل callback
    offLocationUpdate(callbackId) {
        this.callbacks.delete(callbackId);
    }

    // تنسيق بيانات الموقع
    formatPosition(position) {
        return {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || null,
            altitude: position.coords.altitude || null,
            altitudeAccuracy: position.coords.altitudeAccuracy || null,
            timestamp: new Date().toISOString()
        };
    }

    // معالجة أخطاء الموقع
    handleLocationError(error) {
        let message = 'خطأ في التتبع: ';
        let notificationType = 'error';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message += 'يجب منح الإذن لتحديد الموقع';
                notificationType = 'error';
                break;
            case error.POSITION_UNAVAILABLE:
                message += 'خدمة الموقع غير متاحة';
                notificationType = 'warning';
                break;
            case error.TIMEOUT:
                message += 'مهلة طلب الموقع انتهت';
                notificationType = 'warning';
                break;
            default:
                message += 'خطأ غير متوقع';
                notificationType = 'error';
        }
        
        console.error('📍 Location error:', error);
        mamoonSystem.showNotification(message, notificationType);
        
        return new Error(message);
    }

    // التحقق من دقة الموقع
    isLocationAccurate(location, maxAccuracy = 100) {
        return location && location.accuracy <= maxAccuracy;
    }

    // حساب المسافة بين موقعين
    calculateDistance(location1, location2) {
        if (!location1 || !location2) return 0;
        
        const R = 6371; // نصف قطر الأرض بالكيلومتر
        const dLat = this.toRad(location2.lat - location1.lat);
        const dLon = this.toRad(location2.lng - location1.lng);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(location1.lat)) * Math.cos(this.toRad(location2.lat)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI/180);
    }

    // الحصول على العنوان من الإحداثيات
    async getAddressFromCoordinates(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`
            );
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            return data.display_name || 'عنوان غير معروف';
        } catch (error) {
            console.error('Error getting address:', error);
            return 'تعذر الحصول على العنوان';
        }
    }

    // تحديث موقع المندوب في النظام
    async updateEmployeeLocation(employeeId, location) {
        if (!this.isLocationAccurate(location)) {
            console.warn(`📍 دقة الموقع منخفضة: ${Math.round(location.accuracy)}م`);
            return false;
        }

        try {
            const success = storageSystem.updateEmployeeLocation(employeeId, location);
            
            if (success) {
                console.log('✅ تم تحديث موقع المندوب:', employeeId, location);
                return true;
            } else {
                console.error('❌ فشل في تحديث موقع المندوب:', employeeId);
                return false;
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث موقع المندوب:', error);
            return false;
        }
    }

    // بدء التتبع للمندوب مع تحديث تلقائي
    startEmployeeTracking(employeeId, options = {}) {
        return this.startTracking((location) => {
            // تحديث موقع المندوب في النظام
            this.updateEmployeeLocation(employeeId, location);
            
            // استدعاء callback إضافي إذا تم توفيره
            if (options.onLocationUpdate && typeof options.onLocationUpdate === 'function') {
                options.onLocationUpdate(location);
            }
        }, options);
    }

    // الحصول على الموقع الحالي مع تحديث النظام
    async getAndUpdateEmployeeLocation(employeeId) {
        try {
            const location = await this.getCurrentLocation();
            if (!location) {
                throw new Error('فشل في الحصول على الموقع');
            }

            const success = await this.updateEmployeeLocation(employeeId, location);
            
            if (success) {
                mamoonSystem.showNotification('تم تحديث الموقع بنجاح', 'success');
                return location;
            } else {
                throw new Error('فشل في تحديث الموقع في النظام');
            }
        } catch (error) {
            mamoonSystem.showNotification(error.message, 'error');
            throw error;
        }
    }

    // طلب صلاحيات الموقع
    async requestLocationPermission() {
        try {
            const location = await this.getCurrentLocation();
            return true;
        } catch (error) {
            if (error.code === error.PERMISSION_DENIED) {
                mamoonSystem.showNotification('يجب منح الإذن لتحديد الموقع لاستخدام التتبع', 'error');
            }
            return false;
        }
    }

    // الحصول على حالة التتبع
    getTrackingStatus() {
        return {
            isTracking: this.isTracking,
            watchId: this.watchId,
            currentLocation: this.currentLocation,
            callbacksCount: this.callbacks.size
        };
    }

    // إعادة تعيين النظام
    reset() {
        this.stopTracking();
        this.callbacks.clear();
        this.currentLocation = null;
        console.log('✅ نظام التتبع تم إعادة تعيينه');
    }

    // تحسين دقة الموقع
    async getAccurateLocation(maxAttempts = 3, targetAccuracy = 50) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const location = await this.getCurrentLocation();
                
                if (this.isLocationAccurate(location, targetAccuracy)) {
                    console.log(`📍 تم الحصول على موقع دقيق في المحاولة ${attempt}`);
                    return location;
                } else {
                    console.warn(`📍 دقة الموقع غير كافية في المحاولة ${attempt}: ${Math.round(location.accuracy)}م`);
                    
                    if (attempt < maxAttempts) {
                        // الانتظار قبل المحاولة التالية
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            } catch (error) {
                console.error(`📍 فشل في المحاولة ${attempt}:`, error);
                
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        
        throw new Error('تعذر الحصول على موقع دقيق بعد عدة محاولات');
    }
}

// إنشاء نظام التتبع
const trackingSystem = new TrackingSystem();
window.trackingSystem = trackingSystem;