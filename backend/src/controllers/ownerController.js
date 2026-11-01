import mongoose from 'mongoose';
import Room from '../models/Room.js';
import Booking, { ACTIVE_BOOKING_STATUSES } from '../models/Booking.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPagination, escapeRegex } from '../utils/pagination.js';
import { getBookingsByStatus, getTotalRevenue, getMonthlyRevenue } from '../utils/stats.js';
import { notify } from '../utils/notify.js';
import { sendMail, mailLayout, mailButton, escapeHtml } from '../utils/mailer.js';
import dayjs from 'dayjs';
import { findOverlappingBooking, blockEndExclusive } from '../utils/bookingRules.js';
import { normalizeDate } from '../utils/date.js';

const ROOM_FIELDS = [
  'title', 'description', 'roomType', 'address', 'city', 'district', 'location', 'pricePerNight',
  'cleaningFee', 'maxGuests', 'bedrooms', 'beds', 'bathrooms', 'area', 'amenities', 'images',
  'rules', 'checkInTime', 'checkOutTime', 'weekendPrice', 'minNights',
];

const pickRoomFields = (body = {}) => {
  const data = {};
  ROOM_FIELDS.forEach((field) => {
    if (body[field] !== undefined) data[field] = body[field];
  });
  if (data.location) {
    data.location = {
      lat: data.location.lat === '' || data.location.lat === null || data.location.lat === undefined ? null : Number(data.location.lat),
      lng: data.location.lng === '' || data.location.lng === null || data.location.lng === undefined ? null : Number(data.location.lng),
    };
  }
  if (data.amenities && !Array.isArray(data.amenities)) data.amenities = String(data.amenities).split(',').filter(Boolean);
  if (data.images && !Array.isArray(data.images)) data.images = [data.images];
  return data;
};

const findMyRoom = async (req) => {
  const room = await Room.findOne({ _id: req.params.id, owner: req.user._id });
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng');
  return room;
};

export const getMyRooms = asyncHandler(async (req, res) => {
  const { status, keyword } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  if (keyword && String(keyword).trim()) {
    const regex = new RegExp(escapeRegex(String(keyword).trim()), 'i');
    filter.$or = [{ title: regex }, { city: regex }, { address: regex }];
  }
  const [rooms, total] = await Promise.all([
    Room.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Room.countDocuments(filter),
  ]);
  res.json({ success: true, data: rooms, pagination: buildPagination(page, limit, total) });
});

export const createRoom = asyncHandler(async (req, res) => {
  const data = pickRoomFields(req.body);
  if (!data.title || !String(data.title).trim()) throw new ApiError(400, 'Vui lòng nhập tên phòng');
  if (data.pricePerNight === undefined || data.pricePerNight === '') throw new ApiError(400, 'Vui lòng nhập giá mỗi đêm');
  const room = await Room.create({ ...data, owner: req.user._id, status: 'pending' });
  res.status(201).json({ success: true, message: 'Tạo phòng thành công, vui lòng chờ quản trị viên duyệt', data: room });
});

export const getMyRoom = asyncHandler(async (req, res) => {
  const room = await findMyRoom(req);
  res.json({ success: true, data: room });
});

export const updateRoom = asyncHandler(async (req, res) => {
  const room = await findMyRoom(req);
  const data = pickRoomFields(req.body);
  Object.assign(room, data);
  let message = 'Cập nhật phòng thành công';
  if (room.status === 'rejected') {
    room.status = 'pending';
    room.rejectReason = '';
    message = 'Cập nhật phòng thành công, phòng đã được gửi duyệt lại';
  }
  await room.save();
  res.json({ success: true, message, data: room });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await findMyRoom(req);
  const activeCount = await Booking.countDocuments({ room: room._id, status: { $in: ACTIVE_BOOKING_STATUSES } });
  if (activeCount > 0) throw new ApiError(400, 'Không thể xóa phòng đang có đơn đặt chưa hoàn thành');
  await Promise.all([
    Review.deleteMany({ room: room._id }),
    User.updateMany({ favorites: room._id }, { $pull: { favorites: room._id } }),
    room.deleteOne(),
  ]);
  res.json({ success: true, message: 'Đã xóa phòng', data: { _id: room._id } });
});

export const toggleVisibility = asyncHandler(async (req, res) => {
  const room = await findMyRoom(req);
  if (room.status === 'approved') room.status = 'hidden';
  else if (room.status === 'hidden') room.status = 'approved';
  else throw new ApiError(400, 'Chỉ có thể ẩn/hiện phòng đã được duyệt');
  await room.save();
  res.json({
    success: true,
    message: room.status === 'hidden' ? 'Đã ẩn phòng' : 'Đã hiển thị lại phòng',
    data: room,
  });
});

export const getOwnerBookings = asyncHandler(async (req, res) => {
  const { status, keyword } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  if (keyword && String(keyword).trim()) {
    const regex = new RegExp(escapeRegex(String(keyword).trim()), 'i');
    filter.$or = [{ code: regex }, { contactName: regex }];
  }
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('room', 'title slug images city')
      .populate('customer', 'name avatar email phone'),
    Booking.countDocuments(filter),
  ]);
  res.json({ success: true, data: bookings, pagination: buildPagination(page, limit, total) });
});

const TRANSITIONS = {
  pending: ['confirmed', 'rejected'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['completed'],
};

const STATUS_MESSAGES = {
  confirmed: 'Đã xác nhận đơn đặt phòng',
  rejected: 'Đã từ chối đơn đặt phòng',
  checked_in: 'Đã check-in cho khách',
  cancelled: 'Đã hủy đơn đặt phòng',
  completed: 'Đơn đặt phòng đã hoàn thành',
};

const CUSTOMER_STATUS_NOTICES = {
  confirmed: { title: 'Đơn đặt phòng đã được xác nhận', verb: 'đã được chủ phòng xác nhận' },
  rejected: { title: 'Đơn đặt phòng bị từ chối', verb: 'đã bị chủ phòng từ chối' },
  checked_in: { title: 'Bạn đã nhận phòng', verb: 'đã được check-in' },
  cancelled: { title: 'Đơn đặt phòng đã bị hủy', verb: 'đã bị chủ phòng hủy' },
  completed: { title: 'Lưu trú đã hoàn thành', verb: 'đã hoàn thành. Hãy để lại đánh giá cho chủ phòng nhé' },
};

const MAILED_STATUSES = ['confirmed', 'rejected', 'cancelled'];

const notifyCustomerBookingStatus = async (booking, status) => {
  try {
    const notice = CUSTOMER_STATUS_NOTICES[status];
    const customer = booking.customer;
    if (!notice || !customer) return;
    const roomTitle = booking.room?.title || 'phòng';
    const reasonText = booking.cancelReason && (status === 'rejected' || status === 'cancelled') ? ` Lý do: ${booking.cancelReason}` : '';
    const message = `Đơn ${booking.code} tại ${roomTitle} ${notice.verb}.${reasonText}`;
    const link = `/account/bookings/${booking._id}`;
    await notify(customer._id || customer, { type: 'booking_status', title: notice.title, message, link });
    if (MAILED_STATUSES.includes(status) && customer.email) {
      const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
      await sendMail({
        to: customer.email,
        subject: `${notice.title} - ${booking.code}`,
        html: mailLayout(
          notice.title,
          `<p>Xin chào ${escapeHtml(customer.name || '')},</p><p>${escapeHtml(message)}</p>${mailButton(`${clientUrl}${link}`, 'Xem chi tiết đơn')}`
        ),
      });
    }
  } catch (error) {
    console.error('[owner] Lỗi gửi thông báo trạng thái đơn:', error.message);
  }
};

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body || {};
  const booking = await Booking.findOne({ _id: req.params.id, owner: req.user._id });
  if (!booking) throw new ApiError(404, 'Không tìm thấy đơn đặt phòng');
  const allowed = TRANSITIONS[booking.status] || [];
  if (!allowed.includes(status)) throw new ApiError(400, 'Không thể chuyển đơn sang trạng thái này');
  booking.status = status;
  if ((status === 'rejected' || status === 'cancelled') && reason) booking.cancelReason = reason;
  if ((status === 'rejected' || status === 'cancelled') && booking.paymentStatus === 'paid') booking.paymentStatus = 'refunded';
  if (status === 'completed' && booking.paymentMethod === 'cash' && booking.paymentStatus !== 'paid') {
    booking.paymentStatus = 'paid';
    booking.paidAt = new Date();
  }
  await booking.save();
  await booking.populate([
    { path: 'room', select: 'title slug images city' },
    { path: 'customer', select: 'name avatar email phone' },
  ]);
  await notifyCustomerBookingStatus(booking, status);
  res.json({ success: true, message: STATUS_MESSAGES[status], data: booking });
});

export const getOwnerReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const roomIds = await Room.find({ owner: req.user._id }).distinct('_id');
  const { roomId, replied, rating } = req.query;
  const scopedRoomIds = roomId ? roomIds.filter((id) => String(id) === String(roomId)) : roomIds;
  const filter = { room: { $in: scopedRoomIds } };
  if (replied === 'true') filter.ownerReply = { $nin: ['', null] };
  if (replied === 'false') filter.ownerReply = { $in: ['', null] };
  if (rating && Number(rating) >= 1 && Number(rating) <= 5) filter.rating = Number(rating);
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('room', 'title slug images')
      .populate('customer', 'name avatar'),
    Review.countDocuments(filter),
  ]);
  res.json({ success: true, data: reviews, pagination: buildPagination(page, limit, total) });
});

export const replyReview = asyncHandler(async (req, res) => {
  const { reply } = req.body || {};
  if (!reply || !String(reply).trim()) throw new ApiError(400, 'Vui lòng nhập nội dung phản hồi');
  const review = await Review.findById(req.params.id).populate('room', 'title slug images owner');
  if (!review || !review.room || String(review.room.owner) !== String(req.user._id)) {
    throw new ApiError(404, 'Không tìm thấy đánh giá');
  }
  review.ownerReply = String(reply).trim();
  review.repliedAt = new Date();
  await review.save();
  await review.populate('customer', 'name avatar');
  await notify(review.customer?._id, {
    type: 'review_reply',
    title: 'Chủ phòng đã phản hồi đánh giá của bạn',
    message: `${req.user.name} đã phản hồi đánh giá của bạn về ${review.room.title}.`,
    link: `/rooms/${review.room.slug}`,
  });
  res.json({ success: true, message: 'Đã phản hồi đánh giá', data: review });
});

export const getOwnerStats = asyncHandler(async (req, res) => {
  const ownerId = new mongoose.Types.ObjectId(String(req.user._id));
  const match = { owner: ownerId };
  const roomIds = await Room.find({ owner: ownerId }).distinct('_id');

  const [totalRooms, approvedRooms, pendingRooms, totalBookings, bookingsByStatus, totalRevenue, monthlyRevenue, topRoomsRaw, ratingRow] =
    await Promise.all([
      Room.countDocuments({ owner: ownerId }),
      Room.countDocuments({ owner: ownerId, status: 'approved' }),
      Room.countDocuments({ owner: ownerId, status: 'pending' }),
      Booking.countDocuments(match),
      getBookingsByStatus(match),
      getTotalRevenue(match),
      getMonthlyRevenue(match),
      Booking.aggregate([
        { $match: { ...match, status: { $nin: ['cancelled', 'rejected'] } } },
        {
          $group: {
            _id: '$room',
            bookings: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0] } },
          },
        },
        { $sort: { revenue: -1, bookings: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'rooms', localField: '_id', foreignField: '_id', as: 'room' } },
        { $unwind: { path: '$room', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, title: { $ifNull: ['$room.title', 'Phòng đã xóa'] }, bookings: 1, revenue: 1 } },
      ]),
      Review.aggregate([
        { $match: { room: { $in: roomIds } } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

  res.json({
    success: true,
    data: {
      totalRooms,
      approvedRooms,
      pendingRooms,
      totalBookings,
      bookingsByStatus,
      totalRevenue,
      monthlyRevenue,
      topRooms: topRoomsRaw,
      ratingAvg: ratingRow[0] ? Math.round(ratingRow[0].avg * 10) / 10 : 0,
      totalReviews: ratingRow[0] ? ratingRow[0].count : 0,
    },
  });
});

export const getOwnerCalendar = asyncHandler(async (req, res) => {
  const monthParam = String(req.query.month || '');
  const month = /^\d{4}-\d{2}$/.test(monthParam) ? dayjs(`${monthParam}-01`) : dayjs().startOf('month');
  if (!month.isValid()) throw new ApiError(400, 'Tháng không hợp lệ');
  const monthStart = month.startOf('month').toDate();
  const monthEnd = month.add(1, 'month').startOf('month').toDate();
  const roomFilter = { owner: req.user._id };
  if (req.query.roomId) {
    if (!mongoose.isValidObjectId(req.query.roomId)) throw new ApiError(400, 'Phòng không hợp lệ');
    roomFilter._id = req.query.roomId;
  }
  const rooms = await Room.find(roomFilter).select('title slug status blockedDates').sort({ createdAt: -1 });
  const roomIds = rooms.map((room) => room._id);
  const bookings = await Booking.find({
    room: { $in: roomIds },
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkIn: { $lt: monthEnd },
    checkOut: { $gt: monthStart },
  })
    .select('code room customer checkIn checkOut nights guests status paymentStatus totalPrice contactName')
    .populate('customer', 'name')
    .sort({ checkIn: 1 });
  const blocked = [];
  rooms.forEach((room) => {
    (room.blockedDates || []).forEach((block) => {
      if (block.from < monthEnd && blockEndExclusive(block) > monthStart) {
        blocked.push({ _id: block._id, roomId: room._id, from: block.from, to: block.to, reason: block.reason || '' });
      }
    });
  });
  res.json({
    success: true,
    data: {
      month: month.format('YYYY-MM'),
      rooms: rooms.map((room) => ({ _id: room._id, title: room.title, slug: room.slug, status: room.status })),
      bookings,
      blocked,
    },
  });
});

export const addBlockedDates = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ _id: req.params.id, owner: req.user._id });
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng');
  const { from, to, reason } = req.body || {};
  const start = normalizeDate(from);
  const end = normalizeDate(to || from);
  if (!start || !end) throw new ApiError(400, 'Vui lòng chọn khoảng ngày hợp lệ');
  if (end < start) throw new ApiError(400, 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu');
  if (dayjs(end).diff(dayjs(start), 'day') > 365) throw new ApiError(400, 'Chỉ được khóa tối đa 365 ngày một lần');
  if (end < dayjs().startOf('day').toDate()) throw new ApiError(400, 'Không thể khóa ngày trong quá khứ');
  const endExclusive = dayjs(end).add(1, 'day').toDate();
  const overlap = await findOverlappingBooking(room._id, start, endExclusive);
  if (overlap) throw new ApiError(409, 'Khoảng ngày này đã có đơn đặt phòng đang hoạt động, không thể khóa');
  const duplicated = (room.blockedDates || []).some((block) => block.from < endExclusive && blockEndExclusive(block) > start);
  if (duplicated) throw new ApiError(409, 'Khoảng ngày này trùng với ngày đã khóa trước đó');
  room.blockedDates.push({ from: start, to: end, reason: String(reason || '').trim().slice(0, 200) });
  await room.save();
  const block = room.blockedDates[room.blockedDates.length - 1];
  res.status(201).json({
    success: true,
    message: 'Đã khóa ngày cho phòng',
    data: { _id: block._id, roomId: room._id, from: block.from, to: block.to, reason: block.reason, blockedDates: room.blockedDates },
  });
});

export const removeBlockedDates = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ _id: req.params.id, owner: req.user._id });
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng');
  const block = room.blockedDates.id(req.params.blockId);
  if (!block) throw new ApiError(404, 'Không tìm thấy khoảng ngày đã khóa');
  block.deleteOne();
  await room.save();
  res.json({ success: true, message: 'Đã mở khóa ngày', data: { blockedDates: room.blockedDates } });
});
