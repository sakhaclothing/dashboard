// Admin check logic
const adminOnly = document.getElementById('adminOnly');
const notAdmin = document.getElementById('notAdmin');
const adminName = document.getElementById('adminName');
const adminRole = document.getElementById('adminRole');
const token = localStorage.getItem('token');

if (!token) {
    if (adminOnly) adminOnly.classList.add('hidden');
    if (notAdmin) notAdmin.classList.remove('hidden');
} else {
    fetch('https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha/auth/profile', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .then(res => res.json())
        .then(profile => {
            if (profile.role !== 'admin') {
                if (adminOnly) adminOnly.classList.add('hidden');
                if (notAdmin) notAdmin.classList.remove('hidden');
            } else {
                if (adminOnly) adminOnly.classList.remove('hidden');
                if (notAdmin) notAdmin.classList.add('hidden');
                if (adminName) adminName.textContent = profile.fullname || profile.username || profile.email || 'Admin';
                if (adminRole) adminRole.textContent = profile.role === 'admin' ? 'Administrator' : profile.role;
                // Hanya inisialisasi sekali!
                if (!window.productManager) {
                    window.productManager = new ProductManager();
                }
            }
        })
        .catch(() => {
            if (adminOnly) adminOnly.classList.add('hidden');
            if (notAdmin) notAdmin.classList.remove('hidden');
        });
}

// Product Management JavaScript
class ProductManager {
    constructor() {
        this.products = [];
        this.currentProduct = null;
        this.apiBaseUrl = 'https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha';
        this.isSaving = false;
        console.log('ProductManager initialized');
        this.initializeEventListeners();
        this.loadProducts();
    }

    initializeEventListeners() {
        // Sidebar toggle
        document.getElementById('openSidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('-translate-x-full');
        });

        document.getElementById('closeSidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('-translate-x-full');
        });

        // Modal controls
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Form submission
        const productForm = document.getElementById('productForm');
        if (!productForm._submitAttached) {
            productForm.addEventListener('submit', (e) => {
                console.log('Form submit event attached');
                e.preventDefault();
                this.saveProduct();
            });
            productForm._submitAttached = true;
        }

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterProducts();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterProducts();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.filterProducts();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    async loadProducts() {
        try {
            // Use all=true to get all products (active and inactive) for admin dashboard
            const url = `${this.apiBaseUrl}/products?all=true`;
            console.log('Loading products from:', url);

            const response = await fetch(url);
            console.log('Load response status:', response.status);

            const data = await response.json();
            console.log('Load response data:', data);

            if (data.status === 'success') {
                this.products = data.data;
                console.log('Loaded products:', this.products);
                this.renderProducts();
            } else {
                throw new Error(data.message || 'Failed to load products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification(`Error loading products: ${error.message}`, 'error');
        }
    }

    renderProducts(productsToRender = this.products) {
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';

        if (productsToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No products found
                    </td>
                </tr>
            `;
            return;
        }

        productsToRender.forEach(product => {
            // Use _id if available (MongoDB ObjectId), otherwise use id
            const productId = product._id || product.id;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-lg object-cover" 
                                 src="${product.image_url || 'https://via.placeholder.com/40x40?text=No+Image'}" 
                                 alt="${product.name}">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${product.name}</div>
                            <div class="text-sm text-gray-500">${product.description || 'No description'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${product.category || 'Uncategorized'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp ${product.price.toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.stock}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">
                        ${product.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="productManager.toggleFeatured('${productId}')" 
                            class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                }">
                        ${product.is_featured ? 'Featured' : 'Not Featured'}
                    </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="productManager.editProduct('${productId}')" 
                            class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="productManager.deleteProduct('${productId}')" 
                            class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    filterProducts() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        const filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm));

            const matchesCategory = !categoryFilter || product.category === categoryFilter;

            let matchesStatus = true;
            if (statusFilter === 'active') {
                matchesStatus = product.is_active;
            } else if (statusFilter === 'inactive') {
                matchesStatus = !product.is_active;
            } else if (statusFilter === 'featured') {
                matchesStatus = product.is_featured;
            }

            return matchesSearch && matchesCategory && matchesStatus;
        });

        this.renderProducts(filteredProducts);
    }

    openModal(product = null) {
        this.currentProduct = product;
        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('productForm');

        if (product) {
            modalTitle.textContent = 'Edit Product';
            this.fillFormWithProduct(product);
        } else {
            modalTitle.textContent = 'Add New Product';
            form.reset();
            document.getElementById('productId').value = '';
        }

        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('productModal').classList.add('hidden');
        this.currentProduct = null;
    }

    fillFormWithProduct(product) {
        // Use _id if available (MongoDB ObjectId), otherwise use id
        const productId = product._id || product.id;
        document.getElementById('productId').value = productId;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productImage').value = product.image_url || '';
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productActive').checked = product.is_active;
        document.getElementById('productFeatured').checked = product.is_featured;
    }

    async saveProduct() {
        if (this.isSaving) return;
        this.isSaving = true;
        try {
            const productId = document.getElementById('productId').value;
            const isEdit = productId !== '';

            const productData = {
                name: document.getElementById('productName').value.trim(),
                description: document.getElementById('productDescription').value.trim(),
                price: parseFloat(document.getElementById('productPrice').value),
                category: document.getElementById('productCategory').value,
                image_url: document.getElementById('productImage').value.trim(),
                stock: parseInt(document.getElementById('productStock').value),
                is_active: document.getElementById('productActive').checked,
                is_featured: document.getElementById('productFeatured').checked
            };

            // Validasi sederhana
            if (!productData.name) {
                this.showNotification('Product name is required', 'error');
                return;
            }

            const url = isEdit
                ? `${this.apiBaseUrl}/products/${productId}`
                : `${this.apiBaseUrl}/products`;
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            const data = await response.json();

            if (data.status === 'success') {
                this.showNotification('Product saved successfully!', 'success');
                this.closeModal();
                await this.loadProducts();
            } else {
                throw new Error(data.message || 'Failed to save product');
            }
        } catch (error) {
            this.showNotification(`Error saving product: ${error.message}`, 'error');
        } finally {
            this.isSaving = false;
        }
    }

    async editProduct(productId) {
        console.log('Editing product with ID:', productId);
        console.log('Available products:', this.products);

        // Try to find by both id and _id (MongoDB ObjectId)
        const product = this.products.find(p => p.id === productId || p._id === productId);

        if (product) {
            console.log('Found product:', product);
            this.openModal(product);
        } else {
            console.error('Product not found with ID:', productId);
            this.showNotification('Product not found', 'error');
        }
    }

    async deleteProduct(productId) {
        console.log('Deleting product with ID:', productId);

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const url = `${this.apiBaseUrl}/products/${productId}`;
                console.log('Delete URL:', url);

                const response = await fetch(url, {
                    method: 'DELETE'
                });

                console.log('Delete response status:', response.status);
                const data = await response.json();
                console.log('Delete response data:', data);

                if (data.status === 'success') {
                    this.showNotification('Product deleted successfully', 'success');
                    this.loadProducts();
                } else {
                    throw new Error(data.message || 'Failed to delete product');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                this.showNotification(`Error deleting product: ${error.message}`, 'error');
            }
        }
    }

    async toggleFeatured(productId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/products/${productId}/featured`, {
                method: 'PATCH'
            });

            const data = await response.json();

            if (data.status === 'success') {
                this.showNotification('Featured status updated successfully', 'success');
                this.loadProducts();
            } else {
                throw new Error(data.message || 'Failed to update featured status');
            }
        } catch (error) {
            console.error('Error updating featured status:', error);
            this.showNotification('Error updating featured status', 'error');
        }
    }

    showNotification(message, type = 'info') {
        Swal.fire({
            title: type === 'success' ? 'Success!' : type === 'error' ? 'Error!' : 'Info',
            text: message,
            icon: type,
            timer: type === 'success' ? 2000 : undefined,
            timerProgressBar: type === 'success'
        });
    }

    logout() {
        // Clear any stored authentication data
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');

        // Clear user session cookie
        document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Redirect to login page
        window.location.href = '/login/';
    }
}

// Initialize the product manager when the page loads
let productManager;
document.addEventListener('DOMContentLoaded', () => {
    productManager = new ProductManager();
}); 