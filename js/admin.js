// نظام المشرف
class AdminSystem {
    constructor() {
        this.employeeMarkers = new Map();
        this.liveTracking = false;
        this.init();
    }

    init() {
        this.loadAdminData();
        this.setupEventListeners();
        this.loadOverviewData();
        
        setInterval(() => {
            if (this.liveTracking) {
                this.updateLiveTracking();
            }
            this.loadOverviewData();
        }, 10000);
        
        console.log('✅ نظام المشرف جاهز للعمل');
    }

    loadAdminData() {
        const user = window.mamoonSystem?.currentUser;
        if (user && user.role === 'admin') {
            document.getElementById('adminName').textContent = user.name;
        } else {
            window.location.href = 'index.html';
        }
    }

    getSupervisorEmployees() {
        const currentUser = window.mamoonSystem?.currentUser;
        const supervisorId = currentUser?.id;
        return window.storageSystem?.getEmployeesForSupervisor?.(supervisorId) || window.storageSystem?.getEmployees() || [];
    }

    getSupervisorVisits(employees = this.getSupervisorEmployees()) {
        const employeeIds = new Set((employees || []).map(emp => emp.id));
        return (window.storageSystem?.getVisits() || []).filter(visit => employeeIds.has(visit.employeeId));
    }

    setupEventListeners() {
        const settingsForm = document.getElementById('systemSettings');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSystemSettings();
            });
        }

        const employeeForm = document.getElementById('addEmployeeForm');
        if (employeeForm) {
            employeeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewEmployee();
            });
        }

        this.loadCurrentSettings();
    }

    loadCurrentSettings() {
        const settings = window.storageSystem?.getSettings();
        if (settings) {
            document.getElementById('updateInterval').value = settings.updateInterval / 1000;
            document.getElementById('maxAccuracy').value = settings.maxAccuracy;
            document.getElementById('dailyTarget').value = settings.dailyTarget;
        }
    }

    loadOverviewData() {
        const employees = this.getSupervisorEmployees();
        const visits = this.getSupervisorVisits(employees);
        const today = new Date().toDateString();

        const activeEmployees = employees.filter(emp => 
            emp.lastActivity && 
            (new Date() - new Date(emp.lastActivity)) < 3600000
        ).length;

        const todayVisits = visits.filter(visit => 
            new Date(visit.recordedAt).toDateString() === today
        ).length;

        document.getElementById('activeEmployeesCount').textContent = activeEmployees;
        document.getElementById('todayVisitsCount').textContent = todayVisits;
        document.getElementById('totalKmToday').textContent = 
            this.calculateTotalDistance(todayVisits) + ' كم';

        this.updateCurrentActivity(employees);
        this.updateRecentVisits(visits);
        this.updatePerformanceChart(employees, visits);
    }

    calculateTotalDistance(visits) {
        let total = 0;
        const locations = visits.filter(v => v.location).map(v => v.location);
        
        for (let i = 1; i < locations.length; i++) {
            const prev = locations[i-1];
            const curr = locations[i];
            total += window.mamoonSystem?.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng) || 0;
        }
        
        return total.toFixed(1);
    }

    updateCurrentActivity(employees) {
        const activeEmployees = employees.filter(emp => 
            emp.lastActivity && 
            (new Date() - new Date(emp.lastActivity)) < 3600000
        );

        let activityHTML = '';
        
        if (activeEmployees.length === 0) {
            activityHTML = '<p>لا يوجد مندوبين نشطين حالياً</p>';
        } else {
            activityHTML = activeEmployees.map(emp => `
                <div class="activity-item">
                    <div class="activity-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="activity-info">
                        <strong>${emp.name}</strong>
                        <p>${emp.lastLocation ? 'يعمل في الميدان' : 'غير متصل'}</p>
                        <small>${emp.lastActivity ? this.formatTime(emp.lastActivity) : 'لا يوجد نشاط'}</small>
                    </div>
                    <div class="activity-status ${emp.lastLocation ? 'online' : 'offline'}">
                        <i class="fas fa-circle"></i>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('currentActivity').innerHTML = activityHTML;
    }

    updateRecentVisits(visits) {
        const recentVisits = visits
            .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
            .slice(0, 10);

        const tbody = document.getElementById('recentVisitsTable');
        
        if (recentVisits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد زيارات</td></tr>';
            return;
        }

        tbody.innerHTML = recentVisits.map(visit => `
            <tr>
                <td>${visit.employeeName}</td>
                <td>${visit.clientName}</td>
                <td>${visit.visitType}</td>
                <td>${this.formatTime(visit.recordedAt)}</td>
                <td><span class="badge badge-success">مكتملة</span></td>
            </tr>
        `).join('');
    }

    updatePerformanceChart(employees, visits) {
        const performanceData = employees.map(emp => {
            const employeeVisits = visits.filter(v => v.employeeId === emp.id);
            return {
                name: emp.name,
                visits: employeeVisits.length,
                efficiency: employeeVisits.length > 0 ? 
                    Math.min((employeeVisits.length / 5) * 100, 100) : 0
            };
        });

        let chartHTML = '';
        
        performanceData.forEach(data => {
            chartHTML += `
                <div class="performance-bar">
                    <div class="bar-label">${data.name}</div>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${data.efficiency}%">
                            <span>${data.visits} زيارات</span>
                        </div>
                    </div>
                    <div class="bar-value">${Math.round(data.efficiency)}%</div>
                </div>
            `;
        });

        document.getElementById('performanceChart').innerHTML = chartHTML;
    }

    startLiveTracking() {
        this.liveTracking = true;
        this.updateLiveTracking();
        window.mamoonSystem?.showNotification('تم بدء التتبع الحي لجميع المندوبين', 'success');
    }

    stopLiveTracking() {
        this.liveTracking = false;
        if (typeof window.mapSystem !== 'undefined') {
            window.mapSystem.clearAllMarkers('adminMap');
        }
        this.employeeMarkers.clear();
        window.mamoonSystem?.showNotification('تم إيقاف التتبع الحي', 'warning');
    }

    updateLiveTracking() {
        if (!this.liveTracking) return;

        const employees = window.storageSystem?.getEmployees() || [];
        
        employees.forEach(emp => {
            if (emp.lastLocation) {
                this.updateEmployeeMarker(emp);
            }
        });

        this.updateConnectedEmployees(employees);
        this.updateTrackingStats(employees);
    }

    updateEmployeeMarker(employee) {
        if (!employee.lastLocation) return;

        const popupContent = `
            <b>${employee.name}</b><br>
            ${employee.title}<br>
            ${this.formatTime(employee.lastLocation.timestamp)}<br>
            دقة: ${Math.round(employee.lastLocation.accuracy)}م
        `;

        const latlng = [employee.lastLocation.lat, employee.lastLocation.lng];
        
        if (this.employeeMarkers.has(employee.id)) {
            const markerId = this.employeeMarkers.get(employee.id);
            if (typeof window.mapSystem !== 'undefined') {
                window.mapSystem.updateMarker('adminMap', markerId, latlng, popupContent);
            }
        } else {
            if (typeof window.mapSystem !== 'undefined') {
                const markerResult = window.mapSystem.addMarker('adminMap', latlng, popupContent);
                if (markerResult) {
                    this.employeeMarkers.set(employee.id, markerResult.id);
                }
            }
        }
    }

    updateConnectedEmployees(employees) {
        const connected = employees.filter(emp => 
            emp.lastActivity && 
            (new Date() - new Date(emp.lastActivity)) < 3600000
        );

        let connectedHTML = '';
        
        if (connected.length === 0) {
            connectedHTML = '<p>لا يوجد مندوبين متصلين</p>';
        } else {
            connectedHTML = connected.map(emp => `
                <div class="employee-item">
                    <div class="activity-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="activity-info">
                        <strong>${emp.name}</strong>
                        <p>${emp.lastLocation ? 'نشط في الميدان' : 'في الانتظار'}</p>
                        <small>آخر تحديث: ${this.formatTime(emp.lastActivity)}</small>
                    </div>
                    <div class="activity-status online">
                        <i class="fas fa-wifi"></i>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('connectedEmployees').innerHTML = connectedHTML;
    }

    updateTrackingStats(employees) {
        const active = employees.filter(emp => 
            emp.lastActivity && 
            (new Date() - new Date(emp.lastActivity)) < 3600000
        ).length;

        const visits = this.getSupervisorVisits(employees);
        const totalLocations = visits.filter(v => v.location).length || 0;
        const today = new Date().toDateString();
        const todayLocations = visits.filter(v => 
            v.location && new Date(v.recordedAt).toDateString() === today
        ).length || 0;

        const statsHTML = `
            <div class="location-info">
                <h4>📊 إحصائيات التتبع</h4>
                <p><strong>مندوبين نشطين:</strong> ${active}</p>
                <p><strong>مواقع مسجلة اليوم:</strong> ${todayLocations}</p>
                <p><strong>إجمالي المواقع المسجلة:</strong> ${totalLocations}</p>
                <p><strong>آخر تحديث:</strong> ${this.formatTime(new Date())}</p>
            </div>
        `;

        document.getElementById('trackingStats').innerHTML = statsHTML;
    }

    loadEmployeesManagement() {
        const employees = this.getSupervisorEmployees();
        const tbody = document.getElementById('employeesTable');
        
        if (employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا يوجد مندوبين</td></tr>';
            return;
        }

        tbody.innerHTML = employees.map(emp => {
            const visits = window.storageSystem?.getVisits().filter(v => v.employeeId === emp.id).length || 0;
            
            const status = emp.lastActivity && 
                (new Date() - new Date(emp.lastActivity)) < 3600000 ? 
                '<span class="badge badge-success">نشط</span>' : 
                '<span class="badge badge-secondary">غير نشط</span>';

            const lastLocation = emp.lastLocation ? 
                `${emp.lastLocation.lat.toFixed(4)}, ${emp.lastLocation.lng.toFixed(4)}` : 
                'غير متاح';

            const lastActivity = emp.lastActivity ? 
                this.formatTime(emp.lastActivity) : 'لا يوجد';

            return `
                <tr>
                    <td>
                        <div class="activity-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                    </td>
                    <td>${emp.name}</td>
                    <td>${status}</td>
                    <td>${lastLocation}</td>
                    <td>${lastActivity}</td>
                    <td>${visits}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewEmployeeDetails('${emp.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editEmployee('${emp.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${emp.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadVisitsManagement(filter = 'all') {
        let visits = this.getSupervisorVisits();
        
        const now = new Date();
        switch(filter) {
            case 'today':
                visits = visits.filter(v => 
                    new Date(v.recordedAt).toDateString() === now.toDateString()
                );
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                visits = visits.filter(v => new Date(v.recordedAt) >= weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                visits = visits.filter(v => new Date(v.recordedAt) >= monthAgo);
                break;
        }

        visits.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

        const tbody = document.getElementById('allVisitsTable');
        
        if (visits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا توجد زيارات</td></tr>';
            return;
        }

        tbody.innerHTML = visits.map(visit => `
            <tr>
                <td>${this.formatDate(visit.recordedAt)}</td>
                <td>${visit.employeeName}</td>
                <td>${visit.clientName}</td>
                <td>${visit.visitType}</td>
                <td>${visit.contactPerson || '-'}</td>
                <td>${visit.duration || 30} دقيقة</td>
                <td>${visit.signature}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewVisitDetails('${visit.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editVisit('${visit.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    generateReport(period = 'today') {
        const report = window.storageSystem?.generateReport(period);
        if (!report) return;
        
        document.getElementById('reportTitle').textContent = `تقرير أداء المندوبين - ${this.getPeriodName(period)}`;
        document.getElementById('reportPeriod').textContent = `الفترة: ${this.getPeriodName(period)}`;
        
        document.getElementById('reportTotalVisits').textContent = report.stats.totalVisits;
        document.getElementById('reportTotalDistance').textContent = report.stats.totalDistance.toFixed(1) + ' كم';
        document.getElementById('reportAvgDuration').textContent = Math.round(report.stats.averageDuration) + ' د';
        
        this.generateDetailedReport(report);
    }

    getPeriodName(period) {
        const names = {
            'today': 'اليوم',
            'week': 'الأسبوع',
            'month': 'الشهر'
        };
        return names[period] || period;
    }

    generateDetailedReport(report) {
        let detailedHTML = `
            <h4>إحصائيات المندوبين</h4>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>اسم المندوب</th>
                            <th>عدد الزيارات</th>
                            <th>آخر نشاط</th>
                            <th>معدل الإنجاز</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        Object.entries(report.stats.visitsByEmployee).forEach(([empId, visits]) => {
            const employee = window.storageSystem?.getEmployees().find(emp => emp.id === empId);
            if (employee) {
                const efficiency = Math.min((visits.length / 5) * 100, 100);
                detailedHTML += `
                    <tr>
                        <td>${employee.name}</td>
                        <td>${visits.length}</td>
                        <td>${employee.lastActivity ? this.formatTime(employee.lastActivity) : 'لا يوجد'}</td>
                        <td>${Math.round(efficiency)}%</td>
                    </tr>
                `;
            }
        });

        detailedHTML += `
                    </tbody>
                </table>
            </div>

            <h4>توزيع الزيارات حسب النوع</h4>
            <div class="chart-container">
        `;

        Object.entries(report.stats.visitsByType).forEach(([type, visits]) => {
            const percentage = (visits.length / report.stats.totalVisits) * 100;
            detailedHTML += `
                <div class="performance-bar">
                    <div class="bar-label">${type}</div>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%">
                            <span>${visits.length} زيارة</span>
                        </div>
                    </div>
                    <div class="bar-value">${Math.round(percentage)}%</div>
                </div>
            `;
        });

        detailedHTML += `</div>`;

        document.getElementById('detailedReport').innerHTML = detailedHTML;
    }

    addNewEmployee() {
        const employeeData = {
            name: document.getElementById('empName').value,
            email: document.getElementById('empEmail').value,
            phone: document.getElementById('empPhone').value,
            area: document.getElementById('empArea').value,
            title: 'مندوب ميداني',
            department: 'قسم العلاقات العامة'
        };

        if (!employeeData.name || !employeeData.email || !employeeData.phone || !employeeData.area) {
            window.mamoonSystem?.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        const currentUser = window.mamoonSystem?.currentUser;
        const employee = window.storageSystem?.addEmployee({
            ...employeeData,
            username: this.generateEmployeeUsername(employeeData),
            password: this.generateEmployeePassword(employeeData),
            supervisorId: currentUser?.id || null
        });

        if (employee) {
            this.closeEmployeeModal();
            this.loadEmployeesManagement();
            document.getElementById('addEmployeeForm').reset();
        }
    }

    generateEmployeeUsername(employeeData) {
        const base = (employeeData.email || employeeData.name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
        return base || `emp${Date.now()}`;
    }

    generateEmployeePassword(employeeData) {
        const digits = String(employeeData.phone || '').replace(/\D/g, '');
        return digits.length >= 6 ? digits.slice(-6) : '123456';
    }

    saveSystemSettings() {
        const newSettings = {
            updateInterval: parseInt(document.getElementById('updateInterval').value) * 1000,
            maxAccuracy: parseInt(document.getElementById('maxAccuracy').value),
            dailyTarget: parseInt(document.getElementById('dailyTarget').value)
        };

        const success = window.storageSystem?.updateSettings(newSettings);
        if (success) {
            window.mamoonSystem?.showNotification('تم حفظ الإعدادات بنجاح', 'success');
        } else {
            window.mamoonSystem?.showNotification('خطأ في حفظ الإعدادات', 'error');
        }
    }

    closeEmployeeModal() {
        document.getElementById('employeeModal').style.display = 'none';
    }

    backupData() {
        const success = window.storageSystem?.backupData();
        if (success) {
            window.mamoonSystem?.showNotification('تم إنشاء نسخة احتياطية', 'success');
        }
    }

    restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                await window.storageSystem?.restoreData(file);
                window.mamoonSystem?.showNotification('تم استعادة البيانات بنجاح', 'success');
                location.reload();
            } catch (error) {
                window.mamoonSystem?.showNotification('خطأ في استعادة البيانات: ' + error.message, 'error');
            }
        };
        
        input.click();
    }

    clearAllData() {
        if (confirm('⚠️ هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
            const success = window.storageSystem?.clearAllData();
            if (success) {
                window.mamoonSystem?.showNotification('تم مسح جميع البيانات', 'success');
                location.reload();
            }
        }
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

// إنشاء نظام المشرف
const adminSystem = new AdminSystem();
window.adminSystem = adminSystem;

// دوال عامة للواجهة
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    const titles = {
        'overview': 'نظرة عامة',
        'live-tracking': 'التتبع الحي',
        'employees': 'إدارة المندوبين',
        'visits': 'إدارة الزيارات',
        'reports': 'التقارير والإحصائيات',
        'settings': 'الإعدادات'
    };
    
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'لوحة التحكم';
    
    if (sectionName === 'employees') {
        window.adminSystem.loadEmployeesManagement();
    } else if (sectionName === 'visits') {
        window.adminSystem.loadVisitsManagement();
    } else if (sectionName === 'reports') {
        window.adminSystem.generateReport('today');
    } else if (sectionName === 'live-tracking') {
        setTimeout(() => {
            if (typeof window.mapSystem !== 'undefined') {
                window.mapSystem.initializeMap('adminMap');
            }
        }, 100);
    }
}

function showEmployeeModal() {
    document.getElementById('employeeModal').style.display = 'block';
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').style.display = 'none';
}

function startLiveTracking() {
    window.adminSystem.startLiveTracking();
}

function stopLiveTracking() {
    window.adminSystem.stopLiveTracking();
}

function refreshData() {
    window.adminSystem.loadOverviewData();
    window.mamoonSystem?.showNotification('تم تحديث البيانات', 'success');
}

function filterVisits(period) {
    window.adminSystem.loadVisitsManagement(period);
}

function exportAllVisits() {
    const visits = window.storageSystem?.getVisits() || [];
    const data = visits.map(visit => ({
        'التاريخ': window.adminSystem.formatDate(visit.recordedAt),
        'المندوب': visit.employeeName,
        'المركز الطبي': visit.clientName,
        'نوع الزيارة': visit.visitType,
        'المسؤول': visit.contactPerson || '',
        'المدة (دقيقة)': visit.duration || 30,
        'الملاحظات': visit.notes || '',
        'التوقيع': visit.signature
    }));

    if (window.downloadCSV) {
        window.downloadCSV(data, `جميع_الزيارات_${new Date().toISOString().split('T')[0]}.csv`);
    }
}

function generateReport(period) {
    window.adminSystem.generateReport(period);
}

function printReport() {
    window.print();
}

function backupData() {
    window.adminSystem.backupData();
}

function restoreData() {
    window.adminSystem.restoreData();
}

function clearAllData() {
    window.adminSystem.clearAllData();
}

function viewEmployeeDetails(employeeId) {
    const employees = window.storageSystem?.getEmployees() || [];
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (employee) {
        const visits = window.storageSystem?.getVisits().filter(v => v.employeeId === employeeId) || [];
        
        const details = `
            الاسم: ${employee.name}
            البريد: ${employee.email || 'غير محدد'}
            الهاتف: ${employee.phone || 'غير محدد'}
            المنطقة: ${employee.area || 'غير محدد'}
            عدد الزيارات: ${visits.length}
            آخر نشاط: ${employee.lastActivity ? window.adminSystem.formatDate(employee.lastActivity) : 'لا يوجد'}
            آخر موقع: ${employee.lastLocation ? 
                `${employee.lastLocation.lat.toFixed(6)}, ${employee.lastLocation.lng.toFixed(6)}` : 'غير متاح'}
        `;
        
        alert(details);
    }
}

function viewVisitDetails(visitId) {
    const visits = window.storageSystem?.getVisits() || [];
    const visit = visits.find(v => v.id === visitId);
    
    if (visit) {
        const details = `
            المندوب: ${visit.employeeName}
            المركز الطبي: ${visit.clientName}
            نوع الزيارة: ${visit.visitType}
            المسؤول: ${visit.contactPerson || 'غير محدد'}
            المدة: ${visit.duration || 30} دقيقة
            الملاحظات: ${visit.notes || 'لا توجد'}
            الموقع: ${visit.location ? 
                `${visit.location.lat.toFixed(6)}, ${visit.location.lng.toFixed(6)}` : 'غير متاح'}
            التاريخ: ${window.adminSystem.formatDate(visit.recordedAt)}
            التوقيع: ${visit.signature}
        `;
        
        alert(details);
    }
}

function editEmployee(employeeId) {
    window.mamoonSystem?.showNotification('خاصية التعديل قيد التطوير', 'info');
}

function deleteEmployee(employeeId) {
    if (confirm('هل أنت متأكد من حذف هذا المندوب؟')) {
        const success = window.storageSystem?.deleteEmployee(employeeId);
        if (success) {
            window.mamoonSystem?.showNotification('تم حذف المندوب بنجاح', 'success');
            window.adminSystem.loadEmployeesManagement();
        } else {
            window.mamoonSystem?.showNotification('خطأ في حذف المندوب', 'error');
        }
    }
}

function editVisit(visitId) {
    window.mamoonSystem?.showNotification('خاصية التعديل قيد التطوير', 'info');
}

// تحميل البيانات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.adminSystem.loadEmployeesManagement();
    window.adminSystem.loadVisitsManagement();
});