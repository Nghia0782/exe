import mongoose from 'mongoose';

const ShopSchema = new mongoose.Schema(
  {
    idUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    name: { type: String, required: true },
    avatar: { type: String, default: '' },
    cover: { type: String, default: '' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    followers: { type: Number, default: 0 },
    responseRate: { type: Number, min: 0, max: 100 },
    responseTime: { type: String, default: '' },
    joinedDate: { type: String },
    productsCount: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    lastActive: { type: String, default: '' },
    description: { type: String, default: '' },
    location: {
      type: String,
      enum: ['Hồ Chí Minh', 'Đà Nẵng', 'Hà Nội'],
      required: true,
    },
    contact: {
      phone: String,
      email: String,
    },
    operatingHours: String,
    packagePost: {
      type: [String],
      enum: ['Free', 'Basic', 'Advanced', 'Business'],
      default: ["Free"]
    },
    packageInsurance: {
      type: [String],
      enum: ['Basic', 'Standard', 'Premium'],
    },
    skipConfirmation: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: 'shopDetail',
    timestamps: true,
  }
);

export default mongoose.model('ShopDetail', ShopSchema);
