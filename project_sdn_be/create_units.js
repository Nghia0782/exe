import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import ProductDetail from './src/models/ProductDetail.js';
import UnitProduct from './src/models/UnitProduct.js';

const MONGO_URI = process.env.MONGO_URI || process.env.DB_URL;

async function createUnitsForProduct() {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const productId = '68cd2047e9faff9c07e6b8e7';
    const count = 5; // Số units muốn tạo

    try {
        // Kiểm tra product có tồn tại không
        const product = await ProductDetail.findById(productId);
        if (!product) {
            console.log('Product not found!');
            return;
        }

        console.log(`Creating ${count} units for product: "${product.title}"`);

        // Kiểm tra units hiện có
        const existingUnits = await UnitProduct.find({ productId });
        console.log(`Existing units: ${existingUnits.length}`);

        // Tạo units mới
        const unitsToCreate = [];
        for (let i = 1; i <= count; i++) {
            const unitId = `${productId}-${existingUnits.length + i}`;
            unitsToCreate.push({
                productId,
                unitId,
                productStatus: 'available',
                renterId: product.idShop || null,
            });
        }

        const createdUnits = await UnitProduct.insertMany(unitsToCreate);
        console.log(`✅ Created ${createdUnits.length} units successfully!`);
        console.log(`Total units for this product: ${existingUnits.length + createdUnits.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createUnitsForProduct();
