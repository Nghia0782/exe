import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/database.js'
import User from '../models/User.js'

async function upsertUser(doc) {
  const { email, ...rest } = doc
  const existing = await User.findOne({ email })
  if (existing) {
    const roles = Array.from(new Set([...(existing.roles || []), ...(rest.roles || [])]))
    await User.updateOne({ _id: existing._id }, { $set: { ...rest, roles } })
    return existing
  }
  return await User.create({ email, ...rest })
}

async function run() {
  await connectDB()
  try {
    const users = [
      { name: 'Customer One', email: 'customer1@example.com', roles: ['renter'], kycStatus: 'verified' },
      { name: 'Owner One', email: 'owner1@example.com', roles: ['owner'], kycStatus: 'premium' },
      { name: 'Admin One', email: 'admin1@example.com', roles: ['admin'] },
    ]
    for (const u of users) {
      await upsertUser(u)
      console.log('Ensured user:', u.email, u.roles.join(','))
    }
    console.log('Done users.')
  } catch (e) {
    console.error(e)
  } finally {
    await mongoose.connection.close()
  }
}

run()


