import express from 'express';
import { getAllOrders, getOrderStats, updateOrderStatus, getOrderDetails, getOrdersByDateRange } from '../controllers/orderManagementController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorizeRoles('admin'));

// Get all orders
router.get('/', getAllOrders);

// Get order statistics
router.get('/stats', getOrderStats);

// Get orders by date range
router.get('/date-range', getOrdersByDateRange);

// Get order details
router.get('/:orderId', getOrderDetails);

// Update order status
router.put('/:orderId/status', updateOrderStatus);

export default router;
