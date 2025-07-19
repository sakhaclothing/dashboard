# Admin Authentication - Newsletter Dashboard

## Overview

Newsletter Management Dashboard sekarang dilengkapi dengan sistem autentikasi admin yang memastikan hanya user dengan role admin yang dapat mengakses dan mengelola newsletter.

## Fitur Keamanan

### 1. Token-based Authentication

- Menggunakan JWT token dari localStorage
- Token diverifikasi setiap kali halaman dimuat
- Auto logout jika token expired atau invalid

### 2. Role-based Access Control

- Hanya user dengan role `admin` yang dapat mengakses dashboard
- User non-admin akan melihat halaman "Access Denied"
- Konten dashboard disembunyikan untuk non-admin

### 3. Secure API Calls

- Semua API calls menggunakan Authorization header
- Token otomatis disertakan di setiap request
- Error handling untuk unauthorized access

## Flow Authentication

### 1. Page Load

```javascript
// Check token existence
const token = localStorage.getItem("token");
if (!token) {
  showAccessDenied("Please login to access this page");
  return;
}
```

### 2. Token Verification

```javascript
// Verify token with backend
const response = await fetch(`${apiBaseUrl}/auth/verify`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

### 3. Role Check

```javascript
// Check if user is admin
if (data.user.role === "admin") {
  this.isAdmin = true;
  showAdminContent();
} else {
  showAccessDenied("Access denied. Admin privileges required.");
}
```

## API Endpoints yang Dilindungi

### Newsletter Management

- `GET /newsletter/subscribers` - Get all subscribers
- `GET /newsletter/history` - Get notification history
- `POST /newsletter/subscribe` - Subscribe user
- `POST /newsletter/unsubscribe` - Unsubscribe user
- `POST /newsletter/notify/{id}` - Send notification

### Product Management

- `GET /products?all=true` - Get all products

### Authentication

- `GET /auth/verify` - Verify JWT token

## Error Handling

### 1. No Token

```javascript
showAccessDenied("Please login to access this page");
```

### 2. Invalid Token

```javascript
showAccessDenied("Invalid or expired session. Please login again.");
```

### 3. Non-Admin User

```javascript
showAccessDenied("Access denied. Admin privileges required.");
```

### 4. Token Expired (401 Response)

```javascript
showAccessDenied("Session expired. Please login again.");
```

## UI Components

### 1. Access Denied Page

- Icon shield dengan warna merah
- Pesan error yang jelas
- Tombol Login dan Go Home
- Background abu-abu

### 2. Admin Header

- Nama admin dari token
- Role administrator
- Logout button
- Notification bell

### 3. Admin Content

- Stats cards
- Newsletter management tabs
- Subscriber table
- Notification history
- Send notification form

## Security Best Practices

### 1. Token Storage

- Token disimpan di localStorage
- Auto clear saat logout
- Tidak ada hardcoded tokens

### 2. API Security

- Semua requests menggunakan HTTPS
- Authorization header di setiap request
- CORS protection

### 3. Session Management

- Auto logout saat token expired
- Clear localStorage saat logout
- Redirect ke login page

## Testing Scenarios

### 1. Valid Admin Access

- Login dengan user admin
- Akses newsletter dashboard
- Semua fitur tersedia

### 2. Non-Admin Access

- Login dengan user biasa
- Akses newsletter dashboard
- Lihat halaman "Access Denied"

### 3. No Authentication

- Akses tanpa login
- Lihat halaman "Please login"

### 4. Expired Token

- Token expired
- Auto redirect ke login

## Implementation Details

### 1. Constructor

```javascript
constructor() {
    this.isAdmin = false;
    this.user = null;
    this.checkAuthAndInit();
}
```

### 2. Authentication Check

```javascript
async checkAuthAndInit() {
    // Check token
    // Verify with backend
    // Check role
    // Initialize if admin
}
```

### 3. API Headers

```javascript
getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}
```

### 4. Logout

```javascript
logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}
```

## Troubleshooting

### 1. "Please login to access this page"

**Cause**: No token in localStorage
**Solution**: Login melalui halaman login

### 2. "Invalid or expired session"

**Cause**: Token invalid atau expired
**Solution**: Login ulang untuk mendapatkan token baru

### 3. "Access denied. Admin privileges required"

**Cause**: User bukan admin
**Solution**: Gunakan akun dengan role admin

### 4. API calls failing

**Cause**: Token tidak disertakan atau expired
**Solution**: Check network tab, login ulang jika perlu

## Future Enhancements

### 1. Refresh Token

- Implement refresh token mechanism
- Auto refresh expired tokens
- Seamless user experience

### 2. Multi-factor Authentication

- 2FA untuk admin access
- SMS/Email verification
- Enhanced security

### 3. Session Timeout

- Configurable session timeout
- Warning before timeout
- Auto logout after inactivity

### 4. Audit Logging

- Log admin actions
- Track user activities
- Security monitoring
