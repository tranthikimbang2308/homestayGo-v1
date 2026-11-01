import { Link } from 'react-router-dom';
import { BedDouble, Check, GitCompareArrows, MapPin, Star, Users } from 'lucide-react';
import { formatPrice } from '../utils/format.js';
import { FALLBACK_IMAGE, ROOM_TYPE_LABELS } from '../utils/constants.js';
import FavoriteButton from './FavoriteButton.jsx';
import { useCompare } from '../context/CompareContext.jsx';

export default function RoomCard({ room, onFavoriteToggle, showCompare = true }) {
  const { isCompared, toggle } = useCompare();
  const compared = isCompared(room._id);
  const cover = room.images?.[0] || FALLBACK_IMAGE;
  const link = `/rooms/${room.slug || room._id}`;

  return (
    <article className="group">
      <Link to={link} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand-dark">
          <img
            src={cover}
            alt={room.title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="badge absolute left-3 top-3 bg-white/95 text-ink">{ROOM_TYPE_LABELS[room.roomType] || 'Homestay'}</span>
          <div className="absolute right-3 top-3">
            <FavoriteButton roomId={room._id} onToggle={onFavoriteToggle} />
          </div>
        </div>
        <div className="pt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 font-sans text-[15px] font-semibold text-ink group-hover:text-primary">{room.title}</h3>
            {room.ratingCount > 0 ? (
              <span className="flex shrink-0 items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                <span className="font-medium">{Number(room.ratingAvg).toFixed(1)}</span>
                <span className="text-muted">({room.ratingCount})</span>
              </span>
            ) : (
              <span className="shrink-0 text-xs text-muted">Chưa có đánh giá</span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{[room.district, room.city].filter(Boolean).join(', ')}</span>
          </p>
          <p className="mt-1 flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {room.maxGuests} khách
            </span>
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {room.bedrooms || 1} phòng ngủ
            </span>
          </p>
        </div>
      </Link>
      <div className="mt-2 flex items-center justify-between gap-3">
        <Link to={link} className="text-sm">
          <span className="font-semibold text-accent">{formatPrice(room.pricePerNight)}</span>
          <span className="text-muted"> / đêm</span>
        </Link>
        {showCompare && (
          <button
            type="button"
            onClick={() => toggle(room)}
            aria-pressed={compared}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
              compared ? 'border-primary bg-primary-light text-primary' : 'border-line text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {compared ? <Check className="h-3.5 w-3.5" /> : <GitCompareArrows className="h-3.5 w-3.5" />}
            {compared ? 'Đang so sánh' : 'So sánh'}
          </button>
        )}
      </div>
    </article>
  );
}

export function RoomCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] rounded-xl bg-line/60" />
      <div className="mt-3 h-4 w-3/4 rounded bg-line/60" />
      <div className="mt-2 h-3 w-1/2 rounded bg-line/60" />
      <div className="mt-3 h-4 w-1/3 rounded bg-line/60" />
    </div>
  );
}
