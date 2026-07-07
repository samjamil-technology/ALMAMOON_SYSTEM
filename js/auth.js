// نظام المصادقة
class AuthSystem {
    constructor() {
        this.users = [
            {
                id: 'admin-1',
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                name: 'سام جميل القدسي',
                title: 'أخصائي العلاقات العامة',
                department: 'قسم العلاقات العامة',
                phone: '+963-XXX-XXXX',
                email: 'admin@mamoonmedical.com'
            },
            {
                id: 'emp-1',
                username: 'employee',
                password: '123456',
                role: 'employee',
                name: 'أحمد محمد',
                title: 'مندوب ميداني',
                department: 'قسم العلاقات العامة',
                phone: '+963-XXX-XXXX',
                area: 'دمشق'
            }
        ];
        
        this.setupEventListeners();
    }

    getStorageEmployees() {
        if (window.storageSystem?.getEmployees) {
            return window.storageSystem.getEmployees();
        }

        try {
            const data = JSON.parse(localStorage.getItem('mamoonMedicalData') || '{}');
            return Array.isArray(data.employees) ? data.employees : [];
        } catch (error) {
            console.error('Error reading storage employees:', error);
            return [];
        }
    }

    getAllUsers() {
        const storageEmployees = this.getStorageEmployees();

        const mappedEmployees = storageEmployees
            .filter(employee => employee.isActive !== false)
            .map(employee => ({
                id: employee.id,
                username: employee.username || employee.email?.split('@')[0]?.replace(/[^a-z0-9]/gi, '').toLowerCase() || `emp-${employee.id}`,
                password: employee.password || this.generateEmployeePassword(employee),
                role: 'employee',
                name: employee.name,
                title: employee.title || 'مندوب ميداني',
                department: employee.department || 'قسم العلاقات العامة',
                phone: employee.phone,
                email: employee.email,
                area: employee.area,
                supervisorId: employee.supervisorId || null
            }));

        return [...this.users, ...mappedEmployees];
    }

    generateEmployeePassword(employee) {
        const digits = String(employee.phone || '').replace(/\D/g, '');
        return digits.length >= 6 ? digits.slice(-6) : '123456';
    }

    setupEventListeners() {
        // نموذج الدخول
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // زر الخروج
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        
        const success = await this.login(username, password, role);
        
        if (success) {
            window.mamoonSystem.showNotification(`مرحباً ${window.mamoonSystem.currentUser.name}!`, 'success');
        }
    }

    async login(username, password, role) {
        try {
            // التحقق من بيانات الدخول
            const user = this.authenticateUser(username, password, role);
            
            if (user) {
                window.mamoonSystem.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // إعادة التوجيه للوحة المناسبة
                setTimeout(() => {
                    if (user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'employee.html';
                    }
                }, 1000);
                
                return true;
            } else {
                window.mamoonSystem.showNotification('بيانات الدخول غير صحيحة', 'error');
                return false;
            }
        } catch (error) {
            window.mamoonSystem.showNotification('حدث خطأ في النظام', 'error');
            console.error('Login error:', error);
            return false;
        }
    }

    authenticateUser(username, password, role) {
        const users = this.getAllUsers();
        return users.find(user => 
            user.username === username && 
            user.password === password && 
            user.role === role
        );
    }

    logout() {
        window.mamoonSystem.currentUser = null;
        localStorage.removeItem('currentUser');
        window.mamoonSystem.showNotification('تم تسجيل الخروج بنجاح', 'info');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    getCurrentUser() {
        return window.mamoonSystem.currentUser;
    }
}

// إنشاء نظام المصادقة
const authSystem = new AuthSystem();
window.authSystem = authSystem;