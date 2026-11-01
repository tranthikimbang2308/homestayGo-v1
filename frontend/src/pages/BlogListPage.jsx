import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Newspaper, Search, X } from 'lucide-react';
import client from '../api/client.js';
import Pagination from '../components/ui/Pagination.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { FALLBACK_IMAGE } from '../utils/constants.js';
import { formatDate } from '../utils/format.js';
import { POST_CATEGORIES, PostCard, postCategoryLabel } from './BlogDetailPage.jsx';

const TABS = [{ value: '', label: 'Tất cả' }, ...POST_CATEGORIES];

function PostSkeleton() {
  return (
    <div>
      <div className="aspect-[4/3] animate-pulse rounded-xl bg-line/60" />
      <div className="mt-4 h-3 w-24 animate-pulse rounded bg-line/60" />
      <div className="mt-3 h-5 w-full animate-pulse rounded bg-line/60" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-line/60" />
    </div>
  );
}

export default function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const keyword = searchParams.get('keyword') || '';
  const page = Number(searchParams.get('page')) || 1;
  const [input, setInput] = useState(keyword);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInput(keyword);
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    client
      .get('/posts', { params: { category: category || undefined, keyword: keyword || undefined, page, limit: 10 } })
      .then((res) => {
        if (cancelled) return;
        setPosts(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, keyword, page]);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!('page' in changes)) next.delete('page');
    setSearchParams(next);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    updateParams({ keyword: input.trim() });
  };

  const changePage = (value) => {
    updateParams({ page: value > 1 ? String(value) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showFeatured = !loading && page === 1 && !category && !keyword && posts.length > 3;
  const featured = showFeatured ? posts[0] : null;
  const rest = showFeatured ? posts.slice(1) : posts;

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Cẩm nang du lịch</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Đi đâu, ở đâu, ăn gì</h1>
          <p className="mt-3 text-muted">Kinh nghiệm thực tế, gợi ý lịch trình và những điều nên biết trước khi xách ba lô lên đường.</p>
        </div>
        <form onSubmit={submitSearch} className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tìm bài viết, điểm đến"
            className="input pl-9 pr-24"
            aria-label="Tìm bài viết"
          />
          <button type="submit" className="btn btn-primary btn-sm absolute right-1.5 top-1/2 -translate-y-1/2">Tìm</button>
        </form>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {TABS.map((tab) => {
            const active = tab.value === category;
            return (
              <button
                key={tab.value || 'all'}
                type="button"
                onClick={() => updateParams({ category: tab.value })}
                className={`shrink-0 rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors ${active ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary hover:text-primary'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {keyword && (
          <button type="button" onClick={() => updateParams({ keyword: '' })} className="flex items-center gap-1.5 text-sm text-muted hover:text-primary">
            Kết quả cho "{keyword}" <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <PostSkeleton key={index} />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Newspaper}
          title="Chưa có bài viết phù hợp"
          description="Thử từ khóa khác hoặc xem tất cả danh mục."
          action={<button type="button" className="btn btn-outline" onClick={() => setSearchParams({})}>Xem tất cả bài viết</button>}
        />
      ) : (
        <>
          {featured && (
            <Link
              to={`/blog/${featured.slug}`}
              className="group mt-8 grid gap-6 rounded-xl border border-line bg-white p-4 sm:p-5 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-10"
            >
              <div className="aspect-[16/10] overflow-hidden rounded-lg bg-sand-dark">
                <img src={featured.coverImage || FALLBACK_IMAGE} alt={featured.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="lg:pr-6">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="font-semibold uppercase tracking-wide text-primary">{postCategoryLabel(featured.category)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatDate(featured.createdAt)}</span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold leading-snug group-hover:text-primary sm:text-[1.75rem]">{featured.title}</h2>
                {featured.excerpt && <p className="mt-3 text-muted">{featured.excerpt}</p>}
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Đọc bài viết <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )}
          <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => <PostCard key={post._id} post={post} />)}
          </div>
          <Pagination page={pagination.page || page} totalPages={pagination.totalPages} onChange={changePage} />
        </>
      )}
    </div>
  );
}
