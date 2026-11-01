import { Router } from 'express';
import { getPublicSettings, getPublicStats, putSettings } from '../controllers/settingController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/', getPublicSettings);
router.get('/stats', getPublicStats);
router.put('/', protect, authorize('admin'), putSettings);

export default router;
