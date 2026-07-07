// نظام المندوبين
class EmployeeSystem {
    constructor() {
        this.currentEmployee = null;
        this.trackingWatchId = null;
        this.isTracking = false;
        this.currentMarker = null;
        this.init();
    }

    init() {
        this.loadEmployeeData();
        this.setupEventListeners();
        this.loadDashboardData();
        
        setInterval(() => {
            this.loadDashboardData();
        }, 10000);
        
        console.log('✅ نظام المندوبين جاهز للعمل');
    }

    loadEmployeeData() {
        const user = mamoonSystem.currentUser;
        if (user && user.role === 'employee') {
            this.currentEmployee = user;
            document.getElementById('employeeName').textContent = user.name;
            document.getElementById('employeeRole').textContent = user.title;
        } else {
            window.location.href = 'index.html';
        }
    }

    setupEventListeners() {
        const visitForm = document.getElementById('visitForm');
        if (visitForm) {
            visitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.recordNewVisit();
            });
        }
    }

    async startTracking() {
        if (this.isTracking) {
            mamoonSystem.showNotification('التتبع يعمل بالفعل', 'warning');
            return;
        }

        try {
            this.isTracking = true;
            document.getElementById('startTrackingBtn').disabled = true;
            document.getElementById('stopTrackingBtn').disabled = false;

            if (typeof trackingSystem !== 'undefined') {
                this.trackingWatchId = trackingSystem.startEmployeeTracking(
                    this.currentEmployee.id,
                    {
                        onLocationUpdate: (location) => {
                            this.updateMapWithCurrentLocation(location);
                            this.updateLocationDetails(location);
                        }
                    }
                );
            }

        } catch (error) {
            mamoonSystem.showNotification('خطأ في بدء التتبع: ' + error.message, 'error');
            this.isTracking = false;
            document.getElementById('startTrackingBtn').disabled = false;
            document.getElementById('stopTrackingBtn').disabled = true;
        }
    }

    stopTracking() {
        if (this.trackingWatchId && typeof trackingSystem !== 'undefined') {
            trackingSystem.stopTracking();
            this.trackingWatchId = null;
        }
        
        this.isTracking = false;
        document.getElementById('startTrackingBtn').disabled = false;
        document.getElementById('stopTrackingBtn').disabled = true;
        
        mamoonSystem.showNotification('تم إيقاف التتبع', 'warning');
    }

    async getCurrentLocation() {
        try {
            if (typeof trackingSystem !== 'undefined') {
                const location = await trackingSystem.getAndUpdateEmployeeLocation(this.currentEmployee.id);
                this.updateMapWithCurrentLocation(location);
                this.updateLocationDetails(location);
            }
        } catch (error) {
            // الخطأ تم معالجته مسبقاً في trackingSystem
        }
    }

    updateMapWithCurrentLocation(location) {
        const popupContent = `
            <b>موقعك الحالي</b><br>
            ${this.currentEmployee.name}<br>
            ${this.formatTime(location.timestamp)}
        `;
        
        if (typeof mapSystem !== 'undefined') {
            const markerResult = mapSystem.trackLocationOnMap('liveMap', location, popupContent);
            
            if (markerResult) {
                this.currentMarker = markerResult;
            }
        }
    }

    updateLocationDetails(location) {
        const detailsHtml = `
            <h4>📍 معلومات الموقع المحدث</h4>
            <p><strong>الإحداثيات:</strong> ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</p>
            <p><strong>الدقة:</strong> ${Math.round(location.accuracy)} متر</p>
            <p><strong>السرعة:</strong> ${location.speed ? location.speed.toFixed(1) + ' م/ث' : 'غير متاح'}</p>
            <p><strong>الاتجاه:</strong> ${location.heading ? location.heading.toFixed(0) + '°' : 'غير متاح'}</p>
            <p><strong>آخر تحديث:</strong> ${this.formatTime(location.timestamp)}</p>
            <p><strong>الحالة:</strong> <span class="badge badge-success">متصل</span></p>
        `;
        
        document.getElementById('locationDetails').innerHTML = detailsHtml;
    }

    async recordNewVisit() {
        const form = document.getElementById('visitForm');
        
        let currentLocation = null;
        if (this.isTracking && typeof trackingSystem !== 'undefined' && trackingSystem.currentLocation) {
            currentLocation = trackingSystem.currentLocation;
        }

        const visitData = {
            clientName: document.getElementById('clientName').value,
            visitType: document.getElementById('visitType').value,
            contactPerson: document.getElementById('contactPerson').value,
            duration: parseInt(document.getElementById('visitDuration').value) || 30,
            notes: document.getElementById('visitNotes').value,
            nextVisit: document.getElementById('nextVisit').value || null,
            employeeId: this.currentEmployee.id,
            employeeName: this.currentEmployee.name,
            location: currentLocation
        };

        if (!visitData.clientName || !visitData.visitType) {
            mamoonSystem.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        try {
            const visit = storageSystem.addVisit(visitData);
            
            if (visit) {
                form.reset();
                this.loadVisitsHistory();
                this.loadDashboardData();
                mamoonSystem.showNotification('تم تسجيل الزيارة بنجاح', 'success');
            }
            
        } catch (error) {
            mamoonSystem.showNotification('خطأ في تسجيل الزيارة', 'error');
            console.error('Error recording visit:', error);
        }
    }

    async getLocationForVisit() {
        try {
            if (typeof trackingSystem !== 'undefined') {
                const location = await trackingSystem.getCurrentLocation();
                mamoonSystem.showNotification('تم تحديد الموقع الحالي للزيارة', 'success');
                return location;
            }
        } catch (error) {
            mamoonSystem.showNotification('تعذر تحديد الموقع للزيارة', 'warning');
            return null;
        }
    }

    loadDashboardData() {
        if (!this.currentEmployee) return;

        const visits = storageSystem.getVisits().filter(visit => 
            visit.employeeId === this.currentEmployee.id
        );

        const today = new Date().toDateString();
        const todayVisits = visits.filter(visit => 
            new Date(visit.recordedAt).toDateString() === today
        );

        document.getElementById('todayVisitsCount').textContent = todayVisits.length;
        document.getElementById('totalDistance').textContent = 
            this.calculateTodayDistance(todayVisits) + ' كم';
        document.getElementById('workHours').textContent = 
            this.calculateWorkHours(todayVisits) + ' س';
        document.getElementById('completionRate').textContent = 
            this.calculateCompletionRate(todayVisits) + '%';

        this.updateCurrentStatus();
        this.updateUpcomingVisits(visits);
        this.updateTodayActivity(todayVisits);
    }

    calculateTodayDistance(visits) {
        let total = 0;
        const locations = visits.filter(v => v.location).map(v => v.location);
        
        if (locations.length < 2) return '0';
        
        for (let i = 1; i < locations.length; i++) {
            const prev = locations[i-1];
            const curr = locations[i];
            total += mamoonSystem.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        }
        
        return total.toFixed(1);
    }

    calculateWorkHours(visits) {
        if (visits.length === 0) return '0';
        const durations = visits.map(v => v.duration || 30);
        const totalMinutes = durations.reduce((a, b) => a + b, 0);
        return (totalMinutes / 60).toFixed(1);
    }

    calculateCompletionRate(visits) {
        const settings = storageSystem.getSettings();
        const target = settings.dailyTarget;
        return Math.min(Math.round((visits.length / target) * 100), 100);
    }

    updateCurrentStatus() {
        const employees = storageSystem.getEmployees();
        const employee = employees.find(emp => emp.id === this.currentEmployee.id);
        
        let statusHTML = '';

        if (employee && employee.lastLocation) {
            statusHTML = `
                <div class="status-success">
                    <p><strong>🟢 حالة الاتصال:</strong> متصل</p>
                    <p><strong>📍 آخر موقع:</strong> ${this.formatTime(employee.lastLocation.timestamp)}</p>
                    <p><strong>📱 الدقة:</strong> ${Math.round(employee.lastLocation.accuracy)} متر</p>
                    <p><strong>📊 الزيارات اليوم:</strong> ${this.getTodayVisitsCount()} زيارة</p>
                </div>
            `;
        } else {
            statusHTML = `
                <div class="status-warning">
                    <p><strong>🟡 حالة الاتصال:</strong> غير متصل</p>
                    <p>يجب تفعيل التتبع لعرض الموقع الحالي</p>
                    <button class="btn btn-sm btn-primary" onclick="startTracking()">
                        تفعيل التتبع
                    </button>
                </div>
            `;
        }

        document.getElementById('currentStatus').innerHTML = statusHTML;
    }

    getTodayVisitsCount() {
        const visits = storageSystem.getVisits().filter(visit => 
            visit.employeeId === this.currentEmployee.id &&
            new Date(visit.recordedAt).toDateString() === new Date().toDateString()
        );
        return visits.length;
    }

    updateUpcomingVisits(visits) {
        const upcoming = visits
            .filter(visit => visit.nextVisit && new Date(visit.nextVisit) > new Date())
            .slice(0, 3);

        if (upcoming.length === 0) {
            document.getElementById('upcomingVisits').innerHTML = 
                '<p>لا توجد زيارات مجدولة</p>';
            return;
        }

        const visitsHTML = upcoming.map(visit => `
            <div class="visit-item">
                <strong>${visit.clientName}</strong><br>
                <small>📅 ${this.formatDate(visit.nextVisit)}</small><br>
                <small>📋 ${visit.visitType}</small>
            </div>
        `).join('');

        document.getElementById('upcomingVisits').innerHTML = visitsHTML;
    }

    updateTodayActivity(visits) {
        if (visits.length === 0) {
            document.getElementById('todayActivity').innerHTML = 
                '<p>لا توجد نشاطات مسجلة اليوم</p>';
            return;
        }

        const activityHTML = visits.map(visit => `
            <div class="activity-item">
                <div class="activity-avatar">
                    <i class="fas fa-hospital"></i>
                </div>
                <div class="activity-info">
                    <strong>${visit.clientName}</strong>
                    <p>${visit.visitType} - ${visit.duration} دقيقة</p>
                    <small>${this.formatTime(visit.recordedAt)}</small>
                </div>
                <div class="activity-status online">
                    <i class="fas fa-check-circle"></i>
                </div>
            </div>
        `).join('');

        document.getElementById('todayActivity').innerHTML = activityHTML;
    }

    loadVisitsHistory() {
        if (!this.currentEmployee) return;

        const visits = storageSystem.getVisits()
            .filter(visit => visit.employeeId === this.currentEmployee.id)
            .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

        const tbody = document.getElementById('visitsTableBody');
        
        if (visits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا توجد زيارات مسجلة</td></tr>';
            return;
        }

        tbody.innerHTML = visits.map(visit => `
            <tr>
                <td>${this.formatDate(visit.recordedAt)}</td>
                <td>${visit.clientName}</td>
                <td>${visit.visitType}</td>
                <td>${visit.contactPerson || '-'}</td>
                <td>${visit.duration || 30} دقيقة</td>
                <td><span class="badge badge-success">مكتملة</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewVisitDetails('${visit.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    exportMyVisits() {
        const visits = storageSystem.getVisits()
            .filter(visit => visit.employeeId === this.currentEmployee.id);

        const data = visits.map(visit => ({
            'التاريخ': this.formatDate(visit.recordedAt),
            'المركز الطبي': visit.clientName,
            'نوع الزيارة': visit.visitType,
            'المسؤول': visit.contactPerson || '',
            'المدة (دقيقة)': visit.duration || 30,
            'الملاحظات': visit.notes || '',
            'الموقع': visit.location ? 
                `${visit.location.lat.toFixed(6)}, ${visit.location.lng.toFixed(6)}` : ''
        }));

        if (window.downloadCSV) {
            downloadCSV(data, `زيارات_${this.currentEmployee.name}_${new Date().toISOString().split('T')[0]}.csv`);
        }
    }

    generateDailyReport() {
        this.showReportTab('daily');
    }

    generateWeeklyReport() {
        this.showReportTab('weekly');
    }

    generateMonthlyReport() {
        this.showReportTab('monthly');
    }

    showReportTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.getElementById(tabName + '-report').classList.add('active');
        event.target.classList.add('active');
        
        this.generateReport(tabName);
    }

    generateReport(period) {
        const report = storageSystem.generateReport(period);
        const stats = report.stats;
        
        let reportHTML = '';
        
        if (period === 'daily') {
            reportHTML = this.generateDailyReportHTML(stats);
        } else if (period === 'weekly') {
            reportHTML = this.generateWeeklyReportHTML(stats);
        } else {
            reportHTML = this.generateMonthlyReportHTML(stats);
        }
        
        document.getElementById(period + 'Stats').innerHTML = reportHTML;
    }

    generateDailyReportHTML(stats) {
        const employeeVisits = stats.visitsByEmployee[this.currentEmployee.id] || [];
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${employeeVisits.length}</div>
                    <div class="stat-label">زيارات اليوم</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-number">${Math.round(stats.completionRate)}%</div>
                    <div class="stat-label">معدل الإنجاز</div>
                </div>
                <div class="stat-card info">
                    <div class="stat-number">${this.calculateEmployeeDistance(employeeVisits)} كم</div>
                    <div class="stat-label">المسافة المقطوعة</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-number">${this.calculateEmployeeWorkHours(employeeVisits)} س</div>
                    <div class="stat-label">ساعات العمل</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h4>توزيع زياراتك حسب النوع</h4>
                ${this.generateEmployeeVisitsChart(employeeVisits)}
            </div>
        `;
    }

    calculateEmployeeDistance(visits) {
        let total = 0;
        const locations = visits.filter(v => v.location).map(v => v.location);
        
        if (locations.length < 2) return '0';
        
        for (let i = 1; i < locations.length; i++) {
            const prev = locations[i-1];
            const curr = locations[i];
            total += mamoonSystem.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        }
        
        return total.toFixed(1);
    }

    calculateEmployeeWorkHours(visits) {
        if (visits.length === 0) return '0';
        const durations = visits.map(v => v.duration || 30);
        const totalMinutes = durations.reduce((a, b) => a + b, 0);
        return (totalMinutes / 60).toFixed(1);
    }

    generateEmployeeVisitsChart(visits) {
        const visitsByType = mamoonSystem.groupBy(visits, 'visitType');
        let chartHTML = '';
        const totalVisits = visits.length;
        
        Object.entries(visitsByType).forEach(([type, typeVisits]) => {
            const percentage = totalVisits > 0 ? (typeVisits.length / totalVisits) * 100 : 0;
            chartHTML += `
                <div class="performance-bar">
                    <div class="bar-label">${type}</div>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%">
                            <span>${typeVisits.length} زيارة</span>
                        </div>
                    </div>
                    <div class="bar-value">${Math.round(percentage)}%</div>
                </div>
            `;
        });
        
        return chartHTML || '<p>لا توجد زيارات مسجلة</p>';
    }

    generateWeeklyReportHTML(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${stats.totalVisits}</div>
                    <div class="stat-label">زيارات الأسبوع</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-number">${Math.round(stats.completionRate)}%</div>
                    <div class="stat-label">معدل الإنجاز</div>
                </div>
                <div class="stat-card info">
                    <div class="stat-number">${stats.totalDistance.toFixed(1)} كم</div>
                    <div class="stat-label">مسافة الأسبوع</div>
                </div>
            </div>
        `;
    }

    generateMonthlyReportHTML(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${stats.totalVisits}</div>
                    <div class="stat-label">زيارات الشهر</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-number">${Math.round(stats.completionRate)}%</div>
                    <div class="stat-label">معدل الإنجاز</div>
                </div>
            </div>
        `;
    }

    // دوال مساعدة للتنسيق
    formatDate(date) {
        if (!date) return 'غير محدد';
        const d = new Date(date);
        return d.toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(date) {
        if (!date) return 'غير محدد';
        const d = new Date(date);
        return d.toLocaleString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// إنشاء نظام المندوبين
const employeeSystem = new EmployeeSystem();

// دوال عامة للواجهة
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionName + '-section').classList.add('active');
    
    const titles = {
        'dashboard': 'الرئيسية',
        'tracking': 'التتبع المباشر',
        'visits': 'تسجيل الزيارات',
        'history': 'سجل الزيارات',
        'reports': 'تقارير الأداء'
    };
    
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'لوحة المندوب';
    
    if (sectionName === 'history') {
        employeeSystem.loadVisitsHistory();
    } else if (sectionName === 'reports') {
        employeeSystem.generateDailyReport();
    } else if (sectionName === 'tracking') {
        setTimeout(() => {
            if (typeof mapSystem !== 'undefined') {
                mapSystem.initializeMap('liveMap');
            }
        }, 100);
    }
}

function startTracking() {
    employeeSystem.startTracking();
}

function stopTracking() {
    employeeSystem.stopTracking();
}

function getCurrentLocation() {
    employeeSystem.getCurrentLocation();
}

function getLocationForVisit() {
    employeeSystem.getLocationForVisit();
}

function exportMyVisits() {
    employeeSystem.exportMyVisits();
}

function refreshVisits() {
    employeeSystem.loadVisitsHistory();
    mamoonSystem.showNotification('تم تحديث سجل الزيارات', 'success');
}

function viewVisitDetails(visitId) {
    const visits = storageSystem.getVisits();
    const visit = visits.find(v => v.id === visitId);
    
    if (visit) {
        const details = `
            المركز الطبي: ${visit.clientName}
            نوع الزيارة: ${visit.visitType}
            المسؤول: ${visit.contactPerson || 'غير محدد'}
            المدة: ${visit.duration || 30} دقيقة
            الملاحظات: ${visit.notes || 'لا توجد'}
            التاريخ: ${employeeSystem.formatDate(visit.recordedAt)}
            التوقيع: ${visit.signature}
        `;
        
        alert(details);
    }
}

function generateDailyReport() {
    employeeSystem.generateDailyReport();
}

function generateWeeklyReport() {
    employeeSystem.generateWeeklyReport();
}

function generateMonthlyReport() {
    employeeSystem.generateMonthlyReport();
}

function showReportTab(tabName) {
    employeeSystem.showReportTab(tabName);
}

// دالة لتحميل CSV
function downloadCSV(data, filename) {
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

// تحميل سجل الزيارات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', function() {
    employeeSystem.loadVisitsHistory();
});