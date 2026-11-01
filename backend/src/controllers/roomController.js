import mongoose from 'mongoose';
import Room from '../models/Room.js';
import Booking, { ACTIVE_BOOKING_STATUSES } from '../models/Booking.js';
import Review from '../models/Review.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPagination, escapeRegex } from '../utils/pagination.js';
import { normalizeDate, startOfToday } from '../utils/date.js';
import { getBusyRoomIds, findRoomByIdOrSlug, getUnavailableRanges } from '../utils/bookingRules.js';

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  price_asc: { pricePerNight: 1, createdAt: -1 },
  price_desc: { pricePerNight: -1, createdAt: -1 },
  rating: { ratingAvg: -1, ratingCount: -1 },
  popular: { bookingCount: -1, ratingAvg: -1 },
};

const OWNER_PUBLIC_FIELDS = 'name avatar';
const MAP_LIMIT = 200;
const SIMILAR_LIMIT = 4;
const COMPARE_LIMIT = 3;

const buildRoomFilter = async (query) => {
  const { keyword, city, roomType, minPrice, maxPrice, guests, amenities, checkIn, checkOut, minRating } = query;
  const filter = { status: 'approved' };

  if (keyword && String(keyword).trim()) {
    const regex = new RegExp(escapeRegex(String(keyword).trim()), 'i');
    filter.$or = [{ title: regex }, { city: regex }, { address: regex }, { district: regex }];
  }
  if (city && String(city).trim()) filter.city = new RegExp(`^${escapeRegex(String(city).trim())}$`, 'i');
  if (roomType) {
    const types = String(roomType).split(',').map((t) => t.trim()).filter(Boolean);
    if (types.length) filter.roomType = types.length === 1 ? types[0] : { $in: types };
  }
  const priceFilter = {};
  if (minPrice !== undefined && minPrice !== '' && !Number.isNaN(Number(minPrice))) priceFilter.$gte = Number(minPrice);
  if (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(Number(maxPrice))) priceFilter.$lte = Number(maxPrice);
  if (Object.keys(priceFilter).length) filter.pricePerNight = priceFilter;
  if (guests && Number(guests) > 0) filter.maxGuests = { $gte: Number(guests) };
  if (amenities) {
    const keys = String(amenities).split(',').map((a) => a.trim()).filter(Boolean);
    if (keys.length) filter.amenities = { $all: keys };
  }
  if (minRating && Number(minRating) > 0) filter.ratingAvg = { $gte: Number(minRating) };

  const from = normalizeDate(checkIn);
  const to = normalizeDate(checkOut);
  if (from && to && to > from) {
    const busyIds = await getBusyRoomIds(from, to);
    if (busyIds.length) filter._id = { $nin: busyIds };
  }
  return filter;
};

export const getRooms = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = await buildRoomFilter(req.query);
  const sortBy = SORT_OPTIONS[req.query.sort] || SORT_OPTIONS.newest;
  const [rooms, total] = await Promise.all([
    Room.find(filter).sort(sortBy).skip(skip).limit(limit).populate('owner', OWNER_PUBLIC_FIELDS),
    Room.countDocuments(filter),
  ]);

  res.json({ success: true, data: rooms, pagination: buildPagination(page, limit, total) });
});

export const getMapRooms = asyncHandler(async (req, res) => {
  const filter = await buildRoomFilter(req.query);
  const sortBy = SORT_OPTIONS[req.query.sort] || SORT_OPTIONS.newest;
  const rooms = await Room.find(filter)
    .sort(sortBy)
    .limit(MAP_LIMIT)
    .select('slug title pricePerNight location images ratingAvg city')
    .lean();
  const data = rooms.map((room) => ({
    _id: room._id,
    slug: room.slug,
    title: room.title,
    pricePerNight: room.pricePerNight,
    location: room.location,
    images: room.images?.length ? [room.images[0]] : [],
    ratingAvg: room.ratingAvg,
    city: room.city,
  }));
  res.json({ success: true, data });
});

export const getSimilarRooms = asyncHandler(async (req, res) => {
  const room = await findRoomByIdOrSlug(req.params.id);
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng');
  const conditions = [{ roomType: room.roomType }];
  if (room.city) conditions.push({ city: room.city });
  const candidates = await Room.find({ status: 'approved', _id: { $ne: room._id }, $or: conditions })
    .limit(60)
    .populate('owner', OWNER_PUBLIC_FIELDS);
  const cityRank = (item) => (room.city && item.city === room.city ? 0 : 1);
  const data = candidates
    .sort((a, b) => {
      const diff = Math.abs(a.pricePerNight - room.pricePerNight) - Math.abs(b.pricePerNight - room.pricePerNight);
      return diff !== 0 ? diff : cityRank(a) - cityRank(b);
    })
    .slice(0, SIMILAR_LIMIT);
  res.json({ success: true, data });
});

export const compareRooms = asyncHandler(async (req, res) => {
  const ids = String(req.query.ids || '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
  const uniqueIds = [...new Set(ids)].slice(0, COMPARE_LIMIT);
  if (!uniqueIds.length) return res.json({ success: true, data: [] });
  const rooms = await Room.find({ _id: { $in: uniqueIds }, status: 'approved' }).populate('owner', OWNER_PUBLIC_FIELDS);
  const data = uniqueIds.map((id) => rooms.find((room) => String(room._id) === id)).filter(Boolean);
  res.json({ success: true, data });
});

export const getCities = asyncHandler(async (req, res) => {
  const cities = await Room.aggregate([
    { $match: { status: 'approved', city: { $nin: [null, ''] } } },
    { $sort: { ratingAvg: -1, createdAt: -1 } },
    { $group: { _id: '$city', count: { $sum: 1 }, image: { $first: { $arrayElemAt: ['$images', 0] } } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { _id: 0, city: '$_id', count: 1, image: { $ifNull: ['$image', ''] } } },
  ]);
  res.json({ success: true, data: cities });
});

export const getFeaturedRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ status: 'approved' })
    .sort({ ratingAvg: -1, ratingCount: -1, bookingCount: -1 })
    .limit(8)
    .populate('owner', OWNER_PUBLIC_FIELDS);
  res.json({ success: true, data: rooms });
});

export const getRoomDetail = asyncHandler(async (req, res) => {
  const room = await findRoomByIdOrSlug(req.params.idOrSlug);
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng');
  if (room.status !== 'approved') {
    const user = req.user;
    const canView = user && (user.role === 'admin' || String(room.owner) === String(user._id));
    if (!canView) throw new ApiError(404, 'Không tìm thấy phòng');
  }
  if (room.status === 'approved') {
    await Room.updateOne({ _id: room._id }, { $inc: { viewCount: 1 } });
    room.viewCount = (room.viewCount || 0) + 1;
  }
  await room.populate('owner', 'name avatar phone email createdAt');
  res.json({ success: true, data: room });
});

export const getBookedDates = asyncHandler(async (req, res) => {
  const room = await findRoomByIdOrSlug(req.params.id);
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng');
  res.json({ success: true, data: await getUnavailableRanges(room) });
});

export const getRoomReviews = asyncHandler(async (req, res) => {
  const room = await findRoomByIdOrSlug(req.params.id);
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng');
  const { page, limit, skip } = getPagination(req.query);
  const baseFilter = { room: room._id, isHidden: { $ne: true } };
  const filter = { ...baseFilter };
  const rating = Number(req.query.rating);
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) filter.rating = rating;
  const [items, total, groups] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('customer', 'name avatar'),
    Review.countDocuments(filter),
    Review.aggregate([{ $match: baseFilter }, { $group: { _id: '$rating', count: { $sum: 1 } } }]),
  ]);
  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  groups.forEach((group) => {
    const star = Math.round(group._id);
    if (ratingBreakdown[star] !== undefined) ratingBreakdown[star] += group.count;
  });
  res.json({ success: true, data: { items, ratingBreakdown }, pagination: buildPagination(page, limit, total) });
});
