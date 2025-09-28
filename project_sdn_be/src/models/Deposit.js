import mongoose from 'mongoose';

const DepositSchema = new mongoose.Schema(
    {
        orderId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Order', 
            required: true 
        },
        customerId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        amount: { 
            type: Number, 
            required: true,
            min: 0
        },
        depositType: {
            type: String,
            enum: ['fixed_amount'],
            default: 'fixed_amount'
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'refunded', 'forfeited', 'cancelled'],
            default: 'pending'
        },
        paymentMethod: {
            type: String,
            enum: ['vnpay', 'momo', 'bank_transfer', 'cash'],
            default: 'vnpay'
        },
        paymentTransactionId: {
            type: String,
            default: null
        },
        paymentUrl: {
            type: String,
            default: null
        },
        paidAt: {
            type: Date,
            default: null
        },
        refundedAt: {
            type: Date,
            default: null
        },
        refundAmount: {
            type: Number,
            default: 0
        },
        refundReason: {
            type: String,
            default: null
        },
        notes: {
            type: String,
            default: null
        },
        // Thông tin bảo mật
        securityCode: {
            type: String,
            default: null
        },
        // Thời gian hết hạn đặt cọc
        expiresAt: {
            type: Date,
            default: function() {
                // Hết hạn sau 24 giờ
                return new Date(Date.now() + 24 * 60 * 60 * 1000);
            }
        }
    },
    {
        collection: 'deposits',
        timestamps: true,
    }
);

// Index để tối ưu query
DepositSchema.index({ orderId: 1 });
DepositSchema.index({ customerId: 1 });
DepositSchema.index({ status: 1 });
DepositSchema.index({ expiresAt: 1 });

// Virtual để tính toán thông tin
DepositSchema.virtual('isExpired').get(function() {
    return this.expiresAt && this.expiresAt < new Date();
});

DepositSchema.virtual('canRefund').get(function() {
    return this.status === 'paid' && !this.isExpired;
});

// Pre-save middleware
DepositSchema.pre('save', function(next) {
    // Tự động tạo security code nếu chưa có
    if (!this.securityCode) {
        this.securityCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    next();
});

export default mongoose.model('Deposit', DepositSchema);
