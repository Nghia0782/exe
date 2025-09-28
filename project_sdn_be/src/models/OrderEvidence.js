import mongoose from 'mongoose';

const OrderEvidenceSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        evidenceType: {
            type: String,
            enum: ['delivery', 'return', 'damage', 'other'],
            required: true
        },
        images: [String], // URLs from cloudinary
        videos: [String], // URLs from cloudinary
        description: {
            type: String,
            required: true
        },
        submittedBy: {
            type: String,
            enum: ['owner', 'renter'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: Date,
        reviewNote: String
    },
    {
        timestamps: true,
        collection: 'orderEvidence'
    }
);

// Index để tối ưu truy vấn
OrderEvidenceSchema.index({ orderId: 1, evidenceType: 1 });
OrderEvidenceSchema.index({ submittedBy: 1, status: 1 });

export default mongoose.model('OrderEvidence', OrderEvidenceSchema); 