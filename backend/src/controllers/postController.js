import mongoose from 'mongoose';
import Post, { POST_CATEGORIES } from '../models/Post.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPagination, escapeRegex } from '../utils/pagination.js';

const LIST_FIELDS = '-content';

const buildKeywordFilter = (keyword) => {
  const text = String(keyword || '').trim();
  if (!text) return null;
  const regex = new RegExp(escapeRegex(text), 'i');
  return [{ title: regex }, { excerpt: regex }, { tags: regex }];
};

const normalizeTags = (tags) => {
  const list = Array.isArray(tags) ? tags : String(tags || '').split(',');
  return [...new Set(list.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 10);
};

const pickPostFields = (body = {}) => {
  const data = {};
  ['title', 'excerpt', 'content', 'coverImage'].forEach((field) => {
    if (body[field] !== undefined) data[field] = String(body[field] ?? '').trim();
  });
  if (body.category !== undefined) {
    if (!POST_CATEGORIES.includes(body.category)) throw new ApiError(400, 'Danh mục không hợp lệ');
    data.category = body.category;
  }
  if (body.tags !== undefined) data.tags = normalizeTags(body.tags);
  if (body.isPublished !== undefined) data.isPublished = body.isPublished === true || body.isPublished === 'true';
  return data;
};

const findPostOr404 = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Không tìm thấy bài viết');
  const post = await Post.findById(id);
  if (!post) throw new ApiError(404, 'Không tìm thấy bài viết');
  return post;
};

export const getPosts = asyncHandler(async (req, res) => {
  const { category, keyword } = req.query;
  const { page, limit, skip } = getPagination(req.query, 9);
  const filter = { isPublished: true };
  if (category && POST_CATEGORIES.includes(category)) filter.category = category;
  const keywordFilter = buildKeywordFilter(keyword);
  if (keywordFilter) filter.$or = keywordFilter;
  const [items, total] = await Promise.all([
    Post.find(filter).select(LIST_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('author', 'name avatar'),
    Post.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, pagination: buildPagination(page, limit, total) });
});

export const getPostBySlug = asyncHandler(async (req, res) => {
  const post = await Post.findOneAndUpdate(
    { slug: req.params.slug, isPublished: true },
    { $inc: { views: 1 } },
    { returnDocument: 'after' }
  ).populate('author', 'name avatar');
  if (!post) throw new ApiError(404, 'Không tìm thấy bài viết');
  const related = await Post.find({ _id: { $ne: post._id }, category: post.category, isPublished: true })
    .select(LIST_FIELDS)
    .sort({ createdAt: -1 })
    .limit(3);
  res.json({ success: true, data: { ...post.toJSON(), related } });
});

export const getAdminPosts = asyncHandler(async (req, res) => {
  const { category, keyword, status } = req.query;
  const { page, limit, skip } = getPagination(req.query, 10);
  const filter = {};
  if (category && POST_CATEGORIES.includes(category)) filter.category = category;
  if (status === 'published') filter.isPublished = true;
  if (status === 'draft') filter.isPublished = false;
  const keywordFilter = buildKeywordFilter(keyword);
  if (keywordFilter) filter.$or = keywordFilter;
  const [items, total] = await Promise.all([
    Post.find(filter).select(LIST_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('author', 'name'),
    Post.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, pagination: buildPagination(page, limit, total) });
});

export const getAdminPost = asyncHandler(async (req, res) => {
  const post = await findPostOr404(req.params.id);
  res.json({ success: true, data: post });
});

export const createPost = asyncHandler(async (req, res) => {
  const data = pickPostFields(req.body);
  if (!data.title) throw new ApiError(400, 'Vui lòng nhập tiêu đề bài viết');
  if (!data.content) throw new ApiError(400, 'Vui lòng nhập nội dung bài viết');
  const post = await Post.create({ ...data, author: req.user._id });
  res.status(201).json({ success: true, message: 'Đã tạo bài viết', data: post });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await findPostOr404(req.params.id);
  const data = pickPostFields(req.body);
  if (data.title === '') throw new ApiError(400, 'Vui lòng nhập tiêu đề bài viết');
  if (data.content === '') throw new ApiError(400, 'Vui lòng nhập nội dung bài viết');
  post.set(data);
  await post.save();
  res.json({ success: true, message: 'Đã cập nhật bài viết', data: post });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await findPostOr404(req.params.id);
  await post.deleteOne();
  res.json({ success: true, message: 'Đã xóa bài viết', data: { _id: post._id } });
});
