// src/models/Message.js
import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const MessageSchema = new Schema(
  {
    roomId: { type: Types.ObjectId, ref: 'ChatRoom', required: true },
    senderId: { type: Types.ObjectId, required: true },
    senderType: { type: String, enum: ['user', 'shop'], required: true },
    content: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default model('Message', MessageSchema);
