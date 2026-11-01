import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { ArrowLeft, BedDouble, CalendarCheck, CalendarDays, MessageSquareText, Star, UserX } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import RatingStars from '../components/ui/RatingStars.jsx';
import Avatar from '../components/Avatar.jsx';
import RoomCard from '../components/RoomCard.jsx';
import MessageButton from '../components/MessageButton.jsx';
import { formatDate, formatNumber } from '../utils/format.js';

export default function HostProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    client
      .get(`/hosts/${id}`)
      .then((res) => !ignore && setProfile(res.data.data))
      .catch((err) => !ignore && setError(getErrorMessage(err, 'Không tìm thấy chủ phòng')))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) return <Spinner fullPage label="Đang tải hồ sơ chủ phòng..." />;

  if (error || !profile) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={UserX}
          title="Không tìm thấy chủ phòng"
          description={error || 'Hồ sơ này không tồn tại hoặc đã bị gỡ.'}
          action={
            <Link to="/rooms" className="btn btn-primary">
              Xem danh sách phòng
            </Link>
          }
        />
      </div>
    );
  }

  const { host, stats, rooms = [], reviews = [] } = profile;
  const statItems = [
    { icon: BedDouble, label: 'Phòng đang cho thuê', value: formatNumber(stats.roomCount) },
    { icon: MessageSquareText, label: 'Lượt đánh giá', value: formatNumber(stats.reviewCount) },
    { icon: Star, label: 'Điểm trung bình', value: stats.reviewCount ? `${Number(stats.ratingAvg).toFixed(1)}/5` : 'Chưa có' },
    { icon: CalendarCheck, label: 'Lượt lưu trú hoàn thành', value: formatNumber(stats.completedBookings) },
  ];

  return (
    <div className="container-page py-8 lg:py-10">
      <Link to="/rooms" className="flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách phòng
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar src={host.avatar} name={host.name} size="xl" />
              <h1 className="mt-4 text-2xl font-semibold text-ink">{host.name}</h1>
              <p className="mt-1 text-sm text-muted">Chủ phòng trên HomestayGo</p>
              {host.createdAt && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <CalendarDays className="h-4 w-4" /> Tham gia từ tháng {dayjs(host.createdAt).format('M/YYYY')}
                </p>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
              {statItems.map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white p-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
            <MessageButton recipientId={host._id} label="Nhắn tin cho chủ phòng" className="mt-5" fullWidth />
          </div>
        </aside>

        <div className="min-w-0">
          <section>
            <h2 className="text-xl font-semibold text-ink">Giới thiệu</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/90">{host.bio || `${host.name} chưa viết lời giới thiệu.`}</p>
          </section>

          <section className="mt-10 border-t border-line pt-8">
            <h2 className="text-xl font-semibold text-ink">Phòng của {host.name}</h2>
            {rooms.length ? (
              <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {rooms.map((room) => (
                  <RoomCard key={room._id} room={room} />
                ))}
              </div>
            ) : (
              <EmptyState icon={BedDouble} title="Chưa có phòng đang cho thuê" description="Chủ phòng này hiện chưa có phòng nào được duyệt." className="mt-4" />
            )}
          </section>

          <section className="mt-10 border-t border-line pt-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-ink">Khách nói gì</h2>
              {stats.reviewCount > 0 && (
                <span className="flex items-center gap-2 text-sm">
                  <RatingStars value={stats.ratingAvg} size="sm" />
                  <span className="font-semibold">{Number(stats.ratingAvg).toFixed(1)}/5</span>
                  <span className="text-muted">· {stats.reviewCount} đánh giá</span>
                </span>
              )}
            </div>
            {reviews.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {reviews.map((review) => (
                  <article key={review._id} className="rounded-xl border border-line bg-white p-5">
                    <div className="flex items-center gap-3">
                      <Avatar src={review.customer?.avatar} name={review.customer?.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{review.customer?.name || 'Khách hàng'}</p>
                        <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
                      </div>
                      <RatingStars value={review.rating} size="xs" />
                    </div>
                    <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-ink/90">{review.comment || 'Khách không để lại nhận xét.'}</p>
                    {review.room && (
                      <Link to={`/rooms/${review.room.slug || review.room._id}`} className="mt-3 block truncate text-xs font-medium text-primary hover:underline">
                        {review.room.title}
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={MessageSquareText} title="Chưa có đánh giá" description="Các phòng của chủ nhà này chưa nhận được đánh giá nào." className="mt-4" />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
