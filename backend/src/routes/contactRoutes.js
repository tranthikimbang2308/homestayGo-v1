import { Router } from 'express';
import { createContact, getContacts, replyContact, closeContact, deleteContact } from '../controllers/contactController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();
const adminOnly = [protect, authorize('admin')];

router.post('/', createContact);
router.get('/', ...adminOnly, getContacts);
router.patch('/:id/reply', ...adminOnly, replyContact);
router.patch('/:id/close', ...adminOnly, closeContact);
router.delete('/:id', ...adminOnly, deleteContact);

export default router;
