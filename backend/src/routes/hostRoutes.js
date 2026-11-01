import { Router } from 'express';
import { getHostProfile } from '../controllers/hostController.js';

const router = Router();

router.get('/:id', getHostProfile);

export default router;
