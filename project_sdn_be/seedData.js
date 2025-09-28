import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import models
import User from './src/models/User.js';
import CategoryProduct from './src/models/CategoryProduct.js';
import ProductDetail from './src/models/ProductDetail.js';
import ShopDetail from './src/models/ShopDetail.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await CategoryProduct.deleteMany({});
    await ProductDetail.deleteMany({});
    await ShopDetail.deleteMany({});
    console.log('🗑️  Cleared existing data');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  }
};

const seedCategories = async () => {
  const categories = [
    { name: 'Laptop' },
    { name: 'Máy ảnh' },
    { name: 'Điện thoại' },
    { name: 'Âm thanh' },
    { name: 'Phụ kiện' },
    { name: 'Gaming' },
    { name: 'Máy chiếu' },
    { name: 'Thiết bị văn phòng' }
  ];

  const createdCategories = await CategoryProduct.insertMany(categories);
  console.log('✅ Categories created:', createdCategories.length);
  return createdCategories;
};

const seedUsers = async () => {
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const users = [
    {
      name: 'Nguyễn Văn An',
      email: 'an@example.com',
      password: hashedPassword,
      phone: '0123456789',
      roles: ['owner'],
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isActive: true,
      gender: 'male',
      walletBalance: 5000000
    },
    {
      name: 'Trần Thị Bình',
      email: 'binh@example.com',
      password: hashedPassword,
      phone: '0987654321',
      roles: ['owner'],
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      isActive: true,
      gender: 'female',
      walletBalance: 3000000
    },
    {
      name: 'Lê Văn Cường',
      email: 'cuong@example.com',
      password: hashedPassword,
      phone: '0369852147',
      roles: ['renter'],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      isActive: true,
      gender: 'male',
      walletBalance: 1000000
    },
    {
      name: 'Phạm Thị Dung',
      email: 'dung@example.com',
      password: hashedPassword,
      phone: '0741852963',
      roles: ['renter'],
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      isActive: true,
      gender: 'female',
      walletBalance: 2000000
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log('✅ Users created:', createdUsers.length);
  return createdUsers;
};

const seedShops = async (users) => {
  const shops = [
    {
      idUser: users[0]._id,
      name: 'TechRent Pro',
      avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop',
      cover: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=300&fit=crop',
      rating: 4.8,
      followers: 1250,
      responseRate: 95,
      responseTime: 'Trong 1 giờ',
      joinedDate: '2023-01-15',
      productsCount: 25,
      totalReviews: 180,
      lastActive: 'Hôm nay',
      description: 'Chuyên cho thuê thiết bị công nghệ cao cấp với giá cả hợp lý',
      location: 'Hồ Chí Minh',
      contact: {
        phone: '0123456789',
        email: 'an@example.com'
      },
      operatingHours: '8:00 - 22:00',
      packagePost: ['Basic', 'Advanced'],
      packageInsurance: ['Standard', 'Premium']
    },
    {
      idUser: users[1]._id,
      name: 'Camera Studio',
      avatar: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=200&h=200&fit=crop',
      cover: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=300&fit=crop',
      rating: 4.9,
      followers: 2100,
      responseRate: 98,
      responseTime: 'Trong 30 phút',
      joinedDate: '2022-11-20',
      productsCount: 18,
      totalReviews: 320,
      lastActive: 'Hôm nay',
      description: 'Studio chuyên nghiệp cho thuê máy ảnh và thiết bị quay phim',
      location: 'Hà Nội',
      contact: {
        phone: '0987654321',
        email: 'binh@example.com'
      },
      operatingHours: '7:00 - 23:00',
      packagePost: ['Advanced', 'Business'],
      packageInsurance: ['Premium']
    }
  ];

  const createdShops = await ShopDetail.insertMany(shops);
  console.log('✅ Shops created:', createdShops.length);
  return createdShops;
};

const seedProducts = async (categories, shops) => {
  const products = [
    {
      title: 'MacBook Pro M2 14 inch',
      brand: 'Apple',
      category: categories[0]._id,
      price: 500000,
      priceWeek: 3000000,
      priceMonth: 10000000,
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=400&fit=crop'
      ],
      view: 1250,
      idShop: shops[0]._id,
      details: 'MacBook Pro M2 với hiệu năng mạnh mẽ, màn hình Liquid Retina XDR 14 inch, bộ nhớ 16GB RAM, ổ cứng SSD 512GB. Hoàn hảo cho công việc chuyên nghiệp và sáng tạo.',
      shortDetails: 'MacBook Pro M2 14 inch - Hiệu năng cao, màn hình đẹp',
      parameter: [
        { key: 'cpu', label: 'CPU', value: 'Apple M2' },
        { key: 'ram', label: 'RAM', value: '16GB' },
        { key: 'storage', label: 'Ổ cứng', value: '512GB SSD' },
        { key: 'screen', label: 'Màn hình', value: '14 inch Liquid Retina XDR' }
      ],
      isHotProduct: true,
      isNewProduct: true,
      location: 'Hồ Chí Minh',
      soldCount: 45,
      discount: 10,
      stock: 3,
      adminApprovalStatus: 'approved'
    },
    {
      title: 'Canon EOS R5',
      brand: 'Canon',
      category: categories[1]._id,
      price: 800000,
      priceWeek: 5000000,
      priceMonth: 18000000,
      images: [
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500&h=400&fit=crop'
      ],
      view: 2100,
      idShop: shops[1]._id,
      details: 'Canon EOS R5 - Máy ảnh mirrorless chuyên nghiệp với cảm biến 45MP, quay video 8K, chống rung 5 trục. Hoàn hảo cho nhiếp ảnh và quay phim chuyên nghiệp.',
      shortDetails: 'Canon EOS R5 - Máy ảnh mirrorless 45MP, quay 8K',
      parameter: [
        { key: 'sensor', label: 'Cảm biến', value: '45MP Full Frame' },
        { key: 'video', label: 'Video', value: '8K RAW' },
        { key: 'stabilization', label: 'Chống rung', value: '5 trục' },
        { key: 'iso', label: 'ISO', value: '100-51200' }
      ],
      isHotProduct: true,
      isNewProduct: false,
      location: 'Hà Nội',
      soldCount: 28,
      discount: 15,
      stock: 2,
      adminApprovalStatus: 'approved'
    },
    {
      title: 'iPhone 15 Pro Max',
      brand: 'Apple',
      category: categories[2]._id,
      price: 300000,
      priceWeek: 1800000,
      priceMonth: 6000000,
      images: [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=400&fit=crop'
      ],
      view: 3200,
      idShop: shops[0]._id,
      details: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình 6.7 inch Super Retina XDR. Thiết kế titan cao cấp, hoàn hảo cho công việc và giải trí.',
      shortDetails: 'iPhone 15 Pro Max - Chip A17 Pro, camera 48MP',
      parameter: [
        { key: 'chip', label: 'Chip', value: 'A17 Pro' },
        { key: 'camera', label: 'Camera', value: '48MP chính' },
        { key: 'screen', label: 'Màn hình', value: '6.7 inch Super Retina XDR' },
        { key: 'storage', label: 'Bộ nhớ', value: '256GB' }
      ],
      isHotProduct: true,
      isNewProduct: true,
      location: 'Hồ Chí Minh',
      soldCount: 67,
      discount: 5,
      stock: 5,
      adminApprovalStatus: 'approved'
    },
    {
      title: 'Sony WH-1000XM5',
      brand: 'Sony',
      category: categories[3]._id,
      price: 150000,
      priceWeek: 900000,
      priceMonth: 3000000,
      images: [
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=400&fit=crop'
      ],
      view: 1800,
      idShop: shops[0]._id,
      details: 'Sony WH-1000XM5 - Tai nghe chống ồn hàng đầu với công nghệ chống ồn thích ứng, âm thanh chất lượng cao, pin 30 giờ. Hoàn hảo cho công việc và du lịch.',
      shortDetails: 'Sony WH-1000XM5 - Tai nghe chống ồn cao cấp',
      parameter: [
        { key: 'noise_cancelling', label: 'Chống ồn', value: 'Thích ứng' },
        { key: 'battery', label: 'Pin', value: '30 giờ' },
        { key: 'driver', label: 'Driver', value: '30mm' },
        { key: 'weight', label: 'Trọng lượng', value: '250g' }
      ],
      isHotProduct: false,
      isNewProduct: false,
      location: 'Hồ Chí Minh',
      soldCount: 34,
      discount: 0,
      stock: 4,
      adminApprovalStatus: 'approved'
    },
    {
      title: 'Dell XPS 13',
      brand: 'Dell',
      category: categories[0]._id,
      price: 400000,
      priceWeek: 2400000,
      priceMonth: 8000000,
      images: [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&h=400&fit=crop'
      ],
      view: 950,
      idShop: shops[1]._id,
      details: 'Dell XPS 13 với thiết kế siêu mỏng, màn hình 13.4 inch 4K, chip Intel Core i7, RAM 16GB. Laptop cao cấp cho doanh nhân và sinh viên.',
      shortDetails: 'Dell XPS 13 - Laptop siêu mỏng, màn hình 4K',
      parameter: [
        { key: 'cpu', label: 'CPU', value: 'Intel Core i7' },
        { key: 'ram', label: 'RAM', value: '16GB' },
        { key: 'screen', label: 'Màn hình', value: '13.4 inch 4K' },
        { key: 'weight', label: 'Trọng lượng', value: '1.27kg' }
      ],
      isHotProduct: false,
      isNewProduct: true,
      location: 'Hà Nội',
      soldCount: 22,
      discount: 8,
      stock: 2,
      adminApprovalStatus: 'approved'
    },
    {
      title: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      category: categories[2]._id,
      price: 350000,
      priceWeek: 2100000,
      priceMonth: 7000000,
      images: [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=400&fit=crop',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=400&fit=crop'
      ],
      view: 2800,
      idShop: shops[0]._id,
      details: 'Samsung Galaxy S24 Ultra với S Pen, camera 200MP, màn hình 6.8 inch Dynamic AMOLED 2X. Điện thoại Android cao cấp nhất với AI tích hợp.',
      shortDetails: 'Samsung Galaxy S24 Ultra - S Pen, camera 200MP',
      parameter: [
        { key: 'chip', label: 'Chip', value: 'Snapdragon 8 Gen 3' },
        { key: 'camera', label: 'Camera', value: '200MP chính' },
        { key: 'screen', label: 'Màn hình', value: '6.8 inch Dynamic AMOLED 2X' },
        { key: 'pen', label: 'S Pen', value: 'Có' }
      ],
      isHotProduct: true,
      isNewProduct: true,
      location: 'Hồ Chí Minh',
      soldCount: 41,
      discount: 12,
      stock: 3,
      adminApprovalStatus: 'approved'
    }
  ];

  const createdProducts = await ProductDetail.insertMany(products);
  console.log('✅ Products created:', createdProducts.length);
  return createdProducts;
};

const seedDatabase = async () => {
  try {
    await connectDB();
    await clearDatabase();
    
    const categories = await seedCategories();
    const users = await seedUsers();
    const shops = await seedShops(users);
    const products = await seedProducts(categories, shops);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Shops: ${shops.length}`);
    console.log(`   - Products: ${products.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
