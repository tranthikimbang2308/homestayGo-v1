import { CalendarDays, Users, Phone, Mail, MapPin, CreditCard, StickyNote } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { formatPrice, formatDate, formatDateTime } from '../../utils/format';
import { StatusPill, bookingStatusLabel, paymentStatusLabel, coverImage } from './dashboardShared';

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className={strong ? 'font-semibold text-accent' : 'text-ink'}>{value}</span>
    </div>
  );
}

export default function BookingDetailModal({ booking, open, onClose, footer }) {
  if (!booking) return null;
  const room = booking.room || {};
  const customer = booking.customer || {};
  const roomCost = booking.subtotal ?? (booking.pricePerNight || 0) * (booking.nights || 0);
  const sameRateAllNights = roomCost === (booking.pricePerNight || 0) * (booking.nights || 0);

  return (
    <Modal open={open} onClose={onClose} title={`Đơn ${booking.code || ''}`} size="lg" footer={footer}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={booking.status}>{bookingStatusLabel(booking.status)}</StatusPill>
          <StatusPill status={booking.paymentStatus}>{paymentStatusLabel(booking.paymentStatus)}</StatusPill>
          <span className="text-xs text-muted">Tạo lúc {formatDateTime(booking.createdAt)}</span>
        </div>

        <div className="flex gap-4 rounded-xl border border-line p-3">
          {coverImage(room) ? (
            <img src={coverImage(room)} alt={room.title} className="h-20 w-28 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="h-20 w-28 shrink-0 rounded-lg bg-sand" />
          )}
          <div className="min-w-0">
            <p className="font-serif text-base font-semibold text-ink">{room.title || 'Phòng đã bị xóa'}</p>
            {(room.address || room.city) && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <MapPin className="h-3.5 w-3.5" />
                {[room.address, room.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Lưu trú</p>
            <p className="flex items-center gap-2 text-sm text-ink">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-ink">
              <Users className="h-4 w-4 text-primary" />
              {booking.guests} khách · {booking.nights} đêm
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-ink">
              <CreditCard className="h-4 w-4 text-primary" />
              {booking.paymentMethod === 'vnpay' ? 'Thanh toán VNPay' : 'Thanh toán tại homestay'}
            </p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Người đặt</p>
            <p className="text-sm font-medium text-ink">{booking.contactName || customer.name}</p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-ink">
              <Phone className="h-4 w-4 text-primary" />
              {booking.contactPhone || customer.phone || 'Chưa cung cấp'}
            </p>
            {customer.email && (
              <p className="mt-1.5 flex items-center gap-2 break-all text-sm text-ink">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                {customer.email}
              </p>
            )}
          </div>
        </div>

        {booking.note && (
          <div className="flex gap-2 rounded-xl bg-sand p-4 text-sm text-ink">
            <StickyNote className="h-4 w-4 shrink-0 text-muted" />
            <p>{booking.note}</p>
          </div>
        )}

        {booking.cancelReason && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="font-medium">Lý do: </span>
            {booking.cancelReason}
          </div>
        )}

        <div className="rounded-xl border border-line p-4">
          <Row
            label={sameRateAllNights ? `${formatPrice(booking.pricePerNight)} × ${booking.nights} đêm` : `Tiền phòng ${booking.nights} đêm (gồm giá cuối tuần)`}
            value={formatPrice(roomCost)}
          />
          <Row label="Phí dọn dẹp" value={formatPrice(booking.cleaningFee || 0)} />
          <Row label="Phí dịch vụ" value={formatPrice(booking.serviceFee || 0)} />
          {booking.discount > 0 && (
            <Row label={`Giảm giá${booking.couponCode ? ` (${booking.couponCode})` : ''}`} value={`-${formatPrice(booking.discount)}`} />
          )}
          <div className="my-2 border-t border-line" />
          <Row label="Tổng cộng" value={formatPrice(booking.totalPrice)} strong />
          {booking.paidAt && <Row label="Thanh toán lúc" value={formatDateTime(booking.paidAt)} />}
        </div>
      </div>
    </Modal>
  );
}
