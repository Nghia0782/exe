import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/database.js'
import User from '../models/User.js'
import ShopDetail from '../models/ShopDetail.js'
import ProductDetail from '../models/ProductDetail.js'
import UnitProduct from '../models/UnitProduct.js'
import Order from '../models/Order.js'

async function ensureUsers() {
  const existing = await User.countDocuments()
  if (existing > 0) return
  const users = await User.insertMany([
    { name: 'Customer One', email: 'customer1@example.com', roles: ['renter'], kycStatus: 'verified' },
    { name: 'Owner One', email: 'owner1@example.com', roles: ['owner'], kycStatus: 'premium' },
    { name: 'Admin One', email: 'admin1@example.com', roles: ['admin'] },
  ])
  console.log(`Inserted ${users.length} users`)
}

async function ensureShops() {
  const owner = await User.findOne({ roles: { $in: ['owner'] } })
  if (!owner) return
  const exists = await ShopDetail.findOne({ idUser: owner._id })
  if (exists) return
  await ShopDetail.create({
    idUser: owner._id,
    name: 'Owner One Shop',
    location: 'Hồ Chí Minh',
    contact: { email: 'owner1@example.com', phone: '0900000000' },
    description: 'Cửa hàng cho thuê thiết bị quay chụp.'
  })
  console.log('Inserted 1 shop')
}

async function ensureProductsAndUnits() {
  const count = await ProductDetail.countDocuments()
  if (count === 0) {
    console.log('No products found. Please run npm run seed:products first.')
    return
  }
  const products = await ProductDetail.find({}).select('_id title stock idShop').lean()
  for (const p of products) {
    const existing = await UnitProduct.countDocuments({ productId: p._id })
    const need = Math.max(0, (p.stock || 0) - existing)
    if (need === 0) continue
    const docs = []
    for (let i = 1; i <= need; i++) {
      docs.push({ productId: p._id, unitId: `${p._id}-${existing + i}`, productStatus: 'available', renterId: p.idShop || null })
    }
    const created = await UnitProduct.insertMany(docs)
    console.log(`+ ${p.title}: created ${created.length} units`)
  }
}

async function ensureOrders() {
  const customer = await User.findOne({ roles: { $in: ['renter'] } })
  const oneUnit = await UnitProduct.findOne({ productStatus: 'available' })
  if (!customer || !oneUnit) return
  const exists = await Order.findOne({ customerId: customer._id })
  if (exists) return
  const order = await Order.create({
    customerId: customer._id,
    products: [oneUnit._id],
    totalPrice: 500000,
    duration: 3,
    depositRequired: true,
    depositAmount: 150000,
    depositStatus: 'pending',
    status: 'pending_confirmation'
  })
  console.log('Inserted sample order:', order._id.toString())
}

async function run() {
  await connectDB()
  try {
    await ensureUsers()
    await ensureShops()
    await ensureProductsAndUnits()
    await ensureOrders()
  } catch (e) {
    console.error(e)
  } finally {
    await mongoose.connection.close()
    console.log('Done.')
  }
}

run()


