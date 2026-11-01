import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TicketPercent, X } from 'lucide-react';
import client, { getErrorMessage } from '../../api/client.js';
import { formatPrice } from '../../utils/format.js';
import { describeCoupon } from './bookingUtils.js';

export default function CouponInput({ roomId, subtotal, appliedCode, discount = 0, coupon, error, onApply, onRemove }) {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (subtotal) setLocalError((current) => (current === 'Chọn ngày lưu trú trước khi áp dụng mã' ? '' : current));
  }, [subtotal]);

  const handleApply = async () => {
    const value = code.trim().toUpperCase();
    if (!value) {
      setLocalError('Nhập mã giảm giá');
      return;
    }
    if (!subtotal) {
      setLocalError('Chọn ngày lưu trú trước khi áp dụng mã');
      return;
    }
    setChecking(true);
    setLocalError('');
    try {
      const res = await client.post('/coupons/validate', { code: value, roomId, subtotal });
      onApply?.(res.data.data.coupon.code, res.data.data);
      toast.success(`Đã áp dụng mã ${res.data.data.coupon.code}`);
      setCode('');
    } catch (err) {
      setLocalError(getErrorMessage(err, 'Mã giảm giá không hợp lệ'));
    } finally {
      setChecking(false);
    }
  };

  if (appliedCode && !error) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary-light px-3.5 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <TicketPercent className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{appliedCode}</p>
            <p className="text-xs text-muted">
              {coupon ? describeCoupon(coupon) : 'Đã áp dụng'}
              {discount > 0 && ` · Bạn tiết kiệm ${formatPrice(discount)}`}
            </p>
          </div>
        </div>
        <button type="button" onClick={onRemove} className="rounded-lg p-1 text-muted hover:bg-white hover:text-ink" aria-label="Bỏ mã giảm giá">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const message = localError || error;

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <TicketPercent className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              setLocalError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleApply();
              }
            }}
            placeholder="Nhập mã giảm giá"
            className={`input pl-9 uppercase ${message ? 'input-error' : ''}`}
            aria-label="Mã giảm giá"
          />
        </div>
        <button type="button" onClick={handleApply} disabled={checking} className="btn btn-outline shrink-0">
          {checking ? 'Đang kiểm tra...' : 'Áp dụng'}
        </button>
      </div>
      {message ? (
        <p className="mt-1.5 text-xs text-danger">{message}</p>
      ) : (
        <p className="mt-1.5 text-xs text-muted">
          Chưa có mã?{' '}
          <Link to="/promotions" target="_blank" className="font-medium text-primary hover:underline">
            Xem ưu đãi đang có
          </Link>
        </p>
      )}
    </div>
  );
}
