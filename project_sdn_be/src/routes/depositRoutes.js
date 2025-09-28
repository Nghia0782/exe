import express from 'express';
import {
    createDeposit,
    getDeposit,
    getUserDeposits,
    confirmDepositPayment,
    refundDeposit,
    forfeitDeposit,
    getDepositStats,
    vnpayReturn,
    vnpayIpn,
    getPaymentHistoryMy,
    getPaymentHistoryAdmin
} from '../controllers/depositController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/vnpay-return', vnpayReturn);
router.get('/vnpay-ipn', vnpayIpn);
router.post('/confirm-payment/:depositId', protect, confirmDepositPayment);

// Protected routes (cần đăng nhập)
router.post('/', protect, createDeposit);
router.get('/user', protect, getUserDeposits);
router.get('/history/my', protect, getPaymentHistoryMy);
router.get('/:depositId', protect, getDeposit);

// Admin routes
router.post('/:depositId/refund', protect, authorizeRoles('admin'), refundDeposit);
router.post('/:depositId/forfeit', protect, authorizeRoles('admin'), forfeitDeposit);
router.get('/admin/stats', protect, authorizeRoles('admin'), getDepositStats);
router.get('/admin/history', protect, authorizeRoles('admin'), getPaymentHistoryAdmin);

export default router;
