import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import ProductDetail from '../models/ProductDetail.js';
import ShopDetail from '../models/ShopDetail.js';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || process.env.DB_URL;

async function main() {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const products = await ProductDetail.find();
    let fixed = 0;

    for (const product of products) {
        const user = await User.findById(product.idShop);
        if (user) {
            const shop = await ShopDetail.findOne({ idUser: user._id });
            if (shop) {
                product.idShop = shop._id;
                await product.save();
                fixed++;
                console.log(`Đã sửa idShop cho sản phẩm ${product.title} (${product._id})`);
            }
        }
    }
    console.log(`Đã sửa ${fixed} sản phẩm bị sai idShop.`);
    process.exit(0);
}

main(); 