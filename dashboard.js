// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication and role
    checkAuth();

    // Initialize sidebar
    initSidebar();

    // Initialize logout
    initLogout();

    // Load dashboard data
    loadDashboardData();
});

// Check authentication and role
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login/';
        return;
    }

    // Get user profile to check role
    fetch('/api/profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to get profile');
            }
            return response.json();
        })
        .then(data => {
            if (data.role === 'admin') {
                document.getElementById('adminOnly').classList.remove('hidden');
                document.getElementById('notAdmin').classList.add('hidden');

                // Update admin info
                document.getElementById('adminName').textContent = data.fullname || data.username;
                document.getElementById('adminRole').textContent = data.role;
                document.getElementById('welcomeName').textContent = data.fullname || data.username;
            } else {
                document.getElementById('adminOnly').classList.add('hidden');
                document.getElementById('notAdmin').classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Error checking auth:', error);
            localStorage.removeItem('token');
            window.location.href = '/login/';
        });
}

// Initialize sidebar functionality
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
        });
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 1024 &&
            !sidebar.contains(e.target) &&
            !openSidebarBtn.contains(e.target)) {
            sidebar.classList.add('-translate-x-full');
        }
    });
}

// Initialize logout functionality
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Logout',
                text: 'Are you sure you want to logout?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#000000',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Yes, logout',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('token');
                    window.location.href = '/login/';
                }
            });
        });
    }
}

// Load dashboard data
function loadDashboardData() {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Load user statistics
    fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to get users');
            }
            return response.json();
        })
        .then(data => {
            if (data.users) {
                updateUserStats(data.users);
            }
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
        });
}

// Update user statistics
function updateUserStats(users) {
    const totalUsers = users.length;
    const verifiedUsers = users.filter(user => user.is_verified).length;
    const pendingUsers = totalUsers - verifiedUsers;
    const adminUsers = users.filter(user => user.role === 'admin').length;

    document.getElementById('totalUsers').textContent = totalUsers;
    // Note: We don't have these elements in the dashboard anymore, but keeping for future use
    // document.getElementById('verifiedUsers').textContent = verifiedUsers;
    // document.getElementById('pendingUsers').textContent = pendingUsers;
    // document.getElementById('adminUsers').textContent = adminUsers;
}

// Utility function to format numbers
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
} 