import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import client from '../../api/client.js';
import { PostCard } from '../../pages/BlogDetailPage.jsx';

export default function LatestPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    client
      .get('/posts', { params: { limit: 3 } })
      .then((res) => {
        if (!cancelled) setPosts(res.data.data || []);
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
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="container-page py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Cẩm nang du lịch</p>
          <h2 className="section-title mt-2">Đọc trước khi lên đường</h2>
        </div>
        <Link to="/blog" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Xem tất cả bài viết <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {loading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index}>
              <div className="aspect-[4/3] animate-pulse rounded-xl bg-line/60" />
              <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-line/60" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => <PostCard key={post._id} post={post} />)}
        </div>
      )}
    </section>
  );
}
