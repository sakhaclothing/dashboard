// Cek token
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
const adminOnly = document.getElementById('adminOnly');
const notAdmin = document.getElementById('notAdmin');
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
                // Ambil total visitor dari endpoint count
                fetch("https://asia-southeast2-ornate-course-437014-u9.cloudfunctions.net/sakha/tracker/count")
                    .then(res => res.json())
                    .then(data => {
                        document.getElementById('totalVisitors').textContent = data.count ?? '-';
                    })
                    .catch(() => {
                        document.getElementById('totalVisitors').textContent = '-';
                    });
            }
        })
        .catch(() => {
            adminOnly.classList.add('hidden');
            notAdmin.classList.remove('hidden');
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