import { BOOKING_STATUS, PAYMENT_STATUS } from '../utils/constants.js';

export function BookingStatusBadge({ status }) {
  const item = BOOKING_STATUS[status];
  return <span className={`badge ${item?.className || 'bg-stone-100 text-muted'}`}>{item?.label || status}</span>;
}

export function PaymentStatusBadge({ status }) {
  const item = PAYMENT_STATUS[status];
  return <span className={`badge ${item?.className || 'bg-stone-100 text-muted'}`}>{item?.label || status}</span>;
}
