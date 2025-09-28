import mongoose from 'mongoose';

const PaymentHistorySchema = new mongoose.Schema(
  {
    depositId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deposit', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    gateway: { type: String, enum: ['vnpay', 'momo', 'bank_transfer', 'cash'], default: 'vnpay' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'VND' },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    transactionId: { type: String },
    responseCode: { type: String },
    bankCode: { type: String },
    cardType: { type: String },
    rawParams: { type: Object },
  },
  { timestamps: true, collection: 'payment_histories' }
);

export default mongoose.model('PaymentHistory', PaymentHistorySchema);


