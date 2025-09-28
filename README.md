# SDN Project - Full Stack E-commerce Platform

Dự án thương mại điện tử full-stack với React frontend và Node.js backend.

## 🚀 Tính năng chính

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Authentication**: JWT + Google OAuth
- **UI Components**: Radix UI + Shadcn/ui
- **Real-time**: Socket.io cho chat
- **Payment**: Tích hợp thanh toán
- **Admin Panel**: Quản lý sản phẩm, đơn hàng, người dùng
- **KYC**: Xác minh danh tính người dùng

## 📋 Yêu cầu hệ thống

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm hoặc yarn

## 🛠️ Cài đặt và chạy dự án

### 1. Clone repository

```bash
git clone https://github.com/Nghia0782/exe.git
cd exe
```

### 2. Cài đặt dependencies

#### Backend
```bash
cd project_sdn_be
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

### 3. Cấu hình Environment Variables

#### Backend (.env trong thư mục project_sdn_be)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sdn_project
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

#### Frontend (.env trong thư mục frontend)
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Khởi động MongoDB

Đảm bảo MongoDB đang chạy trên máy của bạn:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 5. Chạy dự án

#### Terminal 1 - Backend
```bash
cd project_sdn_be
npm start
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### 6. Truy cập ứng dụng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📁 Cấu trúc dự án

```
exe/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/          # Page components
│   │   ├── shared/         # Shared utilities
│   │   └── ...
│   └── package.json
├── project_sdn_be/          # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── ...
│   └── package.json
└── README.md
```

## 🔧 Scripts có sẵn

### Backend
```bash
npm start          # Chạy server production
npm run dev        # Chạy server development
npm run seed       # Seed dữ liệu mẫu
```

### Frontend
```bash
npm run dev        # Chạy development server
npm run build      # Build cho production
npm run preview    # Preview build
```

## 🗄️ Database

Dự án sử dụng MongoDB với các collections chính:
- Users (người dùng)
- Products (sản phẩm)
- Orders (đơn hàng)
- Categories (danh mục)
- Reviews (đánh giá)

## 🔐 Authentication

- JWT tokens cho authentication
- Google OAuth integration
- Role-based access control (Admin, User, Seller)

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/google` - Google OAuth

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `GET /api/products/:id` - Lấy chi tiết sản phẩm

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `PUT /api/orders/:id` - Cập nhật đơn hàng

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- GitHub: [@Nghia0782](https://github.com/Nghia0782)
- Email: your-email@example.com

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
