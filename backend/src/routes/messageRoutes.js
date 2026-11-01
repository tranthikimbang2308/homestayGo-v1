import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import {
  getConversations,
  startConversation,
  getConversationMessages,
  sendMessage,
  getUnreadMessageCount,
} from '../controllers/messageController.js';

const router = Router();

router.use(protect);
router.get('/unread-count', getUnreadMessageCount);
router.get('/conversations', getConversations);
router.post('/conversations', startConversation);
router.get('/conversations/:id', getConversationMessages);
router.post('/conversations/:id', sendMessage);

export default router;
