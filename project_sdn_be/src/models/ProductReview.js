import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    author: { type: String, required: true },
    avatar: { type: String, default: '' },
    rating: { type: Number, required: true, min: 0, max: 5 },
    date: { type: Date, default: Date.now },
    content: { type: String, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductDetail', required: true }
}, {
    collection: 'productReview',
    timestamps: true,
});

export default mongoose.model('ProductReview', ReviewSchema);
