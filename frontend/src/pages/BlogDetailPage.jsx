import { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarDays, Eye, Link2, Newspaper, Tag } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { FALLBACK_IMAGE } from '../utils/constants.js';
import { formatDate, formatNumber } from '../utils/format.js';

export const POST_CATEGORIES = [
  { value: 'kinh-nghiem', label: 'Kinh nghiệm' },
  { value: 'diem-den', label: 'Điểm đến' },
  { value: 'am-thuc', label: 'Ẩm thực' },
  { value: 'tin-tuc', label: 'Tin tức' },
];

export const postCategoryLabel = (value) => POST_CATEGORIES.find((item) => item.value === value)?.label || value || '';

export const readingMinutes = (text = '') => Math.max(1, Math.round(String(text).trim().split(/\s+/).length / 220));

const ORDERED_LINE = /^\d+[.)]\s+/;
const BULLET_LINE = /^[-*]\s+/;

const parseBlocks = (content = '') =>
  String(content)
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (lines.length === 1 && lines[0].startsWith('### ')) return { type: 'h3', text: lines[0].slice(4) };
      if (lines.length === 1 && lines[0].startsWith('## ')) return { type: 'h2', text: lines[0].slice(3) };
      if (lines.every((line) => ORDERED_LINE.test(line))) return { type: 'ol', items: lines.map((line) => line.replace(ORDERED_LINE, '')) };
      if (lines.every((line) => BULLET_LINE.test(line))) return { type: 'ul', items: lines.map((line) => line.replace(BULLET_LINE, '')) };
      return { type: 'p', lines };
    });

export function PostContent({ content, className = '' }) {
  const blocks = parseBlocks(content);
  return (
    <div className={`space-y-5 text-[16px] leading-[1.8] text-ink ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === 'h2') return <h2 key={index} className="pt-4 text-xl font-semibold sm:text-2xl">{block.text}</h2>;
        if (block.type === 'h3') return <h3 key={index} className="pt-2 text-lg font-semibold">{block.text}</h3>;
        if (block.type === 'ol') {
          return (
            <ol key={index} className="list-decimal space-y-2 pl-6 marker:font-semibold marker:text-primary">
              {block.items.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6 marker:text-primary">
              {block.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          );
        }
        return (
          <p key={index}>
            {block.lines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function PostCard({ post, compact = false }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group flex flex-col">
      <div className={`overflow-hidden rounded-xl bg-sand-dark ${compact ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
        <img
          src={post.coverImage || FALLBACK_IMAGE}
          alt={post.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span className="font-semibold uppercase tracking-wide text-primary">{postCategoryLabel(post.category)}</span>
        <span aria-hidden="true">·</span>
        <span>{formatDate(post.createdAt)}</span>
      </div>
      <h3 className={`mt-2 font-semibold leading-snug text-ink group-hover:text-primary ${compact ? 'text-base' : 'text-lg'}`}>{post.title}</h3>
      {!compact && post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>}
    </Link>
  );
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    client
      .get(`/posts/${slug}`)
      .then((res) => {
        if (!cancelled) setPost(res.data.data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Không tải được bài viết'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (post?.title) document.title = `${post.title} | HomestayGo`;
    return () => {
      document.title = 'HomestayGo';
    };
  }, [post?.title]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết bài viết');
    } catch {
      toast.error('Không sao chép được liên kết');
    }
  };

  if (loading) return <Spinner fullPage />;

  if (error || !post) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Newspaper}
          title="Không tìm thấy bài viết"
          description={error || 'Bài viết có thể đã bị gỡ hoặc đường dẫn không đúng.'}
          action={<Link to="/blog" className="btn btn-primary">Về trang Cẩm nang</Link>}
        />
      </div>
    );
  }

  const related = post.related || [];

  return (
    <article className="pb-4">
      <div className="container-page pt-6 lg:pt-8">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Cẩm nang du lịch
        </Link>
        <header className="mx-auto mt-6 max-w-3xl">
          <Link to={`/blog?category=${post.category}`} className="text-xs font-semibold uppercase tracking-[0.12em] text-primary hover:underline">
            {postCategoryLabel(post.category)}
          </Link>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-lg text-muted">{post.excerpt}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line py-3 text-sm text-muted">
            <span className="font-medium text-ink">{post.author?.name || 'HomestayGo'}</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDate(post.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{formatNumber(post.views)} lượt xem</span>
            <span>{readingMinutes(post.content)} phút đọc</span>
            <button type="button" onClick={copyLink} className="ml-auto flex items-center gap-1.5 text-ink hover:text-primary">
              <Link2 className="h-4 w-4" /> Sao chép liên kết
            </button>
          </div>
        </header>
      </div>

      {post.coverImage && (
        <div className="container-page mt-8">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-xl bg-sand-dark">
            <img src={post.coverImage} alt={post.title} className="aspect-[16/9] w-full object-cover" />
          </div>
        </div>
      )}

      <div className="container-page mt-10">
        <div className="mx-auto max-w-3xl">
          <PostContent content={post.content} />
          {post.tags?.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
              <Tag className="h-4 w-4 text-muted" />
              {post.tags.map((tag) => (
                <Link key={tag} to={`/blog?keyword=${encodeURIComponent(tag)}`} className="rounded-full border border-line bg-white px-3 py-1 text-xs text-ink hover:border-primary hover:text-primary">
                  {tag}
                </Link>
              ))}
            </div>
          )}
          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-line bg-white p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold">Sẵn sàng cho chuyến đi?</p>
              <p className="text-sm text-muted">Tìm homestay phù hợp và đặt phòng trực tiếp với chủ nhà.</p>
            </div>
            <Link to="/rooms" className="btn btn-primary shrink-0">Tìm homestay</Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-page mt-16">
          <div className="mb-6 flex items-end justify-between gap-4 border-t border-line pt-10">
            <h2 className="section-title">Bài viết liên quan</h2>
            <Link to={`/blog?category=${post.category}`} className="text-sm font-medium text-primary hover:underline">Xem thêm</Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => <PostCard key={item._id} post={item} compact />)}
          </div>
        </section>
      )}
    </article>
  );
}
