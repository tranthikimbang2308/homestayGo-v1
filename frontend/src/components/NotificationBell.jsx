import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Bell,
  BellOff,
  CalendarCheck,
  CheckCheck,
  Home,
  Info,
  MessageCircle,
  ShieldCheck,
  Star,
  Tag,
  UserRound,
} from 'lucide-react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const POLL_INTERVAL = 30000;

const TYPE_ICONS = {
  message: MessageCircle,
  booking_new: CalendarCheck,
  booking_status: CalendarCheck,
  booking_cancelled: CalendarCheck,
  payment: CalendarCheck,
  review_new: Star,
  review_reply: Star,
  room_status: Home,
  room_pending: Home,
  account: UserRound,
  security: ShieldCheck,
  promotion: Tag,
  report: Info,
};

export const notificationIcon = (type) => TYPE_ICONS[type] || Bell;

export const notificationsPathFor = (role) => {
  if (role === 'owner') return '/owner/notifications';
  if (role === 'admin') return '/admin/notifications';
  return '/account/notifications';
};

export const timeAgo = (value) => {
  if (!value) return '';
  const now = dayjs();
  const date = dayjs(value);
  const minutes = now.diff(date, 'minute');
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = now.diff(date, 'hour');
  if (hours < 24) return `${hours} giờ trước`;
  const days = now.diff(date, 'day');
  if (days < 7) return `${days} ngày trước`;
  return date.format('DD/MM/YYYY');
};

export function NotificationIcon({ type, isRead }) {
  const Icon = notificationIcon(type);
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        isRead ? 'bg-sand text-muted' : 'bg-primary-light text-primary'
      }`}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

export default function NotificationBell() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchCount = useCallback(() => {
    client
      .get('/notifications/unread-count')
      .then((res) => setCount(res.data.data?.count || 0))
      .catch(() => {});
  }, []);

  const fetchLatest = useCallback(() => {
    setLoading(true);
    client
      .get('/notifications', { params: { limit: 8 } })
      .then((res) => {
        setItems(res.data.data?.items || []);
        setCount(res.data.data?.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    fetchCount();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') fetchCount();
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [isAuthenticated, fetchCount]);

  useEffect(() => {
    if (isAuthenticated) fetchCount();
  }, [location.pathname, isAuthenticated, fetchCount]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!isAuthenticated || !user) return null;

  const toggle = () => {
    setOpen((prev) => {
      if (!prev) fetchLatest();
      return !prev;
    });
  };

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)));
      setCount((prev) => Math.max(0, prev - 1));
      client.patch(`/notifications/${item._id}/read`).catch(() => {});
    }
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  const handleReadAll = async () => {
    try {
      await client.patch('/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCount(0);
    } catch {
      fetchCount();
    }
  };

  const badge = count > 99 ? '99+' : count;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative inline-flex rounded-full p-2 text-ink transition-colors hover:bg-sand-dark"
        aria-label={count ? `Thông báo, ${count} chưa đọc` : 'Thông báo'}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-white shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Thông báo</p>
            {count > 0 && (
              <button type="button" onClick={handleReadAll} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <CheckCheck className="h-3.5 w-3.5" />
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="h-9 w-9 animate-pulse rounded-full bg-line/60" />
                    <div className="flex-1 space-y-2">
                      <span className="block h-3 w-3/4 animate-pulse rounded bg-line/60" />
                      <span className="block h-3 w-1/2 animate-pulse rounded bg-line/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <BellOff className="h-6 w-6 text-muted" />
                <p className="mt-2 text-sm text-muted">Bạn chưa có thông báo nào</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-sand ${item.isRead ? '' : 'bg-primary-light/40'}`}
                    >
                      <NotificationIcon type={item.type} isRead={item.isRead} />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm leading-snug ${item.isRead ? 'text-ink' : 'font-semibold text-ink'}`}>{item.title}</span>
                        {item.message && <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{item.message}</span>}
                        <span className="mt-1 block text-[11px] text-muted">{timeAgo(item.createdAt)}</span>
                      </span>
                      {!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            to={notificationsPathFor(user.role)}
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-3 text-center text-sm font-medium text-primary hover:bg-sand"
          >
            Xem tất cả
          </Link>
        </div>
      )}
    </div>
  );
}
