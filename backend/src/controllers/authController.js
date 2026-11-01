import crypto from 'crypto';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import { sendMail, mailLayout, mailButton, escapeHtml } from '../utils/mailer.js';
import { notify } from '../utils/notify.js';

const toUserResponse = (user) => {
  const obj = user.toJSON();
  delete obj.password;
  return obj;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body || {};
  if (!name || !email || !password) throw new ApiError(400, 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu');
  if (String(password).length < 6) throw new ApiError(400, 'Mật khẩu tối thiểu 6 ký tự');
  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) throw new ApiError(409, 'Email đã được sử dụng');
  const user = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    role: role === 'owner' ? 'owner' : 'customer',
  });
  res.status(201).json({
    success: true,
    message: 'Đăng ký tài khoản thành công',
    data: { token: generateToken(user), user: toUserResponse(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'Vui lòng nhập email và mật khẩu');
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Email hoặc mật khẩu không đúng');
  if (!user.isActive) throw new ApiError(403, 'Tài khoản đã bị khóa');
  res.json({
    success: true,
    message: 'Đăng nhập thành công',
    data: { token: generateToken(user), user: toUserResponse(user) },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: toUserResponse(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar, bio } = req.body || {};
  const user = req.user;
  if (name !== undefined) {
    if (!String(name).trim()) throw new ApiError(400, 'Họ tên không được để trống');
    user.name = String(name).trim();
  }
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;
  await user.save();
  res.json({ success: true, message: 'Cập nhật thông tin thành công', data: toUserResponse(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới');
  if (String(newPassword).length < 6) throw new ApiError(400, 'Mật khẩu mới tối thiểu 6 ký tự');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new ApiError(400, 'Mật khẩu hiện tại không đúng');
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Đổi mật khẩu thành công', data: null });
});

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const FORGOT_PASSWORD_MESSAGE = 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.';

const hashResetToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  if (!email) throw new ApiError(400, 'Vui lòng nhập email');
  const user = await User.findOne({ email });
  if (user && user.isActive) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashResetToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save({ validateBeforeSave: false });
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;
    const html = mailLayout(
      'Đặt lại mật khẩu',
      `<p>Xin chào ${escapeHtml(user.name)},</p>
       <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản HomestayGo của bạn. Nhấn nút bên dưới để tạo mật khẩu mới. Liên kết có hiệu lực trong 30 phút.</p>
       ${mailButton(resetUrl, 'Đặt lại mật khẩu')}
       <p style="color:#6B6B66;font-size:13px;">Nếu nút không hoạt động, sao chép liên kết sau vào trình duyệt:<br>${escapeHtml(resetUrl)}</p>
       <p style="color:#6B6B66;font-size:13px;">Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.</p>`
    );
    await sendMail({ to: user.email, subject: 'Đặt lại mật khẩu HomestayGo', html });
  }
  res.json({ success: true, data: null, message: FORGOT_PASSWORD_MESSAGE });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const password = String(req.body?.password || '');
  if (!token) throw new ApiError(400, 'Liên kết đặt lại mật khẩu không hợp lệ');
  if (password.length < 6) throw new ApiError(400, 'Mật khẩu tối thiểu 6 ký tự');
  const user = await User.findOne({
    resetPasswordToken: hashResetToken(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');
  if (!user) throw new ApiError(400, 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  await notify(user._id, {
    type: 'security',
    title: 'Mật khẩu đã được đặt lại',
    message: 'Mật khẩu tài khoản của bạn vừa được thay đổi. Nếu không phải bạn, hãy liên hệ hỗ trợ ngay.',
    link: '',
  });
  res.json({ success: true, data: null, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' });
});
