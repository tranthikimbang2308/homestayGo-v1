import dayjs from 'dayjs';

export const formatPrice = (n) => {
  const value = Math.round(Number(n) || 0);
  const digits = Math.abs(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${value < 0 ? '-' : ''}${digits} ₫`;
};

export const formatNumber = (n) => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const formatDate = (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '');

export const formatDateTime = (d) => (d ? dayjs(d).format('HH:mm DD/MM/YYYY') : '');

export const toInputDate = (d) => (d ? dayjs(d).format('YYYY-MM-DD') : '');

export const calcNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = dayjs(checkOut).startOf('day').diff(dayjs(checkIn).startOf('day'), 'day');
  return diff > 0 ? diff : 0;
};

export const SERVICE_FEE_RATE = 0.05;

export const calcBookingPrice = ({ pricePerNight = 0, cleaningFee = 0, nights = 0 }) => {
  const roomTotal = pricePerNight * nights;
  const serviceFee = Math.round(roomTotal * SERVICE_FEE_RATE);
  const fee = nights > 0 ? cleaningFee || 0 : 0;
  return { roomTotal, cleaningFee: fee, serviceFee, totalPrice: roomTotal + fee + serviceFee };
};

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
