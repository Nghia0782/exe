import { Router } from 'express';
import * as chatCtrl from '../controllers/chatController.js';
import { protect, ensureVerifiedUser } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/', chatCtrl.getAllRooms);
router.post('/', chatCtrl.getOrCreateRoom);

router.get('/shop/:shopId', chatCtrl.getRoomsByShopId);

router.get('/:roomId/messages', chatCtrl.getMessages);
router.post('/:roomId/messages', chatCtrl.sendMessage);
router.get('/shop/:shopId', chatCtrl.getRoomsByShop);
export default router;
