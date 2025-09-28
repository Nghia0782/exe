import _ from 'lodash';
import ProductDetail from '../models/ProductDetail.js';
import User from '../models/User.js';
import {
  getCurrentUser,
  getAllUsers,
  becomeOwner,
} from '../service/user/index.js';

export const getCurrentUserController = async (req, res) => {
  try {
    const user = await getCurrentUser(req.authenticatedUser.userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    const ownedProductsCount = await ProductDetail.countDocuments({
      owner: req.authenticatedUser.userId,
    });
    const rentingProductsCount = await ProductDetail.countDocuments({
      renters: req.authenticatedUser.userId,
    });

    res.status(200).json({
      _id: user._id.toString(),
      fullname:
        user.identityVerification?.status === 'verified'
          ? user.name
          : undefined,
      name: user.name,
      email: user.email,
      roles: user.roles,
      joinDate: user.createdAt.toISOString(),
      phone: user.phone || '',
      address: user.identityVerification?.address || '',
      isVerified: user.identityVerification?.status === 'verified',
      ownedProducts: ownedProductsCount || 0,
      rentingProducts: rentingProductsCount || 0,
      registeredLessor: user.roles.includes('owner'),
      avatar: user.avatar,
      gender: user.gender,
      // dateOfBirth: user.dateOfBirth?.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

export const getAllUsersController = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

export const becomeOwnerController = async (req, res) => {
  try {
    const userId = req.user?._id || req.authenticatedUser?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Missing user ID in token' });
    }

    const shopPayload = req.body;
    const shop = await becomeOwner(userId, shopPayload);

    const user = await getCurrentUser(userId);

    const ownedProductsCount = await ProductDetail.countDocuments({
      owner: userId,
    });
    const rentingProductsCount = await ProductDetail.countDocuments({
      renters: userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Trở thành chủ sở hữu thành công',
      data: {
        user: {
          _id: user._id.toString(),
          fullname:
            user.identityVerification?.status === 'verified'
              ? user.name
              : undefined,
          name: user.name,
          email: user.email,
          roles: user.roles,
          joinDate: user.createdAt.toISOString(),
          phone: user.phone || '',
          address: user.identityVerification?.address || '',
          isVerified: user.identityVerification?.status === 'verified',
          ownedProducts: ownedProductsCount || 0,
          rentingProducts: rentingProductsCount || 0,
          registeredLessor: user.roles.includes('owner'),
        },
        shop: {
          _id: user._id.toString(),
          ...shop,
        },
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUserController = async (req, res) => {
  try {
    const userId = req.user?._id;
    console.log('userId', userId);
    const updates = req.body;
    console.log('updates', updates);

    const protectedFields = [
      'password',
      'email',
      'resetCode',
      'resetCodeExpiry',
    ];
    protectedFields.forEach((field) => {
      if (field in updates) delete updates[field];
    });

    if (updates.identityVerification) {
      const user = await User.findById(userId);
      if (user) {
        updates.identityVerification = {
          ...user.identityVerification?.toObject?.() || user.identityVerification || {},
          ...updates.identityVerification,
        };
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res
      .status(500)
      .json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params._id;

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const safeUser = _.omit(user.toObject(), ['password']);
    res.status(200).json({ user: safeUser });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
