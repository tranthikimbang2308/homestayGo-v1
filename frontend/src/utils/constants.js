export const AMENITIES = [
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'ac', label: 'Điều hòa' },
  { key: 'kitchen', label: 'Bếp' },
  { key: 'parking', label: 'Chỗ đậu xe' },
  { key: 'pool', label: 'Hồ bơi' },
  { key: 'tv', label: 'TV' },
  { key: 'washer', label: 'Máy giặt' },
  { key: 'bbq', label: 'Khu BBQ' },
  { key: 'garden', label: 'Sân vườn' },
  { key: 'balcony', label: 'Ban công' },
  { key: 'hot_water', label: 'Nước nóng' },
  { key: 'pet', label: 'Cho phép thú cưng' },
  { key: 'breakfast', label: 'Bữa sáng' },
  { key: 'mountain_view', label: 'View núi' },
  { key: 'sea_view', label: 'View biển' },
];

export const AMENITY_LABELS = Object.fromEntries(AMENITIES.map((item) => [item.key, item.label]));

export const ROOM_TYPES = [
  { key: 'entire', label: 'Nguyên căn' },
  { key: 'private', label: 'Phòng riêng' },
  { key: 'dorm', label: 'Phòng tập thể' },
  { key: 'villa', label: 'Biệt thự' },
  { key: 'bungalow', label: 'Bungalow' },
];

export const ROOM_TYPE_LABELS = Object.fromEntries(ROOM_TYPES.map((item) => [item.key, item.label]));

export const BOOKING_STATUS = {
  pending: { label: 'Chờ xác nhận', className: 'bg-amber-50 text-warning border border-amber-200' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-primary-light text-primary border border-primary/20' },
  checked_in: { label: 'Đang lưu trú', className: 'bg-sky-50 text-sky-700 border border-sky-200' },
  completed: { label: 'Hoàn thành', className: 'bg-green-50 text-success border border-green-200' },
  cancelled: { label: 'Đã hủy', className: 'bg-stone-100 text-muted border border-stone-200' },
  rejected: { label: 'Bị từ chối', className: 'bg-red-50 text-danger border border-red-200' },
};

export const PAYMENT_STATUS = {
  unpaid: { label: 'Chưa thanh toán', className: 'bg-amber-50 text-warning border border-amber-200' },
  paid: { label: 'Đã thanh toán', className: 'bg-green-50 text-success border border-green-200' },
  refunded: { label: 'Đã hoàn tiền', className: 'bg-sky-50 text-sky-700 border border-sky-200' },
};

export const PAYMENT_METHODS = {
  vnpay: { label: 'VNPay' },
  cash: { label: 'Thanh toán tại homestay' },
};

export const ROOM_STATUS = {
  pending: { label: 'Chờ duyệt', className: 'bg-amber-50 text-warning border border-amber-200' },
  approved: { label: 'Đã duyệt', className: 'bg-green-50 text-success border border-green-200' },
  rejected: { label: 'Bị từ chối', className: 'bg-red-50 text-danger border border-red-200' },
  hidden: { label: 'Đã ẩn', className: 'bg-stone-100 text-muted border border-stone-200' },
};

export const ROLES = {
  customer: { label: 'Khách hàng', className: 'bg-primary-light text-primary border border-primary/20' },
  owner: { label: 'Chủ phòng', className: 'bg-accent-light text-accent-dark border border-accent/20' },
  admin: { label: 'Quản trị viên', className: 'bg-stone-100 text-ink border border-stone-200' },
};

export const SORT_OPTIONS = [
  { key: 'newest', label: 'Mới nhất' },
  { key: 'popular', label: 'Phổ biến nhất' },
  { key: 'rating', label: 'Đánh giá cao' },
  { key: 'price_asc', label: 'Giá thấp đến cao' },
  { key: 'price_desc', label: 'Giá cao đến thấp' },
];

export const CITIES = ['Đà Lạt', 'Hội An', 'Sa Pa', 'Vũng Tàu', 'Đà Nẵng', 'Hà Nội', 'Phú Quốc'];

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80';
