import ProductDetail from '../models/ProductDetail.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

// Get admin dashboard stats
export const getAdminStats = async (req, res) => {
    try {
        console.log('[Admin Stats] Starting to fetch admin statistics...');
        
        // Get total products
        console.log('[Admin Stats] Fetching total products...');
        const totalProducts = await ProductDetail.countDocuments();
        console.log('[Admin Stats] Total products:', totalProducts);
        
        // Get total orders
        console.log('[Admin Stats] Fetching total orders...');
        const totalOrders = await Order.countDocuments();
        console.log('[Admin Stats] Total orders:', totalOrders);
        
        // Get total revenue
        console.log('[Admin Stats] Fetching total revenue...');
        const revenueResult = await Order.aggregate([
            { $match: { status: { $in: ['completed', 'paid'] } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        console.log('[Admin Stats] Total revenue:', totalRevenue);
        
        // Get pending orders
        console.log('[Admin Stats] Fetching pending orders...');
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        console.log('[Admin Stats] Pending orders:', pendingOrders);
        
        const statsData = {
            totalProducts,
            totalOrders,
            totalRevenue,
            pendingOrders
        };
        
        console.log('[Admin Stats] Final stats data:', statsData);
        
        res.json({
            success: true,
            data: statsData
        });
    } catch (error) {
        console.error('[Admin Stats] Error fetching admin stats:', error);
        console.error('[Admin Stats] Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user stats
export const getUserStats = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get user's total orders
        const totalOrders = await Order.countDocuments({ customerId: userId });
        
        // Get user's total spent
        const spentResult = await Order.aggregate([
            { $match: { customerId: userId, status: { $in: ['completed', 'paid'] } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalSpent = spentResult.length > 0 ? spentResult[0].total : 0;
        
        // Get active rentals
        const activeRentals = await Order.countDocuments({ 
            customerId: userId, 
            status: { $in: ['paid', 'processing'] } 
        });
        
        // Get completed rentals
        const completedRentals = await Order.countDocuments({ 
            customerId: userId, 
            status: 'completed' 
        });
        
        res.json({
            success: true,
            data: {
                totalOrders,
                totalSpent,
                activeRentals,
                completedRentals
            }
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get comprehensive admin statistics
export const getComprehensiveAdminStats = async (req, res) => {
    try {
        console.log('[Comprehensive Admin Stats] Starting to fetch comprehensive statistics...');
        
        // Get total users
        const totalUsers = await User.countDocuments();
        console.log('[Comprehensive Admin Stats] Total users:', totalUsers);
        
        // Get active users (users with recent activity)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsers = await User.countDocuments({
            updatedAt: { $gte: thirtyDaysAgo }
        });
        console.log('[Comprehensive Admin Stats] Active users:', activeUsers);
        
        // Get total products
        const totalProducts = await ProductDetail.countDocuments();
        console.log('[Comprehensive Admin Stats] Total products:', totalProducts);
        
        // Get total orders
        const totalOrders = await Order.countDocuments();
        console.log('[Comprehensive Admin Stats] Total orders:', totalOrders);
        
        // Get pending orders
        const pendingOrders = await Order.countDocuments({ 
            status: { $in: ['pending_confirmation', 'pending_payment'] } 
        });
        console.log('[Comprehensive Admin Stats] Pending orders:', pendingOrders);
        
        // Get completed orders
        const completedOrders = await Order.countDocuments({ 
            status: 'completed' 
        });
        console.log('[Comprehensive Admin Stats] Completed orders:', completedOrders);
        
        // Get total revenue
        const revenueResult = await Order.aggregate([
            { $match: { status: { $in: ['completed', 'paid'] } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        console.log('[Comprehensive Admin Stats] Total revenue:', totalRevenue);
        
        // Get daily revenue (today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dailyRevenueResult = await Order.aggregate([
            { 
                $match: { 
                    status: { $in: ['completed', 'paid'] },
                    createdAt: { $gte: today, $lt: tomorrow }
                } 
            },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const dailyRevenue = dailyRevenueResult.length > 0 ? dailyRevenueResult[0].total : 0;
        console.log('[Comprehensive Admin Stats] Daily revenue:', dailyRevenue);
        
        // Get weekly revenue (last 7 days)
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
        console.log('[Comprehensive Admin Stats] Weekly revenue:', weeklyRevenue);
        
        // Get monthly revenue (last 30 days)
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
        console.log('[Comprehensive Admin Stats] Monthly revenue:', monthlyRevenue);
        
        // Get pending KYC requests
        const KycRequest = (await import('../models/KycRequest.js')).default;
        const pendingKyc = await KycRequest.countDocuments({ status: 'pending' });
        console.log('[Comprehensive Admin Stats] Pending KYC:', pendingKyc);
        
        const statsData = {
            totalUsers,
            activeUsers,
            totalProducts,
            totalOrders,
            pendingOrders,
            completedOrders,
            totalRevenue,
            dailyRevenue,
            weeklyRevenue,
            monthlyRevenue,
            pendingKyc
        };
        
        console.log('[Comprehensive Admin Stats] Final comprehensive stats:', statsData);
        
        res.json({
            success: true,
            data: statsData
        });
    } catch (error) {
        console.error('[Comprehensive Admin Stats] Error fetching comprehensive stats:', error);
        console.error('[Comprehensive Admin Stats] Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get recent activity for admin dashboard
export const getRecentActivity = async (req, res) => {
    try {
        console.log('[Recent Activity] Starting to fetch recent activity...');
        
        const activities = [];
        
        // Get recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'name email')
            .lean();
        
        recentOrders.forEach(order => {
            activities.push({
                _id: `order_${order._id}`,
                type: 'order',
                action: `Đơn hàng mới #${order._id.toString().slice(-6)}`,
                user: order.customerId?.name || order.customerId?.email || 'Unknown',
                details: `Trạng thái: ${order.status}, Tổng: ${order.totalPrice?.toLocaleString()} ₫`,
                timestamp: order.createdAt
            });
        });
        
        // Get recent users
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
        
        recentUsers.forEach(user => {
            activities.push({
                _id: `user_${user._id}`,
                type: 'user',
                action: 'Người dùng mới đăng ký',
                user: user.name || user.email,
                details: `Email: ${user.email}, Vai trò: ${user.roles?.join(', ')}`,
                timestamp: user.createdAt
            });
        });
        
        // Get recent products
        const recentProducts = await ProductDetail.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
        
        recentProducts.forEach(product => {
            activities.push({
                _id: `product_${product._id}`,
                type: 'product',
                action: 'Sản phẩm mới được thêm',
                user: 'Admin',
                details: `${product.title} - ${product.price?.toLocaleString()} ₫`,
                timestamp: product.createdAt
            });
        });
        
        // Get recent KYC requests
        const KycRequest = (await import('../models/KycRequest.js')).default;
        const recentKyc = await KycRequest.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('userId', 'name email')
            .lean();
        
        recentKyc.forEach(kyc => {
            activities.push({
                _id: `kyc_${kyc._id}`,
                type: 'kyc',
                action: 'Yêu cầu KYC mới',
                user: kyc.userId?.name || kyc.userId?.email || 'Unknown',
                details: `Trạng thái: ${kyc.status}, Loại: ${kyc.idType}`,
                timestamp: kyc.createdAt
            });
        });
        
        // Sort all activities by timestamp
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        console.log('[Recent Activity] Total activities found:', activities.length);
        
        res.json({
            success: true,
            data: activities.slice(0, 20) // Return top 20 most recent
        });
    } catch (error) {
        console.error('[Recent Activity] Error fetching recent activity:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export default { getAdminStats, getUserStats, getComprehensiveAdminStats, getRecentActivity };
