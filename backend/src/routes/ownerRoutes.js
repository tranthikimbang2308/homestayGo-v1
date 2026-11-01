import { Router } from 'express';
import {
  getMyRooms,
  createRoom,
  getMyRoom,
  updateRoom,
  deleteRoom,
  toggleVisibility,
  getOwnerBookings,
  updateBookingStatus,
  getOwnerReviews,
  replyReview,
  getOwnerStats,
  getOwnerCalendar,
  addBlockedDates,
  removeBlockedDates,
} from '../controllers/ownerController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(protect, authorize('owner'));

router.get('/rooms', getMyRooms);
router.post('/rooms', createRoom);
router.get('/rooms/:id', getMyRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);
router.patch('/rooms/:id/visibility', toggleVisibility);
router.get('/bookings', getOwnerBookings);
router.patch('/bookings/:id/status', updateBookingStatus);
router.get('/reviews', getOwnerReviews);
router.put('/reviews/:id/reply', replyReview);
router.get('/stats', getOwnerStats);
router.get('/calendar', getOwnerCalendar);
router.post('/rooms/:id/blocked-dates', addBlockedDates);
router.delete('/rooms/:id/blocked-dates/:blockId', removeBlockedDates);

export default router;
