import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck, CalendarDays, ChevronRight, MapPin, Users } from 'lucide-react';
import client, { getErrorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import AccountShell from '../../components/AccountShell.jsx';
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/BookingStatusBadge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { BOOKING_STATUS, FALLBACK_IMAGE, PAYMENT_METHODS } from '../../utils/constants.js';
import { formatDate, formatPrice } from '../../utils/format.js';

const TABS = [{ key: '', label: 'Tất cả' }, ...Object.entries(BOOKING_STATUS).map(([key, value]) => ({ key, label: value.label }))];

function BookingRow({ booking }) {
  const room = booking.room || {};
  return (
    <Link to={`/account/bookings/${booking._id}`} className="card group flex flex-col gap-4 p-4 transition-colors hover:border-primary/50 sm:flex-row">
      <img
        src={room.images?.[0] || FALLBACK_IMAGE}
        alt={room.title}
        className="h-40 w-full shrink-0 rounded-lg object-cover sm:h-28 sm:w-40"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          <PaymentStatusBadge status={booking.paymentStatus} />
          <span className="text-xs text-muted">Mã đơn {booking.code}</span>
        </div>
        <h3 className="mt-2 line-clamp-1 font-sans text-base font-semibold group-hover:text-primary">{room.title || 'Phòng đã bị xóa'}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5" /> {room.city}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-muted" />
            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)} ({booking.nights} đêm)
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted" /> {booking.guests} khách
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2 border-t border-dashed border-line pt-3 sm:flex-col sm:border-0 sm:pt-0 sm:text-right">
        <div>
          <p className="font-serif text-lg font-semibold text-accent">{formatPrice(booking.totalPrice)}</p>
          <p className="text-xs text-muted">{PAYMENT_METHODS[booking.paymentMethod]?.label}</p>
        </div>
        <span className="flex items-center gap-1 text-sm font-medium text-primary">
          Chi tiết <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const page = Number(params.get('page')) || 1;
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isCustomer = user?.role === 'customer';

  useEffect(() => {
    if (!isCustomer) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    client
      .get('/bookings/my', { params: { status: status || undefined, page, limit: 8 } })
      .then((res) => {
        setBookings(res.data.data || []);
        setPagination(res.data.pagination || { totalPages: 1 });
      })
      .catch((err) => setError(getErrorMessage(err, 'Không tải được danh sách đơn')))
      .finally(() => setLoading(false));
  }, [status, page, isCustomer]);

  const changeTab = (key) => {
    const next = new URLSearchParams();
    if (key) next.set('status', key);
    setParams(next);
  };

  if (!isCustomer) {
    const dashboard = user?.role === 'admin' ? '/admin/bookings' : '/owner/bookings';
    return (
      <AccountShell title="Đơn đặt phòng">
        <EmptyState
          icon={CalendarCheck}
          title="Trang này dành cho khách hàng"
          description="Bạn đang dùng tài khoản quản lý. Đơn đặt phòng được quản lý trong bảng điều khiển."
          action={
            <Link to={dashboard} className="btn btn-primary">
              Mở bảng điều khiển
            </Link>
          }
        />
      </AccountShell>
    );
  }

  return (
    <AccountShell title="Đơn đặt phòng" description="Theo dõi trạng thái, thanh toán và đánh giá các chuyến đi của bạn.">
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key || 'all'}
            type="button"
            onClick={() => changeTab(tab.key)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              status === tab.key ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Đang tải đơn đặt phòng..." />
      ) : error ? (
        <EmptyState title="Không tải được đơn" description={error} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={status ? `Không có đơn "${BOOKING_STATUS[status]?.label}"` : 'Bạn chưa có chuyến đi nào'}
          description="Tìm một căn homestay ưng ý và đặt chuyến đi đầu tiên."
          action={
            <Link to="/rooms" className="btn btn-primary">
              Tìm phòng ngay
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingRow key={booking._id} booking={booking} />
          ))}
        </div>
      )}
      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        onChange={(nextPage) => {
          const next = new URLSearchParams(params);
          next.set('page', String(nextPage));
          setParams(next);
        }}
      />
    </AccountShell>
  );
}
