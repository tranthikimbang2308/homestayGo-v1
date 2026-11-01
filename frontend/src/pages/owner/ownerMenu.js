import { LayoutDashboard, BedDouble, CalendarDays, CalendarCheck, TicketPercent, MessageCircle, MessageSquareText, Bell, UserRound } from 'lucide-react';

const ownerMenu = [
  { to: '/owner', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/owner/rooms', label: 'Phòng của tôi', icon: BedDouble },
  { to: '/owner/calendar', label: 'Lịch phòng', icon: CalendarDays },
  { to: '/owner/bookings', label: 'Đơn đặt phòng', icon: CalendarCheck },
  { to: '/owner/coupons', label: 'Mã giảm giá', icon: TicketPercent },
  { to: '/owner/messages', label: 'Tin nhắn', icon: MessageCircle },
  { to: '/owner/reviews', label: 'Đánh giá', icon: MessageSquareText },
  { to: '/owner/notifications', label: 'Thông báo', icon: Bell },
  { to: '/owner/profile', label: 'Tài khoản', icon: UserRound },
];

export default ownerMenu;
