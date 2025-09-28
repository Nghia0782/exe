# Google OAuth Setup Guide

## Cấu hình Google OAuth

### 1. Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable Google+ API và Google OAuth2 API
4. Vào "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Chọn "Web application"
6. Thêm Authorized redirect URIs:
   - Development: `http://localhost:5000/api/auth/google/callback`
   - Production: `https://your-domain.com/api/auth/google/callback`

### 2. Cấu hình Environment Variables

Thêm các biến môi trường sau vào file `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Frontend URL (để redirect sau khi login)
CLIENT_URL=http://localhost:3000

# JWT Secret
SECRET_KEY=your_jwt_secret_key_here
```

### 3. API Endpoints

#### Login với Google
- **GET** `/api/auth/google` - Bắt đầu OAuth flow
- **GET** `/api/auth/google/callback` - Callback từ Google (tự động)

### 4. Flow hoạt động

1. User click "Login with Google" → redirect đến `/api/auth/google`
2. Google xác thực user → redirect về `/api/auth/google/callback`
3. Server tạo/cập nhật user với `identityVerification.status = "verified"`
4. Redirect về frontend với JWT token và user info

### 5. Response Format

Sau khi login thành công, user sẽ được redirect về:
```
CLIENT_URL/oauth-callback?token=JWT_TOKEN&user=USER_INFO_JSON
```

### 6. User Model Updates

Khi login bằng Google:
- `identityVerification.status` tự động set thành `"verified"`
- `identityVerification.verifiedAt` được set thành thời gian hiện tại
- Nếu user đã tồn tại, thông tin sẽ được cập nhật và đảm bảo verified

### 7. Testing

1. Start server: `npm run dev`
2. Truy cập: `http://localhost:5000/api/auth/google`
3. Đăng nhập với Google account
4. Kiểm tra redirect về frontend với token 