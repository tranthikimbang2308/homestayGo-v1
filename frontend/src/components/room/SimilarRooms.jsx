import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import RoomCard, { RoomCardSkeleton } from '../RoomCard.jsx';
import { addRecentlyViewed } from '../home/RecentlyViewed.jsx';

export default function SimilarRooms({ room }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const roomId = room?._id;

  useEffect(() => {
    if (!roomId) return undefined;
    if (room.status === 'approved' || !room.status) addRecentlyViewed(room);
    let active = true;
    setLoading(true);
    client
      .get(`/rooms/${roomId}/similar`)
      .then((res) => {
        if (active) setRooms(res.data.data || []);
      })
      .catch(() => {
        if (active) setRooms([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [roomId]);

  if (!roomId || (!loading && !rooms.length)) return null;

  return (
    <section className="mt-12 border-t border-line pt-10">
      <h2 className="text-xl font-semibold text-ink">Phòng tương tự</h2>
      <p className="mt-1 text-sm text-muted">Cùng khu vực hoặc cùng loại phòng, mức giá gần với phòng bạn đang xem.</p>
      <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <RoomCardSkeleton key={index} />)
          : rooms.map((item) => <RoomCard key={item._id} room={item} />)}
      </div>
    </section>
  );
}
