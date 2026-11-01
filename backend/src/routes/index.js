import { Router } from 'express';
import authRoutes from './authRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import roomRoutes from './roomRoutes.js';
import ownerRoutes from './ownerRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import favoriteRoutes from './favoriteRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import adminRoutes from './adminRoutes.js';
import couponRoutes from './couponRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import messageRoutes from './messageRoutes.js';
import postRoutes from './postRoutes.js';
import contactRoutes from './contactRoutes.js';
import reportRoutes from './reportRoutes.js';
import moderationRoutes from './moderationRoutes.js';
import settingRoutes from './settingRoutes.js';
import hostRoutes from './hostRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() }, message: 'HomestayGo API đang hoạt động' });
});

router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/rooms', roomRoutes);
router.use('/owner', ownerRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payment', paymentRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/coupons', couponRoutes);
router.use('/notifications', notificationRoutes);
router.use('/messages', messageRoutes);
router.use('/posts', postRoutes);
router.use('/contacts', contactRoutes);
router.use('/reports', reportRoutes);
router.use('/moderation', moderationRoutes);
router.use('/settings', settingRoutes);
router.use('/hosts', hostRoutes);

export default router;
