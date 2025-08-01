// Newsletter Management System
class NewsletterManager {
    constructor() {
        this.apiBaseUrl = 'https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha';
        this.subscribers = [];
        this.notifications = [];
        this.products = [];
        this.currentTab = 'subscribers';
        this.isAdmin = false;
        this.user = null;

        this.checkAuthAndInit();
    }

    async checkAuthAndInit() {
        const adminOnly = document.getElementById('adminOnly');
        const notAdmin = document.getElementById('notAdmin');
        const adminName = document.getElementById('adminName');
        const adminRole = document.getElementById('adminRole');
        const token = localStorage.getItem('token');

        if (!token) {
            if (adminOnly) adminOnly.classList.add('hidden');
            if (notAdmin) notAdmin.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch('https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha/auth/profile', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const profile = await response.json();
            if (profile.role !== 'admin') {
                if (adminOnly) adminOnly.classList.add('hidden');
                if (notAdmin) notAdmin.classList.remove('hidden');
            } else {
                if (adminOnly) adminOnly.classList.remove('hidden');
                if (notAdmin) notAdmin.classList.add('hidden');
                if (adminName) adminName.textContent = profile.fullname || profile.username || profile.email || 'Admin';
                if (adminRole) adminRole.textContent = profile.role === 'admin' ? 'Administrator' : profile.role;
                this.user = profile;
                this.isAdmin = true;
                this.setupEventListeners();
                await this.loadData();
                this.updateStats();
            }
        } catch (error) {
            if (adminOnly) adminOnly.classList.add('hidden');
            if (notAdmin) notAdmin.classList.remove('hidden');
        }
    }

    showNotAdmin() {
        // Hide admin content
        const adminOnly = document.getElementById('adminOnly');
        if (adminOnly) adminOnly.classList.add('hidden');
        // Show not admin content
        const notAdmin = document.getElementById('notAdmin');
        if (notAdmin) notAdmin.classList.remove('hidden');
    }

    updateAdminInfo() {
        // Update admin name and role in header
        const adminName = document.getElementById('adminName');
        const adminRole = document.getElementById('adminRole');
        if (adminName && this.user) {
            adminName.textContent = this.user.fullname || this.user.username || this.user.email || 'Admin';
        }
        if (adminRole && this.user) {
            adminRole.textContent = this.user.role === 'admin' ? 'Administrator' : this.user.role;
        }
        // Show admin content
        const adminOnly = document.getElementById('adminOnly');
        if (adminOnly) {
            adminOnly.classList.remove('hidden');
        }
    }

    async init() {
        // This method is now called after authentication
        this.setupEventListeners();
        await this.loadData();
        this.updateStats();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Subscriber filter
        document.getElementById('subscriberFilter').addEventListener('change', (e) => {
            this.filterSubscribers(e.target.value);
        });

        // Product select for notification
        document.getElementById('productSelect').addEventListener('change', (e) => {
            this.updateNotificationPreview(e.target.value);
        });

        // Notification form
        document.getElementById('notificationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendNotification();
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Mobile sidebar toggle
        const openSidebarBtn = document.getElementById('openSidebar');
        const sidebar = document.getElementById('sidebar');

        if (openSidebarBtn && sidebar) {
            openSidebarBtn.addEventListener('click', () => {
                sidebar.classList.remove('hidden');
                sidebar.classList.add('block');
            });
        }
    }

    logout() {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Clear user session cookie
        document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Redirect to login page
        window.location.href = '/login';
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async loadData() {
        await Promise.all([
            this.loadSubscribers(),
            this.loadNotifications(),
            this.loadProducts()
        ]);
    }

    async loadSubscribers() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/newsletter/subscribers`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                this.showAccessDenied('Session expired. Please login again.');
                return;
            }

            const data = await response.json();

            if (data.status === 'success') {
                this.subscribers = data.data || [];
                this.renderSubscribers();
            } else {
                throw new Error(data.message || 'Failed to load subscribers');
            }
        } catch (error) {
            console.error('Error loading subscribers:', error);
            this.subscribers = [];
            this.renderSubscribers();
            this.showNotification('Error loading subscribers', 'error');
        }
    }

    async loadNotifications() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/newsletter/history`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();

            if (data.status === 'success') {
                this.notifications = data.data || [];
                this.renderNotifications();
            } else {
                throw new Error(data.message || 'Failed to load notifications');
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.notifications = [];
            this.renderNotifications();
            this.showNotification('Error loading notifications', 'error');
        }
    }

    async loadProducts() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/products?all=true`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();

            if (data.status === 'success') {
                this.products = data.data || [];
                this.populateProductSelect();
            } else {
                throw new Error(data.message || 'Failed to load products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
            this.populateProductSelect();
            this.showNotification('Error loading products', 'error');
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('border-blue-500', 'text-blue-600');
            button.classList.add('border-transparent', 'text-gray-500');
        });

        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        activeButton.classList.remove('border-transparent', 'text-gray-500');
        activeButton.classList.add('border-blue-500', 'text-blue-600');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        this.currentTab = tabName;

        // Load data for specific tab
        if (tabName === 'send-notification') {
            this.updateSubscriberCount();
        }
    }

    renderSubscribers() {
        const tbody = document.getElementById('subscribersTableBody');
        tbody.innerHTML = '';

        // Check if subscribers exist and is an array
        if (!this.subscribers || !Array.isArray(this.subscribers)) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No subscribers found</td></tr>';
            return;
        }

        if (this.subscribers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No subscribers yet</td></tr>';
            return;
        }

        this.subscribers.forEach(subscriber => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${subscriber.email || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${subscriber.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }">
                        ${subscriber.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${subscriber.created_at ? new Date(subscriber.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="newsletterManager.toggleSubscriberStatus('${subscriber.email}', ${subscriber.is_active})" 
                            class="text-indigo-600 hover:text-indigo-900 mr-3">
                        ${subscriber.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onclick="newsletterManager.deleteSubscriber('${subscriber.email}')" 
                            class="text-red-600 hover:text-red-900">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderNotifications() {
        const tbody = document.getElementById('notificationsTableBody');
        tbody.innerHTML = '';

        // Check if notifications exist and is an array
        if (!this.notifications || !Array.isArray(this.notifications)) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No notifications found</td></tr>';
            return;
        }

        if (this.notifications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No notifications sent yet</td></tr>';
            return;
        }

        this.notifications.forEach(notification => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${notification.product?.name || 'Unknown Product'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${notification.sent_at ? new Date(notification.sent_at).toLocaleDateString() : 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${notification.sent_count || 0}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${notification.status === 'sent'
                    ? 'bg-green-100 text-green-800'
                    : notification.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                }">
                        ${notification.status || 'unknown'}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    populateProductSelect() {
        const select = document.getElementById('productSelect');
        select.innerHTML = '<option value="">Choose a product...</option>';

        // Check if products exist and is an array
        if (!this.products || !Array.isArray(this.products)) {
            return;
        }

        this.products
            .filter(product => product.is_active)
            .forEach(product => {
                const option = document.createElement('option');
                option.value = product.id || product._id;
                option.textContent = `${product.name || 'Unknown Product'} - Rp ${(product.price || 0).toLocaleString()}`;
                select.appendChild(option);
            });
    }

    filterSubscribers(filter) {
        // Check if subscribers exist and is an array
        if (!this.subscribers || !Array.isArray(this.subscribers)) {
            this.renderFilteredSubscribers([]);
            return;
        }

        let filteredSubscribers = [...this.subscribers];

        if (filter === 'active') {
            filteredSubscribers = filteredSubscribers.filter(s => s.is_active);
        } else if (filter === 'inactive') {
            filteredSubscribers = filteredSubscribers.filter(s => !s.is_active);
        }

        this.renderFilteredSubscribers(filteredSubscribers);
    }

    renderFilteredSubscribers(subscribers) {
        const tbody = document.getElementById('subscribersTableBody');
        tbody.innerHTML = '';

        // Check if subscribers array is valid
        if (!subscribers || !Array.isArray(subscribers)) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No subscribers found</td></tr>';
            return;
        }

        if (subscribers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No subscribers match the filter</td></tr>';
            return;
        }

        subscribers.forEach(subscriber => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${subscriber.email || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${subscriber.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }">
                        ${subscriber.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${subscriber.created_at ? new Date(subscriber.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="newsletterManager.toggleSubscriberStatus('${subscriber.email}', ${subscriber.is_active})" 
                            class="text-indigo-600 hover:text-indigo-900 mr-3">
                        ${subscriber.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onclick="newsletterManager.deleteSubscriber('${subscriber.email}')" 
                            class="text-red-600 hover:text-red-900">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateNotificationPreview(productId) {
        const preview = document.getElementById('notificationPreview');

        // Check if products exist and is an array
        if (!this.products || !Array.isArray(this.products)) {
            preview.innerHTML = '<p class="text-gray-500">No products available...</p>';
            return;
        }

        const product = this.products.find(p => (p.id || p._id) === productId);

        if (product) {
            preview.innerHTML = `
                <h3 class="font-semibold text-lg mb-2">${product.name || 'Unknown Product'}</h3>
                <p class="text-gray-600 mb-2"><strong>Price:</strong> Rp ${(product.price || 0).toLocaleString()}</p>
                <p class="text-gray-600 mb-2"><strong>Category:</strong> ${product.category || 'N/A'}</p>
                <p class="text-gray-600">${product.description || 'No description available'}</p>
            `;
        } else {
            preview.innerHTML = '<p class="text-gray-500">Select a product to see preview...</p>';
        }
    }

    updateSubscriberCount() {
        const activeCount = this.subscribers && Array.isArray(this.subscribers) ? this.subscribers.filter(s => s.is_active).length : 0;
        document.getElementById('subscriberCount').textContent = activeCount;
    }

    updateStats() {
        // Check if subscribers exist and is an array
        const totalSubscribers = this.subscribers && Array.isArray(this.subscribers) ? this.subscribers.length : 0;
        const activeSubscribers = this.subscribers && Array.isArray(this.subscribers) ? this.subscribers.filter(s => s.is_active).length : 0;
        const notificationsSent = this.notifications && Array.isArray(this.notifications) ? this.notifications.length : 0;

        document.getElementById('totalSubscribers').textContent = totalSubscribers;
        document.getElementById('activeSubscribers').textContent = activeSubscribers;
        document.getElementById('notificationsSent').textContent = notificationsSent;
    }

    async toggleSubscriberStatus(email, currentStatus) {
        try {
            const action = currentStatus ? 'unsubscribe' : 'subscribe';
            const response = await fetch(`${this.apiBaseUrl}/newsletter/${action}?email=${encodeURIComponent(email)}`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();

            if (data.status === 'success') {
                this.showNotification(data.message, 'success');
                await this.loadSubscribers();
                this.updateStats();
            } else {
                throw new Error(data.message || 'Failed to update subscriber status');
            }
        } catch (error) {
            console.error('Error updating subscriber status:', error);
            this.showNotification('Error updating subscriber status', 'error');
        }
    }

    async deleteSubscriber(email) {
        const result = await Swal.fire({
            title: 'Delete Subscriber?',
            text: `Are you sure you want to delete ${email}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                // For now, we'll just deactivate the subscriber
                // In a real implementation, you might want to add a delete endpoint
                await this.toggleSubscriberStatus(email, true);
                this.showNotification('Subscriber deactivated successfully', 'success');
            } catch (error) {
                console.error('Error deleting subscriber:', error);
                this.showNotification('Error deleting subscriber', 'error');
            }
        }
    }

    async sendNotification() {
        const productId = document.getElementById('productSelect').value;
        if (!productId) {
            this.showNotification('Please select a product', 'error');
            return;
        }

        const result = await Swal.fire({
            title: 'Send Notification?',
            text: `This will send a notification about the selected product to all active subscribers.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, send it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/newsletter/notify/${productId}`, {
                    method: 'POST',
                    headers: this.getAuthHeaders()
                });
                const data = await response.json();

                if (data.status === 'success') {
                    this.showNotification('Notification sent successfully!', 'success');
                    await this.loadNotifications();
                    this.updateStats();
                } else {
                    throw new Error(data.message || 'Failed to send notification');
                }
            } catch (error) {
                console.error('Error sending notification:', error);
                this.showNotification('Error sending notification', 'error');
            }
        }
    }

    exportSubscribers() {
        // Check if subscribers exist and is an array
        if (!this.subscribers || !Array.isArray(this.subscribers)) {
            this.showNotification('No subscribers to export', 'error');
            return;
        }

        const activeSubscribers = this.subscribers.filter(s => s.is_active);

        if (activeSubscribers.length === 0) {
            this.showNotification('No active subscribers to export', 'error');
            return;
        }

        const csvContent = [
            ['Email', 'Status', 'Subscribed Date'],
            ...activeSubscribers.map(s => [
                s.email || 'N/A',
                s.is_active ? 'Active' : 'Inactive',
                s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification('Subscribers exported successfully!', 'success');
    }

    showNotification(message, type) {
        Swal.fire({
            title: type === 'success' ? 'Success!' : 'Error!',
            text: message,
            icon: type,
            timer: type === 'success' ? 3000 : undefined,
            timerProgressBar: type === 'success'
        });
    }
}

// Initialize newsletter manager
const newsletterManager = new NewsletterManager();

// Global functions for onclick handlers
window.exportSubscribers = () => newsletterManager.exportSubscribers(); 