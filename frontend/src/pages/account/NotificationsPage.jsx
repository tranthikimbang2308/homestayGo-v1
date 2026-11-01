import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import client, { getErrorMessage } from '../../api/client.js';
import AccountShell from '../../components/AccountShell.jsx';
import { NotificationIcon, timeAgo } from '../../components/NotificationBell.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatDateTime } from '../../utils/format.js';

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
];

function NotificationsContent() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { page, limit: 15 };
    if (filter === 'unread') params.unread = true;
    client
      .get('/notifications', { params })
      .then((res) => {
        setItems(res.data.data?.items || []);
        setUnreadCount(res.data.data?.unreadCount || 0);
        setPagination(res.data.pagination || { totalPages: 1, total: 0 });
      })
      .catch((err) => setError(getErrorMessage(err, 'Không tải được thông báo')))
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const changeFilter = (value) => {
    setFilter(value);
    setPage(1);
  };

  const openItem = (item) => {
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      client.patch(`/notifications/${item._id}/read`).catch(() => {});
    }
    if (item.link) navigate(item.link);
  };

  const markRead = async (item) => {
    try {
      await client.patch(`/notifications/${item._id}/read`);
      if (filter === 'unread') setItems((prev) => prev.filter((n) => n._id !== item._id));
      else setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await client.patch('/notifications/read-all');
      toast.success('Đã đánh dấu tất cả là đã đọc');
      if (filter === 'unread') {
        setItems([]);
        setPagination({ totalPages: 1, total: 0 });
      } else setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  const remove = async (item) => {
    try {
      await client.delete(`/notifications/${item._id}`);
      setItems((prev) => prev.filter((n) => n._id !== item._id));
      if (!item.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success('Đã xóa thông báo');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex gap-1 rounded-lg bg-sand p-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeFilter(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === option.value ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {option.label}
              {option.value === 'unread' && unreadCount > 0 && <span className="ml-1.5 text-xs">({unreadCount})</span>}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAll} loading={markingAll} disabled={unreadCount === 0}>
          Đánh dấu đã đọc tất cả
        </Button>
      </div>

      {loading ? (
        <ul className="divide-y divide-line">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="flex gap-3 px-4 py-4 sm:px-5">
              <span className="h-9 w-9 animate-pulse rounded-full bg-line/60" />
              <div className="flex-1 space-y-2">
                <span className="block h-3.5 w-1/2 animate-pulse rounded bg-line/60" />
                <span className="block h-3 w-3/4 animate-pulse rounded bg-line/60" />
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <div className="p-5">
          <EmptyState title="Không tải được thông báo" description={error} action={<Button onClick={load}>Thử lại</Button>} />
        </div>
      ) : items.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={Bell}
            title={filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
            description="Thông báo về đơn đặt phòng, tin nhắn và đánh giá sẽ xuất hiện tại đây."
          />
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item._id} className={`group flex gap-3 px-4 py-4 sm:px-5 ${item.isRead ? '' : 'bg-primary-light/40'}`}>
              <NotificationIcon type={item.type} isRead={item.isRead} />
              <button type="button" onClick={() => openItem(item)} className="min-w-0 flex-1 text-left">
                <span className="flex items-start gap-2">
                  <span className={`text-sm leading-snug ${item.isRead ? 'text-ink' : 'font-semibold text-ink'}`}>{item.title}</span>
                  {!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </span>
                {item.message && <span className="mt-1 block text-sm text-muted">{item.message}</span>}
                <span className="mt-1.5 block text-xs text-muted" title={formatDateTime(item.createdAt)}>
                  {timeAgo(item.createdAt)}
                </span>
              </button>
              <div className="flex shrink-0 items-start gap-1">
                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => markRead(item)}
                    className="rounded-lg p-2 text-muted hover:bg-sand hover:text-primary"
                    aria-label="Đánh dấu đã đọc"
                    title="Đánh dấu đã đọc"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(item)}
                  className="rounded-lg p-2 text-muted hover:bg-sand hover:text-danger"
                  aria-label="Xóa thông báo"
                  title="Xóa thông báo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!loading && !error && pagination.totalPages > 1 && (
        <div className="border-t border-line px-4 pb-6 sm:px-5">
          <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage({ embedded = false }) {
  if (embedded) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Thông báo</h2>
          <p className="mt-1 text-sm text-muted">Cập nhật mới nhất về hoạt động trên tài khoản của bạn.</p>
        </div>
        <NotificationsContent />
      </div>
    );
  }
  return (
    <AccountShell title="Thông báo" description="Cập nhật mới nhất về đơn đặt phòng, tin nhắn và tài khoản của bạn.">
      <div className="max-w-3xl">
        <NotificationsContent />
      </div>
    </AccountShell>
  );
}
