import express from 'express';
import {
  getCurrentUserController,
  getAllUsersController,
  becomeOwnerController,
  updateUserController,
  getUserById,
} from '../controllers/userController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, getCurrentUserController);
router.patch('/me', protect, updateUserController)
router.get('/userAll', protect, authorizeRoles('admin'), getAllUsersController);
router.post('/become-owner', protect, becomeOwnerController);
router.get('/get-user-by-id/:_id', getUserById);
router.get('/', getAllUsersController);

router.get('/count', async (req, res) => {
  const User = (await import('../models/User.js')).default;
  const count = await User.countDocuments();
  res.json({ data: { count } });
});

router.get('/with-products', async (req, res) => {
  const ShopDetail = (await import('../models/ShopDetail.js')).default;
  const ProductDetail = (await import('../models/ProductDetail.js')).default;
  const shops = await ShopDetail.find().populate('idUser');
  const products = await ProductDetail.find();
  const userMap = {};
  products.forEach(p => {
    if (p.idShop) {
      userMap[p.idShop] = (userMap[p.idShop] || 0) + 1;
    }
  });
  const result = shops
    .filter(shop => userMap[shop._id])
    .map(shop => ({
      user: shop.idUser,
      shopId: shop._id,
      productCount: userMap[shop._id] || 0,
    }));
  res.json({ data: result });
});

export default router;
