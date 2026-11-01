import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageCircle } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from './ui/Button.jsx';

export const messagesPathFor = (role) => (role === 'owner' ? '/owner/messages' : '/account/messages');

export default function MessageButton({ recipientId, roomId, bookingId, label = 'Nhắn tin', className = '', fullWidth = false }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const recipient = recipientId ? String(recipientId?._id || recipientId) : '';
  if (!recipient) return null;
  if (user && (String(user._id) === recipient || user.role === 'admin')) return null;

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    setLoading(true);
    try {
      const payload = { recipientId: recipient };
      if (roomId) payload.roomId = String(roomId?._id || roomId);
      if (bookingId) payload.bookingId = String(bookingId?._id || bookingId);
      const res = await client.post('/messages/conversations', payload);
      navigate(`${messagesPathFor(user?.role)}?c=${res.data.data._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không mở được hội thoại'));
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" icon={MessageCircle} loading={loading} onClick={handleClick} className={className} fullWidth={fullWidth}>
      {label}
    </Button>
  );
}
