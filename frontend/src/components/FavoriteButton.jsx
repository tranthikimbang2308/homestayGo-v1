import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const toId = (item) => (typeof item === 'object' && item !== null ? item._id : item);

export function useIsFavorite(roomId) {
  const { user } = useAuth();
  return Boolean(user?.favorites?.some((item) => toId(item) === roomId));
}

export default function FavoriteButton({ roomId, variant = 'icon', onToggle, className = '' }) {
  const { isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const favorited = useIsFavorite(roomId);
  const [busy, setBusy] = useState(false);

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      toast('Đăng nhập để lưu phòng yêu thích');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    setBusy(true);
    try {
      const res = await client.post(`/favorites/${roomId}`);
      const { favorited: nextState, favorites } = res.data.data;
      updateUser({ favorites });
      toast.success(nextState ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích');
      onToggle?.(nextState);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'button') {
    return (
      <button type="button" onClick={handleClick} disabled={busy} className={`btn btn-outline ${className}`}>
        <Heart className={`h-4 w-4 ${favorited ? 'fill-accent text-accent' : ''}`} />
        {favorited ? 'Đã lưu' : 'Lưu'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={favorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      aria-pressed={favorited}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink transition-colors hover:text-accent ${className}`}
    >
      <Heart className={`h-[18px] w-[18px] ${favorited ? 'fill-accent text-accent' : ''}`} />
    </button>
  );
}
