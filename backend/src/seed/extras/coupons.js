import dayjs from 'dayjs';
import Coupon from '../../models/Coupon.js';
import Room from '../../models/Room.js';
import Booking, { ACTIVE_BOOKING_STATUSES } from '../../models/Booking.js';
import { calcCouponDiscount } from '../../utils/bookingRules.js';

const roundPrice = (value) => Math.round(value / 10000) * 10000;

const WEEKEND_MARKUP = {
  'Sương Mai Đà Lạt - Nhà gỗ giữa đồi thông': 1.2,
  'The Pine Cabin - Bungalow view hồ Tuyền Lâm': 1.25,
  'Tam Cốc Riverside - Nhà vườn bên núi đá vôi': 1.15,
  'Lantern House Hội An - Nhà cổ phố đèn lồng': 1.2,
  'Cẩm Thanh Villa - Biệt thự hồ bơi giữa rừng dừa': 1.3,
  'Mỹ Khê Ocean View - Căn hộ sát biển': 1.2,
  'Bãi Sau Seaside - Nhà nghỉ dưỡng gần biển': 1.25,
  'Ông Lang Pool Villa - Biệt thự sát biển Phú Quốc': 1.2,
};

const MIN_NIGHTS = {
  'Cẩm Thanh Villa - Biệt thự hồ bơi giữa rừng dừa': 2,
  'Ông Lang Pool Villa - Biệt thự sát biển Phú Quốc': 2,
};

const BLOCK_PLAN = [
  { title: 'Sương Mai Đà Lạt - Nhà gỗ giữa đồi thông', offset: 32, days: 3, reason: 'Bảo trì hệ thống nước nóng' },
  { title: 'Lantern House Hội An - Nhà cổ phố đèn lồng', offset: 18, days: 2, reason: 'Gia đình sử dụng riêng' },
  { title: 'Mỹ Khê Ocean View - Căn hộ sát biển', offset: 40, days: 4, reason: 'Sơn sửa lại phòng' },
];

const findFreeWindow = (roomBookings, startOffset, days) => {
  const today = dayjs().startOf('day');
  for (let shift = 0; shift < 60; shift += 1) {
    const from = today.add(startOffset + shift, 'day');
    const toExclusive = from.add(days, 'day');
    const clash = roomBookings.some((b) => dayjs(b.checkIn).isBefore(toExclusive) && dayjs(b.checkOut).isAfter(from));
    if (!clash) return { from: from.toDate(), to: toExclusive.subtract(1, 'day').toDate() };
  }
  return null;
};

export const seedCoupons = async ({ userMap = {}, rooms = [], bookings = [] } = {}) => {
  await Coupon.deleteMany({});

  const byTitle = Object.fromEntries(rooms.map((room) => [room.title, room]));
  const ownerRooms = (key) =>
    rooms.filter((room) => room.status === 'approved' && userMap[key] && String(room.owner) === String(userMap[key]._id));

  const roomOps = [];
  rooms.forEach((room) => {
    const set = {};
    const markup = WEEKEND_MARKUP[room.title];
    if (markup) set.weekendPrice = roundPrice(room.pricePerNight * markup);
    if (MIN_NIGHTS[room.title]) set.minNights = MIN_NIGHTS[room.title];
    if (Object.keys(set).length) roomOps.push({ updateOne: { filter: { _id: room._id }, update: { $set: set } } });
  });

  const activeBookings = await Booking.find({ status: { $in: ACTIVE_BOOKING_STATUSES } }).select('room checkIn checkOut').lean();
  let blockCount = 0;
  BLOCK_PLAN.forEach((plan) => {
    const room = byTitle[plan.title];
    if (!room) return;
    const window = findFreeWindow(
      activeBookings.filter((b) => String(b.room) === String(room._id)),
      plan.offset,
      plan.days
    );
    if (!window) return;
    blockCount += 1;
    roomOps.push({
      updateOne: { filter: { _id: room._id }, update: { $set: { blockedDates: [{ ...window, reason: plan.reason }] } } },
    });
  });
  if (roomOps.length) await Room.bulkWrite(roomOps);

  const today = dayjs().startOf('day');
  const owner1Rooms = ownerRooms('owner1');
  const owner2Rooms = ownerRooms('owner2');
  const owner3Rooms = ownerRooms('owner3');

  const docs = [
    {
      code: 'CHAOHE10',
      description: 'Chào hè rực rỡ: giảm 10% tiền phòng, tối đa 300.000 ₫ cho mọi homestay trên HomestayGo.',
      discountType: 'percent',
      discountValue: 10,
      maxDiscount: 300000,
      minOrderValue: 0,
      startDate: today.subtract(10, 'day').toDate(),
      endDate: today.add(90, 'day').toDate(),
      usageLimit: 500,
      usedCount: 0,
      owner: null,
      rooms: [],
    },
    {
      code: 'HOMESTAYGO50K',
      description: 'Giảm ngay 50.000 ₫ cho đơn đặt phòng có tiền phòng từ 500.000 ₫.',
      discountType: 'fixed',
      discountValue: 50000,
      minOrderValue: 500000,
      startDate: today.subtract(30, 'day').toDate(),
      endDate: today.add(180, 'day').toDate(),
      usageLimit: 0,
      usedCount: 27,
      owner: null,
      rooms: [],
    },
    {
      code: 'HETHAN30',
      description: 'Ưu đãi tháng trước đã kết thúc.',
      discountType: 'percent',
      discountValue: 30,
      maxDiscount: 500000,
      startDate: today.subtract(60, 'day').toDate(),
      endDate: today.subtract(5, 'day').toDate(),
      usageLimit: 100,
      usedCount: 64,
      owner: null,
      rooms: [],
      isPublic: false,
    },
    {
      code: 'DALAT15',
      description: 'Giảm 15% (tối đa 200.000 ₫) khi đặt nhà gỗ và bungalow của Sương Mai Đà Lạt.',
      discountType: 'percent',
      discountValue: 15,
      maxDiscount: 200000,
      minOrderValue: 0,
      startDate: today.subtract(7, 'day').toDate(),
      endDate: today.add(60, 'day').toDate(),
      usageLimit: 100,
      usedCount: 8,
      owner: userMap.owner1?._id,
      rooms: owner1Rooms.slice(0, 2).map((room) => room._id),
    },
    {
      code: 'CUOITUAN100K',
      description: 'Giảm 100.000 ₫ cho đơn từ 1.000.000 ₫ tại mọi homestay của chủ nhà Nguyễn Minh Khôi.',
      discountType: 'fixed',
      discountValue: 100000,
      minOrderValue: 1000000,
      startDate: null,
      endDate: today.add(45, 'day').toDate(),
      usageLimit: 50,
      usedCount: 12,
      owner: userMap.owner1?._id,
      rooms: [],
    },
    {
      code: 'HOIAN20',
      description: 'Giảm 20% tối đa 400.000 ₫ cho kỳ nghỉ ở Hội An và Đà Nẵng, đơn từ 1.500.000 ₫.',
      discountType: 'percent',
      discountValue: 20,
      maxDiscount: 400000,
      minOrderValue: 1500000,
      startDate: today.subtract(3, 'day').toDate(),
      endDate: today.add(30, 'day').toDate(),
      usageLimit: 30,
      usedCount: 4,
      owner: userMap.owner2?._id,
      rooms: [],
    },
    {
      code: 'VIP200K',
      description: 'Mã tri ân khách quen, giới hạn 5 lượt.',
      discountType: 'fixed',
      discountValue: 200000,
      minOrderValue: 1000000,
      endDate: today.add(20, 'day').toDate(),
      usageLimit: 5,
      usedCount: 5,
      owner: userMap.owner2?._id,
      rooms: [],
      isPublic: false,
    },
    {
      code: 'BIENXANH12',
      description: 'Giảm 12% tối đa 600.000 ₫ cho biệt thự và nhà nghỉ dưỡng sát biển.',
      discountType: 'percent',
      discountValue: 12,
      maxDiscount: 600000,
      minOrderValue: 2000000,
      startDate: today.toDate(),
      endDate: today.add(75, 'day').toDate(),
      usageLimit: 40,
      usedCount: 2,
      owner: userMap.owner3?._id,
      rooms: owner3Rooms.slice(0, 2).map((room) => room._id),
    },
  ].filter((doc) => doc.owner !== undefined);

  const created = await Coupon.insertMany(docs);
  const chaoHe = created.find((coupon) => coupon.code === 'CHAOHE10');

  const upcoming = bookings
    .filter((booking) => ['pending', 'confirmed'].includes(booking.status) && booking.paymentStatus === 'unpaid')
    .slice(0, 2);
  let applied = 0;
  for (const booking of upcoming) {
    const subtotal = booking.subtotal ?? booking.pricePerNight * booking.nights;
    const discount = calcCouponDiscount(chaoHe, subtotal);
    if (discount <= 0) continue;
    await Booking.updateOne(
      { _id: booking._id },
      {
        $set: {
          subtotal,
          couponCode: chaoHe.code,
          discount,
          totalPrice: subtotal + (booking.cleaningFee || 0) + (booking.serviceFee || 0) - discount,
        },
      }
    );
    applied += 1;
  }
  if (applied) await Coupon.updateOne({ _id: chaoHe._id }, { $inc: { usedCount: applied } });

  if (owner2Rooms.length === 0) console.warn('Không tìm thấy phòng của owner2 khi seed mã giảm giá');
  console.log(`Đã tạo ${created.length} mã giảm giá, ${roomOps.length - blockCount} phòng có giá cuối tuần/số đêm tối thiểu, ${blockCount} phòng có ngày khóa`);
};
