import { Router } from 'express';
import {
  getAdminStats,
  getUsers,
  toggleUserStatus,
  changeUserRole,
  getAllRooms,
  approveRoom,
  rejectRoom,
  hideRoom,
  getAllBookings,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/role', changeUserRole);
router.get('/rooms', getAllRooms);
router.patch('/rooms/:id/approve', approveRoom);
router.patch('/rooms/:id/reject', rejectRoom);
router.patch('/rooms/:id/hide', hideRoom);
router.get('/bookings', getAllBookings);

export default router;
