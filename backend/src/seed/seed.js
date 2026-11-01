import 'dotenv/config';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import generateBookingCode from '../utils/bookingCode.js';
import { calcPrice } from '../utils/bookingRules.js';
import { USERS, ROOMS, REVIEW_COMMENTS, OWNER_REPLIES, buildImages } from './data.js';
import { seedExtras } from './extras/index.js';

const PASSWORD = '123456';

const BOOKING_PLAN = [
  { room: 0, daysAgo: 335, nights: 3, guests: 5, method: 'cash', status: 'completed' },
  { room: 8, daysAgo: 310, nights: 2, guests: 3, method: 'vnpay', status: 'completed' },
  { room: 10, daysAgo: 290, nights: 3, guests: 4, method: 'vnpay', status: 'completed' },
  { room: 1, daysAgo: 265, nights: 2, guests: 2, method: 'cash', status: 'completed' },
  { room: 13, daysAgo: 240, nights: 3, guests: 9, method: 'vnpay', status: 'completed' },
  { room: 9, daysAgo: 215, nights: 2, guests: 7, method: 'vnpay', status: 'completed' },
  { room: 12, daysAgo: 200, nights: 2, guests: 6, method: 'vnpay', status: 'cancelled', paymentStatus: 'refunded', cancelReason: 'Gia đình có việc đột xuất nên không thể đi được.' },
  { room: 7, daysAgo: 190, nights: 2, guests: 4, method: 'cash', status: 'completed' },
  { room: 3, daysAgo: 170, nights: 3, guests: 3, method: 'cash', status: 'completed' },
  { room: 14, daysAgo: 150, nights: 4, guests: 2, method: 'vnpay', status: 'completed' },
  { room: 11, daysAgo: 128, nights: 2, guests: 2, method: 'vnpay', status: 'completed' },
  { room: 5, daysAgo: 120, nights: 2, guests: 2, method: 'cash', status: 'rejected', cancelReason: 'Phòng đang bảo trì hệ thống điện trong thời gian này, rất xin lỗi quý khách.' },
  { room: 2, daysAgo: 105, nights: 3, guests: 2, method: 'cash', status: 'completed' },
  { room: 12, daysAgo: 85, nights: 2, guests: 6, method: 'cash', status: 'completed' },
  { room: 0, daysAgo: 65, nights: 2, guests: 4, method: 'vnpay', status: 'completed' },
  { room: 9, daysAgo: 60, nights: 3, guests: 6, method: 'cash', status: 'cancelled', cancelReason: 'Thay đổi lịch trình công tác.' },
  { room: 5, daysAgo: 45, nights: 3, guests: 2, method: 'vnpay', status: 'completed' },
  { room: 8, daysAgo: 30, nights: 2, guests: 4, method: 'cash', status: 'completed' },
  { room: 10, daysAgo: 18, nights: 3, guests: 3, method: 'vnpay', status: 'completed', customer: 'customer1', skipReview: true },
  { room: 7, daysAgo: 10, nights: 2, guests: 3, method: 'cash', status: 'completed', customer: 'customer2', skipReview: true },
  { room: 0, daysAgo: 1, nights: 3, guests: 4, method: 'cash', status: 'checked_in', customer: 'customer3' },
  { room: 10, daysAgo: 1, nights: 3, guests: 2, method: 'vnpay', status: 'checked_in', paymentStatus: 'paid', customer: 'customer4' },
  { room: 8, daysAgo: -5, nights: 3, guests: 4, method: 'vnpay', status: 'confirmed', paymentStatus: 'paid', customer: 'customer5' },
  { room: 13, daysAgo: -12, nights: 2, guests: 8, method: 'cash', status: 'confirmed', customer: 'customer6' },
  { room: 1, daysAgo: -20, nights: 2, guests: 2, method: 'cash', status: 'confirmed', customer: 'customer2' },
  { room: 9, daysAgo: -7, nights: 2, guests: 6, method: 'vnpay', status: 'pending', customer: 'customer6' },
  { room: 3, daysAgo: -15, nights: 2, guests: 3, method: 'cash', status: 'pending', customer: 'customer1' },
  { room: 12, daysAgo: -25, nights: 3, guests: 5, method: 'cash', status: 'pending', customer: 'customer5' },
];

const NOTES = [
  'Mình sẽ đến khoảng 15h, nhờ chủ nhà hướng dẫn đường giúp.',
  'Có trẻ nhỏ đi cùng, nhờ chuẩn bị thêm gối giúp mình.',
  '',
  'Cho mình xin thêm một bộ chăn mỏng nhé.',
  'Kỷ niệm ngày cưới, mong được trang trí phòng đơn giản.',
  '',
];

const run = async () => {
  await connectDB();
  await Promise.all([User.deleteMany({}), Room.deleteMany({}), Booking.deleteMany({}), Review.deleteMany({})]);
  console.log('Đã xóa dữ liệu cũ');

  const now = dayjs();
  const today = now.startOf('day');
  const userMap = {};
  for (const data of USERS) {
    const { key, monthsAgo, ...fields } = data;
    const user = await User.create({ ...fields, password: PASSWORD });
    const createdAt = now.subtract(monthsAgo, 'month').subtract(3, 'day').toDate();
    await User.collection.updateOne({ _id: user._id }, { $set: { createdAt, updatedAt: createdAt } });
    user.createdAt = createdAt;
    userMap[key] = user;
  }
  console.log(`Đã tạo ${USERS.length} người dùng`);

  const rooms = [];
  for (let i = 0; i < ROOMS.length; i += 1) {
    const { owner, cover, scenery, ...fields } = ROOMS[i];
    const room = await Room.create({ ...fields, owner: userMap[owner]._id, images: buildImages(cover, scenery, i) });
    const createdAt = fields.status === 'approved'
      ? now.subtract(12, 'month').add(i * 3, 'day').toDate()
      : now.subtract(i, 'day').toDate();
    await Room.collection.updateOne({ _id: room._id }, { $set: { createdAt, updatedAt: createdAt } });
    rooms.push(room);
  }
  console.log(`Đã tạo ${rooms.length} phòng`);

  const customerKeys = ['customer1', 'customer2', 'customer3', 'customer4', 'customer5', 'customer6'];
  let rotation = 0;
  const pickCustomer = (createdAt) => {
    for (let tries = 0; tries < customerKeys.length; tries += 1) {
      const key = customerKeys[rotation % customerKeys.length];
      rotation += 1;
      if (dayjs(userMap[key].createdAt).isBefore(createdAt)) return userMap[key];
    }
    return userMap.customer1;
  };

  const usedCodes = new Set();
  const uniqueCode = () => {
    let code = generateBookingCode();
    while (usedCodes.has(code)) code = generateBookingCode();
    usedCodes.add(code);
    return code;
  };

  const bookings = [];
  for (let i = 0; i < BOOKING_PLAN.length; i += 1) {
    const plan = BOOKING_PLAN[i];
    const room = rooms[plan.room];
    const checkIn = today.subtract(plan.daysAgo, 'day');
    const checkOut = checkIn.add(plan.nights, 'day');
    const createdAt = plan.daysAgo > 0
      ? checkIn.subtract(4 + (i % 6), 'day').hour(9 + (i % 10)).minute(15)
      : now.subtract(1 + (i % 3), 'day');
    const customer = plan.customer ? userMap[plan.customer] : pickCustomer(createdAt);
    const price = calcPrice(room, plan.nights);
    let paymentStatus = plan.paymentStatus || 'unpaid';
    if (plan.status === 'completed') paymentStatus = 'paid';
    let paidAt;
    if (paymentStatus === 'paid' || paymentStatus === 'refunded') {
      paidAt = plan.method === 'vnpay' ? createdAt.add(10, 'minute').toDate() : checkOut.hour(11).toDate();
    }
    const code = uniqueCode();
    const booking = await Booking.create({
      code,
      room: room._id,
      customer: customer._id,
      owner: room.owner,
      checkIn: checkIn.toDate(),
      checkOut: checkOut.toDate(),
      nights: plan.nights,
      guests: Math.min(plan.guests, room.maxGuests),
      ...price,
      contactName: customer.name,
      contactPhone: customer.phone,
      note: NOTES[i % NOTES.length],
      paymentMethod: plan.method,
      paymentStatus,
      status: plan.status,
      cancelReason: plan.cancelReason || '',
      paidAt,
      vnpTxnRef: plan.method === 'vnpay' ? `${code}${String(100000 + i)}` : undefined,
    });
    await Booking.collection.updateOne(
      { _id: booking._id },
      { $set: { createdAt: createdAt.toDate(), updatedAt: createdAt.toDate() } }
    );
    bookings.push({ booking, plan, checkOut });
  }
  console.log(`Đã tạo ${bookings.length} đơn đặt phòng`);

  let reviewIndex = 0;
  for (const { booking, plan, checkOut } of bookings) {
    if (booking.status !== 'completed' || plan.skipReview) continue;
    const template = REVIEW_COMMENTS[reviewIndex % REVIEW_COMMENTS.length];
    const hasReply = reviewIndex % 2 === 0 || template.rating <= 3;
    const createdAt = checkOut.add(1, 'day').hour(20).toDate();
    const review = await Review.create({
      room: booking.room,
      booking: booking._id,
      customer: booking.customer,
      rating: template.rating,
      comment: template.comment,
      ownerReply: hasReply ? OWNER_REPLIES[reviewIndex % OWNER_REPLIES.length] : '',
      repliedAt: hasReply ? dayjs(createdAt).add(1, 'day').toDate() : undefined,
    });
    await Review.collection.updateOne({ _id: review._id }, { $set: { createdAt, updatedAt: createdAt } });
    await Booking.collection.updateOne({ _id: booking._id }, { $set: { isReviewed: true } });
    reviewIndex += 1;
  }
  console.log(`Đã tạo ${reviewIndex} đánh giá`);

  for (const room of rooms) {
    const bookingCount = await Booking.countDocuments({ room: room._id });
    await Room.collection.updateOne({ _id: room._id }, { $set: { bookingCount } });
    await Review.recalcRoomRating(room._id);
  }

  const approvedRooms = rooms.filter((r) => r.status === 'approved');
  await User.updateOne({ _id: userMap.customer1._id }, { $set: { favorites: [approvedRooms[0]._id, approvedRooms[6]._id, approvedRooms[10]._id] } });
  await User.updateOne({ _id: userMap.customer2._id }, { $set: { favorites: [approvedRooms[2]._id, approvedRooms[8]._id] } });

  await seedExtras({ userMap, rooms, bookings: bookings.map((item) => item.booking) });

  console.log('Seed dữ liệu hoàn tất. Mật khẩu chung: 123456');
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seed thất bại:', error);
  await mongoose.disconnect();
  process.exit(1);
});
