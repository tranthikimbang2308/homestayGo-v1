import { Router } from 'express';
import { createReview } from '../controllers/reviewController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();

router.post('/', protect, authorize('customer'), createReview);

export default router;
