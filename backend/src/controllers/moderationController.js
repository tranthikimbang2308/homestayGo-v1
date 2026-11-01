import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPagination, escapeRegex } from '../utils/pagination.js';

const populateReview = (query) =>
  query.populate('room', 'title slug images city ratingAvg ratingCount').populate('customer', 'name email avatar');

const findReviewOr404 = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Không tìm thấy đánh giá');
  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, 'Không tìm thấy đánh giá');
  return review;
};

export const getModerationReviews = asyncHandler(async (req, res) => {
  const { rating, isHidden, keyword } = req.query;
  const { page, limit, skip } = getPagination(req.query, 10);
  const filter = {};
  const ratingValue = Number(rating);
  if (Number.isInteger(ratingValue) && ratingValue >= 1 && ratingValue <= 5) filter.rating = ratingValue;
  if (isHidden === 'true') filter.isHidden = true;
  if (isHidden === 'false') filter.isHidden = { $ne: true };
  const text = String(keyword || '').trim();
  if (text) {
    const regex = new RegExp(escapeRegex(text), 'i');
    const [roomIds, userIds] = await Promise.all([
      Room.find({ title: regex }).distinct('_id'),
      User.find({ $or: [{ name: regex }, { email: regex }] }).distinct('_id'),
    ]);
    filter.$or = [{ comment: regex }, { room: { $in: roomIds } }, { customer: { $in: userIds } }];
  }
  const [items, total, hiddenCount] = await Promise.all([
    populateReview(Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Review.countDocuments(filter),
    Review.countDocuments({ isHidden: true }),
  ]);
  res.json({ success: true, data: items, hiddenCount, pagination: buildPagination(page, limit, total) });
});

export const hideReview = asyncHandler(async (req, res) => {
  const reason = String(req.body?.reason || '').trim();
  if (!reason) throw new ApiError(400, 'Vui lòng nhập lý do ẩn đánh giá');
  const review = await findReviewOr404(req.params.id);
  review.isHidden = true;
  review.hiddenReason = reason;
  review.hiddenAt = new Date();
  await review.save();
  await Review.recalcRoomRating(review.room);
  const populated = await populateReview(Review.findById(review._id));
  res.json({ success: true, message: 'Đã ẩn đánh giá', data: populated });
});

export const showReview = asyncHandler(async (req, res) => {
  const review = await findReviewOr404(req.params.id);
  review.isHidden = false;
  review.hiddenReason = '';
  review.hiddenAt = undefined;
  await review.save();
  await Review.recalcRoomRating(review.room);
  const populated = await populateReview(Review.findById(review._id));
  res.json({ success: true, message: 'Đã hiện lại đánh giá', data: populated });
});
