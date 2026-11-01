import mongoose from 'mongoose';
import Contact, { CONTACT_STATUSES } from '../models/Contact.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPagination, escapeRegex } from '../utils/pagination.js';
import { sendMail, mailLayout, escapeHtml } from '../utils/mailer.js';
import { notifyMany } from '../utils/notify.js';
import { getSettings } from '../utils/settings.js';

const toParagraphs = (text = '') =>
  String(text)
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 12px;">${escapeHtml(block.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');

const findContactOr404 = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Không tìm thấy liên hệ');
  const contact = await Contact.findById(id);
  if (!contact) throw new ApiError(404, 'Không tìm thấy liên hệ');
  return contact;
};

export const createContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body || {};
  if (!String(name || '').trim()) throw new ApiError(400, 'Vui lòng nhập họ tên');
  if (!/^\S+@\S+\.\S+$/.test(String(email || '').trim())) throw new ApiError(400, 'Email không hợp lệ');
  if (String(message || '').trim().length < 10) throw new ApiError(400, 'Nội dung cần tối thiểu 10 ký tự');
  const contact = await Contact.create({
    name: String(name).trim(),
    email: String(email).trim(),
    phone: String(phone || '').trim(),
    subject: String(subject || '').trim(),
    message: String(message).trim(),
  });
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  await notifyMany(admins.map((admin) => admin._id), {
    type: 'contact_new',
    title: 'Liên hệ mới',
    message: `${contact.name} vừa gửi liên hệ${contact.subject ? `: ${contact.subject}` : ''}`,
    link: '/admin/contacts',
  });
  res.status(201).json({ success: true, message: 'Cảm ơn bạn đã liên hệ, chúng tôi sẽ phản hồi sớm nhất', data: { _id: contact._id } });
});

export const getContacts = asyncHandler(async (req, res) => {
  const { status, keyword } = req.query;
  const { page, limit, skip } = getPagination(req.query, 10);
  const filter = {};
  if (status && CONTACT_STATUSES.includes(status)) filter.status = status;
  const text = String(keyword || '').trim();
  if (text) {
    const regex = new RegExp(escapeRegex(text), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { subject: regex }, { message: regex }];
  }
  const [items, total, statusRows] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('repliedBy', 'name'),
    Contact.countDocuments(filter),
    Contact.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const counts = CONTACT_STATUSES.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  statusRows.forEach((row) => {
    counts[row._id] = row.count;
  });
  res.json({ success: true, data: items, counts, pagination: buildPagination(page, limit, total) });
});

export const replyContact = asyncHandler(async (req, res) => {
  const reply = String(req.body?.reply || '').trim();
  if (reply.length < 5) throw new ApiError(400, 'Nội dung trả lời cần tối thiểu 5 ký tự');
  const contact = await findContactOr404(req.params.id);
  const settings = await getSettings();
  const subject = `Phản hồi liên hệ${contact.subject ? `: ${contact.subject}` : ''} - ${settings.siteName}`;
  const body = `<p style="margin:0 0 12px;">Chào ${escapeHtml(contact.name)},</p>${toParagraphs(reply)}<div style="margin:20px 0 0;padding:12px 16px;border-left:3px solid #E3E5E3;color:#6B6B66;font-size:14px;"><p style="margin:0 0 6px;">Nội dung bạn đã gửi:</p>${toParagraphs(contact.message)}</div><p style="margin:20px 0 0;">Trân trọng,<br>Đội ngũ ${escapeHtml(settings.siteName)} - Hotline ${escapeHtml(settings.hotline)}</p>`;
  const mailResult = await sendMail({ to: contact.email, subject, html: mailLayout('Phản hồi từ HomestayGo', body), replyTo: settings.email });
  contact.reply = reply;
  contact.status = 'replied';
  contact.repliedAt = new Date();
  contact.repliedBy = req.user._id;
  await contact.save();
  const mailSent = Boolean(mailResult?.success);
  res.json({
    success: true,
    message: mailSent ? 'Đã gửi trả lời qua email' : 'Đã lưu trả lời (email chưa được gửi)',
    data: { ...contact.toJSON(), mailSent },
  });
});

export const closeContact = asyncHandler(async (req, res) => {
  const contact = await findContactOr404(req.params.id);
  contact.status = 'closed';
  await contact.save();
  res.json({ success: true, message: 'Đã đóng liên hệ', data: contact });
});

export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await findContactOr404(req.params.id);
  await contact.deleteOne();
  res.json({ success: true, message: 'Đã xóa liên hệ', data: { _id: contact._id } });
});
