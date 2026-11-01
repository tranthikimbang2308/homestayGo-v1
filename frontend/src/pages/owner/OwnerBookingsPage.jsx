import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, X, LogIn, CircleCheckBig, Ban, CalendarCheck, Download } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { formatPrice, formatDate } from '../../utils/format';
import BookingDetailModal from './BookingDetailModal';
import { BOOKING_CSV_COLUMNS, csvFilename, downloadCsv, fetchAllRows } from '../../utils/exportCsv';
import {
  PageHeader,
  SearchBox,
  FilterTabs,
  StatusPill,
  bookingStatusLabel,
  paymentStatusLabel,
  BOOKING_STATUS_KEYS,
  coverImage,
  errorMessage,
  TABLE_CLASS,
  TH_CLASS,
  TD_CLASS,
} from './dashboardShared';

const STATUS_OPTIONS = [{ value: '', label: 'Tất cả' }, ...BOOKING_STATUS_KEYS.map((key) => ({ value: key, label: bookingStatusLabel(key) }))];

const TRANSITIONS = {
  pending: [
    { to: 'confirmed', label: 'Xác nhận', icon: Check, variant: 'primary' },
    { to: 'rejected', label: 'Từ chối', icon: X, variant: 'outline', needReason: true },
  ],
  confirmed: [
    { to: 'checked_in', label: 'Nhận phòng', icon: LogIn, variant: 'primary' },
    { to: 'cancelled', label: 'Hủy đơn', icon: Ban, variant: 'outline', needReason: true },
  ],
  checked_in: [{ to: 'completed', label: 'Hoàn thành', icon: CircleCheckBig, variant: 'primary' }],
};

const REASON_TITLES = {
  rejected: 'Từ chối đơn đặt phòng',
  cancelled: 'Hủy đơn đặt phòng',
};

const SUCCESS_MESSAGES = {
  confirmed: 'Đã xác nhận đơn',
  rejected: 'Đã từ chối đơn',
  checked_in: 'Đã ghi nhận khách nhận phòng',
  completed: 'Đã hoàn thành đơn',
  cancelled: 'Đã hủy đơn',
};

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [viewing, setViewing] = useState(null);
  const [reasonAction, setReasonAction] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllRows('/owner/bookings', { status, keyword: appliedKeyword });
      if (!rows.length) {
        toast.error('Không có đơn nào để xuất');
        return;
      }
      downloadCsv(csvFilename('don-dat-phong'), rows, BOOKING_CSV_COLUMNS);
      toast.success(`Đã xuất ${rows.length} đơn ra file CSV`);
    } catch {
      toast.error('Không xuất được file CSV');
    } finally {
      setExporting(false);
    }
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/owner/bookings', { params: { status: status || undefined, keyword: appliedKeyword || undefined, page, limit: 10 } });
      setBookings(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được danh sách đơn'));
    } finally {
      setLoading(false);
    }
  }, [status, appliedKeyword, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedKeyword(keyword.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const updateStatus = async (booking, nextStatus, reasonText) => {
    setBusyId(booking._id);
    try {
      const res = await api.patch(`/owner/bookings/${booking._id}/status`, { status: nextStatus, reason: reasonText || undefined });
      toast.success(SUCCESS_MESSAGES[nextStatus] || 'Đã cập nhật đơn');
      const updated = res.data.data;
      if (viewing && viewing._id === booking._id && updated) {
        setViewing({ ...viewing, ...updated, room: viewing.room, customer: viewing.customer });
      }
      fetchBookings();
      return true;
    } catch (error) {
      toast.error(errorMessage(error, 'Không cập nhật được trạng thái đơn'));
      return false;
    } finally {
      setBusyId('');
    }
  };

  const handleAction = (booking, action) => {
    if (action.needReason) {
      setReason('');
      setReasonError('');
      setReasonAction({ booking, action });
      return;
    }
    updateStatus(booking, action.to);
  };

  const submitReason = async () => {
    if (!reason.trim()) {
      setReasonError('Nhập lý do để khách nắm được');
      return;
    }
    const ok = await updateStatus(reasonAction.booking, reasonAction.action.to, reason.trim());
    if (ok) setReasonAction(null);
  };

  const renderActions = (booking, size = 'sm') =>
    (TRANSITIONS[booking.status] || []).map((action) => {
      const compact = size === 'sm' && action.needReason;
      return (
        <Button
          key={action.to}
          size={size}
          variant={action.variant}
          icon={action.icon}
          className={compact ? 'whitespace-nowrap px-2' : 'whitespace-nowrap'}
          disabled={busyId === booking._id}
          onClick={() => handleAction(booking, action)}
          aria-label={action.label}
          title={action.label}
        >
          {compact ? null : action.label}
        </Button>
      );
    });

  return (
    <div>
      <PageHeader
        title="Đơn đặt phòng"
        description="Xác nhận đơn mới, ghi nhận khách nhận phòng và hoàn tất lưu trú."
        actions={
          <Button variant="outline" size="sm" icon={Download} loading={exporting} onClick={handleExportCsv}>
            Xuất CSV
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          options={STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <SearchBox value={keyword} onChange={setKeyword} placeholder="Mã đơn hoặc tên người đặt" />
      </div>

      {loading ? (
        <Spinner fullPage />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Không có đơn nào"
          description={status || appliedKeyword ? 'Thử chọn trạng thái khác hoặc đổi từ khóa.' : 'Đơn mới của khách sẽ hiện ở đây.'}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead className="bg-sand/60">
                  <tr>
                    <th className={TH_CLASS}>Mã đơn</th>
                    <th className={TH_CLASS}>Phòng</th>
                    <th className={`${TH_CLASS} hidden 2xl:table-cell`}>Khách</th>
                    <th className={TH_CLASS}>Lưu trú</th>
                    <th className={`${TH_CLASS} text-right`}>Tổng tiền</th>
                    <th className={TH_CLASS}>Trạng thái</th>
                    <th className={`${TH_CLASS} text-right`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-sand/40">
                      <td className={TD_CLASS}>
                        <button type="button" onClick={() => setViewing(booking)} title="Xem chi tiết đơn" className="font-mono text-sm font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary">
                          {booking.code}
                        </button>
                        <p className="mt-0.5 text-xs text-muted">{formatDate(booking.createdAt)}</p>
                      </td>
                      <td className={TD_CLASS}>
                        <div className="flex min-w-[11rem] max-w-[16rem] items-center gap-3">
                          {coverImage(booking.room) ? (
                            <img src={coverImage(booking.room)} alt="" className="h-10 w-14 shrink-0 rounded-md object-cover" />
                          ) : (
                            <div className="h-10 w-14 shrink-0 rounded-md bg-sand" />
                          )}
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-medium">{booking.room?.title || 'Phòng đã bị xóa'}</p>
                            <p className="text-xs text-muted">{booking.room?.city}</p>
                            <p className="line-clamp-1 text-xs text-ink 2xl:hidden">{booking.contactName || booking.customer?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`${TD_CLASS} hidden 2xl:table-cell`}>
                        <p className="whitespace-nowrap font-medium">{booking.contactName || booking.customer?.name}</p>
                        <p className="text-xs text-muted">{booking.contactPhone || booking.customer?.phone}</p>
                      </td>
                      <td className={`${TD_CLASS} whitespace-nowrap`}>
                        <p>
                          {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
                        </p>
                        <p className="text-xs text-muted">
                          {booking.nights} đêm · {booking.guests} khách
                        </p>
                      </td>
                      <td className={`${TD_CLASS} whitespace-nowrap text-right`}>
                        <p className="font-semibold text-accent">{formatPrice(booking.totalPrice)}</p>
                        <p className="text-xs text-muted">{paymentStatusLabel(booking.paymentStatus)}</p>
                      </td>
                      <td className={TD_CLASS}>
                        <StatusPill status={booking.status}>{bookingStatusLabel(booking.status)}</StatusPill>
                      </td>
                      <td className={TD_CLASS}>
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {renderActions(booking)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page || page} totalPages={pagination.totalPages} onChange={setPage} />
        </>
      )}

      <BookingDetailModal
        open={Boolean(viewing)}
        booking={viewing}
        onClose={() => setViewing(null)}
        footer={viewing && TRANSITIONS[viewing.status] ? renderActions(viewing, 'md') : null}
      />

      <Modal
        open={Boolean(reasonAction)}
        onClose={() => setReasonAction(null)}
        title={reasonAction ? REASON_TITLES[reasonAction.action.to] : ''}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setReasonAction(null)}>
              Quay lại
            </Button>
            <Button variant="danger" loading={busyId === reasonAction?.booking._id} onClick={submitReason}>
              {reasonAction?.action.label}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted">
          Đơn <span className="font-mono font-semibold text-ink">{reasonAction?.booking.code}</span> của {reasonAction?.booking.contactName}. Lý do sẽ được gửi tới khách.
        </p>
        <Textarea
          label="Lý do"
          rows={4}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            if (reasonError) setReasonError('');
          }}
          error={reasonError}
          placeholder="VD: Phòng đang bảo trì trong thời gian này"
          autoFocus
        />
      </Modal>
    </div>
  );
}
