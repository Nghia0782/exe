import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/database.js'
import ProductDetail from '../models/ProductDetail.js'
import UnitProduct from '../models/UnitProduct.js'

async function run() {
  await connectDB()
  try {
    console.log('Seeding units for products...')
    const products = await ProductDetail.find({}).select('_id title stock idShop').lean()
    let totalCreated = 0

    for (const p of products) {
      const existing = await UnitProduct.countDocuments({ productId: p._id })
      const need = Math.max(0, (p.stock || 0) - existing)
      if (need === 0) continue

      const docs = []
      for (let i = 1; i <= need; i++) {
        docs.push({
          productId: p._id,
          unitId: `${p._id}-${existing + i}`,
          productStatus: 'available',
          renterId: p.idShop || null,
        })
      }

      const created = await UnitProduct.insertMany(docs)
      totalCreated += created.length
      console.log(`+ ${p.title}: created ${created.length} units (now ${existing + created.length}/${p.stock})`)
    }

    console.log(`Done. Created total ${totalCreated} units.`)
  } catch (err) {
    console.error(err)
  } finally {
    await mongoose.connection.close()
  }
}

run()


