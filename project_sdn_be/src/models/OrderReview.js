import mongoose from 'mongoose';

const OrderReviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['customer', 'shop'], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
}, { collection: 'order_reviews', timestamps: true });

OrderReviewSchema.index({ orderId: 1, reviewerId: 1, targetType: 1 }, { unique: true });

export default mongoose.model('OrderReview', OrderReviewSchema);


