// Cek token
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
const adminOnly = document.getElementById('adminOnly');
const notAdmin = document.getElementById('notAdmin');
const userTableBody = document.getElementById('userTableBody');
const logoutBtn = document.getElementById('logoutBtn');

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
            data.users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
          <td class="py-2 px-4 border-b">${user.username}</td>
          <td class="py-2 px-4 border-b">${user.email}</td>
          <td class="py-2 px-4 border-b">${user.fullname}</td>
          <td class="py-2 px-4 border-b">
            <select class="roleSelect bg-gray-100 rounded px-2 py-1" data-id="${user.id}" ${user.role === 'admin' ? 'disabled' : ''}>
              <option value="user" ${user.role === 'user' ? 'selected' : ''}>user</option>
              <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>moderator</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
            </select>
          </td>
          <td class="py-2 px-4 border-b text-center">${user.is_verified ? '<span class="text-green-600 font-bold">✔</span>' : '<span class="text-red-500 font-bold">✖</span>'}</td>
          <td class="py-2 px-4 border-b">
            <button class="updateRoleBtn px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" data-id="${user.id}" ${user.role === 'admin' ? 'disabled' : ''}>Update</button>
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
                title: 'Update Role?',
                text: `Yakin ingin mengubah role user ini menjadi ${newRole}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, update!'
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
                                Swal.fire('Berhasil!', data.message, 'success');
                                loadUsers();
                            } else {
                                Swal.fire('Gagal!', data.error || 'Gagal update role', 'error');
                            }
                        });
                }
            });
        });
    });
}

logoutBtn.addEventListener('click', function () {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/login/';
}); 