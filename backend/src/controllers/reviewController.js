import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { notify } from '../utils/notify.js';

export const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body || {};
  if (!bookingId || !mongoose.isValidObjectId(bookingId)) throw new ApiError(400, 'Đơn đặt phòng không hợp lệ');
  const ratingValue = Number(rating);
  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) throw new ApiError(400, 'Số sao đánh giá phải từ 1 đến 5');
  const booking = await Booking.findOne({ _id: bookingId, customer: req.user._id });
  if (!booking) throw new ApiError(404, 'Không tìm thấy đơn đặt phòng');
  if (booking.status !== 'completed') throw new ApiError(400, 'Chỉ có thể đánh giá sau khi hoàn thành lưu trú');
  if (booking.isReviewed) throw new ApiError(409, 'Bạn đã đánh giá đơn đặt phòng này');

  const review = await Review.create({
    room: booking.room,
    booking: booking._id,
    customer: req.user._id,
    rating: ratingValue,
    comment: comment ? String(comment).trim() : '',
  });
  booking.isReviewed = true;
  await booking.save();
  await Review.recalcRoomRating(booking.room);
  await review.populate('customer', 'name avatar');
  await notify(booking.owner, {
    type: 'review_new',
    title: 'Có đánh giá mới',
    message: `${req.user.name} đã đánh giá ${ratingValue} sao cho đơn ${booking.code}.`,
    link: '/owner/reviews',
  });
  res.status(201).json({ success: true, message: 'Cảm ơn bạn đã đánh giá', data: review });
});
