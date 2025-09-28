import User from '../../models/User.js';
import ShopDetail from '../../models/ShopDetail.js';
import { sendVerificationEmail } from '../../utils/mailer.js';

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-password');
  return user
};

export const getAllUsers = async () => {
  return await User.find().select('-password');
};

export const becomeOwner = async (userId, payload) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User không tồn tại');
  }
  const alreadyOwner = user.roles.includes('owner');
  if (alreadyOwner) {
    throw new Error('User đã là owner');
  }
  const existShop = await ShopDetail.findOne({ user: userId });
  if (existShop) {
    throw new Error('User đã có shop');
  }
  const newShop = await ShopDetail.create({
    idUser: userId,

    name: payload.shopName,
    ...payload,
    contact: {
      phone: user.phone,
      email: user.email,
    },
  });
  user.roles.push('owner');
  await user.save();
  return newShop;
};
