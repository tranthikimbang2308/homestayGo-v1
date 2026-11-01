import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import client, { getErrorMessage } from '../../api/client.js';
import AccountShell from '../../components/AccountShell.jsx';
import RoomCard, { RoomCardSkeleton } from '../../components/RoomCard.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

export default function FavoritesPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/favorites')
      .then((res) => setRooms((res.data.data || []).filter((room) => room && room._id)))
      .catch((err) => setError(getErrorMessage(err, 'Không tải được danh sách yêu thích')))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (roomId) => (favorited) => {
    if (!favorited) setRooms((prev) => prev.filter((room) => room._id !== roomId));
  };

  return (
    <AccountShell title="Danh sách yêu thích" description={rooms.length ? `${rooms.length} phòng bạn đã lưu` : 'Lưu lại những căn phòng bạn muốn quay lại xem.'}>
      {loading ? (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <RoomCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Không tải được danh sách" description={error} />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Chưa có phòng yêu thích"
          description="Bấm biểu tượng trái tim trên ảnh phòng để lưu vào danh sách này."
          action={
            <Link to="/rooms" className="btn btn-primary">
              Khám phá homestay
            </Link>
          }
        />
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard key={room._id} room={room} onFavoriteToggle={handleToggle(room._id)} />
          ))}
        </div>
      )}
    </AccountShell>
  );
}
