# 🚀 Hướng dẫn Setup Nhanh

## Bước 1: Clone và cài đặt

```bash
# Clone repository
git clone https://github.com/Nghia0782/exe.git
cd exe

# Cài đặt backend dependencies
cd project_sdn_be
npm install

# Cài đặt frontend dependencies
cd ../frontend
npm install
```

## Bước 2: Cấu hình Environment

### Backend (.env trong project_sdn_be/)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sdn_project
JWT_SECRET=your_super_secret_jwt_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Frontend (.env trong frontend/)
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Bước 3: Khởi động MongoDB

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

## Bước 4: Chạy dự án

### Terminal 1 - Backend
```bash
cd project_sdn_be
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## Bước 5: Seed dữ liệu (Tùy chọn)

```bash
cd project_sdn_be
npm run seed:everything
```

## 🎉 Hoàn thành!

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 🔧 Scripts hữu ích

### Backend
- `npm run dev` - Development server
- `npm run seed:all` - Seed tất cả dữ liệu
- `npm run make:admin` - Tạo admin user
- `npm run health` - Kiểm tra health

### Frontend
- `npm run dev` - Development server
- `npm run build` - Build production
- `npm run preview` - Preview build
