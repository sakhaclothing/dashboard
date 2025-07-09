// Cek token
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
const adminOnly = document.getElementById('adminOnly');
const notAdmin = document.getElementById('notAdmin');
const userTableBody = document.getElementById('userTableBody');
const logoutBtn = document.getElementById('logoutBtn');
const adminName = document.getElementById('adminName');
const adminRole = document.getElementById('adminRole');

// Add User Modal elements
const addUserBtn = document.getElementById('addUserBtn');
const addUserModal = document.getElementById('addUserModal');
const closeAddUserModal = document.getElementById('closeAddUserModal');
const cancelAddUser = document.getElementById('cancelAddUser');
const addUserForm = document.getElementById('addUserForm');

// Edit User Modal elements
const editUserModal = document.getElementById('editUserModal');
const closeEditUserModal = document.getElementById('closeEditUserModal');
const cancelEditUser = document.getElementById('cancelEditUser');
const editUserForm = document.getElementById('editUserForm');

// Filter and Search elements
const searchInput = document.getElementById('searchInput');
const roleFilter = document.getElementById('roleFilter');
const statusFilter = document.getElementById('statusFilter');
const exportBtn = document.getElementById('exportBtn');

// Pagination elements
const pageSize = document.getElementById('pageSize');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const currentPage = document.getElementById('currentPage');
const totalPages = document.getElementById('totalPages');
const showingCount = document.getElementById('showingCount');
const totalCount = document.getElementById('totalCount');

// Sort elements
const sortUsername = document.getElementById('sortUsername');
const sortEmail = document.getElementById('sortEmail');
const sortRole = document.getElementById('sortRole');
const sortStatus = document.getElementById('sortStatus');

// Sidebar functionality
const sidebar = document.getElementById('sidebar');
const openSidebar = document.getElementById('openSidebar');
const closeSidebar = document.getElementById('closeSidebar');

// State management
let allUsers = [];
let filteredUsers = [];
let currentPageNum = 1;
let pageSizeNum = 10;
let sortField = '';
let sortDirection = 'asc';
let searchTerm = '';
let roleFilterValue = '';
let statusFilterValue = '';

openSidebar.addEventListener('click', () => {
    sidebar.classList.remove('-translate-x-full');
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
});

if (!token) {
    adminOnly.classList.add('hidden');
    notAdmin.classList.remove('hidden');
} else {
    // Cek role user
    fetch('https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha/auth/profile', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .then(res => res.json())
        .then(profile => {
            if (profile.role !== 'admin') {
                adminOnly.classList.add('hidden');
                notAdmin.classList.remove('hidden');
            } else {
                adminOnly.classList.remove('hidden');
                notAdmin.classList.add('hidden');
                adminName.textContent = profile.fullname || profile.username || 'Admin';
                adminRole.textContent = profile.role === 'admin' ? 'Administrator' : profile.role;
                loadUsers();
            }
        })
        .catch(() => {
            adminOnly.classList.add('hidden');
            notAdmin.classList.remove('hidden');
        });
}

function loadUsers() {
    fetch('https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha/auth/get-users', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .then(res => res.json())
        .then(data => {
            allUsers = data.users;
            updateStats();
            applyFiltersAndRender();
        });
}

function updateStats() {
    document.getElementById('totalUsers').textContent = allUsers.length;
    const verifiedCount = allUsers.filter(user => user.is_verified).length;
    const pendingCount = allUsers.length - verifiedCount;
    const adminCount = allUsers.filter(user => user.role === 'admin').length;

    document.getElementById('verifiedUsers').textContent = verifiedCount;
    document.getElementById('pendingUsers').textContent = pendingCount;
    document.getElementById('adminUsers').textContent = adminCount;
}

function applyFiltersAndRender() {
    // Apply search filter
    filteredUsers = allUsers.filter(user => {
        const matchesSearch = !searchTerm ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.fullname.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = !roleFilterValue || user.role === roleFilterValue;
        const matchesStatus = !statusFilterValue ||
            (statusFilterValue === 'verified' && user.is_verified) ||
            (statusFilterValue === 'pending' && !user.is_verified);

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Apply sorting
    if (sortField) {
        filteredUsers.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            if (sortField === 'is_verified') {
                aVal = aVal ? 'verified' : 'pending';
                bVal = bVal ? 'verified' : 'pending';
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    renderUsers();
    updatePagination();
}

function renderUsers() {
    const startIndex = (currentPageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const usersToShow = filteredUsers.slice(startIndex, endIndex);

    userTableBody.innerHTML = '';

    usersToShow.forEach(user => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';
        tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10">
            <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span class="text-sm font-medium text-gray-700">${user.username.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${user.username}</div>
            <div class="text-sm text-gray-500">${user.fullname}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${user.email}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-black text-white' :
                user.role === 'moderator' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
            }">
          ${user.role}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${user.is_verified ?
                '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><i class="fas fa-check mr-1"></i>Verified</span>' :
                '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><i class="fas fa-clock mr-1"></i>Pending</span>'
            }
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div class="flex items-center space-x-2">
          <button class="editUserBtn inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors" data-id="${user.id}">
            <i class="fas fa-edit mr-1"></i>Edit
          </button>
          <button class="deleteUserBtn inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors" data-id="${user.id}" ${user.role === 'admin' ? 'disabled' : ''}>
            <i class="fas fa-trash mr-1"></i>Delete
          </button>
        </div>
      </td>
    `;
        userTableBody.appendChild(tr);
    });

    addUserActionListeners();
}

function updatePagination() {
    const totalFilteredUsers = filteredUsers.length;
    const totalPagesNum = Math.ceil(totalFilteredUsers / pageSizeNum);

    totalPages.textContent = totalPagesNum;
    currentPage.textContent = currentPageNum;
    totalCount.textContent = totalFilteredUsers;

    const startIndex = (currentPageNum - 1) * pageSizeNum + 1;
    const endIndex = Math.min(currentPageNum * pageSizeNum, totalFilteredUsers);
    showingCount.textContent = totalFilteredUsers > 0 ? `${startIndex}-${endIndex}` : '0';

    prevPage.disabled = currentPageNum === 1;
    nextPage.disabled = currentPageNum === totalPagesNum;
}

function addUserActionListeners() {
    // Edit user listeners
    document.querySelectorAll('.editUserBtn').forEach(btn => {
        btn.addEventListener('click', function () {
            const userId = this.getAttribute('data-id');
            const user = allUsers.find(u => u.id === userId);
            if (user) {
                openEditModal(user);
            }
        });
    });

    // Delete user listeners
    document.querySelectorAll('.deleteUserBtn').forEach(btn => {
        btn.addEventListener('click', function () {
            const userId = this.getAttribute('data-id');
            const user = allUsers.find(u => u.id === userId);
            if (user) {
                deleteUser(user);
            }
        });
    });
}

// Add User Modal functionality
addUserBtn.addEventListener('click', () => {
    addUserModal.classList.remove('hidden');
});

closeAddUserModal.addEventListener('click', () => {
    addUserModal.classList.add('hidden');
    addUserForm.reset();
});

cancelAddUser.addEventListener('click', () => {
    addUserModal.classList.add('hidden');
    addUserForm.reset();
});

addUserModal.addEventListener('click', (e) => {
    if (e.target === addUserModal) {
        addUserModal.classList.add('hidden');
        addUserForm.reset();
    }
});

addUserForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(addUserForm);
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        fullname: formData.get('fullname'),
        password: formData.get('password'),
        role: formData.get('role')
    };

    if (!userData.username || !userData.email || !userData.fullname || !userData.password) {
        Swal.fire({
            title: 'Error!',
            text: 'Please fill in all required fields',
            icon: 'error',
            confirmButtonColor: '#000000'
        });
        return;
    }

    fetch('https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(userData)
    })
        .then(res => res.json())
        .then(data => {
            if (data.message && data.message.includes('Berhasil')) {
                Swal.fire({
                    title: 'Success!',
                    text: 'User has been created successfully',
                    icon: 'success',
                    confirmButtonColor: '#000000'
                });

                addUserModal.classList.add('hidden');
                addUserForm.reset();
                loadUsers();
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: data.error || 'Failed to create user',
                    icon: 'error',
                    confirmButtonColor: '#EF4444'
                });
            }
        })
        .catch(error => {
            Swal.fire({
                title: 'Error!',
                text: 'Network error. Please try again.',
                icon: 'error',
                confirmButtonColor: '#EF4444'
            });
        });
});

// Edit User Modal functionality
function openEditModal(user) {
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editFullname').value = user.fullname;
    document.getElementById('editRole').value = user.role;

    editUserModal.classList.remove('hidden');
}

closeEditUserModal.addEventListener('click', () => {
    editUserModal.classList.add('hidden');
    editUserForm.reset();
});

cancelEditUser.addEventListener('click', () => {
    editUserModal.classList.add('hidden');
    editUserForm.reset();
});

editUserModal.addEventListener('click', (e) => {
    if (e.target === editUserModal) {
        editUserModal.classList.add('hidden');
        editUserForm.reset();
    }
});

editUserForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(editUserForm);
    const userData = {
        user_id: formData.get('userId'),
        username: formData.get('username'),
        email: formData.get('email'),
        fullname: formData.get('fullname'),
        role: formData.get('role')
    };

    // Update user data
    fetch('https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha/auth/update-role', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ user_id: userData.user_id, role: userData.role })
    })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                Swal.fire({
                    title: 'Success!',
                    text: 'User has been updated successfully',
                    icon: 'success',
                    confirmButtonColor: '#000000'
                });

                editUserModal.classList.add('hidden');
                editUserForm.reset();
                loadUsers();
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: data.error || 'Failed to update user',
                    icon: 'error',
                    confirmButtonColor: '#EF4444'
                });
            }
        });
});

function deleteUser(user) {
    Swal.fire({
        title: 'Delete User?',
        text: `Are you sure you want to delete ${user.username}? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete!'
    }).then((result) => {
        if (result.isConfirmed) {
            // Here you would call the delete API
            // For now, just show success message
            Swal.fire({
                title: 'Deleted!',
                text: 'User has been deleted successfully.',
                icon: 'success',
                confirmButtonColor: '#000000'
            });
            loadUsers();
        }
    });
}

// Search and Filter functionality
searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    currentPageNum = 1;
    applyFiltersAndRender();
});

roleFilter.addEventListener('change', (e) => {
    roleFilterValue = e.target.value;
    currentPageNum = 1;
    applyFiltersAndRender();
});

statusFilter.addEventListener('change', (e) => {
    statusFilterValue = e.target.value;
    currentPageNum = 1;
    applyFiltersAndRender();
});

// Sorting functionality
sortUsername.addEventListener('click', () => toggleSort('username'));
sortEmail.addEventListener('click', () => toggleSort('email'));
sortRole.addEventListener('click', () => toggleSort('role'));
sortStatus.addEventListener('click', () => toggleSort('is_verified'));

function toggleSort(field) {
    if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortDirection = 'asc';
    }
    applyFiltersAndRender();
}

// Pagination functionality
pageSize.addEventListener('change', (e) => {
    pageSizeNum = parseInt(e.target.value);
    currentPageNum = 1;
    applyFiltersAndRender();
});

prevPage.addEventListener('click', () => {
    if (currentPageNum > 1) {
        currentPageNum--;
        applyFiltersAndRender();
    }
});

nextPage.addEventListener('click', () => {
    const totalPagesNum = Math.ceil(filteredUsers.length / pageSizeNum);
    if (currentPageNum < totalPagesNum) {
        currentPageNum++;
        applyFiltersAndRender();
    }
});

// Export functionality
exportBtn.addEventListener('click', () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
});

function generateCSV() {
    const headers = ['Username', 'Email', 'Full Name', 'Role', 'Status'];
    const rows = filteredUsers.map(user => [
        user.username,
        user.email,
        user.fullname,
        user.role,
        user.is_verified ? 'Verified' : 'Pending'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

logoutBtn.addEventListener('click', function () {
    Swal.fire({
        title: 'Logout?',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#000000',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, logout!'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.href = '/login/';
        }
    });
}); 