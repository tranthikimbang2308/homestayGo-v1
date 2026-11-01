import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Star } from 'lucide-react';
import L from '../utils/leafletIcon.js';
import { FALLBACK_IMAGE } from '../utils/constants.js';
import { formatPrice } from '../utils/format.js';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const VIETNAM_CENTER = [16.0471, 108.2068];

const isValidCoord = (value) => typeof value === 'number' && !Number.isNaN(value);

export const hasLocation = (room) => isValidCoord(room?.location?.lat) && isValidCoord(room?.location?.lng);

const shortPrice = (value) => {
  const amount = Number(value) || 0;
  if (amount >= 1000000) return `${(Math.round(amount / 100000) / 10).toString().replace('.', ',')}tr`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
  return String(amount);
};

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const priceIcon = (price) =>
  L.divIcon({
    className: '',
    html: `<span class="inline-block -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-primary bg-white px-2.5 py-1 font-sans text-xs font-semibold text-primary shadow-sm">${escapeHtml(shortPrice(price))}</span>`,
    iconSize: null,
    iconAnchor: [0, 0],
    popupAnchor: [0, -14],
  });

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export function RoomsMap({ rooms = [], height = 640 }) {
  const located = useMemo(() => rooms.filter(hasLocation), [rooms]);
  const points = useMemo(() => located.map((room) => [room.location.lat, room.location.lng]), [located]);

  return (
    <div className="overflow-hidden rounded-xl border border-line" style={{ height }}>
      <MapContainer center={VIETNAM_CENTER} zoom={6} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <FitBounds points={points} />
        {located.map((room) => {
          const link = `/rooms/${room.slug || room._id}`;
          return (
            <Marker key={room._id} position={[room.location.lat, room.location.lng]} icon={priceIcon(room.pricePerNight)}>
              <Popup minWidth={220} maxWidth={240}>
                <Link to={link} className="block w-[220px] font-sans text-ink no-underline">
                  <img
                    src={room.images?.[0] || FALLBACK_IMAGE}
                    alt={room.title}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    className="h-28 w-full rounded-lg object-cover"
                  />
                  <span className="mt-2 block line-clamp-2 text-sm font-semibold text-ink">{room.title}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted">
                    <span>{room.city}</span>
                    {room.ratingAvg > 0 && (
                      <span className="flex items-center gap-1 text-ink">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        {Number(room.ratingAvg).toFixed(1)}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm">
                    <span className="font-semibold text-primary">{formatPrice(room.pricePerNight)}</span>
                    <span className="text-muted"> / đêm</span>
                  </span>
                  <span className="mt-2 block text-xs font-medium text-primary">Xem chi tiết</span>
                </Link>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default function RoomMap({ lat, lng, title, address, height = 360, zoom = 15 }) {
  if (!isValidCoord(lat) || !isValidCoord(lng)) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-line bg-white text-sm text-muted" style={{ height }}>
        Chủ phòng chưa cập nhật vị trí trên bản đồ
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line" style={{ height }}>
      <MapContainer center={[lat, lng]} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <Marker position={[lat, lng]}>
          <Popup>
            <strong>{title}</strong>
            {address && <div>{address}</div>}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
