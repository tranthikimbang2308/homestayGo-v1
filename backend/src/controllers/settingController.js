import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { getSettings, updateSettings } from '../utils/settings.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Post from '../models/Post.js';

const TEXT_FIELDS = ['siteName', 'hotline', 'email', 'address', 'about', 'facebook', 'zalo', 'policies'];

export const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.json({ success: true, data: settings });
});

export const putSettings = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const payload = {};
  TEXT_FIELDS.forEach((field) => {
    if (body[field] !== undefined) payload[field] = String(body[field] ?? '').trim();
  });
  if (payload.siteName === '') throw new ApiError(400, 'Tên website không được để trống');
  if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email)) throw new ApiError(400, 'Email liên hệ không hợp lệ');
  if (body.serviceFeePercent !== undefined) {
    const fee = Number(body.serviceFeePercent);
    if (body.serviceFeePercent === '' || !Number.isFinite(fee) || fee < 0 || fee > 30) throw new ApiError(400, 'Phí dịch vụ phải từ 0 đến 30%');
    payload.serviceFeePercent = Math.round(fee * 10) / 10;
  }
  const settings = await updateSettings(payload);
  res.json({ success: true, message: 'Đã lưu cài đặt hệ thống', data: settings });
});

export const getPublicStats = asyncHandler(async (req, res) => {
  const [rooms, cities, hosts, customers, completedBookings, reviewRow, posts] = await Promise.all([
    Room.countDocuments({ status: 'approved' }),
    Room.distinct('city', { status: 'approved' }),
    Room.distinct('owner', { status: 'approved' }),
    User.countDocuments({ role: 'customer', isActive: true }),
    Booking.countDocuments({ status: 'completed' }),
    Review.aggregate([{ $match: { isHidden: { $ne: true } } }, { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } }]),
    Post.countDocuments({ isPublished: true }),
  ]);
  res.json({
    success: true,
    data: {
      rooms,
      cities: cities.filter(Boolean).length,
      hosts: hosts.length,
      customers,
      completedBookings,
      reviews: reviewRow[0]?.count || 0,
      ratingAvg: reviewRow[0] ? Math.round(reviewRow[0].avg * 10) / 10 : 0,
      posts,
    },
  });
});
