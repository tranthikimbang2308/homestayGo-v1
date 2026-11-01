import mongoose from 'mongoose';
import Coupon, { DISCOUNT_TYPES } from '../models/Coupon.js';
import Room from '../models/Room.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPagination, escapeRegex } from '../utils/pagination.js';
import { startOfToday } from '../utils/date.js';
import { calcCouponDiscount, findCouponByCode, getCouponIssue, normalizeCouponCode } from '../utils/bookingRules.js';

const NUMBER_FIELDS = ['discountValue', 'maxDiscount', 'minOrderValue', 'usageLimit'];
const BOOLEAN_FIELDS = ['isActive', 'isPublic'];

const toDateOrNull = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, 'Ngày không hợp lệ');
  return date;
};

const pickCouponFields = (body = {}) => {
  const data = {};
  if (body.code !== undefined) data.code = normalizeCouponCode(body.code);
  if (body.description !== undefined) data.description = String(body.description || '').trim();
  if (body.discountType !== undefined) {
    if (!DISCOUNT_TYPES.includes(body.discountType)) throw new ApiError(400, 'Loại giảm giá không hợp lệ');
    data.discountType = body.discountType;
  }
  NUMBER_FIELDS.forEach((field) => {
    if (body[field] === undefined) return;
    const value = body[field] === '' || body[field] === null ? 0 : Number(body[field]);
    if (!Number.isFinite(value) || value < 0) throw new ApiError(400, 'Giá trị số không hợp lệ');
    data[field] = value;
  });
  BOOLEAN_FIELDS.forEach((field) => {
    if (body[field] !== undefined) data[field] = body[field] === true || body[field] === 'true';
  });
  const startDate = toDateOrNull(body.startDate);
  const endDate = toDateOrNull(body.endDate);
  if (startDate !== undefined) data.startDate = startDate;
  if (endDate !== undefined) data.endDate = endDate;
  if (body.rooms !== undefined) {
    const list = Array.isArray(body.rooms) ? body.rooms : String(body.rooms || '').split(',');
    const ids = [...new Set(list.map((id) => String(id?._id || id || '').trim()).filter(Boolean))];
    if (ids.some((id) => !mongoose.isValidObjectId(id))) throw new ApiError(400, 'Danh sách phòng không hợp lệ');
    data.rooms = ids;
  }
  return data;
};

const assertRooms = async (roomIds, ownerId) => {
  if (!roomIds || roomIds.length === 0) return;
  const filter = { _id: { $in: roomIds } };
  if (ownerId) filter.owner = ownerId;
  const count = await Room.countDocuments(filter);
  if (count !== roomIds.length) {
    throw new ApiError(400, ownerId ? 'Chỉ được chọn phòng thuộc quyền quản lý của bạn' : 'Có phòng không tồn tại trong danh sách');
  }
};

const scopeFilter = (req) => (req.user.role === 'admin' ? { owner: null } : { owner: req.user._id });

const findManagedCoupon = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Mã định danh không hợp lệ');
  const coupon = await Coupon.findOne({ _id: req.params.id, ...scopeFilter(req) });
  if (!coupon) throw new ApiError(404, 'Không tìm thấy mã giảm giá');
  return coupon;
};

const ensureCodeAvailable = async (code, excludeId) => {
  const filter = { code };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Coupon.exists(filter)) throw new ApiError(409, 'Mã giảm giá đã tồn tại');
};

const POPULATE_ROOMS = { path: 'rooms', select: 'title slug' };
const POPULATE_OWNER = { path: 'owner', select: 'name' };

const activeFilter = () => {
  const now = new Date();
  return {
    isActive: true,
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: startOfToday() } }] },
      { $or: [{ usageLimit: { $lte: 0 } }, { usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
    ],
  };
};

export const getPublicCoupons = asyncHandler(async (req, res) => {
  const filter = { ...activeFilter(), isPublic: true };
  if (req.query.roomId && mongoose.isValidObjectId(req.query.roomId)) {
    const room = await Room.findById(req.query.roomId).select('owner');
    if (room) {
      filter.$and.push({ $or: [{ owner: null }, { owner: room.owner }] });
      filter.$and.push({ $or: [{ rooms: { $size: 0 } }, { rooms: room._id }] });
    }
  }
  const coupons = await Coupon.find(filter)
    .sort({ owner: 1, endDate: 1, createdAt: -1 })
    .limit(100)
    .populate(POPULATE_OWNER)
    .populate(POPULATE_ROOMS);
  res.json({ success: true, data: coupons });
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, roomId, subtotal } = req.body || {};
  if (!normalizeCouponCode(code)) throw new ApiError(400, 'Vui lòng nhập mã giảm giá');
  if (!roomId || !mongoose.isValidObjectId(roomId)) throw new ApiError(400, 'Phòng không hợp lệ');
  const room = await Room.findById(roomId).select('owner status');
  if (!room || room.status !== 'approved') throw new ApiError(404, 'Phòng không tồn tại hoặc chưa sẵn sàng cho đặt');
  const amount = Number(subtotal);
  if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, 'Vui lòng chọn ngày lưu trú trước khi áp dụng mã');
  const coupon = await findCouponByCode(code);
  const issue = getCouponIssue(coupon, { room, subtotal: amount });
  if (issue) throw new ApiError(400, issue);
  const discount = calcCouponDiscount(coupon, amount);
  res.json({
    success: true,
    message: 'Áp dụng mã giảm giá thành công',
    data: {
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        minOrderValue: coupon.minOrderValue,
        endDate: coupon.endDate,
      },
      discount,
    },
  });
});

export const getCoupons = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.user.role === 'admin') {
    if (req.query.scope !== 'all') filter.owner = null;
  } else {
    filter.owner = req.user._id;
  }
  if (req.query.keyword && String(req.query.keyword).trim()) {
    const regex = new RegExp(escapeRegex(String(req.query.keyword).trim()), 'i');
    filter.$or = [{ code: regex }, { description: regex }];
  }
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;
  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(POPULATE_ROOMS).populate(POPULATE_OWNER),
    Coupon.countDocuments(filter),
  ]);
  res.json({ success: true, data: coupons, pagination: buildPagination(page, limit, total) });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const data = pickCouponFields(req.body);
  if (!data.code) throw new ApiError(400, 'Vui lòng nhập mã giảm giá');
  if (!data.discountValue) throw new ApiError(400, 'Vui lòng nhập giá trị giảm');
  const ownerId = req.user.role === 'admin' ? null : req.user._id;
  await assertRooms(data.rooms, ownerId);
  await ensureCodeAvailable(data.code);
  const coupon = await Coupon.create({ ...data, owner: ownerId, usedCount: 0 });
  await coupon.populate([POPULATE_ROOMS, POPULATE_OWNER]);
  res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công', data: coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await findManagedCoupon(req);
  const data = pickCouponFields(req.body);
  if (data.code !== undefined && !data.code) throw new ApiError(400, 'Vui lòng nhập mã giảm giá');
  if (data.code && data.code !== coupon.code) await ensureCodeAvailable(data.code, coupon._id);
  if (data.rooms) await assertRooms(data.rooms, req.user.role === 'admin' ? null : req.user._id);
  Object.assign(coupon, data);
  await coupon.save();
  await coupon.populate([POPULATE_ROOMS, POPULATE_OWNER]);
  res.json({ success: true, message: 'Cập nhật mã giảm giá thành công', data: coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await findManagedCoupon(req);
  await coupon.deleteOne();
  res.json({ success: true, message: 'Đã xóa mã giảm giá', data: { _id: coupon._id } });
});

export const toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await findManagedCoupon(req);
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  await coupon.populate([POPULATE_ROOMS, POPULATE_OWNER]);
  res.json({
    success: true,
    message: coupon.isActive ? 'Đã bật mã giảm giá' : 'Đã tắt mã giảm giá',
    data: coupon,
  });
});
