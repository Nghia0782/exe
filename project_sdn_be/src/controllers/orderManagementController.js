import Order from '../models/Order.js';
import User from '../models/User.js';
import ProductDetail from '../models/ProductDetail.js';

// Get all orders for admin
export const getAllOrders = async (req, res) => {
    try {
        console.log('[Get All Orders] Starting to fetch all orders...');
        
        const orders = await Order.find()
            .populate('customerId', 'name email phone')
            .populate({
                path: 'products',
                populate: {
                    path: 'productId',
                    model: 'ProductDetail',
                    select: 'title price images'
                }
            })
            .sort({ createdAt: -1 })
            .lean();
        
        console.log('[Get All Orders] Found orders:', orders.length);
        
        // Ensure orders array is never null/undefined
        const safeOrders = orders || [];
        
        res.json({
            success: true,
            data: safeOrders
        });
    } catch (error) {
        console.error('[Get All Orders] Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
    try {
        console.log('[Order Stats] Starting to fetch order statistics...');
        
        // Get total orders
        const totalOrders = await Order.countDocuments();
        console.log('[Order Stats] Total orders:', totalOrders);
        
        // Get pending orders
        const pendingOrders = await Order.countDocuments({ 
            status: { $in: ['pending_confirmation', 'pending_payment'] } 
        });
        console.log('[Order Stats] Pending orders:', pendingOrders);
        
        // Get completed orders
        const completedOrders = await Order.countDocuments({ 
            status: 'completed' 
        });
        console.log('[Order Stats] Completed orders:', completedOrders);
        
        // Get cancelled orders
        const cancelledOrders = await Order.countDocuments({ 
            status: 'cancelled' 
        });
        console.log('[Order Stats] Cancelled orders:', cancelledOrders);
        
        // Get total revenue
        const revenueResult = await Order.aggregate([
            { $match: { status: { $in: ['completed', 'paid'] } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        console.log('[Order Stats] Total revenue:', totalRevenue);
        
        // Get today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayRevenueResult = await Order.aggregate([
            { 
                $match: { 
                    status: { $in: ['completed', 'paid'] },
                    createdAt: { $gte: today, $lt: tomorrow }
                } 
            },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;
        console.log('[Order Stats] Today revenue:', todayRevenue);
        
        // Get weekly revenue
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklyRevenueResult = await Order.aggregate([
            { 
                $match: { 
                    status: { $in: ['completed', 'paid'] },
                    createdAt: { $gte: weekAgo }
                } 
            },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const weeklyRevenue = weeklyRevenueResult.length > 0 ? weeklyRevenueResult[0].total : 0;
        console.log('[Order Stats] Weekly revenue:', weeklyRevenue);
        
        // Get monthly revenue
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const monthlyRevenueResult = await Order.aggregate([
            { 
                $match: { 
                    status: { $in: ['completed', 'paid'] },
                    createdAt: { $gte: thirtyDaysAgo }
                } 
            },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;
        console.log('[Order Stats] Monthly revenue:', monthlyRevenue);
        
        const statsData = {
            totalOrders,
            pendingOrders,
            completedOrders,
            cancelledOrders,
            totalRevenue,
            todayRevenue,
            weeklyRevenue,
            monthlyRevenue
        };
        
        console.log('[Order Stats] Final order stats:', statsData);
        
        res.json({
            success: true,
            data: statsData
        });
    } catch (error) {
        console.error('[Order Stats] Error fetching order stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, paymentStatus } = req.body;
        
        console.log('[Update Order Status] Updating order:', orderId, { status, paymentStatus });
        
        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
        
        const order = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true, runValidators: true }
        ).populate('customerId', 'name email');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        console.log('[Update Order Status] Order updated successfully:', order._id);
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('[Update Order Status] Error updating order:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get order details
export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        console.log('[Get Order Details] Fetching order details for:', orderId);
        
        const order = await Order.findById(orderId)
            .populate('customerId', 'name email phone address')
            .populate({
                path: 'products',
                populate: {
                    path: 'productId',
                    model: 'ProductDetail',
                    select: 'title price images description'
                }
            })
            .lean();
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        console.log('[Get Order Details] Order details fetched successfully');
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('[Get Order Details] Error fetching order details:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get orders by date range
export const getOrdersByDateRange = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        
        console.log('[Get Orders By Date Range] Fetching orders:', { startDate, endDate, status });
        
        const filter = {};
        
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        if (status) {
            filter.status = status;
        }
        
        const orders = await Order.find(filter)
            .populate('customerId', 'name email')
            .populate({
                path: 'products',
                populate: {
                    path: 'productId',
                    model: 'ProductDetail',
                    select: 'title price'
                }
            })
            .sort({ createdAt: -1 })
            .lean();
        
        console.log('[Get Orders By Date Range] Found orders:', orders.length);
        
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('[Get Orders By Date Range] Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export default {
    getAllOrders,
    getOrderStats,
    updateOrderStatus,
    getOrderDetails,
    getOrdersByDateRange
};
