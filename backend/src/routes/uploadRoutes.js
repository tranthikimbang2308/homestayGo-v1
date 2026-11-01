import { Router } from 'express';
import { uploadImages } from '../controllers/uploadController.js';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = Router();

router.post('/', protect, upload.array('images', 10), uploadImages);

export default router;
