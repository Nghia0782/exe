# Hướng dẫn cấu hình MongoDB cho Transactions

## Vấn đề
Lỗi "Transaction numbers are only allowed on a replica set member or mongos" xảy ra khi cố gắng sử dụng MongoDB transactions trên một instance đơn lẻ (standalone).

## Giải pháp

### 1. Cài đặt MongoDB (nếu chưa có)

#### Windows:
```bash
# Tải MongoDB Community Server từ https://www.mongodb.com/try/download/community
# Hoặc sử dụng Chocolatey
choco install mongodb
```

#### macOS:
```bash
# Sử dụng Homebrew
brew tap mongodb/brew
brew install mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
# Import public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### 2. Khởi tạo MongoDB Replica Set

#### Phương pháp 1: Sử dụng script tự động
```bash
# Chạy script setup
node setup-mongodb-replica.js
```

#### Phương pháp 2: Thủ công

1. **Tạo thư mục dữ liệu:**
```bash
mkdir -p ./data/db1 ./data/db2 ./data/db3
```

2. **Khởi động 3 MongoDB instances:**
```bash
# Terminal 1
mongod --port 27017 --replSet rs0 --dbpath ./data/db1

# Terminal 2  
mongod --port 27018 --replSet rs0 --dbpath ./data/db2

# Terminal 3
mongod --port 27019 --replSet rs0 --dbpath ./data/db3
```

3. **Kết nối và khởi tạo replica set:**
```bash
# Kết nối đến MongoDB shell
mongosh --port 27017

# Trong MongoDB shell, chạy:
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})

# Kiểm tra trạng thái
rs.status()
```

### 3. Cấu hình Environment Variables

Cập nhật file `.env`:
```env
# Cho replica set (hỗ trợ transactions)
MONGO_URI=mongodb://localhost:27017,localhost:27018,localhost:27019/techrental?replicaSet=rs0
MONGO_REPLICA_SET=rs0

# Hoặc cho standalone (không hỗ trợ transactions)
# MONGO_URI=mongodb://localhost:27017/techrental
```

### 4. Kiểm tra kết nối

Khởi động ứng dụng và kiểm tra log:
```bash
npm run dev
```

Bạn sẽ thấy log như:
```
MongoDB connected successfully
MongoDB server status: { replicaSet: 'rs0', supportsTransactions: true }
```

## Troubleshooting

### Lỗi "replica set not initialized"
```bash
# Kết nối đến MongoDB shell
mongosh --port 27017

# Khởi tạo lại replica set
rs.initiate()
```

### Lỗi "connection refused"
- Đảm bảo MongoDB đang chạy trên các port 27017, 27018, 27019
- Kiểm tra firewall settings

### Lỗi "replica set name mismatch"
- Đảm bảo tên replica set trong connection string khớp với cấu hình
- Mặc định là `rs0`

## Production Setup

### MongoDB Atlas (Khuyến nghị)
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/techrental?retryWrites=true&w=majority
```

### Self-hosted Production
```env
MONGO_URI=mongodb://primary:27017,secondary1:27017,secondary2:27017/techrental?replicaSet=rs0&authSource=admin
```

## Lưu ý quan trọng

1. **Development**: Sử dụng replica set local để test transactions
2. **Production**: Sử dụng MongoDB Atlas hoặc replica set production
3. **Performance**: Replica set có overhead nhỏ so với standalone
4. **Backup**: Luôn backup dữ liệu trước khi thay đổi cấu hình

## Scripts hữu ích

### Khởi động replica set (Windows)
```batch
@echo off
start "MongoDB 1" mongod --port 27017 --replSet rs0 --dbpath ./data/db1
start "MongoDB 2" mongod --port 27018 --replSet rs0 --dbpath ./data/db2  
start "MongoDB 3" mongod --port 27019 --replSet rs0 --dbpath ./data/db3
```

### Khởi động replica set (Linux/macOS)
```bash
#!/bin/bash
mongod --port 27017 --replSet rs0 --dbpath ./data/db1 --fork --logpath ./logs/mongod1.log
mongod --port 27018 --replSet rs0 --dbpath ./data/db2 --fork --logpath ./logs/mongod2.log
mongod --port 27019 --replSet rs0 --dbpath ./data/db3 --fork --logpath ./logs/mongod3.log
```
