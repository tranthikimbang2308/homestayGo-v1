import mongoose from 'mongoose';
import dayjs from 'dayjs';
import Booking, { ACTIVE_BOOKING_STATUSES } from '../models/Booking.js';
import Room from '../models/Room.js';
import Coupon from '../models/Coupon.js';
import ApiError from './ApiError.js';
import { getSettings } from './settings.js';
import { normalizeDate, startOfToday } from './date.js';

export const OVERLAP_MESSAGE = 'Phòng đã có người đặt trong khoảng thời gian này';
export const BLOCKED_MESSAGE = 'Phòng không nhận khách trong khoảng thời gian này';
export const DATE_FORMAT = 'YYYY-MM-DD';

export const findOverlappingBooking = (roomId, checkIn, checkOut, excludeId) => {
  const filter = {
    room: roomId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return Booking.findOne(filter).select('_id');
};

export const blockEndExclusive = (block) => dayjs(block.to).startOf('day').add(1, 'day').toDate();

export const blockedToRanges = (room) =>
  (room?.blockedDates || []).map((block) => ({
    checkIn: dayjs(block.from).startOf('day').toDate(),
    checkOut: blockEndExclusive(block),
  }));

export const findBlockedRange = (room, checkIn, checkOut) =>
  (room?.blockedDates || []).find(
    (block) => dayjs(block.from).startOf('day').toDate() < checkOut && blockEndExclusive(block) > checkIn
  ) || null;

export const getBusyRoomIds = async (checkIn, checkOut) => {
  const lastNight = dayjs(checkOut).startOf('day').subtract(1, 'day').toDate();
  const [bookedIds, blockedIds] = await Promise.all([
    Booking.distinct('room', {
      status: { $in: ACTIVE_BOOKING_STATUSES },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    }),
    Room.distinct('_id', {
      blockedDates: { $elemMatch: { from: { $lte: lastNight }, to: { $gte: dayjs(checkIn).startOf('day').toDate() } } },
    }),
  ]);
  const seen = new Set();
  return [...bookedIds, ...blockedIds].filter((id) => {
    const key = String(id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const getUnavailableRanges = async (room) => {
  const bookings = await Booking.find({
    room: room._id,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkOut: { $gte: startOfToday() },
  })
    .select('checkIn checkOut -_id')
    .sort({ checkIn: 1 })
    .lean();
  const today = startOfToday();
  const blocked = blockedToRanges(room).filter((range) => range.checkOut > today);
  return [...bookings.map((b) => ({ checkIn: b.checkIn, checkOut: b.checkOut })), ...blocked].sort(
    (a, b) => new Date(a.checkIn) - new Date(b.checkIn)
  );
};

export const calcNights = (checkIn, checkOut) => dayjs(checkOut).startOf('day').diff(dayjs(checkIn).startOf('day'), 'day');

export const isWeekendNight = (date) => {
  const weekday = dayjs(date).day();
  return weekday === 5 || weekday === 6;
};

export const nightPrice = (room, date) => {
  const weekend = isWeekendNight(date);
  const weekendPrice = Number(room.weekendPrice) || 0;
  return { price: weekend && weekendPrice > 0 ? weekendPrice : Number(room.pricePerNight) || 0, isWeekend: weekend };
};

export const buildNightly = (room, checkIn, checkOut) => {
  const nightly = [];
  let cursor = dayjs(checkIn).startOf('day');
  const end = dayjs(checkOut).startOf('day');
  while (cursor.isBefore(end) && nightly.length < 366) {
    const { price, isWeekend } = nightPrice(room, cursor);
    nightly.push({ date: cursor.format(DATE_FORMAT), price, isWeekend });
    cursor = cursor.add(1, 'day');
  }
  return nightly;
};

export const calcCouponDiscount = (coupon, subtotal) => {
  const base = Math.max(0, Number(subtotal) || 0);
  if (!coupon || base <= 0) return 0;
  let discount = 0;
  if (coupon.discountType === 'percent') {
    discount = Math.round((base * Number(coupon.discountValue || 0)) / 100);
    if (Number(coupon.maxDiscount) > 0) discount = Math.min(discount, Number(coupon.maxDiscount));
  } else {
    discount = Math.round(Number(coupon.discountValue) || 0);
  }
  return Math.max(0, Math.min(discount, base));
};

const idOf = (value) => String(value?._id || value || '');

export const getCouponIssue = (coupon, { room, subtotal, now = new Date() } = {}) => {
  if (!coupon) return 'Mã giảm giá không tồn tại';
  if (!coupon.isActive) return 'Mã giảm giá đã bị vô hiệu hóa';
  if (coupon.startDate && dayjs(now).isBefore(dayjs(coupon.startDate).startOf('day'))) {
    return `Mã giảm giá chỉ áp dụng từ ngày ${dayjs(coupon.startDate).format('DD/MM/YYYY')}`;
  }
  if (coupon.endDate && dayjs(now).isAfter(dayjs(coupon.endDate).endOf('day'))) return 'Mã giảm giá đã hết hạn';
  if (Number(coupon.usageLimit) > 0 && Number(coupon.usedCount) >= Number(coupon.usageLimit)) return 'Mã giảm giá đã hết lượt sử dụng';
  if (room) {
    if (coupon.owner && idOf(coupon.owner) !== idOf(room.owner)) return 'Mã giảm giá không áp dụng cho phòng này';
    const roomIds = (coupon.rooms || []).map(idOf);
    if (roomIds.length > 0 && !roomIds.includes(idOf(room))) return 'Mã giảm giá không áp dụng cho phòng này';
  }
  const minOrder = Number(coupon.minOrderValue) || 0;
  if (minOrder > 0 && (Number(subtotal) || 0) < minOrder) {
    return `Đơn đặt phòng cần tối thiểu ${minOrder.toLocaleString('vi-VN')} ₫ tiền phòng để dùng mã này`;
  }
  return null;
};

export const normalizeCouponCode = (code) => String(code || '').trim().toUpperCase();

export const findCouponByCode = (code) => {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  return Coupon.findOne({ code: normalized });
};

export const resolveCoupon = async ({ code, room, subtotal }) => {
  const coupon = await findCouponByCode(code);
  const issue = getCouponIssue(coupon, { room, subtotal });
  if (issue) return { coupon: null, discount: 0, error: issue };
  return { coupon, discount: calcCouponDiscount(coupon, subtotal), error: null };
};

export const calcTotals = ({ subtotal, cleaningFee, serviceFeePercent, discount = 0 }) => {
  const percent = Number(serviceFeePercent);
  const serviceFee = Math.round((subtotal * (Number.isFinite(percent) ? percent : 5)) / 100);
  const fee = subtotal > 0 ? Number(cleaningFee) || 0 : 0;
  const safeDiscount = Math.max(0, Math.min(Number(discount) || 0, subtotal));
  return {
    subtotal,
    cleaningFee: fee,
    serviceFee,
    discount: safeDiscount,
    totalPrice: Math.max(0, subtotal + fee + serviceFee - safeDiscount),
  };
};

export const calcPrice = (room, nights, checkIn) => {
  const subtotal = checkIn
    ? buildNightly(room, checkIn, dayjs(checkIn).add(nights, 'day').toDate()).reduce((sum, night) => sum + night.price, 0)
    : room.pricePerNight * nights;
  const totals = calcTotals({ subtotal, cleaningFee: room.cleaningFee, serviceFeePercent: 5 });
  return { pricePerNight: room.pricePerNight, ...totals };
};

export const evaluateBooking = async ({ room, checkIn, checkOut, guests, couponCode }) => {
  const result = { ok: true, status: 200, message: '' };
  const fail = (status, message) => {
    if (result.ok) {
      result.ok = false;
      result.status = status;
      result.message = message;
    }
  };

  const from = normalizeDate(checkIn);
  const to = normalizeDate(checkOut);
  if (!from || !to) {
    fail(400, 'Vui lòng chọn ngày nhận phòng và trả phòng hợp lệ');
    return { ...result, nights: 0, nightly: [], ...calcTotals({ subtotal: 0, cleaningFee: 0, serviceFeePercent: 0 }), coupon: null };
  }
  if (from < startOfToday()) fail(400, 'Ngày nhận phòng không được trước hôm nay');
  if (to <= from) fail(400, 'Ngày trả phòng phải sau ngày nhận phòng');

  const nights = to > from ? calcNights(from, to) : 0;
  if (nights > 365) fail(400, 'Thời gian lưu trú tối đa 365 đêm');
  const minNights = Math.max(1, Number(room.minNights) || 1);
  if (nights > 0 && nights < minNights) fail(400, `Phòng yêu cầu đặt tối thiểu ${minNights} đêm`);

  const guestCount = guests === undefined || guests === null || guests === '' ? 1 : Number(guests);
  if (!Number.isInteger(guestCount) || guestCount < 1) fail(400, 'Số khách không hợp lệ');
  else if (guestCount > room.maxGuests) fail(400, `Phòng chỉ nhận tối đa ${room.maxGuests} khách`);

  if (nights > 0 && nights <= 365) {
    if (findBlockedRange(room, from, to)) fail(409, BLOCKED_MESSAGE);
    const overlap = await findOverlappingBooking(room._id, from, to);
    if (overlap) fail(409, OVERLAP_MESSAGE);
  }

  const nightly = nights > 0 && nights <= 365 ? buildNightly(room, from, to) : [];
  const subtotal = nightly.reduce((sum, night) => sum + night.price, 0);

  let coupon = null;
  let discount = 0;
  let couponError = null;
  if (normalizeCouponCode(couponCode) && subtotal > 0) {
    const resolved = await resolveCoupon({ code: couponCode, room, subtotal });
    coupon = resolved.coupon;
    discount = resolved.discount;
    couponError = resolved.error;
  }

  const settings = await getSettings();
  const totals = calcTotals({
    subtotal,
    cleaningFee: room.cleaningFee,
    serviceFeePercent: settings?.serviceFeePercent,
    discount,
  });

  return {
    ...result,
    from,
    to,
    guests: guestCount,
    nights,
    minNights,
    nightly,
    ...totals,
    serviceFeePercent: Number.isFinite(Number(settings?.serviceFeePercent)) ? Number(settings.serviceFeePercent) : 5,
    pricePerNight: Number(room.pricePerNight) || 0,
    weekendPrice: Number(room.weekendPrice) || 0,
    coupon,
    couponError,
  };
};

export const reserveCouponUsage = async (couponId) => {
  const updated = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      isActive: true,
      $or: [{ usageLimit: { $lte: 0 } }, { usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
    },
    { $inc: { usedCount: 1 } },
    { returnDocument: 'after' }
  );
  if (!updated) throw new ApiError(400, 'Mã giảm giá đã hết lượt sử dụng');
  return updated;
};

export const releaseCouponUsage = (couponId) =>
  Coupon.updateOne({ _id: couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });

export const findRoomByIdOrSlug = (idOrSlug) => {
  if (mongoose.isValidObjectId(idOrSlug) && String(idOrSlug).length === 24) {
    return Room.findOne({ $or: [{ _id: idOrSlug }, { slug: idOrSlug }] });
  }
  return Room.findOne({ slug: idOrSlug });
};
