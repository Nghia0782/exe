import User from '../models/User.js';
import KycRequest from '../models/KycRequest.js';

// Get all users for admin
export const getAllUsers = async (req, res) => {
    try {
        console.log('[Get All Users] Starting to fetch all users...');
        
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();
        
        console.log('[Get All Users] Found users:', users.length);
        
        // Ensure users array is never null/undefined
        const safeUsers = users || [];
        
        // Get KYC status for each user
        const usersWithKyc = await Promise.all(safeUsers.map(async (user) => {
            const kycRequest = await KycRequest.findOne({ userId: user._id })
                .sort({ createdAt: -1 })
                .lean();
            
            return {
                ...user,
                identityVerification: kycRequest ? {
                    status: kycRequest.status,
                    verifiedAt: kycRequest.verifiedAt,
                    idType: kycRequest.idType
                } : null
            };
        }));
        
        res.json({
            success: true,
            data: usersWithKyc
        });
    } catch (error) {
        console.error('[Get All Users] Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
        console.log('[User Stats] Starting to fetch user statistics...');
        
        // Get total users
        const totalUsers = await User.countDocuments();
        console.log('[User Stats] Total users:', totalUsers);
        
        // Get active users (users with recent activity)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsers = await User.countDocuments({
            updatedAt: { $gte: thirtyDaysAgo }
        });
        console.log('[User Stats] Active users:', activeUsers);
        
        // Get verified users
        const verifiedUsers = await KycRequest.countDocuments({ status: 'verified' });
        console.log('[User Stats] Verified users:', verifiedUsers);
        
        // Get admin users
        const adminUsers = await User.countDocuments({ roles: { $in: ['admin'] } });
        console.log('[User Stats] Admin users:', adminUsers);
        
        // Get new users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const newUsersToday = await User.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow }
        });
        console.log('[User Stats] New users today:', newUsersToday);
        
        // Get new users this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const newUsersThisWeek = await User.countDocuments({
            createdAt: { $gte: weekAgo }
        });
        console.log('[User Stats] New users this week:', newUsersThisWeek);
        
        const statsData = {
            totalUsers,
            activeUsers,
            verifiedUsers,
            adminUsers,
            newUsersToday,
            newUsersThisWeek
        };
        
        console.log('[User Stats] Final user stats:', statsData);
        
        res.json({
            success: true,
            data: statsData
        });
    } catch (error) {
        console.error('[User Stats] Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update user status
export const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive, roles } = req.body;
        
        console.log('[Update User Status] Updating user:', userId, { isActive, roles });
        
        const updateData = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (roles !== undefined) updateData.roles = roles;
        
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log('[Update User Status] User updated successfully:', user.email);
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('[Update User Status] Error updating user:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user details
export const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log('[Get User Details] Fetching user details for:', userId);
        
        const user = await User.findById(userId).select('-password').lean();
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get KYC information
        const kycRequest = await KycRequest.findOne({ userId })
            .sort({ createdAt: -1 })
            .lean();
        
        // Get user's orders
        const Order = (await import('../models/Order.js')).default;
        const orders = await Order.find({ customerId: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        
        const userDetails = {
            ...user,
            identityVerification: kycRequest ? {
                status: kycRequest.status,
                verifiedAt: kycRequest.verifiedAt,
                idType: kycRequest.idType,
                idNumber: kycRequest.idNumber,
                frontImage: kycRequest.frontImage,
                backImage: kycRequest.backImage
            } : null,
            recentOrders: orders
        };
        
        console.log('[Get User Details] User details fetched successfully');
        
        res.json({
            success: true,
            data: userDetails
        });
    } catch (error) {
        console.error('[Get User Details] Error fetching user details:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export default {
    getAllUsers,
    getUserStats,
    updateUserStatus,
    getUserDetails
};
