// JSCROOT Library Usage Examples for Dashboard
// ===========================================

// Wait for jscroot to be ready
function waitForJscroot() {
    return new Promise((resolve) => {
        if (window.jscroot) {
            resolve();
        } else {
            document.addEventListener('jscroot-ready', resolve);
        }
    });
}

// Dashboard Script with JSCROOT Integration
class DashboardManager {
    constructor() {
        this.token = localStorage.getItem('token') || sessionStorage.getItem('token');
        this.initializeDashboard();
    }

    async initializeElements() {
        await waitForJscroot();

        this.adminOnly = window.jscroot.getElement('adminOnly');
        this.notAdmin = window.jscroot.getElement('notAdmin');
        this.logoutBtn = window.jscroot.getElement('logoutBtn');
        this.adminName = window.jscroot.getElement('adminName');
        this.adminRole = window.jscroot.getElement('adminRole');
        this.sidebar = window.jscroot.getElement('sidebar');
        this.openSidebar = window.jscroot.getElement('openSidebar');
        this.closeSidebar = window.jscroot.getElement('closeSidebar');
    }

    // Example 1: Authentication using jscroot
    async checkAuthentication() {
        await waitForJscroot();

        if (!this.token) {
            this.showNotAdmin();
            return false;
        }

        try {
            // Show loading
            const loadingElement = document.createElement('div');
            loadingElement.innerHTML = window.jscroot.loading;
            loadingElement.style.position = 'fixed';
            loadingElement.style.top = '50%';
            loadingElement.style.left = '50%';
            loadingElement.style.transform = 'translate(-50%, -50%)';
            loadingElement.style.zIndex = '9999';
            document.body.appendChild(loadingElement);

            // Use jscroot API to check profile
            const response = await new Promise((resolve) => {
                window.jscroot.postJSON(
                    'https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha/auth/profile',
                    {},
                    resolve,
                    'Authorization',
                    'Bearer ' + this.token
                );
            });

            document.body.removeChild(loadingElement);

            if (response.status === 200) {
                const profile = response.data;

                if (profile.role !== 'admin') {
                    this.showNotAdmin();
                    return false;
                } else {
                    this.showAdmin(profile);
                    await this.loadDashboardData();
                    return true;
                }
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            if (document.body.contains(loadingElement)) {
                document.body.removeChild(loadingElement);
            }
            console.error('Authentication error:', error);
            this.showNotAdmin();
            return false;
        }
    }

    // Example 2: Dashboard data loading using jscroot
    async loadDashboardData() {
        await waitForJscroot();

        try {
            // Load visitor count
            const visitorResponse = await new Promise((resolve) => {
                window.jscroot.getJSON(
                    'https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha/tracker/count',
                    resolve
                );
            });

            if (visitorResponse.status === 200) {
                const visitorElement = window.jscroot.getElement('totalVisitors');
                if (visitorElement) {
                    visitorElement.textContent = visitorResponse.data.count ?? '-';
                }
            }

            // Set dashboard cookie
            window.jscroot.setCookieWithExpireHour('dashboard_accessed', 'true', 24);

            // Get browser info for analytics
            const browserInfo = {
                isMobile: window.jscroot.isMobile()
            };

            console.log('Dashboard Browser Info:', browserInfo);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    // Example 3: URL parameter handling
    async handleDashboardUrlParameters() {
        await waitForJscroot();

        const queryString = window.jscroot.getQueryString();
        const message = queryString.message;
        const error = queryString.error;

        if (message) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: decodeURIComponent(message),
                confirmButtonColor: '#000000',
                confirmButtonText: 'OK'
            });
        }

        if (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: decodeURIComponent(error),
                confirmButtonColor: '#000000',
                confirmButtonText: 'OK'
            });
        }
    }

    // Example 4: Cookie management for dashboard preferences
    async loadDashboardPreferences() {
        await waitForJscroot();

        const lastAccessed = window.jscroot.getCookie('dashboard_accessed');
        const userDevice = window.jscroot.getDevice();

        if (lastAccessed === 'true') {
            console.log('User has accessed dashboard before');
        }

        if (userDevice === 'mobile') {
            // Adjust dashboard layout for mobile
            console.log('Mobile device detected, adjusting dashboard layout');
        }
    }

    showAdmin(profile) {
        this.adminOnly.classList.remove('hidden');
        this.notAdmin.classList.add('hidden');

        if (this.adminName) {
            this.adminName.textContent = profile.fullname || profile.username || 'Admin';
        }

        if (this.adminRole) {
            this.adminRole.textContent = profile.role === 'admin' ? 'Administrator' : profile.role;
        }
    }

    showNotAdmin() {
        this.adminOnly.classList.add('hidden');
        this.notAdmin.classList.remove('hidden');
    }

    // Example 5: Logout with jscroot
    async logout() {
        await waitForJscroot();

        try {
            const result = await Swal.fire({
                title: 'Logout?',
                text: 'Are you sure you want to logout?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#000000',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, logout!'
            });

            if (result.isConfirmed) {
                // Show loading
                const loadingElement = document.createElement('div');
                loadingElement.innerHTML = window.jscroot.loading;
                loadingElement.style.position = 'fixed';
                loadingElement.style.top = '50%';
                loadingElement.style.left = '50%';
                loadingElement.style.transform = 'translate(-50%, -50%)';
                loadingElement.style.zIndex = '9999';
                document.body.appendChild(loadingElement);

                // Call logout API using jscroot
                try {
                    await new Promise((resolve) => {
                        window.jscroot.postJSON(
                            'https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha/auth/logout',
                            {},
                            resolve,
                            'Authorization',
                            'Bearer ' + this.token
                        );
                    });
                } catch (error) {
                    console.error('Logout API error:', error);
                }

                // Clear local storage and cookies
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                window.jscroot.setCookieWithExpireHour('dashboard_accessed', '', 0);

                document.body.removeChild(loadingElement);

                // Redirect to login
                window.location.href = '/login/';
            }
        } catch (error) {
            if (document.body.contains(loadingElement)) {
                document.body.removeChild(loadingElement);
            }
            console.error('Logout error:', error);
        }
    }

    initializeSidebar() {
        if (this.openSidebar) {
            this.openSidebar.addEventListener('click', () => {
                this.sidebar.classList.remove('-translate-x-full');
            });
        }

        if (this.closeSidebar) {
            this.closeSidebar.addEventListener('click', () => {
                this.sidebar.classList.add('-translate-x-full');
            });
        }
    }

    async initializeEventListeners() {
        await waitForJscroot();

        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    async initializeDashboard() {
        try {
            // Initialize elements
            await this.initializeElements();

            // Handle URL parameters
            await this.handleDashboardUrlParameters();

            // Load user preferences
            await this.loadDashboardPreferences();

            // Log browser information
            console.log('Dashboard Is Mobile:', window.jscroot.isMobile());

            // Initialize sidebar
            this.initializeSidebar();

            // Initialize event listeners
            await this.initializeEventListeners();

            // Check authentication
            await this.checkAuthentication();

        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async function () {
    try {
        new DashboardManager();
    } catch (error) {
        console.error('Error creating dashboard manager:', error);
    }
}); 