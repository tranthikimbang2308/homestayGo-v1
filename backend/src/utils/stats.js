import Booking, { BOOKING_STATUSES } from '../models/Booking.js';
import { lastTwelveMonths } from './date.js';

const TIMEZONE = 'Asia/Ho_Chi_Minh';

export const countByField = (rows, keys) => {
  const result = {};
  keys.forEach((key) => {
    result[key] = 0;
  });
  rows.forEach((row) => {
    if (row._id !== null && row._id !== undefined) result[row._id] = row.count;
  });
  return result;
};

export const getBookingsByStatus = async (match) => {
  const rows = await Booking.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  return countByField(rows, BOOKING_STATUSES);
};

export const getTotalRevenue = async (match) => {
  const [row] = await Booking.aggregate([
    { $match: { ...match, paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  return row ? row.total : 0;
};

export const getMonthlyRevenue = async (match) => {
  const { months, from } = lastTwelveMonths();
  const rows = await Booking.aggregate([
    { $match: { ...match, createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TIMEZONE } },
        revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0] } },
        bookings: { $sum: 1 },
      },
    },
  ]);
  const map = new Map(rows.map((r) => [r._id, r]));
  return months.map(({ key, label }) => ({
    month: label,
    revenue: map.get(key)?.revenue || 0,
    bookings: map.get(key)?.bookings || 0,
  }));
};

export const getMonthlyCount = async (Model, match = {}) => {
  const { months, from } = lastTwelveMonths();
  const rows = await Model.aggregate([
    { $match: { ...match, createdAt: { $gte: from } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TIMEZONE } }, count: { $sum: 1 } } },
  ]);
  const map = new Map(rows.map((r) => [r._id, r.count]));
  return months.map(({ key, label }) => ({ month: label, count: map.get(key) || 0 }));
};
