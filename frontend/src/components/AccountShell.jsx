import { NavLink } from 'react-router-dom';
import { Bell, CalendarCheck, Heart, MessageCircle, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AccountShell({ title, description, actions, children }) {
  const { user } = useAuth();
  const tabs = [
    { to: '/account/profile', label: 'Tài khoản', icon: UserRound },
    ...(user?.role === 'customer' ? [{ to: '/account/bookings', label: 'Đơn đặt phòng', icon: CalendarCheck }] : []),
    { to: '/account/favorites', label: 'Yêu thích', icon: Heart },
    { to: '/account/messages', label: 'Tin nhắn', icon: MessageCircle },
    { to: '/account/notifications', label: 'Thông báo', icon: Bell },
  ];

  return (
    <div className="container-page py-8 lg:py-10">
      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      {(title || actions) && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            {title && <h1 className="font-serif text-3xl font-semibold">{title}</h1>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
