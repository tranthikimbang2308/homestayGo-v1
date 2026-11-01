import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarClock, Loader2, Minus, Plus, Star, TicketPercent } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import DateRangeCalendar, { buildBlockedNights, rangeHasBlocked } from '../DateRangeCalendar.jsx';
import PriceBreakdown from './PriceBreakdown.jsx';
import { mergeUnavailable, useBookingQuote } from './bookingUtils.js';
import { ROOM_STATUS } from '../../utils/constants.js';
import { calcNights, formatDate, formatPrice } from '../../utils/format.js';

export default function BookingBox({ room, bookedDates }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' });
  const [guests, setGuests] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const boxRef = useRef(null);
  const unavailable = useMemo(() => mergeUnavailable(bookedDates, room.blockedDates), [bookedDates, room.blockedDates]);
  const blocked = useMemo(() => buildBlockedNights(unavailable), [unavailable]);
  const nights = calcNights(dates.checkIn, dates.checkOut);
  const minNights = Math.max(1, Number(room.minNights) || 1);
  const weekendPrice = Number(room.weekendPrice) || 0;
  const isOwnerOrAdmin = user && user.role !== 'customer';
  const notBookable = room.status && room.status !== 'approved';
  const { quote, loading: quoting, error: quoteError } = useBookingQuote({
    roomId: notBookable ? null : room._id,
    checkIn: dates.checkIn,
    checkOut: dates.checkOut,
    guests,
  });

  useEffect(() => {
    const handleClick = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setCalendarOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleDates = (next) => {
    setDates(next);
    if (next.checkIn && next.checkOut) setCalendarOpen(false);
  };

  const handleBook = () => {
    if (!dates.checkIn || !dates.checkOut) {
      toast.error('Chọn ngày nhận và trả phòng');
      setCalendarOpen(true);
      return;
    }
    if (nights < minNights) {
      toast.error(`Phòng yêu cầu đặt tối thiểu ${minNights} đêm`);
      return;
    }
    if (rangeHasBlocked(dates.checkIn, dates.checkOut, blocked)) {
      toast.error('Khoảng ngày này đã kín lịch');
      return;
    }
    if (quote && quote.available === false) {
      toast.error(quote.message || 'Không thể đặt phòng trong khoảng ngày này');
      return;
    }
    const query = new URLSearchParams({ checkIn: dates.checkIn, checkOut: dates.checkOut, guests: String(guests) }).toString();
    const target = `/booking/${room._id}?${query}`;
    if (!isAuthenticated) {
      toast('Đăng nhập để tiếp tục đặt phòng');
      navigate(`/login?redirect=${encodeURIComponent(target)}`);
      return;
    }
    navigate(target);
  };

  const unavailableMessage = quote && quote.available === false ? quote.message : quoteError;

  return (
    <div ref={boxRef} className="card card-shadow relative p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <p>
          <span className="text-2xl font-semibold text-primary">{formatPrice(room.pricePerNight)}</span>
          <span className="text-sm text-muted"> / đêm</span>
        </p>
        {room.ratingCount > 0 && (
          <span className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="font-semibold">{Number(room.ratingAvg).toFixed(1)}</span>
            <span className="text-muted">({room.ratingCount})</span>
          </span>
        )}
      </div>
      {(weekendPrice > 0 && weekendPrice !== room.pricePerNight) || minNights > 1 ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {weekendPrice > 0 && weekendPrice !== room.pricePerNight && (
            <span>
              Thứ 6, thứ 7: <span className="font-medium text-ink">{formatPrice(weekendPrice)}</span> / đêm
            </span>
          )}
          {minNights > 1 && (
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" /> Tối thiểu {minNights} đêm
            </span>
          )}
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-lg border border-line">
        <button type="button" onClick={() => setCalendarOpen((prev) => !prev)} className="grid w-full grid-cols-2 text-left">
          <span className="border-r border-line px-3 py-2.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">Nhận phòng</span>
            <span className={`text-sm ${dates.checkIn ? 'font-medium' : 'text-muted'}`}>{dates.checkIn ? formatDate(dates.checkIn) : 'Chọn ngày'}</span>
          </span>
          <span className="px-3 py-2.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">Trả phòng</span>
            <span className={`text-sm ${dates.checkOut ? 'font-medium' : 'text-muted'}`}>{dates.checkOut ? formatDate(dates.checkOut) : 'Chọn ngày'}</span>
          </span>
        </button>
        <div className="flex items-center justify-between border-t border-line px-3 py-2.5">
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">Số khách</span>
            <span className="text-sm font-medium">{guests} khách</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGuests((prev) => Math.max(1, prev - 1))}
              disabled={guests <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line hover:border-ink disabled:opacity-30"
              aria-label="Giảm số khách"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setGuests((prev) => Math.min(room.maxGuests || 1, prev + 1))}
              disabled={guests >= (room.maxGuests || 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line hover:border-ink disabled:opacity-30"
              aria-label="Tăng số khách"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-xs text-muted">Tối đa {room.maxGuests} khách</p>

      {calendarOpen && (
        <div className="card card-shadow absolute left-0 right-0 top-[150px] z-30 p-4 lg:left-auto lg:right-0 lg:w-[620px]">
          <DateRangeCalendar
            checkIn={dates.checkIn}
            checkOut={dates.checkOut}
            onChange={handleDates}
            blocked={blocked}
            minNights={minNights}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDates({ checkIn: '', checkOut: '' })}>
              Xóa ngày
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setCalendarOpen(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}

      {notBookable ? (
        <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-warning">
          Phòng đang ở trạng thái "{ROOM_STATUS[room.status]?.label}", chưa nhận đặt phòng.
        </div>
      ) : isOwnerOrAdmin ? (
        <div className="mt-5 rounded-lg bg-sand px-4 py-3 text-sm text-muted">Chỉ tài khoản khách hàng mới có thể đặt phòng.</div>
      ) : (
        <button
          type="button"
          onClick={handleBook}
          disabled={Boolean(quote && quote.available === false)}
          className="btn btn-primary btn-lg mt-5 w-full"
        >
          {nights > 0 ? 'Đặt phòng' : 'Chọn ngày để đặt phòng'}
        </button>
      )}

      {nights > 0 && unavailableMessage && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-danger">{unavailableMessage}</p>}

      {nights > 0 && quoting && !quote && (
        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tính giá...
        </p>
      )}
      {nights > 0 && quote && quote.nights > 0 && <PriceBreakdown quote={quote} className={`mt-5 ${quoting ? 'opacity-60' : ''}`} />}

      <p className="mt-4 text-center text-xs text-muted">Bạn chưa bị trừ tiền ở bước này</p>
      {!notBookable && !isOwnerOrAdmin && (
        <Link to="/promotions" className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline">
          <TicketPercent className="h-3.5 w-3.5" /> Xem mã giảm giá đang có
        </Link>
      )}
    </div>
  );
}
