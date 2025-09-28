import * as chatSrv from '../service/chat.service.js';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import Shop from '../models/ShopDetail.js';

export async function getAllRooms(req, res) {
  try {
    const rooms = await chatSrv.findAllRoomsByUser(req.user._id);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Không thể lấy danh sách phòng' });
  }
}

export async function getOrCreateRoom(req, res) {
  try {
    const shopId = req.body.shopId ?? req.body.data?.shopId;

    console.log('✅ shopId:', shopId);
    if (!shopId) {
      return res.status(400).json({ message: 'Missing shopId' });
    }

    const room = await chatSrv.getOrCreateRoom(req.user._id, shopId);
    return res.json(room);
  } catch (err) {
    console.error('❌ getOrCreateRoom Error:', err);
    if (err.message === 'SHOP_NOT_FOUND')
      return res.status(404).json({ message: 'Shop not found' });
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}

export async function getMessages(req, res) {
  const msgs = await chatSrv.findMessages(req.params.roomId);
  res.json(msgs);
}

export async function sendMessage(req, res) {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const roles = req.user.roles || [];

    if (!content?.trim())
      return res.status(400).json({ message: 'Content required' });

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    let myShop = null;
    if (roles.includes('owner')) {
      myShop = await Shop.findOne({ idUser: userId });
    }

    let senderType = null;

    // (a)
    if (String(room.userId) === String(userId)) {
      senderType = 'user';
    }

    // (b)
    if (myShop && String(myShop._id) === String(room.shopId)) {
      senderType = 'shop';
    }

    if (!senderType) {
      return res.status(403).json({ message: 'Not allowed in this room' });
    }

    const msg = await chatSrv.createMessage(
      roomId,
      userId,
      senderType,
      content.trim()
    );

    if (req.io) req.io.to(roomId).emit('newMessage', { roomId, data: msg });
    return res.status(201).json(msg);
  } catch (err) {
    console.error('🔥 sendMessage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getRoomsByShop(req, res) {
  try {
    const shopId = req.query.shopId || req.body?.shopId;
    if (!shopId) return res.status(400).json({ message: 'Missing shopId' });

    const rooms = await ChatRoom.find({ shopId })
      .populate('userId', 'name avatar email')
      .populate('shopId', 'name avatar')
      .sort({ lastMessageTime: -1 });

    console.log('🧪 Trả về room shop:', rooms);
    return res.json(rooms);
  } catch (err) {
    console.error('❌ getRoomsByShop error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getRoomsByShopId(req, res) {
  try {
    const shopId = req.params.shopId;

    if (!shopId) {
      return res.status(400).json({ message: 'Missing shopId in params' });
    }

    const rooms = await ChatRoom.find({ shopId })
      .populate('userId', 'name avatar email')
      .populate('shopId', 'name avatar')
      .sort({ lastMessageTime: -1 });

    return res.json(rooms);
  } catch (err) {
    console.error('❌ Lỗi lấy rooms theo shopId:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
