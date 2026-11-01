import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  Clock,
  DoorOpen,
  Grid2x2,
  Mail,
  MapPin,
  MessageSquareText,
  Minus,
  Phone,
  Plus,
  Ruler,
  Share2,
  Star,
  Users,
} from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import RatingStars from '../components/ui/RatingStars.jsx';
import Avatar from '../components/Avatar.jsx';
import AmenityIcon from '../components/AmenityIcon.jsx';
import FavoriteButton from '../components/FavoriteButton.jsx';
import RoomMap from '../components/RoomMap.jsx';
import { AMENITY_LABELS, FALLBACK_IMAGE, ROOM_STATUS, ROOM_TYPE_LABELS } from '../utils/constants.js';
import { formatDate, formatPrice } from '../utils/format.js';
import ReportRoomButton from '../components/room/ReportRoomButton.jsx';
import MessageButton from '../components/MessageButton.jsx';
import SimilarRooms from '../components/room/SimilarRooms.jsx';
import BookingBox from '../components/booking/BookingBox.jsx';

function Gallery({ images, title }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const list = images.length ? images : [FALLBACK_IMAGE];

  const openAt = (index) => {
    setActive(index);
    setOpen(true);
  };

  return (
    <>
      <div className="relative grid h-[280px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl sm:h-[420px]">
        {list.slice(0, 5).map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => openAt(index)}
            className={`group relative overflow-hidden bg-sand-dark ${index === 0 ? 'col-span-4 row-span-2 sm:col-span-2' : 'hidden sm:block'} ${
              list.length === 1 ? 'sm:col-span-4' : ''
            }`}
          >
            <img
              src={src}
              alt={`${title} - ảnh ${index + 1}`}
              className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </button>
        ))}
        {list.length > 1 && (
          <button type="button" onClick={() => openAt(0)} className="btn btn-outline btn-sm absolute bottom-3 right-3 bg-white">
            <Grid2x2 className="h-4 w-4" /> Xem {list.length} ảnh
          </button>
        )}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={title} size="xl">
        <div className="aspect-[16/10] overflow-hidden rounded-lg bg-ink">
          <img src={list[active]} alt={`${title} - ảnh ${active + 1}`} className="h-full w-full object-contain" />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {list.map((src, index) => (
            <button
              key={`${src}-thumb-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 ${index === active ? 'border-primary' : 'border-transparent opacity-70'}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

function ReviewItem({ review, ownerName }) {
  return (
    <div className="py-5">
      <div className="flex items-center gap-3">
        <Avatar src={review.customer?.avatar} name={review.customer?.name} size="sm" />
        <div>
          <p className="text-sm font-semibold">{review.customer?.name || 'Khách'}</p>
          <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
        </div>
        <RatingStars value={review.rating} size="sm" className="ml-auto" />
      </div>
      {review.comment && <p className="mt-3 text-sm leading-relaxed text-ink">{review.comment}</p>}
      {review.ownerReply && (
        <div className="mt-3 rounded-lg border-l-2 border-primary bg-primary-light/60 px-4 py-3">
          <p className="text-xs font-semibold text-primary">
            Phản hồi từ chủ phòng {ownerName ? `(${ownerName})` : ''} {review.repliedAt ? `- ${formatDate(review.repliedAt)}` : ''}
          </p>
          <p className="mt-1 text-sm text-ink">{review.ownerReply}</p>
        </div>
      )}
    </div>
  );
}

export default function RoomDetailPage() {
  const { slug } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookedDates, setBookedDates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    client
      .get(`/rooms/${slug}`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data;
        setRoom(data);
        client
          .get(`/rooms/${data._id}/booked-dates`)
          .then((r) => !cancelled && setBookedDates(r.data.data || []))
          .catch(() => {});
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Không tìm thấy phòng')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!room?._id) return undefined;
    let ignore = false;
    setLoadingReviews(true);
    const params = { page: reviewPage, limit: 6 };
    if (reviewRating) params.rating = reviewRating;
    client
      .get(`/rooms/${room._id}/reviews`, { params })
      .then((res) => {
        if (ignore) return;
        const payload = res.data.data || {};
        const list = Array.isArray(payload) ? payload : payload.items || [];
        setReviews((prev) => (reviewPage === 1 ? list : [...prev, ...list]));
        if (payload.ratingBreakdown) setRatingBreakdown(payload.ratingBreakdown);
        setReviewTotalPages(res.data.pagination?.totalPages || 1);
        setReviewTotal(res.data.pagination?.total ?? list.length);
      })
      .catch(() => {})
      .finally(() => !ignore && setLoadingReviews(false));
    return () => {
      ignore = true;
    };
  }, [room?._id, reviewPage, reviewRating]);

  const changeReviewRating = (value) => {
    setReviewRating((prev) => (prev === value ? 0 : value));
    setReviewPage(1);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết phòng');
    } catch {
      toast.error('Không sao chép được liên kết');
    }
  };

  if (loading) return <Spinner fullPage label="Đang tải thông tin phòng..." />;

  if (error || !room) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={DoorOpen}
          title="Không tìm thấy phòng"
          description={error || 'Phòng có thể đã bị ẩn hoặc không còn tồn tại.'}
          action={
            <Link to="/rooms" className="btn btn-primary">
              Xem các phòng khác
            </Link>
          }
        />
      </div>
    );
  }

  const owner = room.owner || {};
  const breakdownTotal = Object.values(ratingBreakdown).reduce((sum, count) => sum + Number(count || 0), 0);
  const facts = [
    { icon: Users, label: `${room.maxGuests || 1} khách` },
    { icon: DoorOpen, label: `${room.bedrooms || 1} phòng ngủ` },
    { icon: BedDouble, label: `${room.beds || 1} giường` },
    { icon: Bath, label: `${room.bathrooms || 1} phòng tắm` },
  ];
  if (room.area) facts.push({ icon: Ruler, label: `${room.area} m²` });

  return (
    <div className="container-page py-6 lg:py-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link to="/rooms" className="flex items-center gap-1.5 text-sm text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleShare} className="btn btn-ghost btn-sm">
            <Share2 className="h-4 w-4" /> Chia sẻ
          </button>
          <FavoriteButton roomId={room._id} variant="button" className="btn-sm" />
          <ReportRoomButton room={room} />
        </div>
      </div>

      {room.status && room.status !== 'approved' && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
          Bản xem trước: phòng đang ở trạng thái "{ROOM_STATUS[room.status]?.label}". Khách hàng chưa thể thấy phòng này.
          {room.rejectReason && <span className="block">Lý do từ chối: {room.rejectReason}</span>}
        </div>
      )}

      <Gallery images={room.images || []} title={room.title} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-primary-light text-primary">{ROOM_TYPE_LABELS[room.roomType] || 'Homestay'}</span>
            {room.ratingCount > 0 && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-semibold">{Number(room.ratingAvg).toFixed(1)}</span>
                <span className="text-muted">· {room.ratingCount} đánh giá</span>
              </span>
            )}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">{room.title}</h1>
          <p className="mt-2 flex items-start gap-1.5 text-muted">
            <MapPin className="mt-1 h-4 w-4 shrink-0" />
            {[room.address, room.district, room.city].filter(Boolean).join(', ')}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-y border-line py-4">
            {facts.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2 text-sm">
                <Icon className="h-[18px] w-[18px] text-primary" /> {label}
              </span>
            ))}
          </div>

          <section className="py-8">
            <h2 className="font-serif text-xl font-semibold">Giới thiệu</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/90">{room.description || 'Chủ phòng chưa thêm mô tả.'}</p>
          </section>

          <section className="border-t border-line py-8">
            <h2 className="font-serif text-xl font-semibold">Tiện nghi</h2>
            {room.amenities?.length ? (
              <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {room.amenities.map((key) => (
                  <span key={key} className="flex items-center gap-3 text-sm">
                    <AmenityIcon name={key} className="h-5 w-5 text-primary" />
                    {AMENITY_LABELS[key] || key}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Chưa cập nhật tiện nghi.</p>
            )}
          </section>

          <section className="border-t border-line py-8">
            <h2 className="font-serif text-xl font-semibold">Nội quy và giờ giấc</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted">Nhận phòng từ</p>
                  <p className="font-semibold">{room.checkInTime || '14:00'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted">Trả phòng trước</p>
                  <p className="font-semibold">{room.checkOutTime || '12:00'}</p>
                </div>
              </div>
            </div>
            {room.rules && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/90">{room.rules}</p>}
          </section>

          <section className="border-t border-line py-8">
            <h2 className="font-serif text-xl font-semibold">Vị trí</h2>
            <p className="mb-4 mt-1 text-sm text-muted">{[room.address, room.district, room.city].filter(Boolean).join(', ')}</p>
            <RoomMap lat={room.location?.lat} lng={room.location?.lng} title={room.title} address={room.address} />
          </section>

          <section className="border-t border-line py-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-serif text-xl font-semibold">Đánh giá của khách</h2>
              {room.ratingCount > 0 && (
                <span className="flex items-center gap-2 text-sm">
                  <RatingStars value={room.ratingAvg} size="sm" />
                  <span className="font-semibold">{Number(room.ratingAvg).toFixed(1)}/5</span>
                  <span className="text-muted">· {breakdownTotal || reviewTotal || room.ratingCount} đánh giá</span>
                </span>
              )}
            </div>
            {breakdownTotal > 0 && (
              <div className="mt-5 grid gap-6 rounded-xl border border-line bg-white p-5 sm:grid-cols-[160px_1fr]">
                <div className="flex flex-col items-start justify-center sm:items-center sm:border-r sm:border-line sm:pr-6">
                  <span className="text-4xl font-semibold text-ink">{Number(room.ratingAvg || 0).toFixed(1)}</span>
                  <RatingStars value={room.ratingAvg} size="sm" className="mt-1" />
                  <span className="mt-1 text-xs text-muted">{breakdownTotal} đánh giá</span>
                </div>
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = Number(ratingBreakdown[star] || 0);
                    const percent = breakdownTotal ? Math.round((count / breakdownTotal) * 100) : 0;
                    const active = reviewRating === star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => changeReviewRating(star)}
                        disabled={count === 0 && !active}
                        aria-pressed={active}
                        className={`flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          active ? 'bg-primary-light text-primary' : 'hover:bg-sand'
                        }`}
                      >
                        <span className="flex w-12 shrink-0 items-center gap-1 font-medium">
                          {star} <Star className="h-3.5 w-3.5 fill-current" />
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                        </span>
                        <span className="w-14 shrink-0 text-right text-xs text-muted">
                          {count} ({percent}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {breakdownTotal > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted">Lọc theo:</span>
                {[0, 5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => changeReviewRating(star)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      reviewRating === star ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary'
                    }`}
                  >
                    {star ? `${star} sao (${ratingBreakdown[star] || 0})` : 'Tất cả'}
                  </button>
                ))}
              </div>
            )}
            {reviews.length === 0 && !loadingReviews ? (
              <EmptyState
                icon={MessageSquareText}
                title={reviewRating ? `Chưa có đánh giá ${reviewRating} sao` : 'Chưa có đánh giá'}
                description={
                  reviewRating
                    ? 'Thử chọn mức sao khác hoặc xem tất cả đánh giá.'
                    : 'Phòng này chưa có đánh giá nào. Hãy là người đầu tiên lưu trú và chia sẻ cảm nhận.'
                }
                className="mt-4"
              />
            ) : (
              <div className="divide-y divide-line">
                {reviews.map((review) => (
                  <ReviewItem key={review._id} review={review} ownerName={owner.name} />
                ))}
              </div>
            )}
            {reviewPage < reviewTotalPages && (
              <button type="button" onClick={() => setReviewPage((prev) => prev + 1)} disabled={loadingReviews} className="btn btn-outline mt-2">
                {loadingReviews ? 'Đang tải...' : 'Xem thêm đánh giá'}
              </button>
            )}
          </section>

          <section className="border-t border-line py-8">
            <h2 className="font-serif text-xl font-semibold">Chủ phòng</h2>
            <div className="card mt-4 flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
              {owner._id ? (
                <Link to={`/hosts/${owner._id}`} className="shrink-0" aria-label={`Xem hồ sơ ${owner.name || 'chủ phòng'}`}>
                  <Avatar src={owner.avatar} name={owner.name} size="lg" />
                </Link>
              ) : (
                <Avatar src={owner.avatar} name={owner.name} size="lg" />
              )}
              <div className="flex-1">
                {owner._id ? (
                  <Link to={`/hosts/${owner._id}`} className="text-lg font-semibold text-ink hover:text-primary hover:underline">
                    {owner.name || 'Chủ phòng'}
                  </Link>
                ) : (
                  <p className="text-lg font-semibold">{owner.name || 'Chủ phòng'}</p>
                )}
                {owner.createdAt && (
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    <CalendarDays className="h-4 w-4" /> Tham gia từ tháng {dayjs(owner.createdAt).format('M/YYYY')}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {owner.phone && (
                    <a href={`tel:${owner.phone}`} className="flex items-center gap-1.5 text-primary hover:underline">
                      <Phone className="h-4 w-4" /> {owner.phone}
                    </a>
                  )}
                  {owner.email && (
                    <a href={`mailto:${owner.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                      <Mail className="h-4 w-4" /> {owner.email}
                    </a>
                  )}
                </div>
                <MessageButton recipientId={owner._id} roomId={room._id} label="Nhắn tin cho chủ phòng" className="mt-3" />
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingBox room={room} bookedDates={bookedDates} />
        </aside>
      </div>
      <SimilarRooms room={room} />
    </div>
  );
}
