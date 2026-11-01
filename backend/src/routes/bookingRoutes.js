import { Router } from 'express';
import {
  getQuote,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  payBooking,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/quote', getQuote);

router.use(protect);

router.post('/', authorize('customer'), createBooking);
router.get('/my', authorize('customer'), getMyBookings);
router.get('/:id', getBookingById);
router.patch('/:id/cancel', authorize('customer'), cancelBooking);
router.post('/:id/pay', authorize('customer'), payBooking);

export default router;
