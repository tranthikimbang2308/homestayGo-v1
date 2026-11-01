import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { isCancelledStatus } from './bookingUtils.js';

export default function InvoiceLink({ booking, className = '' }) {
  if (!booking?._id || isCancelledStatus(booking.status)) return null;
  return (
    <Link to={`/account/bookings/${booking._id}/invoice`} className={`btn btn-outline ${className}`}>
      <FileText className="h-4 w-4" /> Xem hóa đơn
    </Link>
  );
}
