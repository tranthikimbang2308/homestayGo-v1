import { Router } from 'express';
import { getPosts, getPostBySlug, getAdminPosts, getAdminPost, createPost, updatePost, deletePost } from '../controllers/postController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();
const adminOnly = [protect, authorize('admin')];

router.get('/', getPosts);
router.get('/admin/all', ...adminOnly, getAdminPosts);
router.get('/admin/:id', ...adminOnly, getAdminPost);
router.post('/', ...adminOnly, createPost);
router.put('/:id', ...adminOnly, updatePost);
router.delete('/:id', ...adminOnly, deletePost);
router.get('/:slug', getPostBySlug);

export default router;
