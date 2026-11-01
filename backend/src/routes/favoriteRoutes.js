import { Router } from 'express';
import { getFavorites, toggleFavorite } from '../controllers/favoriteController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

router.use(protect);

router.get('/', getFavorites);
router.post('/:roomId', toggleFavorite);

export default router;
