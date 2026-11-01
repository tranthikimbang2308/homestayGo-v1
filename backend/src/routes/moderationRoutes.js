import { Router } from 'express';
import { getModerationReviews, hideReview, showReview } from '../controllers/moderationController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/reviews', getModerationReviews);
router.patch('/reviews/:id/hide', hideReview);
router.patch('/reviews/:id/show', showReview);

export default router;
