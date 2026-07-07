// أدوات مساعدة
class Utils {
    constructor() {
        this.init();
    }

    init() {
        this.extendDatePrototype();
        this.setupGlobalFunctions();
        console.log('✅ نظام الأدوات المساعدة جاهز للعمل');
    }

    extendDatePrototype() {
        // إضافة دوال مفيدة للـ Date
        if (!Date.prototype.toArabicDate) {
            Date.prototype.toArabicDate = function() {
                const options = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Damascus'
                };
                return this.toLocaleString('ar-SA', options);
            };
        }

        if (!Date.prototype.toArabicTime) {
            Date.prototype.toArabicTime = function() {
                const options = {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Damascus'
                };
                return this.toLocaleString('ar-SA', options);
            };
        }

        if (!Date.prototype.toArabicDateOnly) {
            Date.prototype.toArabicDateOnly = function() {
                const options = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Asia/Damascus'
                };
                return this.toLocaleString('ar-SA', options);
            };
        }
    }

    setupGlobalFunctions() {
        // جعل الدوال متاحة globally
        window.formatDate = (date) => this.formatDate(date);
        window.formatTime = (date) => this.formatTime(date);
        window.formatDuration = (minutes) => this.formatDuration(minutes);
        window.downloadCSV = (data, filename) => this.downloadCSV(data, filename);
        window.isValidEmail = (email) => this.isValidEmail(email);
        window.isValidPhone = (phone) => this.isValidPhone(phone);
    }

    // تنسيق التاريخ
    formatDate(date) {
        if (!date) return 'غير محدد';
        
        try {
            const d = new Date(date);
            return d.toArabicDateOnly();
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'تاريخ غير صالح';
        }
    }

    // تنسيق الوقت
    formatTime(date) {
        if (!date) return 'غير محدد';
        
        try {
            const d = new Date(date);
            return d.toArabicTime();
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'وقت غير صالح';
        }
    }

    // تنسيق التاريخ والوقت معاً
    formatDateTime(date) {
        if (!date) return 'غير محدد';
        
        try {
            const d = new Date(date);
            return d.toArabicDate();
        } catch (error) {
            console.error('Error formatting datetime:', error);
            return 'تاريخ ووقت غير صالحين';
        }
    }

    // تنسيق المسافة
    formatDistance(km) {
        if (km === 0 || !km) return '0 كم';
        return km.toFixed(1) + ' كم';
    }

    // تنسيق المدة
    formatDuration(minutes) {
        if (!minutes || minutes === 0) return '0 دقيقة';
        
        if (minutes < 60) {
            return `${minutes} دقيقة`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours} س ${mins} د` : `${hours} ساعة`;
        }
    }

    // تحميل CSV
    downloadCSV(data, filename) {
        if (!data || data.length === 0) {
            mamoonSystem.showNotification('لا توجد بيانات للتصدير', 'warning');
            return;
        }
        
        try {
            const headers = Object.keys(data[0]);
            const csvContent = [
                '\uFEFF' + headers.join(','), // BOM for UTF-8
                ...data.map(row => 
                    headers.map(header => {
                        const value = row[header] || '';
                        // تنظيف النص وإضافة quotes
                        const cleanedValue = String(value).replace(/"/g, '""');
                        return `"${cleanedValue}"`;
                    }).join(',')
                )
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            mamoonSystem.showNotification('تم تصدير البيانات بنجاح', 'success');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            mamoonSystem.showNotification('خطأ في تصدير البيانات', 'error');
        }
    }

    // تصدير تقرير PDF (مبسط)
    exportReportToPDF(report, title = 'تقرير') {
        try {
            // إنشاء محتوى HTML للطباعة
            const printContent = `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    <style>
                        body { 
                            font-family: 'Tajawal', sans-serif; 
                            padding: 20px;
                            color: #333;
                            line-height: 1.6;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 30px;
                            border-bottom: 2px solid #2563eb;
                            padding-bottom: 20px;
                        }
                        .stats { 
                            display: grid;
                            grid-template-columns: repeat(4, 1fr);
                            gap: 15px;
                            margin: 20px 0;
                        }
                        .stat-item {
                            text-align: center;
                            padding: 15px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            background: #f8fafc;
                        }
                        .signature {
                            margin-top: 50px;
                            text-align: left;
                            border-top: 2px solid #333;
                            padding-top: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 20px 0;
                            font-size: 14px;
                        }
                        th, td {
                            padding: 12px;
                            text-align: right;
                            border-bottom: 1px solid #ddd;
                        }
                        th {
                            background-color: #f8fafc;
                            font-weight: bold;
                        }
                        @media print {
                            body { padding: 0; }
                            .header { border-bottom-color: #000; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${title}</h1>
                        <h2>مركز المامون الطبي التشخيصي</h2>
                        <p>قسم العلاقات العامة</p>
                        <p>تاريخ التقرير: ${this.formatDate(new Date())}</p>
                    </div>
                    
                    <div id="report-content">
                        ${this.generateReportHTML(report)}
                    </div>
                    
                    <div class="signature">
                        <strong>توقيع:</strong><br>
                        سام جميل القدسي<br>
                        أخصائي العلاقات العامة<br>
                        مركز المامون الطبي التشخيصي
                    </div>
                </body>
                </html>
            `;

            // فتح نافذة الطباعة
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
                // printWindow.close(); // يمكن إغلاق النافذة بعد الطباعة
            }, 500);
        } catch (error) {
            console.error('Error generating PDF:', error);
            mamoonSystem.showNotification('خطأ في إنشاء التقرير', 'error');
        }
    }

    generateReportHTML(report) {
        let html = `
            <div class="stats">
                <div class="stat-item">
                    <h3>${report.stats.totalVisits}</h3>
                    <p>إجمالي الزيارات</p>
                </div>
                <div class="stat-item">
                    <h3>${report.stats.activeEmployees}</h3>
                    <p>مندوبين نشطين</p>
                </div>
                <div class="stat-item">
                    <h3>${report.stats.totalDistance.toFixed(1)} كم</h3>
                    <p>المسافة الإجمالية</p>
                </div>
                <div class="stat-item">
                    <h3>${Math.round(report.stats.averageDuration)} د</h3>
                    <p>متوسط المدة</p>
                </div>
            </div>
        `;

        // إضافة جدول المندوبين إذا كان موجوداً
        if (report.employees && report.employees.length > 0) {
            html += `
                <h3>المندوبين النشطين</h3>
                <table>
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>آخر نشاط</th>
                            <th>الزيارات</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            report.employees.forEach(emp => {
                const status = emp.lastLocation ? 'نشط' : 'غير نشط';
                html += `
                    <tr>
                        <td>${emp.name}</td>
                        <td>${this.formatTime(emp.lastActivity)}</td>
                        <td>${emp.totalVisits || 0}</td>
                        <td>${status}</td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
        }

        return html;
    }

    // التحقق من صحة البريد الإلكتروني
    isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // التحقق من صحة رقم الهاتف
    isValidPhone(phone) {
        if (!phone) return false;
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        return phoneRegex.test(phone);
    }

    // تقييد الإدخال للأرقام فقط
    restrictToNumbers(input) {
        if (!input) return;
        
        input.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // إضافة separator للأرقام
    formatNumber(number) {
        if (!number && number !== 0) return '0';
        return new Intl.NumberFormat('ar-SA').format(number);
    }

    // إنشاء رسم بياني مبسط
    createSimpleBarChart(data, containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        const { width = '100%', height = '200px', color = '#2563eb' } = options;

        let html = `<div style="width: ${width}; height: ${height}; display: flex; align-items: end; gap: 10px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background: white;">`;
        
        const maxValue = Math.max(...data.map(item => item.value));
        
        if (maxValue > 0) {
            data.forEach(item => {
                const heightPercent = (item.value / maxValue) * 100;
                html += `
                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                        <div style="background: ${color}; height: ${heightPercent}%; width: 30px; border-radius: 4px 4px 0 0; transition: height 0.5s ease;"></div>
                        <div style="margin-top: 8px; font-size: 12px; text-align: center;">${item.label}</div>
                    </div>
                `;
            });
        } else {
            html += `<div style="text-align: center; width: 100%; color: #6b7280;">لا توجد بيانات</div>`;
        }
        
        html += `</div>`;
        container.innerHTML = html;
    }

    // تأخير تنفيذ function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // منع التكرار
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // تحميل صورة
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    // نسخ للنصوص
    copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    resolve();
                } catch (err) {
                    reject(err);
                }
                document.body.removeChild(textArea);
            }
        });
    }

    // توليد لون عشوائي
    generateRandomColor() {
        const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // تنسيق الوقت المنقضي
    formatElapsedTime(date) {
        if (!date) return 'غير محدد';
        
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        
        return this.formatDate(date);
    }

    // التحقق من اتصال الإنترنت
    checkOnlineStatus() {
        return navigator.onLine;
    }

    // إضافة مستمع لحدث اتصال الإنترنت
    onOnline(callback) {
        window.addEventListener('online', callback);
    }

    onOffline(callback) {
        window.addEventListener('offline', callback);
    }

    // تنزيل البيانات كملف JSON
    downloadJSON(data, filename) {
        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = filename.endsWith('.json') ? filename : filename + '.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error downloading JSON:', error);
            return false;
        }
    }

    // قراءة ملف JSON
    readJSONFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // إظهار تأكيد
    showConfirmation(message, title = 'تأكيد') {
        return new Promise((resolve) => {
            // استخدام confirm افتراضي
            const result = confirm(message);
            resolve(result);
        });
    }

    // إظهار prompt
    showPrompt(message, defaultValue = '') {
        return new Promise((resolve) => {
            const result = prompt(message, defaultValue);
            resolve(result);
        });
    }
}

// إنشاء الأدوات المساعدة
const utils = new Utils();
window.utils = utils;

// دالة تهيئة إضافية لضمان تحميل جميع الدوال
document.addEventListener('DOMContentLoaded', function() {
    // التأكد من تحميل جميع الدوال العالمية
    if (typeof formatDate === 'undefined') {
        window.formatDate = (date) => utils.formatDate(date);
    }
    if (typeof formatTime === 'undefined') {
        window.formatTime = (date) => utils.formatTime(date);
    }
    if (typeof formatDuration === 'undefined') {
        window.formatDuration = (minutes) => utils.formatDuration(minutes);
    }
    if (typeof downloadCSV === 'undefined') {
        window.downloadCSV = (data, filename) => utils.downloadCSV(data, filename);
    }
    if (typeof isValidEmail === 'undefined') {
        window.isValidEmail = (email) => utils.isValidEmail(email);
    }
    if (typeof isValidPhone === 'undefined') {
        window.isValidPhone = (phone) => utils.isValidPhone(phone);
    }
});