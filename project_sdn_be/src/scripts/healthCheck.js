import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/database.js'
import User from '../models/User.js'
import ShopDetail from '../models/ShopDetail.js'
import CategoryProduct from '../models/CategoryProduct.js'
import ProductDetail from '../models/ProductDetail.js'
import UnitProduct from '../models/UnitProduct.js'
import Order from '../models/Order.js'
import Deposit from '../models/Deposit.js'
import PaymentHistory from '../models/PaymentHistory.js'
import OrderReview from '../models/OrderReview.js'

async function run() {
  await connectDB()
  try {
    const stats = {}
    const collections = [
      ['users', () => User.countDocuments()],
      ['shops', () => ShopDetail.countDocuments()],
      ['categories', () => CategoryProduct.countDocuments()],
      ['products', () => ProductDetail.countDocuments()],
      ['units', () => UnitProduct.countDocuments()],
      ['orders', () => Order.countDocuments()],
      ['deposits', () => Deposit.countDocuments()],
      ['payments', () => PaymentHistory.countDocuments()],
      ['orderReviews', () => OrderReview.countDocuments()],
    ]
    for (const [k, fn] of collections) {
      stats[k] = await fn()
    }
    const oneOrder = await Order.findOne().populate('products').lean()
    const orderOk = !!oneOrder && Array.isArray(oneOrder.products)
    console.log(JSON.stringify({ ok: true, stats, orderHasUnits: orderOk }, null, 2))
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e.message }))
  } finally {
    await mongoose.connection.close()
  }
}

run()


