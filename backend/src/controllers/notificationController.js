import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPagination } from '../utils/pagination.js';

const ensureValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Mã thông báo không hợp lệ');
};

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20);
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, data: { items, unreadCount }, pagination: buildPagination(page, limit, total) });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, data: { count } });
});

export const markAsRead = asyncHandler(async (req, res) => {
  ensureValidId(req.params.id);
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Không tìm thấy thông báo');
  res.json({ success: true, data: notification, message: 'Đã đánh dấu đã đọc' });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, data: { modified: result.modifiedCount }, message: 'Đã đánh dấu tất cả là đã đọc' });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  ensureValidId(req.params.id);
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new ApiError(404, 'Không tìm thấy thông báo');
  res.json({ success: true, data: null, message: 'Đã xóa thông báo' });
});
