import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/database.js'
import User from '../models/User.js'
import UnitProduct from '../models/UnitProduct.js'
import Order from '../models/Order.js'
import Deposit from '../models/Deposit.js'

async function createOrderWithStatus({ customer, units, status, deposit }) {
  const totalPrice = 600000
  const depositAmount = 200000
  const base = {
    customerId: customer._id,
    products: units.map(u => u._id),
    totalPrice,
    duration: 3,
    depositRequired: true,
    depositAmount,
    depositStatus: deposit?.status || 'pending',
    status
  }
  const order = await Order.create(base)
  if (deposit) {
    await Deposit.create({
      orderId: order._id,
      customerId: customer._id,
      amount: depositAmount,
      status: deposit.status,
      paymentMethod: 'bank_transfer',
      paymentTransactionId: deposit.txId || null,
      paidAt: deposit.status === 'paid' ? new Date() : null,
      refundedAt: deposit.status === 'refunded' ? new Date() : null,
      refundAmount: deposit.status === 'refunded' ? depositAmount : 0,
      refundReason: deposit.status === 'refunded' ? 'Sample refund' : null,
    })
  }
  return order
}

async function run() {
  await connectDB()
  try {
    const customer = await User.findOne({ roles: { $in: ['renter'] } })
    if (!customer) throw new Error('Need a renter user')
    const availableUnits = await UnitProduct.find({ productStatus: 'available' }).limit(10)
    if (availableUnits.length < 6) throw new Error('Need more available units. Run seed:units')

    // pending_confirmation + pending deposit
    await createOrderWithStatus({ customer, units: availableUnits.slice(0, 1), status: 'pending_confirmation', deposit: { status: 'pending' } })
    // confirmed + deposit paid
    await createOrderWithStatus({ customer, units: availableUnits.slice(1, 2), status: 'confirmed', deposit: { status: 'paid', txId: 'TX123456' } })
    // in_delivery + deposit paid
    await createOrderWithStatus({ customer, units: availableUnits.slice(2, 3), status: 'in_delivery', deposit: { status: 'paid', txId: 'TX123457' } })
    // return_product + deposit paid
    await createOrderWithStatus({ customer, units: availableUnits.slice(3, 4), status: 'return_product', deposit: { status: 'paid', txId: 'TX123458' } })
    // completed + deposit refunded
    await createOrderWithStatus({ customer, units: availableUnits.slice(4, 5), status: 'completed', deposit: { status: 'refunded' } })
    // canceled + deposit pending
    await createOrderWithStatus({ customer, units: availableUnits.slice(5, 6), status: 'canceled', deposit: { status: 'pending' } })

    console.log('Inserted advanced sample orders with various statuses.')
  } catch (e) {
    console.error(e)
  } finally {
    await mongoose.connection.close()
    console.log('Done.')
  }
}

run()


