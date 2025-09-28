import express from 'express'
import multer from 'multer'
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js'
import { submitKyc, getStatus, adminList, adminUpdate, adminGetAllUsersKycStatus } from '../controllers/kycController.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// User submit & status
router.post('/submit', protect, upload.fields([
  { name: 'frontImage', maxCount: 1 },
  { name: 'backImage', maxCount: 1 },
  { name: 'selfieImage', maxCount: 1 },
]), submitKyc)

router.get('/status', protect, getStatus)

// Admin endpoints
router.get('/admin/list', protect, authorizeRoles('admin'), adminList)
router.post('/admin/update', protect, authorizeRoles('admin'), adminUpdate)
router.get('/admin/users-status', protect, authorizeRoles('admin'), adminGetAllUsersKycStatus)

export default router


