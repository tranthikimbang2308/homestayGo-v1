import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { ArrowLeft, CalendarDays, Check, Clock, CreditCard, MapPin, Phone, ReceiptText, StickyNote, Users, XCircle } from 'lucide-react';
import client, { getErrorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/BookingStatusBadge.jsx';
import Avatar from '../../components/Avatar.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Button from '../../components/ui/Button.jsx';
import RatingStars from '../../components/ui/RatingStars.jsx';
import { FALLBACK_IMAGE, PAYMENT_METHODS } from '../../utils/constants.js';
import { formatDate, formatDateTime, formatPrice } from '../../utils/format.js';
import MessageButton from '../../components/MessageButton.jsx';
import InvoiceLink from '../../components/booking/InvoiceLink.jsx';

const FLOW = [
  { key: 'pending', label: 'Đã gửi yêu cầu' },
  { key: 'confirmed', label: 'Chủ phòng xác nhận' },
  { key: 'checked_in', label: 'Nhận phòng' },
  { key: 'completed', label: 'Hoàn thành' },
];

const RATING_HINTS = ['', 'Rất tệ', 'Chưa hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời'];

function StatusTimeline({ status }) {
  if (status === 'cancelled' || status === 'rejected') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
        <XCircle className="h-5 w-5 shrink-0" />
        {status === 'cancelled' ? 'Đơn đặt phòng đã bị hủy.' : 'Chủ phòng đã từ chối đơn đặt phòng này.'}
      </div>
    );
  }
  const currentIndex = FLOW.findIndex((step) => step.key === status);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {FLOW.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <li key={step.key} className="relative flex flex-col items-center text-center">
            {index > 0 && (
              <span className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${index <= currentIndex ? 'bg-primary' : 'bg-line'}`} />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                done ? 'border-primary bg-primary text-white' : 'border-line bg-white text-muted'
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className={`mt-2 text-xs ${done ? 'font-medium text-ink' : 'text-muted'}`}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ReviewForm({ bookingId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!rating) {
      toast.error('Chọn số sao đánh giá');
      return;
    }
    if (comment.trim().length < 10) {
      toast.error('Nhận xét tối thiểu 10 ký tự');
      return;
    }
    setSubmitting(true);
    try {
      await client.post('/reviews', { bookingId, rating, comment: comment.trim() });
      toast.success('Cảm ơn bạn đã gửi đánh giá');
      onDone?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gửi đánh giá thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card border-primary/30 p-5 sm:p-6">
      <h2 className="font-serif text-xl font-semibold">Chuyến đi thế nào?</h2>
      <p className="mt-1 text-sm text-muted">Đánh giá của bạn giúp những vị khách sau chọn phòng dễ hơn.</p>
      <div className="mt-4 flex items-center gap-3">
        <RatingStars value={rating} size="xl" onChange={setRating} />
        <span className="text-sm font-medium text-accent">{RATING_HINTS[rating]}</span>
      </div>
      <Textarea
        containerClassName="mt-4"
        rows={4}
        placeholder="Phòng có sạch sẽ không, chủ nhà có thân thiện không, vị trí có thuận tiện không..."
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <div className="mt-4 flex justify-end">
        <Button type="submit" loading={submitting}>
          Gửi đánh giá
        </Button>
      </div>
    </form>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);

  const load = () => {
    setLoading(true);
    client
      .get(`/bookings/${id}`)
      .then((res) => setBooking(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'Không tìm thấy đơn đặt phòng')))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Nhập lý do hủy đơn');
      return;
    }
    setCancelling(true);
    try {
      const res = await client.patch(`/bookings/${id}/cancel`, { reason: cancelReason.trim() });
      setBooking((prev) => ({ ...prev, ...(res.data.data || {}), room: prev.room, customer: prev.customer, owner: prev.owner, status: res.data.data?.status || 'cancelled' }));
      toast.success('Đã hủy đơn đặt phòng');
      setCancelOpen(false);
      setCancelReason('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Hủy đơn thất bại'));
    } finally {
      setCancelling(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await client.post(`/bookings/${id}/pay`);
      const url = res.data.data?.paymentUrl;
      if (!url) throw new Error('missing paymentUrl');
      window.location.href = url;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không tạo được liên kết thanh toán'));
      setPaying(false);
    }
  };

  if (loading && !booking) return <Spinner fullPage label="Đang tải đơn đặt phòng..." />;

  if (error || !booking) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ReceiptText}
          title="Không tìm thấy đơn"
          description={error}
          action={
            <Link to="/account/bookings" className="btn btn-primary">
              Về danh sách đơn
            </Link>
          }
        />
      </div>
    );
  }

  const room = booking.room || {};
  const owner = booking.owner || room.owner || {};
  const isCustomer = user?.role === 'customer' && (booking.customer?._id || booking.customer) === user._id;
  const canCancel = isCustomer && ['pending', 'confirmed'].includes(booking.status) && dayjs(booking.checkIn).isAfter(dayjs(), 'day');
  const canPay = isCustomer && booking.paymentMethod === 'vnpay' && booking.paymentStatus === 'unpaid' && ['pending', 'confirmed'].includes(booking.status);
  const canReview = isCustomer && booking.status === 'completed' && !booking.isReviewed;
  const roomTotal = booking.subtotal ?? (booking.pricePerNight || 0) * (booking.nights || 0);
  const sameRateAllNights = roomTotal === (booking.pricePerNight || 0) * (booking.nights || 0);

  return (
    <div className="container-page py-8">
      <Link to="/account/bookings" className="flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Đơn đặt phòng của tôi
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Mã đơn</p>
          <h1 className="font-serif text-3xl font-semibold tracking-wide">{booking.code}</h1>
          <p className="mt-1 text-sm text-muted">Đặt lúc {formatDateTime(booking.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BookingStatusBadge status={booking.status} />
          <PaymentStatusBadge status={booking.paymentStatus} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card p-5 sm:p-6">
            <StatusTimeline status={booking.status} />
            {booking.cancelReason && (
              <p className="mt-4 text-sm text-muted">
                <span className="font-medium text-ink">Lý do: </span>
                {booking.cancelReason}
              </p>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <img src={room.images?.[0] || FALLBACK_IMAGE} alt={room.title} className="h-48 w-full object-cover sm:h-auto sm:w-56" />
              <div className="flex-1 p-5">
                <Link to={`/rooms/${room.slug || room._id}`} className="font-serif text-xl font-semibold hover:text-primary">
                  {room.title}
                </Link>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {[room.address, room.district, room.city].filter(Boolean).join(', ')}
                </p>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span>
                      <span className="block text-xs text-muted">Nhận phòng</span>
                      {formatDate(booking.checkIn)} {room.checkInTime ? `từ ${room.checkInTime}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>
                      <span className="block text-xs text-muted">Trả phòng</span>
                      {formatDate(booking.checkOut)} {room.checkOutTime ? `trước ${room.checkOutTime}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>
                      {booking.guests} khách · {booking.nights} đêm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>{PAYMENT_METHODS[booking.paymentMethod]?.label}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="card p-5">
              <h3 className="font-sans text-sm font-semibold">Người nhận phòng</h3>
              <p className="mt-3 font-medium">{booking.contactName}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <Phone className="h-4 w-4" /> {booking.contactPhone}
              </p>
              {booking.note && (
                <p className="mt-3 flex items-start gap-1.5 border-t border-dashed border-line pt-3 text-sm text-muted">
                  <StickyNote className="mt-0.5 h-4 w-4 shrink-0" /> {booking.note}
                </p>
              )}
            </div>
            <div className="card p-5">
              <h3 className="font-sans text-sm font-semibold">Chủ phòng</h3>
              <div className="mt-3 flex items-center gap-3">
                <Avatar src={owner.avatar} name={owner.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{owner.name || 'Chủ phòng'}</p>
                  {owner.phone && (
                    <a href={`tel:${owner.phone}`} className="text-sm text-primary hover:underline">
                      {owner.phone}
                    </a>
                  )}
                  {owner.email && <p className="truncate text-xs text-muted">{owner.email}</p>}
                </div>
              </div>
            </div>
          </div>

          {canReview && <ReviewForm bookingId={booking._id} onDone={() => setBooking((prev) => ({ ...prev, isReviewed: true }))} />}
          {isCustomer && booking.status === 'completed' && booking.isReviewed && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-success">Bạn đã đánh giá chuyến đi này. Cảm ơn bạn.</div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card card-shadow p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">Hóa đơn</h2>
              <span className="text-xs tracking-wider text-muted">{booking.code}</span>
            </div>
            <div className="rule-dashed my-4" />
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">
                  {sameRateAllNights
                    ? `${formatPrice(booking.pricePerNight)} x ${booking.nights} đêm`
                    : `Tiền phòng ${booking.nights} đêm (gồm giá cuối tuần)`}
                </span>
                <span>{formatPrice(roomTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phí dọn dẹp</span>
                <span>{formatPrice(booking.cleaningFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phí dịch vụ</span>
                <span>{formatPrice(booking.serviceFee)}</span>
              </div>
              {booking.discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Giảm giá{booking.couponCode ? ` (${booking.couponCode})` : ''}</span>
                  <span>-{formatPrice(booking.discount)}</span>
                </div>
              )}
            </div>
            <div className="rule-dashed my-4" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Tổng cộng</span>
              <span className="font-serif text-2xl font-semibold text-accent">{formatPrice(booking.totalPrice)}</span>
            </div>
            {booking.paidAt && <p className="mt-2 text-right text-xs text-muted">Thanh toán lúc {formatDateTime(booking.paidAt)}</p>}

            <div className="mt-6 space-y-2">
              <InvoiceLink booking={booking} className="w-full" />
              <MessageButton recipientId={booking.owner?._id || booking.owner} roomId={booking.room?._id} bookingId={booking._id} label="Nhắn tin cho chủ phòng" fullWidth />
            </div>
            {(canPay || canCancel) && (
              <div className="mt-2 space-y-2">
                {canPay && (
                  <Button variant="accent" fullWidth loading={paying} onClick={handlePay} icon={CreditCard}>
                    Thanh toán lại qua VNPay
                  </Button>
                )}
                {canCancel && (
                  <Button variant="outline" fullWidth onClick={() => setCancelOpen(true)} className="hover:border-danger hover:text-danger">
                    Hủy đặt phòng
                  </Button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Hủy đặt phòng"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Giữ đơn
            </Button>
            <Button variant="danger" loading={cancelling} onClick={handleCancel}>
              Xác nhận hủy
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Bạn sắp hủy đơn <span className="font-semibold text-ink">{booking.code}</span>.
          {booking.paymentStatus === 'paid' && ' Số tiền đã thanh toán sẽ được hoàn lại.'}
        </p>
        <Textarea
          label="Lý do hủy"
          containerClassName="mt-4"
          rows={3}
          placeholder="Thay đổi lịch trình, đặt nhầm ngày..."
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
        />
      </Modal>
    </div>
  );
}
