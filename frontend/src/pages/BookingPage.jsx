import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Banknote, CalendarDays, CreditCard, DoorOpen, Loader2, MapPin, Minus, Plus, ShieldCheck, Star } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input from '../components/ui/Input.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Button from '../components/ui/Button.jsx';
import DateRangeCalendar, { buildBlockedNights, rangeHasBlocked } from '../components/DateRangeCalendar.jsx';
import { FALLBACK_IMAGE, ROOM_TYPE_LABELS } from '../utils/constants.js';
import { calcNights, formatDate, formatPrice } from '../utils/format.js';
import PriceBreakdown from '../components/booking/PriceBreakdown.jsx';
import CouponInput from '../components/booking/CouponInput.jsx';
import { mergeUnavailable, useBookingQuote } from '../components/booking/bookingUtils.js';

const PAYMENT_OPTIONS = [
  {
    key: 'vnpay',
    title: 'Thanh toán qua VNPay',
    text: 'Thẻ ATM nội địa, thẻ quốc tế hoặc QR ngân hàng. Đơn được ghi nhận đã thanh toán ngay.',
    icon: CreditCard,
  },
  {
    key: 'cash',
    title: 'Thanh toán tại homestay',
    text: 'Trả tiền mặt hoặc chuyển khoản cho chủ phòng khi nhận phòng.',
    icon: Banknote,
  },
];

export default function BookingPage() {
  const { roomId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateModal, setDateModal] = useState(false);
  const [draftDates, setDraftDates] = useState({ checkIn: '', checkOut: '' });
  const [form, setForm] = useState({ contactName: user?.name || '', contactPhone: user?.phone || '', note: '', paymentMethod: 'vnpay' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const checkIn = params.get('checkIn') || '';
  const checkOut = params.get('checkOut') || '';
  const guests = Math.max(1, Number(params.get('guests')) || 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([client.get(`/rooms/${roomId}`), client.get(`/rooms/${roomId}/booked-dates`).catch(() => ({ data: { data: [] } }))])
      .then(([roomRes, datesRes]) => {
        if (cancelled) return;
        setRoom(roomRes.data.data);
        setBookedDates(datesRes.data.data || []);
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Không tìm thấy phòng')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const blocked = useMemo(() => buildBlockedNights(mergeUnavailable(bookedDates, room?.blockedDates)), [bookedDates, room]);
  const nights = calcNights(checkIn, checkOut);
  const minNights = Math.max(1, Number(room?.minNights) || 1);
  const conflict = checkIn && checkOut && rangeHasBlocked(checkIn, checkOut, blocked);
  const { quote, loading: quoting } = useBookingQuote({ roomId: room?._id, checkIn, checkOut, guests, couponCode });
  const couponError = couponCode && quote?.couponError ? quote.couponError : '';
  const unavailableMessage = quote && quote.available === false ? quote.message : '';

  const updateParams = (updates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setParams(next, { replace: true });
  };

  const validate = () => {
    const next = {};
    if (!form.contactName.trim()) next.contactName = 'Nhập tên người liên hệ';
    if (!form.contactPhone.trim()) next.contactPhone = 'Nhập số điện thoại';
    else if (!/^(0|\+84)\d{9,10}$/.test(form.contactPhone.replace(/\s/g, ''))) next.contactPhone = 'Số điện thoại không hợp lệ';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!nights) {
      toast.error('Chọn ngày nhận và trả phòng');
      setDraftDates({ checkIn, checkOut });
      setDateModal(true);
      return;
    }
    if (conflict) {
      toast.error('Khoảng ngày này đã kín lịch, vui lòng chọn ngày khác');
      return;
    }
    if (unavailableMessage) {
      toast.error(unavailableMessage);
      return;
    }
    if (couponError) {
      toast.error(couponError);
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await client.post('/bookings', {
        roomId: room._id,
        checkIn,
        checkOut,
        guests,
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.replace(/\s/g, ''),
        note: form.note.trim(),
        paymentMethod: form.paymentMethod,
        couponCode: couponCode || undefined,
      });
      const data = res.data.data || {};
      const booking = data.booking || data;
      if (form.paymentMethod === 'vnpay' && data.paymentUrl) {
        toast.success('Đang chuyển sang cổng thanh toán VNPay...');
        window.location.href = data.paymentUrl;
        return;
      }
      toast.success('Đặt phòng thành công');
      navigate(`/account/bookings/${booking._id}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Đặt phòng thất bại'));
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner fullPage label="Đang chuẩn bị đơn đặt phòng..." />;

  if (error || !room) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={DoorOpen}
          title="Không thể đặt phòng này"
          description={error}
          action={
            <Link to="/rooms" className="btn btn-primary">
              Tìm phòng khác
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <Link to={`/rooms/${room.slug || room._id}`} className="flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Quay lại trang phòng
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-semibold">Xác nhận và thanh toán</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]" noValidate>
        <div className="space-y-8">
          <section>
            <h2 className="font-serif text-xl font-semibold">Chuyến đi của bạn</h2>
            <div className="card mt-4 divide-y divide-line">
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium">Ngày lưu trú</p>
                  <p className="text-sm text-muted">
                    {nights > 0 ? `${formatDate(checkIn)} - ${formatDate(checkOut)} (${nights} đêm)` : 'Chưa chọn ngày'}
                  </p>
                  {conflict ? (
                    <p className="mt-1 text-xs text-danger">Khoảng ngày này đã kín lịch</p>
                  ) : (
                    unavailableMessage && <p className="mt-1 text-xs text-danger">{unavailableMessage}</p>
                  )}
                  {minNights > 1 && <p className="mt-1 text-xs text-muted">Phòng yêu cầu đặt tối thiểu {minNights} đêm</p>}
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setDraftDates({ checkIn, checkOut });
                    setDateModal(true);
                  }}
                >
                  <CalendarDays className="h-4 w-4" /> {nights > 0 ? 'Đổi ngày' : 'Chọn ngày'}
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium">Số khách</p>
                  <p className="text-sm text-muted">
                    {guests} khách (tối đa {room.maxGuests})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateParams({ guests: String(Math.max(1, guests - 1)) })}
                    disabled={guests <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line hover:border-ink disabled:opacity-30"
                    aria-label="Giảm số khách"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{guests}</span>
                  <button
                    type="button"
                    onClick={() => updateParams({ guests: String(Math.min(room.maxGuests || 1, guests + 1)) })}
                    disabled={guests >= (room.maxGuests || 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line hover:border-ink disabled:opacity-30"
                    aria-label="Tăng số khách"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold">Thông tin liên hệ</h2>
            <p className="mt-1 text-sm text-muted">Chủ phòng sẽ dùng thông tin này để liên lạc trước ngày nhận phòng.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Họ tên người nhận phòng"
                value={form.contactName}
                error={errors.contactName}
                onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
              />
              <Input
                label="Số điện thoại"
                value={form.contactPhone}
                error={errors.contactPhone}
                placeholder="0901234567"
                onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
              />
              <Textarea
                label="Ghi chú cho chủ phòng"
                containerClassName="sm:col-span-2"
                rows={3}
                placeholder="Giờ đến dự kiến, yêu cầu đặc biệt..."
                value={form.note}
                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              />
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold">Phương thức thanh toán</h2>
            <div className="mt-4 space-y-3" role="radiogroup">
              {PAYMENT_OPTIONS.map(({ key, title, text, icon: Icon }) => {
                const active = form.paymentMethod === key;
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors ${
                      active ? 'border-primary bg-primary-light/60' : 'border-line bg-white hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={key}
                      checked={active}
                      onChange={() => setForm((prev) => ({ ...prev, paymentMethod: key }))}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${active ? 'text-primary' : 'text-muted'}`} />
                    <span>
                      <span className="block text-sm font-semibold">{title}</span>
                      <span className="block text-sm text-muted">{text}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <p className="flex items-start gap-2 text-xs text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Bạn có thể hủy miễn phí khi đơn đang chờ xác nhận hoặc đã xác nhận và chưa đến ngày nhận phòng. Đơn đã thanh toán qua VNPay sẽ được hoàn tiền.
          </p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card card-shadow p-5 sm:p-6">
            <div className="flex gap-4">
              <img
                src={room.images?.[0] || FALLBACK_IMAGE}
                alt={room.title}
                className="h-24 w-28 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted">{ROOM_TYPE_LABELS[room.roomType]}</p>
                <p className="line-clamp-2 font-semibold leading-snug">{room.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5" /> {room.city}
                </p>
                {room.ratingCount > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {Number(room.ratingAvg).toFixed(1)} ({room.ratingCount})
                  </p>
                )}
              </div>
            </div>
            <div className="rule-dashed my-5" />
            <h3 className="font-sans text-sm font-semibold">Chi tiết giá</h3>
            {nights > 0 && quote && quote.nights > 0 ? (
              <PriceBreakdown quote={quote} className={`mt-3 ${quoting ? 'opacity-60' : ''}`} />
            ) : nights > 0 && quoting ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tính giá...
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted">Chọn ngày lưu trú để xem tổng tiền.</p>
            )}
            <div className="rule-dashed my-5" />
            <h3 className="text-sm font-semibold">Mã giảm giá</h3>
            <div className="mt-3">
              <CouponInput
                roomId={room._id}
                subtotal={quote?.subtotal || 0}
                appliedCode={couponCode}
                coupon={quote?.coupon}
                discount={quote?.discount || 0}
                error={couponError}
                onApply={(code) => setCouponCode(code)}
                onRemove={() => setCouponCode('')}
              />
            </div>
            <Button type="submit" variant="accent" size="lg" fullWidth loading={submitting} className="mt-6" disabled={Boolean(conflict || unavailableMessage)}>
              {form.paymentMethod === 'vnpay' ? 'Thanh toán qua VNPay' : 'Xác nhận đặt phòng'}
            </Button>
          </div>
        </aside>
      </form>

      <Modal
        open={dateModal}
        onClose={() => setDateModal(false)}
        title="Chọn ngày lưu trú"
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDraftDates({ checkIn: '', checkOut: '' })}>
              Xóa ngày
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!draftDates.checkIn || !draftDates.checkOut}
              onClick={() => {
                updateParams({ checkIn: draftDates.checkIn, checkOut: draftDates.checkOut });
                setDateModal(false);
              }}
            >
              Lưu ngày
            </button>
          </>
        }
      >
        <DateRangeCalendar checkIn={draftDates.checkIn} checkOut={draftDates.checkOut} onChange={setDraftDates} blocked={blocked} minNights={minNights} />
      </Modal>
    </div>
  );
}
