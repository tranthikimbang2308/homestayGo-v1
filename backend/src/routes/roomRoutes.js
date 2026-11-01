import { Router } from 'express';
import {
  getRooms,
  getCities,
  getFeaturedRooms,
  getMapRooms,
  compareRooms,
  getRoomDetail,
  getBookedDates,
  getRoomReviews,
  getSimilarRooms,
} from '../controllers/roomController.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', getRooms);
router.get('/cities', getCities);
router.get('/featured', getFeaturedRooms);
router.get('/map', getMapRooms);
router.get('/compare', compareRooms);
router.get('/:id/booked-dates', getBookedDates);
router.get('/:id/reviews', getRoomReviews);
router.get('/:id/similar', getSimilarRooms);
router.get('/:idOrSlug', optionalAuth, getRoomDetail);

export default router;
