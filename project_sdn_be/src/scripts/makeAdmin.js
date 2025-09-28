import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/database.js'
import User from '../models/User.js'

async function run() {
  await connectDB()
  try {
    console.log('Making user admin...')
    
    // Tìm user đầu tiên và cập nhật role thành admin
    const user = await User.findOne()
    if (!user) {
      console.log('No users found. Please create a user first.')
      return
    }

    // Thêm role admin vào roles array
    const updatedRoles = [...new Set([...user.roles, 'admin'])]
    await User.findByIdAndUpdate(user._id, { roles: updatedRoles })
    
    console.log(`User ${user.name} (${user.email}) is now admin with roles: ${updatedRoles.join(', ')}`)
    
  } catch (err) {
    console.error(err)
  } finally {
    await mongoose.connection.close()
    console.log('Done.')
  }
}

run()
