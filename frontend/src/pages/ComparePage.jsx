import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, GitCompareArrows, Minus, X } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import { COMPARE_MAX, useCompare } from '../context/CompareContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import RatingStars from '../components/ui/RatingStars.jsx';
import AmenityIcon from '../components/AmenityIcon.jsx';
import { AMENITIES, FALLBACK_IMAGE, ROOM_TYPE_LABELS } from '../utils/constants.js';
import { formatPrice } from '../utils/format.js';

const SPEC_ROWS = [
  { key: 'pricePerNight', label: 'Giá mỗi đêm', render: (room) => formatPrice(room.pricePerNight), best: 'min' },
  { key: 'cleaningFee', label: 'Phí dọn dẹp', render: (room) => (room.cleaningFee ? formatPrice(room.cleaningFee) : 'Miễn phí') },
  { key: 'roomType', label: 'Loại phòng', render: (room) => ROOM_TYPE_LABELS[room.roomType] || 'Homestay' },
  { key: 'city', label: 'Khu vực', render: (room) => [room.district, room.city].filter(Boolean).join(', ') || 'Chưa cập nhật' },
  { key: 'area', label: 'Diện tích', render: (room) => (room.area ? `${room.area} m²` : 'Chưa cập nhật'), best: 'max' },
  { key: 'maxGuests', label: 'Số khách tối đa', render: (room) => `${room.maxGuests || 1} khách`, best: 'max' },
  { key: 'bedrooms', label: 'Phòng ngủ', render: (room) => `${room.bedrooms || 0} phòng`, best: 'max' },
  { key: 'beds', label: 'Giường', render: (room) => `${room.beds || 0} giường` },
  { key: 'bathrooms', label: 'Phòng tắm', render: (room) => `${room.bathrooms || 0} phòng` },
  { key: 'checkInTime', label: 'Giờ nhận / trả phòng', render: (room) => `${room.checkInTime || '14:00'} / ${room.checkOutTime || '12:00'}` },
];

const bestValue = (rooms, key, mode) => {
  const values = rooms.map((room) => Number(room[key]) || 0).filter((value) => value > 0);
  if (values.length < 2) return null;
  const target = mode === 'min' ? Math.min(...values) : Math.max(...values);
  return values.filter((value) => value === target).length === values.length ? null : target;
};

export default function ComparePage() {
  const { items, remove, clear } = useCompare();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const idsKey = items.map((item) => item._id).join(',');

  useEffect(() => {
    if (!idsKey) {
      setRooms([]);
      return undefined;
    }
    let ignore = false;
    setLoading(true);
    setError('');
    client
      .get('/rooms/compare', { params: { ids: idsKey } })
      .then((res) => !ignore && setRooms(res.data.data || []))
      .catch((err) => !ignore && setError(getErrorMessage(err, 'Không tải được dữ liệu so sánh')))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [idsKey]);

  const amenityRows = useMemo(() => {
    const used = new Set(rooms.flatMap((room) => room.amenities || []));
    return AMENITIES.filter((amenity) => used.has(amenity.key));
  }, [rooms]);

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Link to="/rooms" className="flex items-center gap-1.5 text-sm text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Tiếp tục tìm phòng
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">So sánh phòng</h1>
        <p className="mt-1 text-sm text-muted">Đặt các phòng cạnh nhau để chọn nơi phù hợp nhất, tối đa {COMPARE_MAX} phòng.</p>
      </div>
      {items.length > 0 && (
        <button type="button" onClick={clear} className="btn btn-outline btn-sm">
          Xóa tất cả
        </button>
      )}
    </div>
  );

  if (!items.length) {
    return (
      <div className="container-page py-10">
        {header}
        <EmptyState
          icon={GitCompareArrows}
          title="Chưa có phòng nào để so sánh"
          description="Bấm nút So sánh trên thẻ phòng ở trang danh sách để thêm phòng vào đây."
          className="mt-8"
          action={
            <Link to="/rooms" className="btn btn-primary">
              Tìm phòng
            </Link>
          }
        />
      </div>
    );
  }

  const gridTemplate = { gridTemplateColumns: `160px repeat(${rooms.length}, minmax(0, 1fr))` };
  const tableMinWidth = { minWidth: `${160 + rooms.length * 220}px` };

  return (
    <div className="container-page py-10">
      {header}

      {loading ? (
        <Spinner label="Đang tải dữ liệu so sánh..." />
      ) : error ? (
        <EmptyState icon={GitCompareArrows} title="Không tải được dữ liệu" description={error} className="mt-8" />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={GitCompareArrows}
          title="Các phòng đã chọn không còn hoạt động"
          description="Phòng có thể đã bị ẩn. Hãy xóa danh sách và chọn phòng khác."
          className="mt-8"
          action={
            <button type="button" onClick={clear} className="btn btn-primary">
              Xóa danh sách
            </button>
          }
        />
      ) : (
        <>
          {rooms.length < 2 && (
            <p className="mt-6 rounded-lg border border-line bg-white px-4 py-3 text-sm text-muted">
              Thêm ít nhất một phòng nữa để so sánh rõ hơn.{' '}
              <Link to="/rooms" className="font-medium text-primary hover:underline">
                Chọn thêm phòng
              </Link>
            </p>
          )}
          <div className="card mt-6 overflow-x-auto">
            <div style={tableMinWidth}>
              <div className="grid border-b border-line" style={gridTemplate}>
                <div className="p-4" />
                {rooms.map((room) => (
                  <div key={room._id} className="relative border-l border-line p-4">
                    <button
                      type="button"
                      onClick={() => remove(room._id)}
                      className="absolute right-6 top-6 z-10 rounded-full bg-white p-1 text-muted hover:text-ink"
                      aria-label={`Bỏ ${room.title} khỏi so sánh`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <Link to={`/rooms/${room.slug || room._id}`} className="group block">
                      <img
                        src={room.images?.[0] || FALLBACK_IMAGE}
                        alt={room.title}
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_IMAGE;
                        }}
                        className="aspect-[4/3] w-full rounded-lg object-cover"
                      />
                      <span className="mt-3 block line-clamp-2 text-sm font-semibold text-ink group-hover:text-primary">{room.title}</span>
                    </Link>
                    <Link to={`/rooms/${room.slug || room._id}`} className="btn btn-primary btn-sm mt-3 w-full">
                      Xem và đặt phòng
                    </Link>
                  </div>
                ))}
              </div>

              <div className="grid border-b border-line" style={gridTemplate}>
                <div className="p-4 text-sm font-medium text-muted">Đánh giá</div>
                {rooms.map((room) => (
                  <div key={room._id} className="border-l border-line p-4 text-sm">
                    {room.ratingCount > 0 ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <RatingStars value={room.ratingAvg} size="sm" />
                        <span className="font-semibold">{Number(room.ratingAvg).toFixed(1)}</span>
                        <span className="text-muted">({room.ratingCount})</span>
                      </span>
                    ) : (
                      <span className="text-muted">Chưa có đánh giá</span>
                    )}
                  </div>
                ))}
              </div>

              {SPEC_ROWS.map((row) => {
                const best = row.best ? bestValue(rooms, row.key, row.best) : null;
                return (
                  <div key={row.key} className="grid border-b border-line" style={gridTemplate}>
                    <div className="p-4 text-sm font-medium text-muted">{row.label}</div>
                    {rooms.map((room) => {
                      const highlight = best !== null && Number(room[row.key]) === best;
                      return (
                        <div key={room._id} className={`border-l border-line p-4 text-sm ${highlight ? 'font-semibold text-primary' : 'text-ink'}`}>
                          {row.render(room)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              <div className="grid border-b border-line bg-sand" style={gridTemplate}>
                <div className="p-4 text-sm font-semibold text-ink">Tiện nghi</div>
                {rooms.map((room) => (
                  <div key={room._id} className="border-l border-line p-4 text-sm text-muted">
                    {(room.amenities || []).length} tiện nghi
                  </div>
                ))}
              </div>
              {amenityRows.map((amenity) => (
                <div key={amenity.key} className="grid border-b border-line last:border-b-0" style={gridTemplate}>
                  <div className="flex items-center gap-2 p-4 text-sm text-ink">
                    <AmenityIcon name={amenity.key} className="h-4 w-4 text-muted" />
                    {amenity.label}
                  </div>
                  {rooms.map((room) => {
                    const has = (room.amenities || []).includes(amenity.key);
                    return (
                      <div key={room._id} className="flex items-center border-l border-line p-4">
                        {has ? (
                          <Check className="h-5 w-5 text-primary" aria-label="Có" />
                        ) : (
                          <Minus className="h-5 w-5 text-line" aria-label="Không có" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">Giá trị in đậm màu xanh là lựa chọn tốt nhất trong các phòng đang so sánh.</p>
        </>
      )}
    </div>
  );
}
