import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CircleCheck, CircleX } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import Spinner from '../components/ui/Spinner.jsx';
import { formatPrice } from '../utils/format.js';

export default function VnpayReturnPage() {
  const location = useLocation();
  const requested = useRef(false);
  const [state, setState] = useState({ loading: true, paid: false, message: '', bookingId: '', code: '' });
  const query = new URLSearchParams(location.search);
  const amount = Number(query.get('vnp_Amount') || 0) / 100;
  const transactionNo = query.get('vnp_TransactionNo');
  const bankCode = query.get('vnp_BankCode');

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    client
      .get(`/payment/vnpay-return${location.search}`)
      .then((res) => {
        const data = res.data.data || {};
        setState({
          loading: false,
          paid: Boolean(data.paid),
          message: data.message || (data.paid ? 'Thanh toán thành công' : 'Thanh toán không thành công'),
          bookingId: data.bookingId,
          code: data.code,
        });
      })
      .catch((error) => {
        const data = error.response?.data?.data || {};
        setState({
          loading: false,
          paid: false,
          message: getErrorMessage(error, 'Không xác minh được giao dịch'),
          bookingId: data.bookingId,
          code: data.code,
        });
      });
  }, [location.search]);

  if (state.loading) return <Spinner fullPage label="Đang xác minh giao dịch với VNPay..." />;

  const Icon = state.paid ? CircleCheck : CircleX;

  return (
    <div className="container-page py-14">
      <div className="card mx-auto max-w-lg p-8 text-center">
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${state.paid ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
          <Icon className="h-9 w-9" />
        </span>
        <h1 className="mt-5 font-serif text-2xl font-semibold">{state.paid ? 'Thanh toán thành công' : 'Thanh toán chưa hoàn tất'}</h1>
        <p className="mt-2 text-sm text-muted">{state.message}</p>

        <dl className="mt-6 space-y-2 rounded-lg border border-dashed border-line bg-sand px-5 py-4 text-left text-sm">
          {state.code && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Mã đơn</dt>
              <dd className="font-semibold">{state.code}</dd>
            </div>
          )}
          {amount > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Số tiền</dt>
              <dd className="font-semibold text-accent">{formatPrice(amount)}</dd>
            </div>
          )}
          {transactionNo && transactionNo !== '0' && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Mã giao dịch VNPay</dt>
              <dd>{transactionNo}</dd>
            </div>
          )}
          {bankCode && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Ngân hàng</dt>
              <dd>{bankCode}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {state.bookingId && (
            <Link to={`/account/bookings/${state.bookingId}`} className="btn btn-primary">
              {state.paid ? 'Xem chi tiết đơn' : 'Thanh toán lại'}
            </Link>
          )}
          <Link to="/account/bookings" className="btn btn-outline">
            Đơn đặt phòng của tôi
          </Link>
        </div>
      </div>
    </div>
  );
}
