import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Order from '../models/Order.js';
import User from '../models/User.js';
import ProductDetail from '../models/ProductDetail.js';
import ShopDetail from '../models/ShopDetail.js';

const MONGO_URI = process.env.MONGO_URI || process.env.DB_URL;

const fallbackUserIds = [
    '686147cfcbd3b63bd064e793',
    '686147cfcbd3b63bd064e793',
    '6861483bcbd3b63bd064e8bf',
    '68615073cbd3b63bd064efc8',
    '6861598acbd3b63bd064fb11',
];

function getRandomUserId() {
    const idx = Math.floor(Math.random() * fallbackUserIds.length);
    return fallbackUserIds[idx];
}

async function main() {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const orders = await Order.find();
    let fixed = 0;
    let fallbackFixed = 0;

    for (const order of orders) {
        const user = await User.findById(order.customerId);
        if (!user) {
            const firstProductId = Array.isArray(order.products) && order.products.length > 0 ? order.products[0] : null;
            let newUserId = null;
            if (firstProductId) {
                const product = await ProductDetail.findById(firstProductId);
                if (product && product.idShop) {
                    const shop = await ShopDetail.findById(product.idShop);
                    if (shop && shop.idUser) {
                        newUserId = shop.idUser;
                        order.customerId = newUserId;
                        await order.save();
                        fixed++;
                        console.log(`Đã sửa customerId cho order ${order._id} thành user ${shop.idUser}`);
                        continue;
                    }
                }
            }
            newUserId = getRandomUserId();
            order.customerId = newUserId;
            await order.save();
            fallbackFixed++;
            console.log(`Gán ngẫu nhiên customerId cho order ${order._id} thành user ${newUserId}`);
        }
    }
    console.log(`Đã sửa ${fixed} order theo logic truy ngược, ${fallbackFixed} order gán ngẫu nhiên user.`);
    process.exit(0);
}

main(); 