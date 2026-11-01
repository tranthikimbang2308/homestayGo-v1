import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileX, Printer } from 'lucide-react';
import client, { getErrorMessage } from '../../api/client.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Logo from '../../components/Logo.jsx';
import { BOOKING_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '../../utils/constants.js';
import { formatDate, formatDateTime, formatPrice } from '../../utils/format.js';
import { bookingSubtotal, isCancelledStatus } from '../../components/booking/bookingUtils.js';

const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 14mm; }
  body { background: #fff !important; }
  body * { visibility: hidden !important; }
  .invoice-sheet, .invoice-sheet * { visibility: visible !important; }
  .invoice-sheet { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; padding: 0 !important; }
  .invoice-no-print { display: none !important; }
}
`;

const DEFAULT_COMPANY = {
  siteName: 'HomestayGo',
  hotline: '1900 6868',
  email: 'hotro@homestaygo.vn',
  address: '12 Nguyễn Văn Bảo, Gò Vấp, TP. Hồ Chí Minh',
};

function InfoBlock({ title, lines }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
      <div className="mt-2 space-y-0.5 text-sm">
        {lines.filter(Boolean).map((line, index) => (
          <p key={index} className={index === 0 ? 'font-semibold text-ink' : 'text-muted'}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function InvoicePage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    client
      .get(`/bookings/${id}`)
      .then((res) => !ignore && setBooking(res.data.data))
      .catch((err) => !ignore && setError(getErrorMessage(err, 'Không tìm thấy đơn đặt phòng')))
      .finally(() => !ignore && setLoading(false));
    client
      .get('/settings')
      .then((res) => !ignore && res.data?.data && setCompany({ ...DEFAULT_COMPANY, ...res.data.data }))
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) return <Spinner fullPage label="Đang tải hóa đơn..." />;

  if (error || !booking) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={FileX} title="Không xem được hóa đơn" description={error} action={<Link to="/account/bookings" className="btn btn-primary">Về đơn của tôi</Link>} />
      </div>
    );
  }

  if (isCancelledStatus(booking.status)) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={FileX}
          title="Đơn không có hóa đơn"
          description="Đơn đặt phòng đã bị hủy hoặc bị từ chối nên không xuất hóa đơn."
          action={<Link to={`/account/bookings/${booking._id}`} className="btn btn-primary">Xem chi tiết đơn</Link>}
        />
      </div>
    );
  }

  const room = booking.room || {};
  const owner = booking.owner || {};
  const customer = booking.customer || {};
  const subtotal = bookingSubtotal(booking);
  const sameRate = subtotal === (booking.pricePerNight || 0) * (booking.nights || 0);
  const paid = booking.paymentStatus === 'paid';
  const lines = [
    {
      label: room.title || 'Tiền phòng',
      detail: sameRate
        ? `${formatPrice(booking.pricePerNight)} x ${booking.nights} đêm`
        : `${booking.nights} đêm, đã gồm giá cuối tuần (thứ 6, thứ 7)`,
      amount: subtotal,
    },
    { label: 'Phí dọn dẹp', detail: 'Tính một lần cho mỗi đơn', amount: booking.cleaningFee || 0 },
    { label: 'Phí dịch vụ', detail: 'Phí nền tảng HomestayGo', amount: booking.serviceFee || 0 },
  ];

  return (
    <div className="bg-white py-8 sm:py-10">
      <style>{PRINT_CSS}</style>
      <div className="container-page max-w-3xl">
        <div className="invoice-no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to={`/account/bookings/${booking._id}`} className="flex items-center gap-1.5 text-sm text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Quay lại chi tiết đơn
          </Link>
          <button type="button" onClick={() => window.print()} className="btn btn-primary">
            <Printer className="h-4 w-4" /> In hóa đơn
          </button>
        </div>

        <article className="invoice-sheet rounded-xl border border-line bg-white p-6 sm:p-10">
          <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Logo />
              <div className="mt-3 space-y-0.5 text-xs text-muted">
                <p>{company.address}</p>
                <p>
                  Hotline {company.hotline} · {company.email}
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <h1 className="text-2xl font-semibold text-ink">Hóa đơn đặt phòng</h1>
              <p className="mt-1 text-sm text-muted">
                Số: <span className="font-medium text-ink">{booking.code}</span>
              </p>
              <p className="text-sm text-muted">Ngày lập: {formatDate(booking.createdAt)}</p>
              <p className={`mt-2 inline-block rounded-full border px-3 py-0.5 text-xs font-medium ${paid ? 'border-primary/30 text-primary' : 'border-line text-muted'}`}>
                {PAYMENT_STATUS[booking.paymentStatus]?.label || booking.paymentStatus}
              </p>
            </div>
          </header>

          <section className="grid gap-6 border-b border-line py-6 sm:grid-cols-2">
            <InfoBlock
              title="Khách hàng"
              lines={[booking.contactName || customer.name, booking.contactPhone || customer.phone, customer.email]}
            />
            <InfoBlock title="Chủ phòng" lines={[owner.name, owner.phone, owner.email]} />
          </section>

          <section className="grid gap-4 border-b border-line py-6 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted">Nhận phòng</p>
              <p className="font-medium">{formatDate(booking.checkIn)}</p>
              <p className="text-xs text-muted">Từ {room.checkInTime || '14:00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Trả phòng</p>
              <p className="font-medium">{formatDate(booking.checkOut)}</p>
              <p className="text-xs text-muted">Trước {room.checkOutTime || '12:00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Số khách</p>
              <p className="font-medium">{booking.guests} khách</p>
            </div>
            <div>
              <p className="text-xs text-muted">Trạng thái đơn</p>
              <p className="font-medium">{BOOKING_STATUS[booking.status]?.label || booking.status}</p>
            </div>
            {room.address && (
              <div className="sm:col-span-4">
                <p className="text-xs text-muted">Địa chỉ lưu trú</p>
                <p className="font-medium">
                  {room.address}
                  {room.city ? `, ${room.city}` : ''}
                </p>
              </div>
            )}
          </section>

          <section className="py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="pb-2 font-semibold">Khoản mục</th>
                  <th className="pb-2 text-right font-semibold">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {lines.map((line) => (
                  <tr key={line.label}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink">{line.label}</p>
                      <p className="text-xs text-muted">{line.detail}</p>
                    </td>
                    <td className="py-3 text-right align-top">{formatPrice(line.amount)}</td>
                  </tr>
                ))}
                {booking.discount > 0 && (
                  <tr>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-primary">Giảm giá</p>
                      <p className="text-xs text-muted">Mã {booking.couponCode}</p>
                    </td>
                    <td className="py-3 text-right align-top text-primary">-{formatPrice(booking.discount)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink">
                  <td className="pt-4 text-base font-semibold">Tổng thanh toán</td>
                  <td className="pt-4 text-right text-xl font-semibold text-primary">{formatPrice(booking.totalPrice)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <footer className="grid gap-4 border-t border-line pt-6 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Phương thức thanh toán</p>
              <p className="font-medium">{PAYMENT_METHODS[booking.paymentMethod]?.label || booking.paymentMethod}</p>
              {booking.paidAt && <p className="text-xs text-muted">Thanh toán lúc {formatDateTime(booking.paidAt)}</p>}
            </div>
            <div className="text-xs text-muted sm:text-right">
              <p>Cảm ơn bạn đã lựa chọn {company.siteName || 'HomestayGo'}.</p>
              <p>Hóa đơn được tạo tự động từ hệ thống, có giá trị tham khảo cho khách lưu trú.</p>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
