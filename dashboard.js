// Cek token
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
const adminOnly = document.getElementById('adminOnly');
const notAdmin = document.getElementById('notAdmin');
const userTableBody = document.getElementById('userTableBody');
const logoutBtn = document.getElementById('logoutBtn');
const adminName = document.getElementById('adminName');
const adminRole = document.getElementById('adminRole');

// Sidebar functionality
const sidebar = document.getElementById('sidebar');
const openSidebar = document.getElementById('openSidebar');
const closeSidebar = document.getElementById('closeSidebar');

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
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .then(res => res.json())
        .then(data => {
            userTableBody.innerHTML = '';

            // Update stats
            document.getElementById('totalUsers').textContent = data.total;
            const verifiedCount = data.users.filter(user => user.is_verified).length;
            const pendingCount = data.total - verifiedCount;
            const adminCount = data.users.filter(user => user.role === 'admin').length;

            document.getElementById('verifiedUsers').textContent = verifiedCount;
            document.getElementById('pendingUsers').textContent = pendingCount;
            document.getElementById('adminUsers').textContent = adminCount;

            data.users.forEach(user => {
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
            <select class="roleSelect text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-black focus:border-transparent" data-id="${user.id}" ${user.role === 'admin' ? 'disabled' : ''}>
              <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
              <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            ${user.is_verified ?
                        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><i class="fas fa-check mr-1"></i>Verified</span>' :
                        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><i class="fas fa-clock mr-1"></i>Pending</span>'
                    }
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button class="updateRoleBtn inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors" data-id="${user.id}" ${user.role === 'admin' ? 'disabled' : ''}>
              <i class="fas fa-edit mr-1"></i>Update
            </button>
          </td>
        `;
                userTableBody.appendChild(tr);
            });
            addRoleUpdateListeners();
        });
}

function addRoleUpdateListeners() {
    document.querySelectorAll('.updateRoleBtn').forEach(btn => {
        btn.addEventListener('click', function () {
            const userId = this.getAttribute('data-id');
            const select = document.querySelector(`select[data-id='${userId}']`);
            const newRole = select.value;

            Swal.fire({
                title: 'Update User Role?',
                text: `Are you sure you want to change this user's role to ${newRole}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#000000',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, update it!',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch('https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha/auth/update-role', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ user_id: userId, role: newRole })
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.message) {
                                Swal.fire({
                                    title: 'Success!',
                                    text: data.message,
                                    icon: 'success',
                                    confirmButtonColor: '#000000'
                                });
                                loadUsers();
                            } else {
                                Swal.fire({
                                    title: 'Error!',
                                    text: data.error || 'Failed to update role',
                                    icon: 'error',
                                    confirmButtonColor: '#EF4444'
                                });
                            }
                        });
                }
            });
        });
    });
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