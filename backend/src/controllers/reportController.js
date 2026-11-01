import mongoose from 'mongoose';
import Report, { REPORT_REASONS, REPORT_STATUSES, REPORT_REASON_LABELS } from '../models/Report.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPagination } from '../utils/pagination.js';
import { notify, notifyMany } from '../utils/notify.js';

const ROOM_FIELDS = 'title slug images city status owner';

export const createReport = asyncHandler(async (req, res) => {
  const { roomId, reason, description } = req.body || {};
  if (!roomId || !mongoose.isValidObjectId(roomId)) throw new ApiError(400, 'Phòng không hợp lệ');
  if (!REPORT_REASONS.includes(reason)) throw new ApiError(400, 'Vui lòng chọn lý do báo cáo');
  const text = String(description || '').trim();
  if (reason === 'khac' && text.length < 10) throw new ApiError(400, 'Vui lòng mô tả rõ vấn đề (tối thiểu 10 ký tự)');
  const room = await Room.findById(roomId).select('title owner status');
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng');
  if (String(room.owner) === String(req.user._id)) throw new ApiError(400, 'Bạn không thể báo cáo phòng của chính mình');
  const existing = await Report.findOne({ room: room._id, reporter: req.user._id, status: 'pending' });
  if (existing) throw new ApiError(409, 'Bạn đã gửi báo cáo cho phòng này và đang chờ xử lý');
  const report = await Report.create({ room: room._id, reporter: req.user._id, reason, description: text });
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  await notifyMany(admins.map((admin) => admin._id), {
    type: 'report_new',
    title: 'Khiếu nại phòng mới',
    message: `Phòng "${room.title}" bị báo cáo: ${REPORT_REASON_LABELS[reason]}`,
    link: '/admin/reports',
  });
  res.status(201).json({ success: true, message: 'Đã gửi báo cáo, chúng tôi sẽ xem xét sớm nhất', data: report });
});

export const getMyReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10);
  const filter = { reporter: req.user._id };
  const [items, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('room', 'title slug images city'),
    Report.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, pagination: buildPagination(page, limit, total) });
});

export const getReports = asyncHandler(async (req, res) => {
  const { status, reason } = req.query;
  const { page, limit, skip } = getPagination(req.query, 10);
  const filter = {};
  if (status && REPORT_STATUSES.includes(status)) filter.status = status;
  if (reason && REPORT_REASONS.includes(reason)) filter.reason = reason;
  const [items, total, statusRows] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'room', select: ROOM_FIELDS, populate: { path: 'owner', select: 'name email phone' } })
      .populate('reporter', 'name email phone avatar'),
    Report.countDocuments(filter),
    Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const counts = REPORT_STATUSES.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  statusRows.forEach((row) => {
    counts[row._id] = row.count;
  });
  res.json({ success: true, data: items, counts, pagination: buildPagination(page, limit, total) });
});

export const handleReport = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Không tìm thấy báo cáo');
  const { status, adminNote, hideRoom } = req.body || {};
  if (!['resolved', 'rejected'].includes(status)) throw new ApiError(400, 'Trạng thái xử lý không hợp lệ');
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Không tìm thấy báo cáo');
  if (report.status !== 'pending') throw new ApiError(400, 'Báo cáo này đã được xử lý');
  const room = await Room.findById(report.room);
  const shouldHide = status === 'resolved' && (hideRoom === true || hideRoom === 'true');
  report.status = status;
  report.adminNote = String(adminNote || '').trim();
  report.resolvedAt = new Date();
  if (shouldHide && room) {
    room.status = 'hidden';
    await room.save();
    report.roomHidden = true;
  }
  await report.save();

  const statusText = status === 'resolved' ? 'đã được xử lý' : 'không được chấp nhận';
  const noteText = report.adminNote ? ` Ghi chú: ${report.adminNote}` : '';
  await notify(report.reporter, {
    type: 'report_result',
    title: 'Kết quả xử lý báo cáo',
    message: `Báo cáo của bạn về phòng "${room?.title || 'đã xóa'}" ${statusText}.${noteText}`,
    link: room?.slug ? `/rooms/${room.slug}` : '/',
  });
  if (room && status === 'resolved') {
    await notify(room.owner, {
      type: shouldHide ? 'room_hidden' : 'report_warning',
      title: shouldHide ? 'Phòng bị ẩn do khiếu nại' : 'Cảnh báo khiếu nại phòng',
      message: `Phòng "${room.title}" nhận khiếu nại "${REPORT_REASON_LABELS[report.reason]}"${shouldHide ? ' và đã bị ẩn khỏi hệ thống' : ''}.${noteText}`,
      link: '/owner/rooms',
    });
  }

  await report.populate([
    { path: 'room', select: ROOM_FIELDS, populate: { path: 'owner', select: 'name email phone' } },
    { path: 'reporter', select: 'name email phone avatar' },
  ]);
  res.json({ success: true, message: shouldHide ? 'Đã xử lý báo cáo và ẩn phòng' : 'Đã cập nhật báo cáo', data: report });
});
