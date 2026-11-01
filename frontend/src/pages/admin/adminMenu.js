import { LayoutDashboard, ClipboardCheck, Users, CalendarCheck, MessageSquareText, Flag, TicketPercent, Newspaper, Inbox, Settings, Bell, UserRound } from 'lucide-react';

const adminMenu = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/rooms', label: 'Duyệt phòng', icon: ClipboardCheck },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/bookings', label: 'Đơn đặt phòng', icon: CalendarCheck },
  { to: '/admin/reviews', label: 'Đánh giá', icon: MessageSquareText },
  { to: '/admin/reports', label: 'Khiếu nại', icon: Flag },
  { to: '/admin/coupons', label: 'Mã giảm giá', icon: TicketPercent },
  { to: '/admin/posts', label: 'Bài viết', icon: Newspaper },
  { to: '/admin/contacts', label: 'Liên hệ', icon: Inbox },
  { to: '/admin/settings', label: 'Cài đặt', icon: Settings },
  { to: '/admin/notifications', label: 'Thông báo', icon: Bell },
  { to: '/admin/profile', label: 'Tài khoản', icon: UserRound },
];

export default adminMenu;
