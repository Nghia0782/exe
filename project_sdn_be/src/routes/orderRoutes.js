import express from 'express';
import {
  updateOrderStatusController,
  getProductsFromOrderController,
  getAllOrderedProductsController,
  createPaymentController,
  getOrdersByUserIdController,
  getOrdersByRenterIdController,
  getOrderWithRenterDetailsController,
  createOrderController,
  getOrderByIdController,
  checkOrderController,
  getMyOrdersController,
  getOrderPaymentQrController,
  confirmOrderController,
  startDeliveryController,
  markReceivedController,
  requestReturnController,
  completeOrderController,
  cancelOrderController,
  createOrderReviewController,
} from '../controllers/orderController.js';
import { protect, authorizeRoles, ensureKycApproved } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get('/completed', async (req, res) => {
  const Order = (await import('../models/Order.js')).default;
  const orders = await Order.find({ status: 'completed' })
    .populate('customerId')
    .populate({
      path: 'products',
      populate: { path: 'productId', model: 'ProductDetail' },
    });
  res.json({ data: orders });
});

// Count endpoint - MUST be before /:orderId route to avoid conflict
router.get('/count', async (req, res) => {
  try {
    console.log('[Orders Count] Starting to count orders...');
    const Order = (await import('../models/Order.js')).default;
    console.log('[Orders Count] Order model imported successfully');
    const count = await Order.countDocuments();
    console.log('[Orders Count] Total orders count:', count);
    res.json({ data: { count } });
  } catch (error) {
    console.error('[Orders Count] Error counting orders:', error);
    console.error('[Orders Count] Error stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, getMyOrdersController);
router.get('/:orderId', getOrderByIdController);
router.put('/:orderId/status', protect, updateOrderStatusController);
// Require KYC approved to create/check order
router.post('/', protect, ensureKycApproved, createOrderController);
router.post('/check', protect, ensureKycApproved, checkOrderController);
router.get('/:orderId/products', getProductsFromOrderController);
router.get('/products/all', getAllOrderedProductsController);
router.post('/create-payment-url', protect, createPaymentController);
router.get('/:orderId/payment-qr', protect, getOrderPaymentQrController);

// Convenience routes enforcing role-based transitions
router.post('/:orderId/confirm', protect, confirmOrderController);
router.post('/:orderId/start-delivery', protect, startDeliveryController);
router.post('/:orderId/mark-received', protect, markReceivedController);
router.post('/:orderId/request-return', protect, requestReturnController);
router.post('/:orderId/complete', protect, completeOrderController);
router.post('/:orderId/cancel', protect, cancelOrderController);
router.post('/:orderId/reviews', protect, createOrderReviewController);

router.get('/user/:userId', protect, getOrdersByUserIdController);
router.get('/renter/:renterId', protect, getOrdersByRenterIdController);
router.get(
  '/:orderId/renter-details',
  protect,
  getOrderWithRenterDetailsController
);

export default router;
