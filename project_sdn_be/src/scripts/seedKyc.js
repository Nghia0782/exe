import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/database.js'
import KycRequest from '../models/KycRequest.js'
import User from '../models/User.js'

const sampleKycRequests = [
  {
    fullName: 'Nguyễn Văn A',
    idType: 'cccd',
    idNumber: '123456789',
    issueDate: new Date('2020-01-01'),
    expiryDate: new Date('2030-01-01'),
    address: '123 Đường ABC, Quận 1, TP.HCM',
    frontImageUrl: 'https://picsum.photos/400/300?random=1',
    backImageUrl: 'https://picsum.photos/400/300?random=2',
    selfieImageUrl: 'https://picsum.photos/400/300?random=3',
    status: 'pending',
  },
  {
    fullName: 'Trần Thị B',
    idType: 'cccd',
    idNumber: '987654321',
    issueDate: new Date('2019-05-15'),
    expiryDate: new Date('2029-05-15'),
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    frontImageUrl: 'https://picsum.photos/400/300?random=4',
    backImageUrl: 'https://picsum.photos/400/300?random=5',
    selfieImageUrl: 'https://picsum.photos/400/300?random=6',
    status: 'pending',
  },
  {
    fullName: 'Lê Văn C',
    idType: 'passport',
    idNumber: 'P1234567',
    issueDate: new Date('2021-03-10'),
    expiryDate: new Date('2031-03-10'),
    address: '789 Đường DEF, Quận 3, TP.HCM',
    frontImageUrl: 'https://picsum.photos/400/300?random=7',
    backImageUrl: 'https://picsum.photos/400/300?random=8',
    selfieImageUrl: 'https://picsum.photos/400/300?random=9',
    status: 'approved',
  },
  {
    fullName: 'Phạm Thị D',
    idType: 'cccd',
    idNumber: '456789123',
    issueDate: new Date('2018-12-20'),
    expiryDate: new Date('2028-12-20'),
    address: '321 Đường GHI, Quận 4, TP.HCM',
    frontImageUrl: 'https://picsum.photos/400/300?random=10',
    backImageUrl: 'https://picsum.photos/400/300?random=11',
    selfieImageUrl: 'https://picsum.photos/400/300?random=12',
    status: 'rejected',
    reason: 'Ảnh không rõ nét, vui lòng chụp lại',
  },
]

async function run() {
  await connectDB()
  try {
    console.log('Seeding KYC requests...')
    
    // Tìm user đầu tiên để gán userId
    const firstUser = await User.findOne()
    if (!firstUser) {
      console.log('No users found. Please create a user first.')
      return
    }

    // Xóa các KYC cũ để tránh trùng lặp
    await KycRequest.deleteMany({})
    console.log('Cleared existing KYC requests')

    // Tạo KYC requests mới
    const kycRequests = sampleKycRequests.map(kyc => ({
      ...kyc,
      userId: firstUser._id,
    }))

    const inserted = await KycRequest.insertMany(kycRequests)
    console.log(`Inserted ${inserted.length} KYC requests`)
    
  } catch (err) {
    console.error(err)
  } finally {
    await mongoose.connection.close()
    console.log('Done.')
  }
}

run()
