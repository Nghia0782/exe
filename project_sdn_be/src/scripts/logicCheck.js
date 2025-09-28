import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/database.js'
import ProductDetail from '../models/ProductDetail.js'
import UnitProduct from '../models/UnitProduct.js'
import Order from '../models/Order.js'
import Deposit from '../models/Deposit.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function run() {
  await connectDB()
  try {
    // 1) Mỗi product: units == stock
    const products = await ProductDetail.find().select('_id title stock').lean()
    for (const p of products) {
      const units = await UnitProduct.countDocuments({ productId: p._id })
      assert(units === (p.stock || 0), `Units mismatch for product ${p.title}: ${units} != ${p.stock}`)
    }

    // 2) Orders: products đều là UnitProduct tồn tại
    const orders = await Order.find().select('_id products depositRequired depositAmount depositStatus status').lean()
    for (const o of orders) {
      for (const u of o.products) {
        const unit = await UnitProduct.findById(u).lean()
        assert(!!unit, `Order ${o._id} references missing unit ${u}`)
      }
      // 3) Deposit logic consistency
      if (o.depositRequired) {
        assert(o.depositAmount >= 0, `Order ${o._id} depositAmount invalid`)
        if (o.status === 'completed') {
          assert(['paid', 'refunded', 'not_required'].includes(o.depositStatus), `Order ${o._id} completed but depositStatus invalid`)
        }
      } else {
        assert(o.depositAmount === 0 || o.depositStatus === 'not_required', `Order ${o._id} not require deposit yet has deposit info`)
      }
    }

    // 4) Deposit documents reference valid orders and customers
    const deposits = await Deposit.find().select('_id orderId customerId amount status').lean()
    for (const d of deposits) {
      const order = await Order.findById(d.orderId).lean()
      assert(!!order, `Deposit ${d._id} references missing order ${d.orderId}`)
      assert(d.amount >= 0, `Deposit ${d._id} amount invalid`)
    }

    console.log(JSON.stringify({ ok: true, message: 'All checks passed', counts: { products: products.length, orders: orders.length, deposits: deposits.length } }, null, 2))
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e.message }))
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}

run()


