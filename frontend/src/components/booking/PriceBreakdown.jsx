import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { ChevronDown, TicketPercent } from 'lucide-react';
import { formatPrice } from '../../utils/format.js';

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const groupNights = (nightly = []) => {
  const groups = new Map();
  nightly.forEach((night) => {
    const key = `${night.isWeekend ? 'weekend' : 'weekday'}_${night.price}`;
    const current = groups.get(key) || { isWeekend: night.isWeekend, price: night.price, count: 0 };
    current.count += 1;
    groups.set(key, current);
  });
  return [...groups.values()].sort((a, b) => Number(a.isWeekend) - Number(b.isWeekend));
};

export default function PriceBreakdown({ quote, className = '' }) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => groupNights(quote?.nightly), [quote]);
  if (!quote || !quote.nights) return null;
  const hasWeekendRate = groups.some((group) => group.isWeekend && group.price !== quote.pricePerNight);
  const percent = quote.serviceFeePercent ?? 5;

  return (
    <div className={`space-y-2.5 text-sm ${className}`}>
      {groups.map((group) => (
        <div key={`${group.isWeekend}_${group.price}`} className="flex justify-between gap-3">
          <span className="text-muted">
            {formatPrice(group.price)} x {group.count} đêm
            {hasWeekendRate && <span className="ml-1 text-xs">({group.isWeekend ? 'cuối tuần' : 'ngày thường'})</span>}
          </span>
          <span>{formatPrice(group.price * group.count)}</span>
        </div>
      ))}
      {quote.nightly?.length > 1 && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            aria-expanded={open}
          >
            {open ? 'Ẩn chi tiết từng đêm' : 'Xem chi tiết từng đêm'}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-line bg-sand/60 px-3 py-2 text-xs">
              {quote.nightly.map((night) => (
                <li key={night.date} className="flex justify-between gap-3">
                  <span className="text-muted">
                    {WEEKDAY_LABELS[dayjs(night.date).day()]}, {dayjs(night.date).format('DD/MM/YYYY')}
                    {night.isWeekend && hasWeekendRate && <span className="ml-1 text-primary">Cuối tuần</span>}
                  </span>
                  <span>{formatPrice(night.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted">Phí dọn dẹp</span>
        <span>{formatPrice(quote.cleaningFee)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted">Phí dịch vụ ({percent}%)</span>
        <span>{formatPrice(quote.serviceFee)}</span>
      </div>
      {quote.discount > 0 && (
        <div className="flex justify-between text-primary">
          <span className="flex items-center gap-1.5">
            <TicketPercent className="h-4 w-4" />
            Giảm giá{quote.coupon?.code ? ` (${quote.coupon.code})` : ''}
          </span>
          <span>-{formatPrice(quote.discount)}</span>
        </div>
      )}
      <div className="rule-dashed flex justify-between pt-3 text-base font-semibold">
        <span>Tổng cộng</span>
        <span className="text-primary">{formatPrice(quote.totalPrice)}</span>
      </div>
    </div>
  );
}
