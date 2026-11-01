import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquareText, CornerDownRight, Pencil, Send } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import RatingStars from '../../components/ui/RatingStars';
import { formatDate, initials } from '../../utils/format';
import { PageHeader, FilterTabs, errorMessage } from './dashboardShared';

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'unreplied', label: 'Chưa phản hồi' },
  { value: 'replied', label: 'Đã phản hồi' },
];

function ReviewItem({ review, onReplied }) {
  const [editing, setEditing] = useState(!review.ownerReply);
  const [reply, setReply] = useState(review.ownerReply || '');
  const [saving, setSaving] = useState(false);
  const customer = review.customer || {};

  const submit = async (event) => {
    event.preventDefault();
    if (!reply.trim()) {
      toast.error('Nhập nội dung phản hồi');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/owner/reviews/${review._id}/reply`, { reply: reply.trim() });
      toast.success('Đã gửi phản hồi');
      onReplied({ ...review, ...(res.data.data || {}), ownerReply: reply.trim(), repliedAt: res.data.data?.repliedAt || new Date().toISOString(), customer: review.customer, room: review.room });
      setEditing(false);
    } catch (error) {
      toast.error(errorMessage(error, 'Không gửi được phản hồi'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-start gap-3">
        {customer.avatar ? (
          <img src={customer.avatar} alt={customer.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
            {initials(customer.name || 'K')}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="font-medium text-ink">{customer.name || 'Khách hàng'}</p>
            <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <RatingStars value={review.rating} size="sm" />
            <span className="text-xs text-muted">·</span>
            <span className="truncate text-xs font-medium text-primary">{review.room?.title}</span>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">{review.comment || 'Khách không để lại nhận xét.'}</p>

          {review.ownerReply && !editing && (
            <div className="mt-4 rounded-lg border-l-2 border-primary bg-primary-light/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  <CornerDownRight className="h-3.5 w-3.5" />
                  Phản hồi của bạn
                </p>
                <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary">
                  <Pencil className="h-3.5 w-3.5" />
                  Sửa
                </button>
              </div>
              <p className="mt-1.5 whitespace-pre-line text-sm text-ink">{review.ownerReply}</p>
              {review.repliedAt && <p className="mt-1 text-xs text-muted">{formatDate(review.repliedAt)}</p>}
            </div>
          )}

          {editing && (
            <form onSubmit={submit} className="mt-4">
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={3}
                className="input resize-y"
                placeholder="Cảm ơn khách, giải đáp góp ý hoặc mời khách quay lại..."
                maxLength={1000}
              />
              <div className="mt-2 flex justify-end gap-2">
                {review.ownerReply && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReply(review.ownerReply);
                      setEditing(false);
                    }}
                  >
                    Hủy
                  </Button>
                )}
                <Button size="sm" type="submit" icon={Send} loading={saving}>
                  Gửi phản hồi
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}

export default function OwnerReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/owner/reviews', { params: { page, limit: 20 } });
      setReviews(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được đánh giá'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const summary = useMemo(() => {
    const total = reviews.length;
    const average = total ? reviews.reduce((sum, item) => sum + (item.rating || 0), 0) / total : 0;
    const unreplied = reviews.filter((item) => !item.ownerReply).length;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((item) => Math.round(item.rating) === star).length }));
    return { total, average, unreplied, distribution };
  }, [reviews]);

  const visible = reviews.filter((item) => (filter === 'unreplied' ? !item.ownerReply : filter === 'replied' ? Boolean(item.ownerReply) : true));

  const handleReplied = (updated) => setReviews((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));

  return (
    <div>
      <PageHeader title="Đánh giá" description="Đọc nhận xét của khách và phản hồi công khai trên trang phòng." />

      {loading ? (
        <Spinner fullPage />
      ) : reviews.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="Chưa có đánh giá nào" description="Khách đánh giá được sau khi hoàn thành lưu trú." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <aside className="h-fit rounded-xl border border-line bg-white p-5 lg:sticky lg:top-20">
            <p className="text-sm text-muted">Điểm trung bình</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="font-serif text-4xl font-semibold text-ink">{summary.average.toFixed(1)}</span>
              <span className="pb-1.5 text-sm text-muted">/ 5</span>
            </div>
            <RatingStars value={summary.average} size="md" className="mt-1" />
            <p className="mt-1 text-xs text-muted">{summary.total} đánh giá</p>
            <ul className="mt-4 space-y-1.5">
              {summary.distribution.map((item) => (
                <li key={item.star} className="grid grid-cols-[1.5rem_1fr_1.5rem] items-center gap-2 text-xs text-muted">
                  <span>{item.star}★</span>
                  <span className="h-1.5 rounded-full bg-sand">
                    <span className="block h-1.5 rounded-full bg-accent" style={{ width: `${summary.total ? (item.count / summary.total) * 100 : 0}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{item.count}</span>
                </li>
              ))}
            </ul>
            {summary.unreplied > 0 && (
              <p className="mt-4 rounded-lg bg-accent-light px-3 py-2 text-xs text-accent-dark">{summary.unreplied} đánh giá đang chờ bạn phản hồi</p>
            )}
          </aside>

          <div>
            <div className="mb-4">
              <FilterTabs
                options={FILTERS}
                value={filter}
                onChange={setFilter}
                counts={{ all: summary.total, unreplied: summary.unreplied, replied: summary.total - summary.unreplied }}
              />
            </div>
            {visible.length === 0 ? (
              <EmptyState title="Không có đánh giá trong mục này" />
            ) : (
              <div className="space-y-4">
                {visible.map((review) => (
                  <ReviewItem key={review._id} review={review} onReplied={handleReplied} />
                ))}
              </div>
            )}
            <Pagination page={pagination.page || page} totalPages={pagination.totalPages} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
