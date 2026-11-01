import { Router } from 'express';
import {
  getPublicCoupons,
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
} from '../controllers/couponController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/public', getPublicCoupons);
router.post('/validate', protect, authorize('customer'), validateCoupon);

router.use(protect, authorize('owner', 'admin'));

router.get('/', getCoupons);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);
router.patch('/:id/toggle', toggleCoupon);

export default router;
