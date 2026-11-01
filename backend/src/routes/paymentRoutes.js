import { Router } from 'express';
import { vnpayReturn } from '../controllers/paymentController.js';

const router = Router();

router.get('/vnpay-return', vnpayReturn);

export default router;
