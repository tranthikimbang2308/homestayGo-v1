import mongoose from 'mongoose';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const LATEST_REVIEW_LIMIT = 6;

export const getHostProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(404, 'Không tìm thấy chủ phòng');
  const host = await User.findById(id).select('name avatar bio role createdAt isActive');
  if (!host || !['owner', 'admin'].includes(host.role)) throw new ApiError(404, 'Không tìm thấy chủ phòng');

  const rooms = await Room.find({ owner: host._id, status: 'approved' })
    .sort({ ratingAvg: -1, createdAt: -1 })
    .populate('owner', 'name avatar');
  const roomIds = rooms.map((room) => room._id);
  const reviewFilter = { room: { $in: roomIds }, isHidden: { $ne: true } };

  const [reviews, ratingGroups, completedBookings] = await Promise.all([
    Review.find(reviewFilter)
      .sort({ createdAt: -1 })
      .limit(LATEST_REVIEW_LIMIT)
      .populate('customer', 'name avatar')
      .populate('room', 'title slug'),
    Review.aggregate([
      { $match: reviewFilter },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
    Booking.countDocuments({ owner: host._id, status: 'completed' }),
  ]);

  const ratingSummary = ratingGroups[0];
  res.json({
    success: true,
    data: {
      host: { _id: host._id, name: host.name, avatar: host.avatar, bio: host.bio, createdAt: host.createdAt },
      stats: {
        roomCount: rooms.length,
        reviewCount: ratingSummary ? ratingSummary.count : 0,
        ratingAvg: ratingSummary ? Math.round(ratingSummary.avg * 10) / 10 : 0,
        completedBookings,
      },
      rooms,
      reviews,
    },
  });
});
