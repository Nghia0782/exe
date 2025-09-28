import mongoose from 'mongoose'

const KycRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    idType: { type: String, enum: ['cccd', 'cmnd', 'passport'], required: true },
    fullName: { type: String },
    idNumber: { type: String, index: true },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    address: { type: String },
    frontImageUrl: { type: String },
    backImageUrl: { type: String },
    selfieImageUrl: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reason: { type: String },
  },
  { timestamps: true }
)

export default mongoose.model('KycRequest', KycRequestSchema)


