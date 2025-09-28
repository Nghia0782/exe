import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getDepositPolicy } from '../controllers/depositPolicyController.js';

const router = express.Router();

// Lấy thông tin chính sách đặt cọc cho sản phẩm
router.get('/product/:productId', protect, getDepositPolicy);

export default router;
