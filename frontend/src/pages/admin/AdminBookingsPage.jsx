import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarCheck, Download } from 'lucide-react';
import api from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { formatPrice, formatDate } from '../../utils/format';
import BookingDetailModal from '../owner/BookingDetailModal';
import Button from '../../components/ui/Button';
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
} from '../owner/dashboardShared';

const STATUS_OPTIONS = [{ value: '', label: 'Tất cả' }, ...BOOKING_STATUS_KEYS.map((key) => ({ value: key, label: bookingStatusLabel(key) }))];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllRows('/admin/bookings', { status, keyword: appliedKeyword });
      if (!rows.length) {
        toast.error('Không có đơn nào để xuất');
        return;
      }
      downloadCsv(csvFilename('don-dat-phong-he-thong'), rows, BOOKING_CSV_COLUMNS);
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
      const res = await api.get('/admin/bookings', { params: { status: status || undefined, keyword: appliedKeyword || undefined, page, limit: 12 } });
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

  const openDetail = async (booking) => {
    setViewing(booking);
    try {
      const res = await api.get(`/bookings/${booking._id}`);
      const detail = res.data.data;
      if (detail) setViewing((prev) => (prev && prev._id === booking._id ? detail : prev));
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được chi tiết đơn'));
    }
  };

  return (
    <div>
      <PageHeader
        title="Đơn đặt phòng"
        description={`Toàn bộ đơn trên hệ thống · ${pagination.total ?? bookings.length} đơn phù hợp bộ lọc.`}
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
        <EmptyState icon={CalendarCheck} title="Không có đơn nào" description="Thử chọn trạng thái khác hoặc đổi từ khóa." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead className="bg-sand/60">
                  <tr>
                    <th className={TH_CLASS}>Mã đơn</th>
                    <th className={TH_CLASS}>Phòng</th>
                    <th className={TH_CLASS}>Khách</th>
                    <th className={TH_CLASS}>Lưu trú</th>
                    <th className={`${TH_CLASS} text-right`}>Thanh toán</th>
                    <th className={TH_CLASS}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-sand/40">
                      <td className={TD_CLASS}>
                        <button type="button" onClick={() => openDetail(booking)} title="Xem chi tiết đơn" className="font-mono text-sm font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary">
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
                          </div>
                        </div>
                      </td>
                      <td className={TD_CLASS}>
                        <p className="whitespace-nowrap font-medium">{booking.customer?.name || booking.contactName}</p>
                        <p className="text-xs text-muted">{booking.customer?.email || booking.contactPhone}</p>
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
                        <p className="text-xs text-muted">
                          {paymentStatusLabel(booking.paymentStatus)} · {booking.paymentMethod === 'vnpay' ? 'VNPay' : 'Tại homestay'}
                        </p>
                      </td>
                      <td className={TD_CLASS}>
                        <StatusPill status={booking.status}>{bookingStatusLabel(booking.status)}</StatusPill>
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

      <BookingDetailModal open={Boolean(viewing)} booking={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
