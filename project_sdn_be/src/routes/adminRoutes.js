import express from 'express';
import { getAdminStats, getUserStats, getComprehensiveAdminStats, getRecentActivity } from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin stats endpoint
router.get('/stats', protect, authorizeRoles('admin'), (req, res, next) => {
  console.log('[Admin Stats Route] User:', req.user?.email, 'Roles:', req.user?.roles);
  next();
}, getAdminStats);

// User stats endpoint
router.get('/users/me/stats', protect, getUserStats);

// Comprehensive admin stats endpoint
router.get('/comprehensive-stats', protect, authorizeRoles('admin'), (req, res, next) => {
  console.log('[Comprehensive Admin Stats Route] User:', req.user?.email, 'Roles:', req.user?.roles);
  next();
}, getComprehensiveAdminStats);

// Recent activity endpoint
router.get('/recent-activity', protect, authorizeRoles('admin'), (req, res, next) => {
  console.log('[Recent Activity Route] User:', req.user?.email, 'Roles:', req.user?.roles);
  next();
}, getRecentActivity);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes working', timestamp: new Date().toISOString() });
});

export default router;
