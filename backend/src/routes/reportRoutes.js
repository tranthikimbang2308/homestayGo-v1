import { Router } from 'express';
import { createReport, getMyReports, getReports, handleReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(protect);

router.post('/', authorize('customer'), createReport);
router.get('/mine', getMyReports);
router.get('/', authorize('admin'), getReports);
router.patch('/:id', authorize('admin'), handleReport);

export default router;
