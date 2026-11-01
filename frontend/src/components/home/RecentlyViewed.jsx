import { useEffect, useState } from 'react';
import { History, Trash2 } from 'lucide-react';
import RoomCard from '../RoomCard.jsx';

const STORAGE_KEY = 'hg_recent';
const RECENT_MAX = 8;
const CHANGE_EVENT = 'hg:recent-change';

const snapshot = (room) => ({
  _id: room._id,
  slug: room.slug,
  title: room.title,
  images: room.images?.length ? [room.images[0]] : [],
  roomType: room.roomType,
  ratingAvg: room.ratingAvg || 0,
  ratingCount: room.ratingCount || 0,
  district: room.district || '',
  city: room.city || '',
  maxGuests: room.maxGuests,
  bedrooms: room.bedrooms,
  pricePerNight: room.pricePerNight,
});

export const getRecentlyViewed = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && item._id).slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
};

const saveRecentlyViewed = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    return;
  }
};

export const addRecentlyViewed = (room) => {
  if (!room?._id) return;
  const rest = getRecentlyViewed().filter((item) => item._id !== room._id);
  saveRecentlyViewed([snapshot(room), ...rest].slice(0, RECENT_MAX));
};

export default function RecentlyViewed() {
  const [rooms, setRooms] = useState(getRecentlyViewed);

  useEffect(() => {
    const sync = () => setRooms(getRecentlyViewed());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!rooms.length) return null;

  return (
    <section className="container-page pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <History className="h-4 w-4" /> Lịch sử của bạn
          </p>
          <h2 className="section-title mt-2">Đã xem gần đây</h2>
        </div>
        <button type="button" onClick={() => saveRecentlyViewed([])} className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <Trash2 className="h-4 w-4" /> Xóa lịch sử
        </button>
      </div>
      <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {rooms.map((room) => (
          <RoomCard key={room._id} room={room} />
        ))}
      </div>
    </section>
  );
}
