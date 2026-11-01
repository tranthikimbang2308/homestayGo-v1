import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPagination } from '../utils/pagination.js';
import { notify } from '../utils/notify.js';

const PARTICIPANT_FIELDS = 'name avatar role';
const ROOM_FIELDS = 'title slug images';

export const messagesPathFor = (role) => (role === 'owner' ? '/owner/messages' : '/account/messages');

const ensureValidId = (id, label = 'Mã hội thoại không hợp lệ') => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, label);
};

const formatConversation = (conversation, userId) => {
  const obj = conversation.toObject ? conversation.toObject({ flattenMaps: true }) : conversation;
  const unreadMap = obj.unread || {};
  const me = String(userId);
  const otherUser = (obj.participants || []).find((p) => String(p?._id || p) !== me) || null;
  return {
    _id: obj._id,
    participants: obj.participants,
    otherUser,
    room: obj.room || null,
    lastMessage: obj.lastMessage,
    lastMessageAt: obj.lastMessageAt,
    unreadCount: Number(unreadMap[me] || 0),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const loadConversationForUser = async (id, userId) => {
  ensureValidId(id);
  const conversation = await Conversation.findById(id)
    .populate('participants', PARTICIPANT_FIELDS)
    .populate('room', ROOM_FIELDS);
  if (!conversation) throw new ApiError(404, 'Không tìm thấy hội thoại');
  const isMember = conversation.participants.some((p) => String(p._id) === String(userId));
  if (!isMember) throw new ApiError(403, 'Bạn không có quyền truy cập hội thoại này');
  return conversation;
};

const appendMessage = async (conversation, sender, content) => {
  const text = String(content || '').trim();
  if (!text) throw new ApiError(400, 'Vui lòng nhập nội dung tin nhắn');
  if (text.length > 2000) throw new ApiError(400, 'Tin nhắn tối đa 2000 ký tự');
  const message = await Message.create({ conversation: conversation._id, sender: sender._id, content: text });
  const recipient = conversation.participants.find((p) => String(p._id || p) !== String(sender._id));
  const recipientId = String(recipient?._id || recipient);
  conversation.lastMessage = text.length > 160 ? `${text.slice(0, 157)}...` : text;
  conversation.lastMessageAt = message.createdAt;
  conversation.unread.set(recipientId, Number(conversation.unread.get(recipientId) || 0) + 1);
  conversation.unread.set(String(sender._id), 0);
  await conversation.save();
  const recipientRole = recipient?.role || (await User.findById(recipientId).select('role'))?.role;
  await notify(recipientId, {
    type: 'message',
    title: `Tin nhắn mới từ ${sender.name}`,
    message: conversation.lastMessage,
    link: `${messagesPathFor(recipientRole)}?c=${conversation._id}`,
  });
  return message;
};

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
    $or: [{ lastMessage: { $nin: ['', null] } }, { 'participants.0': req.user._id }],
  })
    .sort({ lastMessageAt: -1 })
    .populate('participants', PARTICIPANT_FIELDS)
    .populate('room', ROOM_FIELDS);
  res.json({ success: true, data: conversations.map((c) => formatConversation(c, req.user._id)) });
});

export const startConversation = asyncHandler(async (req, res) => {
  const { recipientId, roomId, content } = req.body || {};
  ensureValidId(recipientId, 'Người nhận không hợp lệ');
  if (String(recipientId) === String(req.user._id)) throw new ApiError(400, 'Bạn không thể tự nhắn tin cho chính mình');
  const recipient = await User.findById(recipientId).select('name role isActive');
  if (!recipient || !recipient.isActive) throw new ApiError(404, 'Không tìm thấy người nhận');
  let room = null;
  if (roomId) {
    ensureValidId(roomId, 'Phòng không hợp lệ');
    room = await Room.findById(roomId).select('_id');
  }
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, recipient._id], $size: 2 },
  });
  let created = false;
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, recipient._id],
      room: room?._id || null,
      lastMessageAt: new Date(),
    });
    created = true;
  } else if (room && String(conversation.room || '') !== String(room._id)) {
    conversation.room = room._id;
    await conversation.save();
  }
  await conversation.populate('participants', PARTICIPANT_FIELDS);
  if (content && String(content).trim()) await appendMessage(conversation, req.user, content);
  await conversation.populate('room', ROOM_FIELDS);
  res.status(created ? 201 : 200).json({
    success: true,
    data: formatConversation(conversation, req.user._id),
    message: created ? 'Đã tạo hội thoại' : 'Đã mở hội thoại',
  });
});

export const getConversationMessages = asyncHandler(async (req, res) => {
  const conversation = await loadConversationForUser(req.params.id, req.user._id);
  const { page, limit, skip } = getPagination(req.query, 50);
  const filter = { conversation: conversation._id };
  const [docs, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments(filter),
  ]);
  const me = String(req.user._id);
  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: req.user._id }, readAt: null },
    { readAt: new Date() }
  );
  if (Number(conversation.unread.get(me) || 0) > 0) {
    conversation.unread.set(me, 0);
    await conversation.save();
  }
  res.json({
    success: true,
    data: { conversation: formatConversation(conversation, req.user._id), messages: docs.reverse() },
    pagination: buildPagination(page, limit, total),
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await loadConversationForUser(req.params.id, req.user._id);
  const message = await appendMessage(conversation, req.user, req.body?.content);
  res.status(201).json({ success: true, data: message, message: 'Đã gửi tin nhắn' });
});

export const getUnreadMessageCount = asyncHandler(async (req, res) => {
  const me = String(req.user._id);
  const conversations = await Conversation.find({ participants: req.user._id, [`unread.${me}`]: { $gt: 0 } }).select('unread');
  const count = conversations.reduce((sum, c) => sum + Number(c.unread.get(me) || 0), 0);
  res.json({ success: true, data: { count, conversations: conversations.length } });
});
