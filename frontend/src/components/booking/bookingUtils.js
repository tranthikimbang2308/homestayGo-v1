import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import client, { getErrorMessage } from '../../api/client.js';

export const blockedDatesToRanges = (blockedDates = []) =>
  (blockedDates || []).map((block) => ({
    checkIn: dayjs(block.from).startOf('day').toISOString(),
    checkOut: dayjs(block.to).startOf('day').add(1, 'day').toISOString(),
  }));

export const mergeUnavailable = (bookedDates = [], blockedDates = []) => {
  const seen = new Set();
  return [...(bookedDates || []), ...blockedDatesToRanges(blockedDates)].filter((range) => {
    const key = `${dayjs(range.checkIn).format('YYYY-MM-DD')}_${dayjs(range.checkOut).format('YYYY-MM-DD')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const isCancelledStatus = (status) => ['cancelled', 'rejected'].includes(status);

export const bookingSubtotal = (booking) => {
  if (!booking) return 0;
  if (booking.subtotal !== undefined && booking.subtotal !== null) return booking.subtotal;
  return (booking.pricePerNight || 0) * (booking.nights || 0);
};

export const describeCoupon = (coupon) => {
  if (!coupon) return '';
  if (coupon.discountType === 'percent') {
    const cap = coupon.maxDiscount > 0 ? `, tối đa ${Math.round(coupon.maxDiscount).toLocaleString('vi-VN')} ₫` : '';
    return `Giảm ${coupon.discountValue}%${cap}`;
  }
  return `Giảm ${Math.round(coupon.discountValue || 0).toLocaleString('vi-VN')} ₫`;
};

export function useBookingQuote({ roomId, checkIn, checkOut, guests, couponCode }) {
  const [state, setState] = useState({ quote: null, loading: false, error: '' });

  useEffect(() => {
    if (!roomId || !checkIn || !checkOut) {
      setState({ quote: null, loading: false, error: '' });
      return undefined;
    }
    let ignore = false;
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    const timer = setTimeout(() => {
      const params = { roomId, checkIn, checkOut, guests: guests || 1 };
      if (couponCode) params.couponCode = couponCode;
      client
        .get('/bookings/quote', { params })
        .then((res) => !ignore && setState({ quote: res.data.data, loading: false, error: '' }))
        .catch((err) => !ignore && setState({ quote: null, loading: false, error: getErrorMessage(err, 'Không tính được giá phòng') }));
    }, 200);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [roomId, checkIn, checkOut, guests, couponCode]);

  return state;
}
