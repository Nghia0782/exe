import express from 'express';
import {
  createOrderEvidenceController,
  getOrderEvidenceByIdController,
  getEvidencesByOrderIdController,
  getEvidencesBySubmitterController,
  updateEvidenceStatusController,
  deleteOrderEvidenceController,
} from '../controllers/orderEvidenceController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', protect, createOrderEvidenceController);

router.get('/:evidenceId', getOrderEvidenceByIdController);

router.get('/order/:orderId', getEvidencesByOrderIdController);

router.get('/my-evidence', getEvidencesBySubmitterController);

router.put('/:evidenceId/status', protect, updateEvidenceStatusController);

router.delete('/:evidenceId', deleteOrderEvidenceController);

export default router;
