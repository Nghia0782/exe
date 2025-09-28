import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/database.js'
import User from '../models/User.js'
import ShopDetail from '../models/ShopDetail.js'
import Order from '../models/Order.js'
import OrderReview from '../models/OrderReview.js'
import Deposit from '../models/Deposit.js'
import PaymentHistory from '../models/PaymentHistory.js'
import bcrypt from 'bcryptjs'

async function ensurePasswords() {
  const users = await User.find({ email: { $in: ['customer1@example.com', 'owner1@example.com', 'admin1@example.com'] } })
  for (const u of users) {
    if (!u.password) {
      const hash = await bcrypt.hash('123456', 10)
      u.password = hash
      await u.save()
      console.log('Set password for', u.email)
    }
  }
}

async function ensureMoreShops() {
  const customers = await User.find({ roles: { $in: ['owner'] } })
  const names = ['Studio HN', 'Gear HCM', 'ProLens DN']
  for (let i = 0; i < names.length; i++) {
    const owner = customers[i % customers.length]
    const exists = await ShopDetail.findOne({ name: names[i] })
    if (!exists) {
      await ShopDetail.create({ idUser: owner._id, name: names[i], location: i % 2 ? 'Hồ Chí Minh' : 'Hà Nội', contact: { email: owner.email } })
      console.log('Inserted shop', names[i])
    }
  }
}

async function seedReviewsAndPayments() {
  const orders = await Order.find().limit(10).lean()
  const customer = await User.findOne({ roles: { $in: ['renter'] } })
  if (!orders.length || !customer) return
  for (const o of orders) {
    // Review shop by customer (skip duplicate)
    try {
      await OrderReview.create({ orderId: o._id, reviewerId: customer._id, targetType: 'shop', rating: 5, comment: 'Dịch vụ tốt!' })
      console.log('Added review for order', o._id.toString())
    } catch {}

    // If there is a deposit, add payment history
    const dep = await Deposit.findOne({ orderId: o._id })
    if (dep) {
      await PaymentHistory.create({
        depositId: dep._id,
        orderId: o._id,
        customerId: customer._id,
        gateway: 'bank_transfer',
        amount: dep.amount || 200000,
        status: dep.status === 'paid' ? 'success' : dep.status === 'pending' ? 'pending' : 'success',
        transactionId: dep.paymentTransactionId || `DEMO-${o._id.toString().slice(-6)}`,
        rawParams: { demo: true }
      })
      console.log('Added payment history for order', o._id.toString())
    }
  }
}

async function run() {
  await connectDB()
  try {
    await ensurePasswords()
    await ensureMoreShops()
    await seedReviewsAndPayments()
  } catch (e) {
    console.error(e)
  } finally {
    await mongoose.connection.close()
    console.log('Done.')
  }
}

run()


