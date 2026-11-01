import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, MessageSquareText, Star } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import RatingStars from '../../components/ui/RatingStars';
import Avatar from '../../components/Avatar';
import { formatDate, formatDateTime } from '../../utils/format';
import { PageHeader, SearchBox, FilterTabs, errorMessage } from '../owner/dashboardShared';

const VISIBILITY_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'false', label: 'Đang hiển thị' },
  { value: 'true', label: 'Đã ẩn' },
];

const QUICK_REASONS = ['Ngôn từ xúc phạm, thiếu văn hóa', 'Chứa thông tin cá nhân', 'Quảng cáo, spam', 'Nội dung không liên quan đến phòng'];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [visibility, setVisibility] = useState('');
  const [rating, setRating] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [hiding, setHiding] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/moderation/reviews', {
        params: { isHidden: visibility || undefined, rating: rating || undefined, keyword: appliedKeyword || undefined, page, limit: 10 },
      });
      setReviews(res.data.data || []);
      setHiddenCount(res.data.hiddenCount || 0);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được danh sách đánh giá'));
    } finally {
      setLoading(false);
    }
  }, [visibility, rating, appliedKeyword, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedKeyword(keyword.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const openHide = (review) => {
    setHiding(review);
    setReason('');
    setReasonError('');
  };

  const submitHide = async () => {
    if (!reason.trim()) {
      setReasonError('Vui lòng nhập lý do ẩn đánh giá');
      return;
    }
    setBusyId(hiding._id);
    try {
      const res = await api.patch(`/moderation/reviews/${hiding._id}/hide`, { reason: reason.trim() });
      const roomInfo = res.data.data?.room;
      toast.success(roomInfo ? `Đã ẩn đánh giá. Điểm phòng hiện là ${Number(roomInfo.ratingAvg || 0).toFixed(1)}` : 'Đã ẩn đánh giá');
      setHiding(null);
      fetchReviews();
    } catch (error) {
      toast.error(errorMessage(error, 'Không ẩn được đánh giá'));
    } finally {
      setBusyId('');
    }
  };

  const showReview = async (review) => {
    setBusyId(review._id);
    try {
      const res = await api.patch(`/moderation/reviews/${review._id}/show`);
      const roomInfo = res.data.data?.room;
      toast.success(roomInfo ? `Đã hiện lại đánh giá. Điểm phòng hiện là ${Number(roomInfo.ratingAvg || 0).toFixed(1)}` : 'Đã hiện lại đánh giá');
      fetchReviews();
    } catch (error) {
      toast.error(errorMessage(error, 'Không hiện lại được đánh giá'));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <PageHeader
        title="Kiểm duyệt đánh giá"
        description={`Ẩn những đánh giá vi phạm tiêu chuẩn cộng đồng. Đánh giá bị ẩn không tính vào điểm trung bình của phòng${hiddenCount ? ` · ${hiddenCount} đánh giá đang ẩn` : ''}.`}
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          options={VISIBILITY_OPTIONS}
          value={visibility}
          onChange={(value) => {
            setVisibility(value);
            setPage(1);
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={rating}
            onChange={(event) => {
              setRating(event.target.value);
              setPage(1);
            }}
            className="input py-2 sm:w-36"
            aria-label="Lọc theo số sao"
          >
            <option value="">Mọi số sao</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>{value} sao</option>
            ))}
          </select>
          <SearchBox value={keyword} onChange={setKeyword} placeholder="Nội dung, phòng, khách" />
        </div>
      </div>

      {loading ? (
        <Spinner fullPage />
      ) : reviews.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="Không có đánh giá phù hợp" description="Thử đổi bộ lọc hoặc từ khóa." />
      ) : (
        <>
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review._id} className={`rounded-xl border bg-white p-5 ${review.isHidden ? 'border-dashed border-line' : 'border-line'}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar src={review.customer?.avatar} name={review.customer?.name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium">{review.customer?.name || 'Khách hàng'}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <RatingStars value={review.rating} size="sm" />
                        <span>{formatDate(review.createdAt)}</span>
                        {review.room && (
                          <a href={`/rooms/${review.room.slug}`} target="_blank" rel="noreferrer" className="max-w-[18rem] truncate hover:text-primary">
                            {review.room.title}
                          </a>
                        )}
                        {review.room && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current text-primary" />
                            {Number(review.room.ratingAvg || 0).toFixed(1)} ({review.room.ratingCount || 0})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {review.isHidden ? (
                      <Button size="sm" variant="outline" icon={Eye} loading={busyId === review._id} onClick={() => showReview(review)}>Hiện lại</Button>
                    ) : (
                      <Button size="sm" variant="ghost" icon={EyeOff} disabled={busyId === review._id} onClick={() => openHide(review)}>Ẩn</Button>
                    )}
                  </div>
                </div>
                <p className={`mt-3 whitespace-pre-line text-sm leading-relaxed ${review.isHidden ? 'text-muted' : 'text-ink'}`}>
                  {review.comment || <span className="text-muted">Khách không để lại nhận xét.</span>}
                </p>
                {review.ownerReply && (
                  <div className="mt-3 border-l-2 border-line pl-3 text-sm text-muted">
                    <span className="font-medium text-ink">Phản hồi của chủ phòng: </span>
                    {review.ownerReply}
                  </div>
                )}
                {review.isHidden && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-sand px-3 py-2 text-xs text-muted">
                    <EyeOff className="h-3.5 w-3.5" />
                    <span className="font-medium text-ink">Đã ẩn{review.hiddenAt ? ` lúc ${formatDateTime(review.hiddenAt)}` : ''}</span>
                    {review.hiddenReason && <span>· {review.hiddenReason}</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <Pagination page={pagination.page || page} totalPages={pagination.totalPages} onChange={setPage} />
        </>
      )}

      <Modal
        open={Boolean(hiding)}
        onClose={() => setHiding(null)}
        title="Ẩn đánh giá"
        footer={
          <>
            <Button variant="outline" onClick={() => setHiding(null)}>Hủy</Button>
            <Button variant="danger" loading={busyId === hiding?._id} onClick={submitHide}>Ẩn đánh giá</Button>
          </>
        }
      >
        {hiding && (
          <>
            <div className="mb-4 rounded-lg bg-sand px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{hiding.customer?.name}</span>
                <RatingStars value={hiding.rating} size="xs" />
              </div>
              <p className="mt-1 line-clamp-3 text-muted">{hiding.comment || 'Không có nhận xét.'}</p>
            </div>
            <p className="mb-2 text-sm font-medium">Lý do thường gặp</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_REASONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setReason(item);
                    setReasonError('');
                  }}
                  className={`rounded-full border px-3 py-1 text-xs ${reason === item ? 'border-primary bg-primary-light text-primary' : 'border-line text-ink hover:border-primary/40'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Textarea
              label="Lý do ẩn"
              rows={3}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError) setReasonError('');
              }}
              error={reasonError}
              hint="Đánh giá bị ẩn sẽ không hiển thị trên trang phòng và không tính vào điểm trung bình."
            />
          </>
        )}
      </Modal>
    </div>
  );
}
