import { Search } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { BOOKING_STATUS, ROOM_STATUS, PAYMENT_STATUS, ROLES, ROOM_TYPES, AMENITIES } from '../../utils/constants';

export const CHART_COLORS = {
  primary: '#1F5F4A',
  primaryLight: '#EAF1EE',
  accent: '#1F5F4A',
  muted: '#6B6B66',
  line: '#E3E5E3',
  ink: '#1E1E1C',
};

export const BOOKING_STATUS_COLORS = {
  pending: '#C98A12',
  confirmed: '#1F5F4A',
  checked_in: '#3E7CB1',
  completed: '#2E7D4F',
  cancelled: '#6B6B66',
  rejected: '#C0392B',
};

export const ROOM_STATUS_COLORS = {
  pending: '#C98A12',
  approved: '#2E7D4F',
  rejected: '#C0392B',
  hidden: '#6B6B66',
};

const PILL_TONES = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-primary-light text-primary border-primary/20',
  checked_in: 'bg-sky-50 text-sky-800 border-sky-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cancelled: 'bg-stone-100 text-stone-700 border-stone-200',
  hidden: 'bg-stone-100 text-stone-700 border-stone-200',
  unpaid: 'bg-stone-100 text-stone-700 border-stone-200',
  refunded: 'bg-sky-50 text-sky-800 border-sky-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  admin: 'bg-ink text-white border-ink',
  owner: 'bg-primary-light text-primary border-primary/20',
  customer: 'bg-sand text-ink border-line',
};

export function labelFrom(source, key) {
  if (!source || key === undefined || key === null) return key || '';
  if (Array.isArray(source)) {
    const found = source.find((item) => item.key === key || item.value === key);
    return found ? found.label : key;
  }
  const value = source[key];
  if (!value) return key;
  return typeof value === 'string' ? value : value.label || key;
}

export const bookingStatusLabel = (key) => labelFrom(BOOKING_STATUS, key);
export const roomStatusLabel = (key) => labelFrom(ROOM_STATUS, key);
export const paymentStatusLabel = (key) => labelFrom(PAYMENT_STATUS, key);
export const roleLabel = (key) => labelFrom(ROLES, key);
export const roomTypeLabel = (key) => labelFrom(ROOM_TYPES, key);
export const amenityLabel = (key) => labelFrom(AMENITIES, key);

export const BOOKING_STATUS_KEYS = ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'rejected'];
export const ROOM_STATUS_KEYS = ['pending', 'approved', 'rejected', 'hidden'];
export const ROLE_KEYS = ['customer', 'owner', 'admin'];

export function errorMessage(error, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại') {
  return getErrorMessage(error, fallback);
}

export function StatusPill({ status, children }) {
  const tone = PILL_TONES[status] || 'bg-sand text-ink border-line';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-ink sm:text-[1.75rem]">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, onSubmit }) {
  return (
    <form
      className="relative w-full sm:max-w-xs"
      onSubmit={(event) => {
        event.preventDefault();
        if (onSubmit) onSubmit();
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </form>
  );
}

export function FilterTabs({ options, value, onChange, counts }) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value || 'all'}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              active ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary/40 hover:text-primary'
            }`}
          >
            {option.label}
            {counts && counts[option.value || 'all'] !== undefined && (
              <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-white/20 text-white' : 'bg-sand text-muted'}`}>
                {counts[option.value || 'all']}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Panel({ title, description, actions, children, className = '', bodyClassName = 'p-5' }) {
  return (
    <section className={`rounded-xl border border-line bg-white ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs">
      {label && <p className="mb-1 font-medium text-ink">{label}</p>}
      {payload.map((item) => (
        <p key={item.dataKey || item.name} className="flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color || item.payload?.fill }} />
          <span>{item.name}:</span>
          <span className="font-medium text-ink">{valueFormatter ? valueFormatter(item.value, item.dataKey) : item.value}</span>
        </p>
      ))}
    </div>
  );
}

export function compactPrice(value) {
  const number = Number(value) || 0;
  if (number >= 1e9) return `${(number / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
  if (number >= 1e6) return `${(number / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
  if (number >= 1e3) return `${(number / 1e3).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}k`;
  return String(number);
}

export const coverImage = (room) => room?.images?.[0] || '';

export const TABLE_CLASS = 'min-w-full divide-y divide-line text-sm';
export const TH_CLASS = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted';
export const TD_CLASS = 'px-4 py-3 align-middle';

export const shortMonth = (value) => String(value || '').replace(/\/\d{2}(\d{2})$/, '/$1');
