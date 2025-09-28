import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/database.js'
import CategoryProduct from '../models/CategoryProduct.js'
import ProductDetail from '../models/ProductDetail.js'

const sampleCategories = [
  { name: 'Máy ảnh' },
  { name: 'Ống kính' },
  { name: 'Laptop' },
  { name: 'Âm thanh' },
  { name: 'Máy quay' },
  { name: 'Phụ kiện' },
]

const image = (w, h, text) => `https://picsum.photos/seed/${encodeURIComponent(text)}/${w}/${h}`

const sampleProducts = (categoryMap) => {
  const base = [
    {
      title: 'Canon EOS R5',
      brand: 'Canon',
      category: categoryMap['Máy ảnh'],
      price: 450000,
      priceWeek: 2700000,
      priceMonth: 9000000,
      images: [image(800,600,'r5-1'), image(800,600,'r5-2'), image(800,600,'r5-3')],
      details: 'Máy ảnh mirrorless full-frame, quay 8K, chụp tốc độ cao.',
      shortDetails: 'Full-frame, 45MP, 8K video',
      parameter: [
        { key: 'sensor', label: 'Cảm biến', value: 'Full-frame 45MP' },
        { key: 'video', label: 'Video', value: '8K RAW' },
      ],
      location: 'Hồ Chí Minh',
      stock: 3,
      isHotProduct: true,
    },
    {
      title: 'Sony A7 IV',
      brand: 'Sony',
      category: categoryMap['Máy ảnh'],
      price: 350000,
      priceWeek: 2100000,
      priceMonth: 7000000,
      images: [image(800,600,'a7iv-1'), image(800,600,'a7iv-2')],
      details: 'Máy ảnh đa dụng, cân bằng ảnh và video.',
      shortDetails: '33MP, 4K60p',
      parameter: [
        { key: 'sensor', label: 'Cảm biến', value: 'Full-frame 33MP' },
        { key: 'video', label: 'Video', value: '4K60p' },
      ],
      location: 'Hà Nội',
      stock: 4,
    },
    {
      title: 'MacBook Pro 14 M3 Pro',
      brand: 'Apple',
      category: categoryMap['Laptop'],
      price: 500000,
      priceWeek: 3000000,
      priceMonth: 10000000,
      images: [image(800,600,'mbp14-1'), image(800,600,'mbp14-2')],
      details: 'Hiệu năng cao, phù hợp dựng phim và lập trình.',
      shortDetails: 'M3 Pro, 16GB, 512GB',
      parameter: [
        { key: 'cpu', label: 'CPU', value: 'Apple M3 Pro' },
        { key: 'ram', label: 'RAM', value: '16GB' },
      ],
      location: 'Đà Nẵng',
      stock: 2,
    },
    {
      title: 'Len 24-70mm f/2.8',
      brand: 'Sigma',
      category: categoryMap['Ống kính'],
      price: 200000,
      priceWeek: 1200000,
      priceMonth: 4000000,
      images: [image(800,600,'2470-1')],
      details: 'Ống kính đa dụng khẩu lớn.',
      shortDetails: 'Zoom tiêu chuẩn f/2.8',
      parameter: [
        { key: 'mount', label: 'Ngàm', value: 'E/RF/EF' },
      ],
      location: 'Hồ Chí Minh',
      stock: 5,
    },
    {
      title: 'DJI Ronin RS3',
      brand: 'DJI',
      category: categoryMap['Phụ kiện'],
      price: 180000,
      priceWeek: 1080000,
      priceMonth: 3600000,
      images: [image(800,600,'rs3-1')],
      details: 'Gimbal chống rung cho máy ảnh mirrorless.',
      shortDetails: 'Ổn định 3 trục',
      parameter: [{ key: 'payload', label: 'Tải trọng', value: '3kg' }],
      location: 'Hà Nội',
      stock: 3,
    },
    {
      title: 'GoPro Hero 12 Black',
      brand: 'GoPro',
      category: categoryMap['Máy quay'],
      price: 220000,
      priceWeek: 1320000,
      priceMonth: 4400000,
      images: [image(800,600,'gopro12-1')],
      details: 'Action cam chống nước, quay 5.3K.',
      shortDetails: '5.3K60, HyperSmooth',
      parameter: [{ key: 'water', label: 'Chống nước', value: '10m' }],
      location: 'Đà Nẵng',
      stock: 4,
    },
    {
      title: 'Mic Rode Wireless Go II',
      brand: 'Rode',
      category: categoryMap['Âm thanh'],
      price: 120000,
      priceWeek: 720000,
      priceMonth: 2400000,
      images: [image(800,600,'rode-1')],
      details: 'Micro không dây 2 kênh cho quay phỏng vấn.',
      shortDetails: '2 TX, 1 RX',
      parameter: [{ key: 'range', label: 'Tầm hoạt động', value: '200m' }],
      location: 'Hồ Chí Minh',
      stock: 6,
    },
    {
      title: 'Sony FX3',
      brand: 'Sony',
      category: categoryMap['Máy quay'],
      price: 800000,
      priceWeek: 4800000,
      priceMonth: 16000000,
      images: [image(800,600,'fx3-1')],
      details: 'Cinema camera nhỏ gọn, quay 4K120p.',
      shortDetails: 'S-Cinetone, XLR',
      parameter: [{ key: 'video', label: 'Video', value: '4K120p' }],
      location: 'Hà Nội',
      stock: 1,
    },
    {
      title: 'Len 70-200mm f/2.8',
      brand: 'Sony',
      category: categoryMap['Ống kính'],
      price: 300000,
      priceWeek: 1800000,
      priceMonth: 6000000,
      images: [image(800,600,'70200-1')],
      details: 'Tele khẩu lớn cho thể thao/sự kiện.',
      shortDetails: 'Tele f/2.8',
      parameter: [{ key: 'stabil', label: 'Chống rung', value: 'Có' }],
      location: 'Đà Nẵng',
      stock: 2,
    },
    {
      title: 'Tripod Manfrotto 190X',
      brand: 'Manfrotto',
      category: categoryMap['Phụ kiện'],
      price: 80000,
      priceWeek: 480000,
      priceMonth: 1600000,
      images: [image(800,600,'tripod-1')],
      details: 'Chân máy vững chắc, linh hoạt.',
      shortDetails: 'Nhôm, khoá bật',
      parameter: [{ key: 'height', label: 'Chiều cao', value: '160cm' }],
      location: 'Hồ Chí Minh',
      stock: 7,
    },
    {
      title: 'Màn hình LG 27" 4K',
      brand: 'LG',
      category: categoryMap['Phụ kiện'],
      price: 150000,
      priceWeek: 900000,
      priceMonth: 3000000,
      images: [image(800,600,'lg27-1')],
      details: 'Màn hình 4K IPS cho đồ hoạ.',
      shortDetails: '4K, 27 inch',
      parameter: [{ key: 'panel', label: 'Tấm nền', value: 'IPS' }],
      location: 'Hà Nội',
      stock: 5,
    },
  ]

  const locations = ['Hồ Chí Minh', 'Đà Nẵng', 'Hà Nội']
  const out = [...base]
  let i = 1
  while (out.length < 20) {
    for (const b of base) {
      if (out.length >= 20) break
      out.push({
        ...b,
        title: `${b.title} (${++i})`,
        images: b.images.map((_, idx) => image(800, 600, `${b.title}-${i}-${idx}`)),
        location: locations[out.length % locations.length],
        stock: Math.max(1, (b.stock || 2) + ((out.length % 3) - 1)),
      })
    }
  }
  return out
}

async function run() {
  await connectDB()
  try {
    console.log('Seeding categories...')
    const existing = await CategoryProduct.find().lean()
    const existingByName = new Map(existing.map(c => [c.name, c._id]))
    const toInsert = sampleCategories.filter(c => !existingByName.has(c.name))
    if (toInsert.length) {
      const inserted = await CategoryProduct.insertMany(toInsert)
      inserted.forEach(c => existingByName.set(c.name, c._id))
      console.log(`Inserted ${inserted.length} categories`)
    } else {
      console.log('Categories already exist, skip insert')
    }

    const categoryMap = Object.fromEntries(existingByName)

    console.log('Seeding products...')
    const products = sampleProducts(categoryMap)
    // Optional: avoid duplicates by title
    const existingTitles = new Set((await ProductDetail.find({ title: { $in: products.map(p => p.title) } }).select('title').lean()).map(p => p.title))
    const newProducts = products.filter(p => !existingTitles.has(p.title))
    if (newProducts.length) {
      const insertedProducts = await ProductDetail.insertMany(newProducts)
      console.log(`Inserted ${insertedProducts.length} products`)
    } else {
      console.log('Products already exist, skip insert')
    }
  } catch (err) {
    console.error(err)
  } finally {
    await mongoose.connection.close()
    console.log('Done.')
  }
}

run()


