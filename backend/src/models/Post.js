import mongoose from 'mongoose';
import { generateSlug } from '../utils/slugify.js';

export const POST_CATEGORIES = ['kinh-nghiem', 'diem-den', 'am-thuc', 'tin-tuc'];

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Vui lòng nhập tiêu đề bài viết'], trim: true, maxlength: [200, 'Tiêu đề tối đa 200 ký tự'] },
    slug: { type: String, unique: true },
    excerpt: { type: String, default: '', trim: true, maxlength: [500, 'Tóm tắt tối đa 500 ký tự'] },
    content: { type: String, required: [true, 'Vui lòng nhập nội dung bài viết'] },
    coverImage: { type: String, default: '' },
    category: { type: String, enum: { values: POST_CATEGORIES, message: 'Danh mục không hợp lệ' }, default: 'kinh-nghiem' },
    tags: [{ type: String, trim: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ isPublished: 1, category: 1, createdAt: -1 });

postSchema.pre('save', async function ensureSlug() {
  if (!this.slug || this.isModified('title')) this.slug = generateSlug(this.title);
});

postSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Post', postSchema);
