import Booking from '../models/Booking.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyReturn } from '../utils/vnpay.js';
import { notifyBookingPaid } from './bookingController.js';

const RESPONSE_MESSAGES = {
  '00': 'Thanh toán thành công',
  '07': 'Giao dịch bị nghi ngờ gian lận',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking',
  10: 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  11: 'Đã hết hạn chờ thanh toán',
  12: 'Thẻ/Tài khoản bị khóa',
  13: 'Nhập sai mật khẩu xác thực giao dịch (OTP)',
  24: 'Khách hàng đã hủy giao dịch',
  51: 'Tài khoản không đủ số dư',
  65: 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
  75: 'Ngân hàng thanh toán đang bảo trì',
  79: 'Nhập sai mật khẩu thanh toán quá số lần quy định',
};

export const vnpayReturn = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  const txnRef = query.vnp_TxnRef;
  const responseCode = String(query.vnp_ResponseCode || '');

  if (!verifyReturn(query)) {
    return res.status(400).json({
      success: false,
      message: 'Chữ ký không hợp lệ',
      data: { bookingId: null, code: null, paid: false, message: 'Chữ ký không hợp lệ' },
    });
  }

  const booking = txnRef ? await Booking.findOne({ vnpTxnRef: txnRef }) : null;
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy đơn đặt phòng',
      data: { bookingId: null, code: null, paid: false, message: 'Không tìm thấy đơn đặt phòng' },
    });
  }

  if (booking.paymentStatus === 'paid') {
    return res.json({
      success: true,
      data: { bookingId: booking._id, code: booking.code, paid: true, message: 'Đơn đặt phòng đã được thanh toán' },
    });
  }

  const amountMatches = Number(query.vnp_Amount) === Math.round(booking.totalPrice) * 100;
  if (responseCode === '00' && String(query.vnp_TransactionStatus || '00') === '00' && amountMatches) {
    booking.paymentStatus = 'paid';
    booking.paymentMethod = 'vnpay';
    booking.paidAt = new Date();
    await booking.save();
    try {
      await notifyBookingPaid(booking);
    } catch (error) {
      console.error('[payment] Lỗi gửi thông báo thanh toán:', error.message);
    }
    return res.json({
      success: true,
      data: { bookingId: booking._id, code: booking.code, paid: true, message: 'Thanh toán thành công' },
    });
  }

  const message = !amountMatches && responseCode === '00'
    ? 'Số tiền thanh toán không khớp'
    : RESPONSE_MESSAGES[responseCode] || 'Thanh toán không thành công';
  res.json({ success: true, data: { bookingId: booking._id, code: booking.code, paid: false, message } });
});
