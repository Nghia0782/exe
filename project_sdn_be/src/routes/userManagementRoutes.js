import express from 'express';
import { getAllUsers, getUserStats, updateUserStatus, getUserDetails } from '../controllers/userManagementController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorizeRoles('admin'));

// Get all users
router.get('/', getAllUsers);

// Get user statistics
router.get('/stats', getUserStats);

// Get user details
router.get('/:userId', getUserDetails);

// Update user status
router.put('/:userId/status', updateUserStatus);

export default router;
