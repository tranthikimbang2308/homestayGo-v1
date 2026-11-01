import User, { ROLES } from '../models/User.js';
import Room, { ROOM_STATUSES } from '../models/Room.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPagination, escapeRegex } from '../utils/pagination.js';
import { countByField, getBookingsByStatus, getTotalRevenue, getMonthlyRevenue, getMonthlyCount } from '../utils/stats.js';
import { notify } from '../utils/notify.js';
import { sendMail, mailLayout, mailButton, escapeHtml } from '../utils/mailer.js';

const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

const notifyRoomOwner = async (room, { title, message, mail = false }) => {
  try {
    const owner = room.owner;
    if (!owner) return;
    const link = '/owner/rooms';
    await notify(owner._id || owner, { type: 'room_status', title, message, link });
    if (mail && owner.email) {
      await sendMail({
        to: owner.email,
        subject: `${title} - ${room.title}`,
        html: mailLayout(title, `<p>Xin chào ${escapeHtml(owner.name || '')},</p><p>${escapeHtml(message)}</p>${mailButton(`${clientUrl()}${link}`, 'Quản lý phòng')}`),
      });
    }
  } catch (error) {
    console.error('[admin] Lỗi gửi thông báo cho chủ phòng:', error.message);
  }
};

export const getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, usersByRoleRaw, totalRooms, roomsByStatusRaw, totalBookings, bookingsByStatus, totalRevenue, monthlyRevenue, newUsersByMonth, topCities, recentBookings] =
    await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Room.countDocuments(),
      Room.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.countDocuments(),
      getBookingsByStatus({}),
      getTotalRevenue({}),
      getMonthlyRevenue({}),
      getMonthlyCount(User),
      Booking.aggregate([
        { $match: { status: { $nin: ['cancelled', 'rejected'] } } },
        { $lookup: { from: 'rooms', localField: 'room', foreignField: '_id', as: 'roomDoc' } },
        { $unwind: '$roomDoc' },
        {
          $group: {
            _id: '$roomDoc.city',
            bookings: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0] } },
          },
        },
        { $sort: { bookings: -1, revenue: -1 } },
        { $limit: 6 },
        { $project: { _id: 0, city: '$_id', bookings: 1, revenue: 1 } },
      ]),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('room', 'title slug images city')
        .populate('customer', 'name avatar email'),
    ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      usersByRole: countByField(usersByRoleRaw, ROLES),
      totalRooms,
      roomsByStatus: countByField(roomsByStatusRaw, ROOM_STATUSES),
      totalBookings,
      bookingsByStatus,
      totalRevenue,
      monthlyRevenue,
      newUsersByMonth,
      topCities,
      recentBookings,
    },
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { keyword, role, isActive } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (keyword && String(keyword).trim()) {
    const regex = new RegExp(escapeRegex(String(keyword).trim()), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (role && ROLES.includes(role)) filter.role = role;
  if (isActive === 'true' || isActive === 'false') filter.isActive = isActive === 'true';
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: users, pagination: buildPagination(page, limit, total) });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'Bạn không thể tự khóa tài khoản của chính mình');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');
  user.isActive = !user.isActive;
  await user.save();
  await notify(user._id, {
    type: 'account',
    title: user.isActive ? 'Tài khoản đã được mở khóa' : 'Tài khoản đã bị khóa',
    message: user.isActive
      ? 'Tài khoản của bạn đã được quản trị viên mở khóa. Bạn có thể sử dụng lại đầy đủ chức năng.'
      : 'Tài khoản của bạn đã bị quản trị viên khóa. Vui lòng liên hệ bộ phận hỗ trợ để biết thêm chi tiết.',
    link: '',
  });
  if (!user.isActive) {
    await sendMail({
      to: user.email,
      subject: 'Tài khoản HomestayGo đã bị khóa',
      html: mailLayout('Tài khoản đã bị khóa', `<p>Xin chào ${escapeHtml(user.name)},</p><p>Tài khoản của bạn đã bị quản trị viên khóa. Vui lòng liên hệ bộ phận hỗ trợ để biết thêm chi tiết.</p>`),
    });
  }
  res.json({
    success: true,
    message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
    data: user,
  });
});

export const changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body || {};
  if (!ROLES.includes(role)) throw new ApiError(400, 'Vai trò không hợp lệ');
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'Bạn không thể tự đổi vai trò của chính mình');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');
  user.role = role;
  await user.save();
  res.json({ success: true, message: 'Đã cập nhật vai trò', data: user });
});

export const getAllRooms = asyncHandler(async (req, res) => {
  const { status, keyword, city } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (status) filter.status = status;
  if (city && String(city).trim()) filter.city = new RegExp(`^${escapeRegex(String(city).trim())}$`, 'i');
  if (keyword && String(keyword).trim()) {
    const regex = new RegExp(escapeRegex(String(keyword).trim()), 'i');
    filter.$or = [{ title: regex }, { city: regex }, { address: regex }];
  }
  const [rooms, total] = await Promise.all([
    Room.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('owner', 'name avatar email phone'),
    Room.countDocuments(filter),
  ]);
  res.json({ success: true, data: rooms, pagination: buildPagination(page, limit, total) });
});

const findRoom = async (id) => {
  const room = await Room.findById(id);
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng');
  return room;
};

export const approveRoom = asyncHandler(async (req, res) => {
  const room = await findRoom(req.params.id);
  room.status = 'approved';
  room.rejectReason = '';
  await room.save();
  await room.populate('owner', 'name avatar email phone');
  await notifyRoomOwner(room, {
    title: 'Phòng đã được duyệt',
    message: `Phòng "${room.title}" đã được duyệt và hiển thị công khai trên HomestayGo.`,
    mail: true,
  });
  res.json({ success: true, message: 'Đã duyệt phòng', data: room });
});

export const rejectRoom = asyncHandler(async (req, res) => {
  const reason = req.body && req.body.reason ? String(req.body.reason).trim() : '';
  if (!reason) throw new ApiError(400, 'Vui lòng nhập lý do từ chối');
  const room = await findRoom(req.params.id);
  room.status = 'rejected';
  room.rejectReason = reason;
  await room.save();
  await room.populate('owner', 'name avatar email phone');
  await notifyRoomOwner(room, {
    title: 'Phòng bị từ chối',
    message: `Phòng "${room.title}" chưa được duyệt. Lý do: ${reason}. Vui lòng chỉnh sửa và gửi duyệt lại.`,
    mail: true,
  });
  res.json({ success: true, message: 'Đã từ chối phòng', data: room });
});

export const hideRoom = asyncHandler(async (req, res) => {
  const room = await findRoom(req.params.id);
  room.status = 'hidden';
  await room.save();
  await room.populate('owner', 'name avatar email phone');
  await notifyRoomOwner(room, {
    title: 'Phòng đã bị ẩn',
    message: `Phòng "${room.title}" đã bị quản trị viên ẩn khỏi trang công khai.`,
  });
  res.json({ success: true, message: 'Đã ẩn phòng', data: room });
});

export const getAllBookings = asyncHandler(async (req, res) => {
  const { status, keyword } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (status) filter.status = status;
  if (keyword && String(keyword).trim()) {
    const regex = new RegExp(escapeRegex(String(keyword).trim()), 'i');
    filter.$or = [{ code: regex }, { contactName: regex }, { contactPhone: regex }];
  }
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('room', 'title slug images city')
      .populate('customer', 'name avatar email phone')
      .populate('owner', 'name avatar email phone'),
    Booking.countDocuments(filter),
  ]);
  res.json({ success: true, data: bookings, pagination: buildPagination(page, limit, total) });
});
