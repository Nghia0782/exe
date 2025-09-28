import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const ChatRoomSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    shopId: { type: Types.ObjectId, ref: 'ShopDetail', required: true },
    lastMessage: String,
    lastMessageTime: Date,
  },
  { timestamps: true }
);

ChatRoomSchema.index({ userId: 1, shopId: 1 }, { unique: true });

const ChatRoom = model('ChatRoom', ChatRoomSchema);
export default ChatRoom;
