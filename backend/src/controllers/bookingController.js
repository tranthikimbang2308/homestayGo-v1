import mongoose from 'mongoose';
import dayjs from 'dayjs';
import Room from '../models/Room.js';
import Booking, { PAYMENT_METHODS } from '../models/Booking.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateBookingCode from '../utils/bookingCode.js';
import { getPagination, buildPagination } from '../utils/pagination.js';
import { startOfToday } from '../utils/date.js';
import { evaluateBooking, reserveCouponUsage, releaseCouponUsage } from '../utils/bookingRules.js';
import { createPaymentUrl, getClientIp } from '../utils/vnpay.js';
import { notify } from '../utils/notify.js';
import { sendMail, mailLayout, mailButton, escapeHtml } from '../utils/mailer.js';

const generateUniqueCode = async () => {
  for (let i = 0; i < 10; i += 1) {
    const code = generateBookingCode();
    const exists = await Booking.exists({ code });
    if (!exists) return code;
  }
  throw new ApiError(500, 'Không thể tạo mã đơn, vui lòng thử lại');
};

const buildPaymentUrl = async (booking, req) => {
  booking.vnpTxnRef = `${booking.code}${Date.now().toString().slice(-6)}`;
  await booking.save();
  return createPaymentUrl({
    amount: booking.totalPrice,
    txnRef: booking.vnpTxnRef,
    orderInfo: `Thanh toan don dat phong ${booking.code}`,
    ipAddr: getClientIp(req),
  });
};

const money = (value) => `${Math.round(Number(value) || 0).toLocaleString('vi-VN')} ₫`;
const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

const sendBookingConfirmation = (booking, room, customer) => {
  if (!customer?.email) return;
  const rows = [
    ['Mã đơn', booking.code],
    ['Phòng', room.title],
    ['Nhận phòng', `${dayjs(booking.checkIn).format('DD/MM/YYYY')} (từ ${room.checkInTime || '14:00'})`],
    ['Trả phòng', `${dayjs(booking.checkOut).format('DD/MM/YYYY')} (trước ${room.checkOutTime || '12:00'})`],
    ['Số đêm', `${booking.nights} đêm`],
    ['Số khách', `${booking.guests} khách`],
    ['Tiền phòng', money(booking.subtotal)],
    ['Phí dọn dẹp', money(booking.cleaningFee)],
    ['Phí dịch vụ', money(booking.serviceFee)],
  ];
  if (booking.discount > 0) rows.push([`Giảm giá (${booking.couponCode})`, `-${money(booking.discount)}`]);
  rows.push(['Tổng cộng', money(booking.totalPrice)]);
  const table = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#6B6B66;">${escapeHtml(label)}</td><td style="padding:6px 0;text-align:right;font-weight:500;">${escapeHtml(value)}</td></tr>`
    )
    .join('');
  const html = mailLayout(
    'Đặt phòng thành công',
    `<p>Xin chào ${escapeHtml(customer.name || '')},</p>
<p>Cảm ơn bạn đã đặt phòng tại HomestayGo. Đơn của bạn đang chờ chủ phòng xác nhận.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #E3E5E3;margin-top:12px;">${table}</table>
${mailButton(`${clientUrl()}/account/bookings/${booking._id}`, 'Xem chi tiết đơn')}`
  );
  sendMail({ to: customer.email, subject: `Xác nhận đặt phòng ${booking.code}`, html }).catch(() => null);
};

const loadBookableRoom = async (roomId) => {
  if (!roomId || !mongoose.isValidObjectId(roomId)) throw new ApiError(400, 'Phòng không hợp lệ');
  const room = await Room.findById(roomId);
  if (!room || room.status !== 'approved') throw new ApiError(404, 'Phòng không tồn tại hoặc chưa sẵn sàng cho đặt');
  return room;
};

const serializeCoupon = (coupon) =>
  coupon
    ? {
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        minOrderValue: coupon.minOrderValue,
      }
    : null;

export const getQuote = asyncHandler(async (req, res) => {
  const { roomId, checkIn, checkOut, guests, couponCode } = req.query;
  const room = await loadBookableRoom(roomId);
  const quote = await evaluateBooking({ room, checkIn, checkOut, guests, couponCode });
  const data = {
    nights: quote.nights,
    minNights: quote.minNights,
    nightly: quote.nightly,
    pricePerNight: quote.pricePerNight,
    weekendPrice: quote.weekendPrice,
    subtotal: quote.subtotal,
    cleaningFee: quote.cleaningFee,
    serviceFeePercent: quote.serviceFeePercent,
    serviceFee: quote.serviceFee,
    discount: quote.discount,
    totalPrice: quote.totalPrice,
    coupon: serializeCoupon(quote.coupon),
    available: quote.ok,
  };
  if (!quote.ok) data.message = quote.message;
  if (quote.couponError) data.couponError = quote.couponError;
  res.json({ success: true, data });
});

export const createBooking = asyncHandler(async (req, res) => {
  const { roomId, checkIn, checkOut, guests, contactName, contactPhone, note, paymentMethod, couponCode } = req.body || {};
  const room = await loadBookableRoom(roomId);
  if (String(room.owner) === String(req.user._id)) throw new ApiError(400, 'Bạn không thể đặt phòng của chính mình');

  const method = paymentMethod || 'cash';
  if (!PAYMENT_METHODS.includes(method)) throw new ApiError(400, 'Phương thức thanh toán không hợp lệ');

  const quote = await evaluateBooking({ room, checkIn, checkOut, guests: guests ?? 1, couponCode });
  if (!quote.ok) throw new ApiError(quote.status, quote.message);
  if (quote.couponError) throw new ApiError(400, quote.couponError);

  let reservedCouponId = null;
  if (quote.coupon) {
    await reserveCouponUsage(quote.coupon._id);
    reservedCouponId = quote.coupon._id;
  }

  let booking;
  try {
    booking = await Booking.create({
      code: await generateUniqueCode(),
      room: room._id,
      customer: req.user._id,
      owner: room.owner,
      checkIn: quote.from,
      checkOut: quote.to,
      nights: quote.nights,
      guests: quote.guests,
      pricePerNight: quote.pricePerNight,
      subtotal: quote.subtotal,
      cleaningFee: quote.cleaningFee,
      serviceFee: quote.serviceFee,
      discount: quote.discount,
      couponCode: quote.coupon ? quote.coupon.code : '',
      totalPrice: quote.totalPrice,
      contactName: contactName || req.user.name,
      contactPhone: contactPhone || req.user.phone || '',
      note: note || '',
      paymentMethod: method,
    });
  } catch (error) {
    if (reservedCouponId) await releaseCouponUsage(reservedCouponId);
    throw error;
  }
  await Room.updateOne({ _id: room._id }, { $inc: { bookingCount: 1 } });

  await notify(room.owner, {
    type: 'booking_new',
    title: 'Có đơn đặt phòng mới',
    message: `${req.user.name} đặt "${room.title}" từ ${dayjs(booking.checkIn).format('DD/MM/YYYY')} đến ${dayjs(booking.checkOut).format('DD/MM/YYYY')} (mã ${booking.code})`,
    link: '/owner/bookings',
  });
  try {
    sendBookingConfirmation(booking, room, req.user);
  } catch (error) {
    console.error('[booking] Lỗi gửi mail xác nhận:', error.message);
  }

  if (method === 'vnpay') {
    const paymentUrl = await buildPaymentUrl(booking, req);
    return res.status(201).json({
      success: true,
      message: 'Đặt phòng thành công, vui lòng thanh toán qua VNPay',
      data: { booking, paymentUrl },
    });
  }
  res.status(201).json({ success: true, message: 'Đặt phòng thành công', data: { booking } });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('room', 'title slug images city address'),
    Booking.countDocuments(filter),
  ]);
  res.json({ success: true, data: bookings, pagination: buildPagination(page, limit, total) });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('room')
    .populate('customer', 'name avatar email phone')
    .populate('owner', 'name avatar email phone');
  if (!booking) throw new ApiError(404, 'Không tìm thấy đơn đặt phòng');
  const userId = String(req.user._id);
  const canView =
    req.user.role === 'admin' ||
    String(booking.customer?._id) === userId ||
    String(booking.owner?._id) === userId;
  if (!canView) throw new ApiError(403, 'Bạn không có quyền xem đơn đặt phòng này');
  const review = booking.isReviewed ? await Review.findOne({ booking: booking._id }) : null;
  res.json({ success: true, data: { ...booking.toJSON(), review } });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user._id });
  if (!booking) throw new ApiError(404, 'Không tìm thấy đơn đặt phòng');
  if (!['pending', 'confirmed'].includes(booking.status)) throw new ApiError(400, 'Chỉ có thể hủy đơn đang chờ xác nhận hoặc đã xác nhận');
  if (booking.checkIn <= startOfToday()) throw new ApiError(400, 'Chỉ có thể hủy đơn trước ngày nhận phòng');
  booking.status = 'cancelled';
  booking.cancelReason = (req.body && req.body.reason) || '';
  if (booking.paymentStatus === 'paid') booking.paymentStatus = 'refunded';
  await booking.save();
  await booking.populate('room', 'title slug images city address');
  await notify(booking.owner, {
    type: 'booking_cancelled',
    title: 'Khách đã hủy đơn đặt phòng',
    message: `${req.user.name} đã hủy đơn ${booking.code} cho "${booking.room?.title || 'phòng'}"${booking.cancelReason ? `. Lý do: ${booking.cancelReason}` : ''}`,
    link: '/owner/bookings',
  });
  res.json({ success: true, message: 'Đã hủy đơn đặt phòng', data: booking });
});

export const payBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user._id });
  if (!booking) throw new ApiError(404, 'Không tìm thấy đơn đặt phòng');
  if (booking.paymentStatus !== 'unpaid') throw new ApiError(400, 'Đơn đặt phòng này đã được thanh toán');
  if (!['pending', 'confirmed'].includes(booking.status)) throw new ApiError(400, 'Không thể thanh toán đơn ở trạng thái hiện tại');
  const paymentUrl = await buildPaymentUrl(booking, req);
  res.json({ success: true, message: 'Tạo liên kết thanh toán thành công', data: { paymentUrl } });
});

export const notifyBookingPaid = async (booking) => {
  const room = await Room.findById(booking.room).select('title');
  const title = room?.title || 'phòng';
  await notify(booking.owner, {
    type: 'booking_paid',
    title: 'Đơn đặt phòng đã được thanh toán',
    message: `Đơn ${booking.code} cho "${title}" đã thanh toán qua VNPay ${money(booking.totalPrice)}`,
    link: '/owner/bookings',
  });
  await notify(booking.customer, {
    type: 'booking_paid',
    title: 'Thanh toán thành công',
    message: `Bạn đã thanh toán ${money(booking.totalPrice)} cho đơn ${booking.code} - "${title}"`,
    link: `/account/bookings/${booking._id}`,
  });
  const customer = await User.findById(booking.customer).select('name email');
  if (customer?.email) {
    const html = mailLayout(
      'Thanh toán thành công',
      `<p>Xin chào ${escapeHtml(customer.name || '')},</p><p>HomestayGo đã nhận ${escapeHtml(money(booking.totalPrice))} cho đơn <strong>${escapeHtml(booking.code)}</strong> - ${escapeHtml(title)}.</p>${mailButton(`${clientUrl()}/account/bookings/${booking._id}/invoice`, 'Xem hóa đơn')}`
    );
    sendMail({ to: customer.email, subject: `Thanh toán thành công đơn ${booking.code}`, html }).catch(() => null);
  }
};
