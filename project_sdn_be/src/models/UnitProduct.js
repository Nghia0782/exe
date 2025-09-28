import mongoose from 'mongoose';

const UnitProductSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductDetail', required: true },
        unitId: { type: String, required: true },
        productStatus: {
            type: String,
            enum: ['available', 'rented'],
            required: true,
        },
        renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
    },
    {
        collection: 'unitProduct',
    },
);

export default mongoose.model('UnitProduct', UnitProductSchema);