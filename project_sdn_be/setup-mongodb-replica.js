#!/usr/bin/env node

/**
 * Script để khởi tạo MongoDB Replica Set cho development
 * Chạy script này sau khi đã cài đặt MongoDB
 */

import { MongoClient } from 'mongodb';

const REPLICA_SET_NAME = 'rs0';
const PORTS = [27017, 27018, 27019];

async function setupReplicaSet() {
  console.log('🚀 Đang khởi tạo MongoDB Replica Set...');
  
  try {
    // Kết nối đến MongoDB instance đầu tiên
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    
    const admin = client.db().admin();
    
    // Kiểm tra xem replica set đã tồn tại chưa
    try {
      const status = await admin.replSetGetStatus();
      console.log('✅ Replica set đã tồn tại:', status.set);
      await client.close();
      return;
    } catch (error) {
      console.log('📝 Replica set chưa tồn tại, đang tạo mới...');
    }
    
    // Cấu hình replica set
    const config = {
      _id: REPLICA_SET_NAME,
      members: PORTS.map((port, index) => ({
        _id: index,
        host: `localhost:${port}`,
        priority: index === 0 ? 2 : 1
      }))
    };
    
    console.log('⚙️  Cấu hình replica set:', JSON.stringify(config, null, 2));
    
    // Khởi tạo replica set
    await admin.replSetInitiate(config);
    console.log('✅ Replica set đã được khởi tạo thành công!');
    
    // Đợi một chút để replica set khởi động
    console.log('⏳ Đang đợi replica set khởi động...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Kiểm tra trạng thái
    const status = await admin.replSetGetStatus();
    console.log('📊 Trạng thái replica set:');
    console.log(JSON.stringify(status, null, 2));
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo replica set:', error.message);
    console.log('\n📋 Hướng dẫn thủ công:');
    console.log('1. Khởi động MongoDB với replica set:');
    console.log('   mongod --port 27017 --replSet rs0 --dbpath ./data/db1');
    console.log('   mongod --port 27018 --replSet rs0 --dbpath ./data/db2');
    console.log('   mongod --port 27019 --replSet rs0 --dbpath ./data/db3');
    console.log('\n2. Kết nối đến MongoDB shell:');
    console.log('   mongosh --port 27017');
    console.log('\n3. Khởi tạo replica set:');
    console.log('   rs.initiate({');
    console.log('     _id: "rs0",');
    console.log('     members: [');
    console.log('       { _id: 0, host: "localhost:27017" },');
    console.log('       { _id: 1, host: "localhost:27018" },');
    console.log('       { _id: 2, host: "localhost:27019" }');
    console.log('     ]');
    console.log('   })');
  }
}

// Chạy script
setupReplicaSet().then(() => {
  console.log('\n🎉 Hoàn thành! Bây giờ bạn có thể sử dụng transactions trong ứng dụng.');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script thất bại:', error);
  process.exit(1);
});
