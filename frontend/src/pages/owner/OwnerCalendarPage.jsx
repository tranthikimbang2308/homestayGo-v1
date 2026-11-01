import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { CalendarDays, ChevronLeft, ChevronRight, Lock, LockOpen, Plus } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, formatPrice } from '../../utils/format';
import { PageHeader, StatusPill, bookingStatusLabel, errorMessage } from './dashboardShared';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const KEY = 'YYYY-MM-DD';

const buildRowCells = (days, bookings, blocks) => {
  const byDay = days.map((day) => {
    const key = day.format(KEY);
    const booking = bookings.find((b) => dayjs(b.checkIn).format(KEY) <= key && dayjs(b.checkOut).format(KEY) > key);
    if (booking) return { type: 'booking', id: booking._id, item: booking };
    const block = blocks.find((b) => dayjs(b.from).format(KEY) <= key && dayjs(b.to).format(KEY) >= key);
    if (block) return { type: 'blocked', id: block._id, item: block };
    return { type: 'free', id: key, day };
  });
  const cells = [];
  byDay.forEach((cell, index) => {
    const last = cells[cells.length - 1];
    if (last && cell.type !== 'free' && last.type === cell.type && last.id === cell.id) {
      last.span += 1;
    } else {
      cells.push({ ...cell, span: 1, startIndex: index });
    }
  });
  return cells;
};

const EMPTY_BLOCK = { roomId: '', from: '', to: '', reason: '' };

export default function OwnerCalendarPage() {
  const [month, setMonth] = useState(() => dayjs().startOf('month'));
  const [roomFilter, setRoomFilter] = useState('');
  const [data, setData] = useState({ rooms: [], bookings: [], blocked: [] });
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockForm, setBlockForm] = useState(null);
  const [blockErrors, setBlockErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewBlock, setViewBlock] = useState(null);
  const [viewBooking, setViewBooking] = useState(null);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/owner/calendar', { params: { month: month.format('YYYY-MM'), roomId: roomFilter || undefined } });
      const payload = res.data.data || { rooms: [], bookings: [], blocked: [] };
      setData(payload);
      if (!roomFilter) setAllRooms(payload.rooms || []);
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được lịch phòng'));
    } finally {
      setLoading(false);
    }
  }, [month, roomFilter]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const days = useMemo(() => Array.from({ length: month.daysInMonth() }, (_, index) => month.date(index + 1)), [month]);
  const todayKey = dayjs().format(KEY);

  const rows = useMemo(
    () =>
      (data.rooms || []).map((room) => ({
        room,
        cells: buildRowCells(
          days,
          (data.bookings || []).filter((b) => String(b.room?._id || b.room) === String(room._id)),
          (data.blocked || []).filter((b) => String(b.roomId) === String(room._id))
        ),
      })),
    [data, days]
  );

  const stats = useMemo(() => {
    const totalNights = rows.length * days.length;
    let booked = 0;
    let blocked = 0;
    rows.forEach((row) =>
      row.cells.forEach((cell) => {
        if (cell.type === 'booking') booked += cell.span;
        if (cell.type === 'blocked') blocked += cell.span;
      })
    );
    return { totalNights, booked, blocked, rate: totalNights ? Math.round((booked / totalNights) * 100) : 0 };
  }, [rows, days]);

  const openBlock = (preset = {}) => {
    setBlockErrors({});
    setBlockForm({ ...EMPTY_BLOCK, roomId: roomFilter || allRooms[0]?._id || '', ...preset });
  };

  const handleSaveBlock = async () => {
    const next = {};
    if (!blockForm.roomId) next.roomId = 'Chọn phòng';
    if (!blockForm.from) next.from = 'Chọn ngày bắt đầu';
    if (blockForm.to && blockForm.from && blockForm.to < blockForm.from) next.to = 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu';
    if (blockForm.from && blockForm.from < todayKey) next.from = 'Không thể khóa ngày trong quá khứ';
    setBlockErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await api.post(`/owner/rooms/${blockForm.roomId}/blocked-dates`, {
        from: blockForm.from,
        to: blockForm.to || blockForm.from,
        reason: blockForm.reason.trim(),
      });
      toast.success('Đã khóa ngày');
      setBlockForm(null);
      fetchCalendar();
    } catch (error) {
      toast.error(errorMessage(error, 'Không khóa được ngày'));
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async () => {
    if (!viewBlock) return;
    setSaving(true);
    try {
      await api.delete(`/owner/rooms/${viewBlock.roomId}/blocked-dates/${viewBlock._id}`);
      toast.success('Đã mở khóa ngày');
      setViewBlock(null);
      fetchCalendar();
    } catch (error) {
      toast.error(errorMessage(error, 'Không mở khóa được'));
    } finally {
      setSaving(false);
    }
  };

  const roomTitle = (roomId) => (allRooms.find((room) => room._id === roomId) || data.rooms.find((room) => room._id === roomId))?.title || '';

  return (
    <div>
      <PageHeader
        title="Lịch phòng"
        description="Xem đơn đặt và ngày khóa theo tháng. Bấm vào ô trống để khóa ngày, bấm vào ô đã khóa để mở khóa."
        actions={
          <Button icon={Plus} onClick={() => openBlock()} disabled={allRooms.length === 0}>
            Khóa ngày
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMonth((prev) => prev.subtract(1, 'month'))} className="btn btn-outline btn-sm px-2" aria-label="Tháng trước">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[9.5rem] rounded-lg border border-line bg-white px-3 py-1.5 text-center text-sm font-medium" aria-live="polite">
            Tháng {month.format('M/YYYY')}
          </span>
          <button type="button" onClick={() => setMonth((prev) => prev.add(1, 'month'))} className="btn btn-outline btn-sm px-2" aria-label="Tháng sau">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setMonth(dayjs().startOf('month'))} className="btn btn-ghost btn-sm">
            Hôm nay
          </button>
        </div>
        <select value={roomFilter} onChange={(event) => setRoomFilter(event.target.value)} className="input w-full cursor-pointer py-1.5 sm:w-72" aria-label="Lọc theo phòng">
          <option value="">Tất cả phòng</option>
          {allRooms.map((room) => (
            <option key={room._id} value={room._id}>
              {room.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded bg-primary" /> Đã xác nhận / đang ở
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded border border-dashed border-primary bg-primary-light" /> Chờ xác nhận
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded bg-stone-300" /> Ngày khóa
        </span>
        {!loading && rows.length > 0 && (
          <span className="ml-auto text-ink">
            Lấp đầy {stats.rate}% · {stats.booked} đêm có khách · {stats.blocked} đêm khóa
          </span>
        )}
      </div>

      {loading ? (
        <Spinner fullPage />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Chưa có phòng"
          description="Thêm phòng để bắt đầu quản lý lịch."
          action={
            <Link to="/owner/rooms/new" className="btn btn-primary">
              Thêm phòng
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs" style={{ minWidth: `${14 + days.length * 2.4}rem` }}>
              <thead>
                <tr className="bg-sand/60">
                  <th className="sticky left-0 z-10 w-56 min-w-[14rem] border-b border-r border-line bg-sand px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Phòng
                  </th>
                  {days.map((day) => {
                    const key = day.format(KEY);
                    const weekend = day.day() === 0 || day.day() === 6;
                    return (
                      <th key={key} className={`min-w-[2.4rem] border-b border-line px-0 py-1.5 text-center font-medium ${key === todayKey ? 'bg-primary text-white' : weekend ? 'text-ink' : 'text-muted'}`}>
                        <span className="block text-[10px]">{WEEKDAYS[day.day()]}</span>
                        <span className="block text-sm">{day.date()}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ room, cells }) => (
                  <tr key={room._id} className="border-b border-line last:border-b-0">
                    <td className="sticky left-0 z-10 border-r border-line bg-white px-3 py-2">
                      <p className="line-clamp-1 text-sm font-medium text-ink" title={room.title}>
                        {room.title}
                      </p>
                      {room.status !== 'approved' && <p className="text-[11px] text-muted">Phòng chưa hiển thị</p>}
                    </td>
                    {cells.map((cell) => {
                      if (cell.type === 'free') {
                        const key = cell.day.format(KEY);
                        const past = key < todayKey;
                        return (
                          <td key={cell.id} className="h-12 border-l border-line/60 p-0.5">
                            <button
                              type="button"
                              disabled={past}
                              onClick={() => openBlock({ roomId: room._id, from: key, to: key })}
                              className="h-full w-full rounded hover:bg-sand disabled:cursor-default disabled:hover:bg-transparent"
                              aria-label={`Khóa ngày ${cell.day.format('DD/MM')} cho ${room.title}`}
                            />
                          </td>
                        );
                      }
                      if (cell.type === 'blocked') {
                        return (
                          <td key={`${cell.id}-${cell.startIndex}`} colSpan={cell.span} className="h-12 border-l border-line/60 p-0.5">
                            <button
                              type="button"
                              onClick={() => setViewBlock(cell.item)}
                              className="flex h-full w-full items-center gap-1 overflow-hidden rounded bg-stone-300 px-1.5 text-left text-[11px] font-medium text-ink hover:bg-stone-400/70"
                              title={cell.item.reason || 'Ngày khóa'}
                            >
                              <Lock className="h-3 w-3 shrink-0" />
                              {cell.span > 1 && <span className="truncate">{cell.item.reason || 'Đã khóa'}</span>}
                            </button>
                          </td>
                        );
                      }
                      const booking = cell.item;
                      const pending = booking.status === 'pending';
                      return (
                        <td key={`${cell.id}-${cell.startIndex}`} colSpan={cell.span} className="h-12 border-l border-line/60 p-0.5">
                          <button
                            type="button"
                            onClick={() => setViewBooking(booking)}
                            className={`flex h-full w-full flex-col justify-center overflow-hidden rounded px-1.5 text-left text-[11px] leading-tight ${
                              pending ? 'border border-dashed border-primary bg-primary-light text-primary' : 'bg-primary text-white hover:bg-primary-dark'
                            }`}
                            title={`${booking.code} - ${booking.contactName || booking.customer?.name || ''}`}
                          >
                            <span className="truncate font-semibold">{cell.span > 1 ? booking.contactName || booking.customer?.name : ''}</span>
                            {cell.span > 2 && <span className="truncate opacity-80">{booking.code}</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(blockForm)}
        onClose={() => !saving && setBlockForm(null)}
        title="Khóa ngày không nhận khách"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBlockForm(null)} disabled={saving}>
              Hủy
            </Button>
            <Button icon={Lock} onClick={handleSaveBlock} loading={saving}>
              Khóa ngày
            </Button>
          </>
        }
      >
        {blockForm && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span className="label">Phòng</span>
              <select value={blockForm.roomId} onChange={(event) => setBlockForm((prev) => ({ ...prev, roomId: event.target.value }))} className={`input cursor-pointer ${blockErrors.roomId ? 'input-error' : ''}`}>
                <option value="">Chọn phòng</option>
                {allRooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.title}
                  </option>
                ))}
              </select>
              {blockErrors.roomId && <p className="mt-1 text-xs text-danger">{blockErrors.roomId}</p>}
            </div>
            <div>
              <span className="label">Từ ngày</span>
              <input type="date" min={todayKey} value={blockForm.from} onChange={(event) => setBlockForm((prev) => ({ ...prev, from: event.target.value, to: prev.to && prev.to >= event.target.value ? prev.to : event.target.value }))} className={`input ${blockErrors.from ? 'input-error' : ''}`} />
              {blockErrors.from && <p className="mt-1 text-xs text-danger">{blockErrors.from}</p>}
            </div>
            <div>
              <span className="label">Đến hết ngày</span>
              <input type="date" min={blockForm.from || todayKey} value={blockForm.to} onChange={(event) => setBlockForm((prev) => ({ ...prev, to: event.target.value }))} className={`input ${blockErrors.to ? 'input-error' : ''}`} />
              {blockErrors.to && <p className="mt-1 text-xs text-danger">{blockErrors.to}</p>}
            </div>
            <div className="sm:col-span-2">
              <span className="label">Lý do (không bắt buộc)</span>
              <input value={blockForm.reason} maxLength={200} onChange={(event) => setBlockForm((prev) => ({ ...prev, reason: event.target.value }))} className="input" placeholder="Bảo trì, gia đình sử dụng..." />
            </div>
            <p className="text-xs text-muted sm:col-span-2">Khách sẽ không thể đặt các đêm trong khoảng này. Không thể khóa ngày đã có đơn đang hoạt động.</p>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(viewBlock)}
        onClose={() => !saving && setViewBlock(null)}
        title="Ngày đang khóa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setViewBlock(null)} disabled={saving}>
              Đóng
            </Button>
            <Button variant="outline" icon={LockOpen} onClick={handleUnblock} loading={saving}>
              Mở khóa
            </Button>
          </>
        }
      >
        {viewBlock && (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Phòng</dt>
              <dd className="text-right font-medium">{roomTitle(viewBlock.roomId)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Thời gian</dt>
              <dd className="font-medium">
                {formatDate(viewBlock.from)} – {formatDate(viewBlock.to)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Lý do</dt>
              <dd className="text-right">{viewBlock.reason || 'Không ghi lý do'}</dd>
            </div>
          </dl>
        )}
      </Modal>

      <Modal
        open={Boolean(viewBooking)}
        onClose={() => setViewBooking(null)}
        title={`Đơn ${viewBooking?.code || ''}`}
        size="sm"
        footer={
          <Link to="/owner/bookings" className="btn btn-primary">
            Đến trang quản lý đơn
          </Link>
        }
      >
        {viewBooking && (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Trạng thái</dt>
              <dd>
                <StatusPill status={viewBooking.status}>{bookingStatusLabel(viewBooking.status)}</StatusPill>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Khách</dt>
              <dd className="font-medium">{viewBooking.contactName || viewBooking.customer?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Lưu trú</dt>
              <dd className="font-medium">
                {formatDate(viewBooking.checkIn)} – {formatDate(viewBooking.checkOut)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Số đêm, số khách</dt>
              <dd>
                {viewBooking.nights} đêm · {viewBooking.guests} khách
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Tổng tiền</dt>
              <dd className="font-semibold text-primary">{formatPrice(viewBooking.totalPrice)}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </div>
  );
}
