import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarClock, Check, Copy, Home, ReceiptText, TicketPercent, UserRound } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { describeCoupon } from '../components/booking/bookingUtils.js';
import { formatDate, formatPrice } from '../utils/format.js';

const TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'system', label: 'Toàn hệ thống' },
  { value: 'owner', label: 'Từ chủ phòng' },
];

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  document.body.removeChild(area);
};

function CouponCard({ coupon, copied, onCopy }) {
  const remaining = coupon.usageLimit > 0 ? Math.max(0, coupon.usageLimit - coupon.usedCount) : null;
  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
          <TicketPercent className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
          {coupon.owner ? 'Ưu đãi chủ phòng' : 'Toàn hệ thống'}
        </span>
      </div>
      <p className="mt-4 text-lg font-semibold text-ink">{describeCoupon(coupon)}</p>
      {coupon.description && <p className="mt-1 text-sm text-muted">{coupon.description}</p>}

      <ul className="mt-4 space-y-1.5 text-sm text-muted">
        <li className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 shrink-0" />
          {coupon.minOrderValue > 0 ? `Tiền phòng từ ${formatPrice(coupon.minOrderValue)}` : 'Không yêu cầu giá trị tối thiểu'}
        </li>
        <li className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 shrink-0" />
          {coupon.endDate ? `Hạn dùng đến ${formatDate(coupon.endDate)}` : 'Không giới hạn thời gian'}
          {remaining !== null && <span className="text-xs">· còn {remaining} lượt</span>}
        </li>
        {coupon.owner && (
          <li className="flex items-center gap-2">
            <UserRound className="h-4 w-4 shrink-0" />
            <span>
              Chủ phòng{' '}
              {coupon.owner._id ? (
                <Link to={`/hosts/${coupon.owner._id}`} className="font-medium text-ink hover:text-primary">
                  {coupon.owner.name}
                </Link>
              ) : (
                coupon.owner.name
              )}
            </span>
          </li>
        )}
        <li className="flex items-start gap-2">
          <Home className="mt-0.5 h-4 w-4 shrink-0" />
          {coupon.rooms?.length > 0 ? (
            <span>
              Áp dụng cho{' '}
              {coupon.rooms.map((room, index) => (
                <span key={room._id}>
                  {index > 0 && ', '}
                  <Link to={`/rooms/${room.slug || room._id}`} className="font-medium text-ink hover:text-primary">
                    {room.title}
                  </Link>
                </span>
              ))}
            </span>
          ) : (
            <span>{coupon.owner ? 'Áp dụng mọi phòng của chủ phòng này' : 'Áp dụng mọi homestay trên HomestayGo'}</span>
          )}
        </li>
      </ul>

      <div className="mt-auto pt-5">
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary-light/50 p-1.5 pl-4">
          <span className="flex-1 truncate text-base font-semibold tracking-wider text-primary">{coupon.code}</span>
          <button type="button" onClick={() => onCopy(coupon.code)} className="btn btn-primary btn-sm" aria-label={`Sao chép mã ${coupon.code}`}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Đã chép' : 'Sao chép'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function PromotionsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    let ignore = false;
    client
      .get('/coupons/public')
      .then((res) => !ignore && setCoupons(res.data.data || []))
      .catch((err) => !ignore && setError(getErrorMessage(err, 'Không tải được danh sách ưu đãi')))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!copiedCode) return undefined;
    const timer = setTimeout(() => setCopiedCode(''), 2000);
    return () => clearTimeout(timer);
  }, [copiedCode]);

  const filtered = useMemo(() => {
    if (tab === 'system') return coupons.filter((coupon) => !coupon.owner);
    if (tab === 'owner') return coupons.filter((coupon) => coupon.owner);
    return coupons;
  }, [coupons, tab]);

  const handleCopy = async (code) => {
    try {
      await copyText(code);
      setCopiedCode(code);
      toast.success(`Đã sao chép mã ${code}`);
    } catch {
      toast.error('Không sao chép được mã, vui lòng chép thủ công');
    }
  };

  return (
    <div className="container-page py-10">
      <div className="max-w-2xl">
        <p className="eyebrow">Ưu đãi</p>
        <h1 className="mt-2 text-3xl font-semibold">Mã giảm giá đang có</h1>
        <p className="mt-2 text-muted">
          Sao chép mã và nhập ở bước xác nhận đặt phòng. Mỗi đơn dùng được một mã, giảm giá tính trên tiền phòng trước phí.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {TABS.map((item) => {
          const active = item.value === tab;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary/40 hover:text-primary'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {loading ? (
          <Spinner label="Đang tải ưu đãi..." />
        ) : error ? (
          <EmptyState icon={TicketPercent} title="Không tải được ưu đãi" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={TicketPercent}
            title="Chưa có ưu đãi phù hợp"
            description="Hiện chưa có mã giảm giá trong mục này. Hãy quay lại sau nhé."
            action={
              <Link to="/rooms" className="btn btn-primary">
                Tìm phòng
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((coupon) => (
              <CouponCard key={coupon._id} coupon={coupon} copied={copiedCode === coupon.code} onCopy={handleCopy} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
