import mongoose from 'mongoose';
import { sendOrderPlacedEmail } from '../utils/mailer.js';
import { sendOrderPaidEmail } from '../utils/mailer.js';
import { sendOrderStatusUpdatedEmail } from '../utils/mailer.js';

const OrderSchema = new mongoose.Schema(
    {
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UnitProduct' }],//unit products 
        totalPrice: { type: Number, required: true },
        status: {
            type: String,
            enum: ['completed', 'pending_payment', 'pending_confirmation', 'confirmed', 'in_delivery', 'return_product', 'canceled', 'before_deadline'],
            default: 'pending_confirmation',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        // Thông tin đặt cọc
        depositRequired: {
            type: Boolean,
            default: true
        },
        depositAmount: {
            type: Number,
            default: 0
        },
        depositStatus: {
            type: String,
            enum: ['not_required', 'pending', 'paid', 'refunded', 'forfeited'],
            default: 'not_required'
        },
        remainingAmount: {
            type: Number,
            default: 0
        },
        duration: { type: Number, required: true },
        deliveryDate: { type: Date },
        // Thông tin giao hàng
        startDate: { type: Date },
        endDate: { type: Date },
        pickupAddress: {
            type: String,
            default: null
        },
        deliveryAddress: {
            type: String,
            default: null
        },
    },
    {
        collection: 'orders',
        timestamps: true,
    },
);

// Virtual để tính toán thông tin
OrderSchema.virtual('isDepositPaid').get(function() {
    return this.depositStatus === 'paid';
});

OrderSchema.virtual('isFullyPaid').get(function() {
    return this.paymentStatus === 'paid' && this.depositStatus === 'paid';
});

OrderSchema.virtual('canStartRental').get(function() {
    return this.depositStatus === 'paid' && this.status === 'confirmed';
});

// Pre-save middleware để tự động tính toán
OrderSchema.pre('save', function(next) {
    // Tính remaining amount
    if (this.totalPrice && this.depositAmount) {
        this.remainingAmount = this.totalPrice - this.depositAmount;
    }
    
    next();
});

export default mongoose.model('Order', OrderSchema);