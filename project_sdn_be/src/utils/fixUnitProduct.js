import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import ProductDetail from '../models/ProductDetail.js';
import UnitProduct from '../models/UnitProduct.js';

const MONGO_URI = process.env.MONGO_URI || process.env.DB_URL;

async function main() {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const products = await ProductDetail.find();
    let totalCreated = 0;

    for (const product of products) {
        const units = await UnitProduct.find({ productId: product._id });
        const existingUnitIds = new Set(units.map(u => u.unitId));
        const missing = (product.stock || 0) - units.length;
        if (missing > 0) {
            console.log(`Product "${product.title}" (${product._id}) thiếu ${missing} unitProduct. Đang tạo thêm...`);
            for (let i = 1; i <= (product.stock || 0); i++) {
                const unitId = `${product._id}-${i}`;
                if (!existingUnitIds.has(unitId)) {
                    await UnitProduct.create({
                        productId: product._id,
                        unitId,
                        productStatus: 'available',
                        renterId: product.idShop, // idShop là ObjectId
                    });
                    totalCreated++;
                }
            }
        }
    }
    console.log(`Đã tạo bổ sung ${totalCreated} unitProduct.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error('Lỗi:', err);
    process.exit(1);
}); 