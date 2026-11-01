import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ExternalLink, Newspaper, Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { formatDate, formatNumber } from '../../utils/format';
import { POST_CATEGORIES, postCategoryLabel } from '../BlogDetailPage';
import { PageHeader, SearchBox, FilterTabs, StatusPill, errorMessage, TABLE_CLASS, TH_CLASS, TD_CLASS } from '../owner/dashboardShared';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'published', label: 'Đang hiển thị' },
  { value: 'draft', label: 'Bản nháp' },
];

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts/admin/all', {
        params: { status: status || undefined, category: category || undefined, keyword: appliedKeyword || undefined, page, limit: 10 },
      });
      setPosts(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được danh sách bài viết'));
    } finally {
      setLoading(false);
    }
  }, [status, category, appliedKeyword, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedKeyword(keyword.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const togglePublish = async (post) => {
    setBusyId(post._id);
    try {
      await api.put(`/posts/${post._id}`, { isPublished: !post.isPublished });
      toast.success(post.isPublished ? 'Đã chuyển bài viết về bản nháp' : 'Đã hiển thị bài viết');
      fetchPosts();
    } catch (error) {
      toast.error(errorMessage(error, 'Không cập nhật được bài viết'));
    } finally {
      setBusyId('');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting._id);
    try {
      await api.delete(`/posts/${deleting._id}`);
      toast.success('Đã xóa bài viết');
      setDeleting(null);
      if (posts.length === 1 && page > 1) setPage(page - 1);
      else fetchPosts();
    } catch (error) {
      toast.error(errorMessage(error, 'Không xóa được bài viết'));
    } finally {
      setBusyId('');
    }
  };

  const filtered = Boolean(status || category || appliedKeyword);

  return (
    <div>
      <PageHeader
        title="Bài viết cẩm nang"
        description={`Quản lý nội dung chuyên mục Cẩm nang du lịch${pagination.total ? ` · ${pagination.total} bài viết` : ''}.`}
        actions={<Button to="/admin/posts/new" icon={Plus}>Viết bài mới</Button>}
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          options={STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="input py-2 sm:w-44"
            aria-label="Lọc theo danh mục"
          >
            <option value="">Mọi danh mục</option>
            {POST_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <SearchBox value={keyword} onChange={setKeyword} placeholder="Tiêu đề, thẻ" />
        </div>
      </div>

      {loading ? (
        <Spinner fullPage />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={filtered ? 'Không có bài viết phù hợp' : 'Chưa có bài viết nào'}
          description={filtered ? 'Thử đổi bộ lọc hoặc từ khóa.' : 'Bắt đầu chia sẻ kinh nghiệm du lịch cho khách hàng.'}
          action={!filtered && <Button to="/admin/posts/new" icon={Plus}>Viết bài mới</Button>}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead className="bg-sand/60">
                  <tr>
                    <th className={TH_CLASS}>Bài viết</th>
                    <th className={TH_CLASS}>Danh mục</th>
                    <th className={`${TH_CLASS} text-right`}>Lượt xem</th>
                    <th className={`${TH_CLASS} hidden xl:table-cell`}>Ngày đăng</th>
                    <th className={TH_CLASS}>Trạng thái</th>
                    <th className={`${TH_CLASS} text-right`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {posts.map((post) => (
                    <tr key={post._id} className="hover:bg-sand/40">
                      <td className={TD_CLASS}>
                        <Link to={`/admin/posts/${post._id}/edit`} className="flex min-w-[16rem] max-w-[26rem] items-center gap-3">
                          {post.coverImage ? (
                            <img src={post.coverImage} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
                          ) : (
                            <div className="h-12 w-16 shrink-0 rounded-md bg-sand" />
                          )}
                          <div className="min-w-0">
                            <p className="line-clamp-2 font-medium hover:text-primary">{post.title}</p>
                            {post.tags?.length > 0 && <p className="line-clamp-1 text-xs text-muted">{post.tags.join(', ')}</p>}
                          </div>
                        </Link>
                      </td>
                      <td className={`${TD_CLASS} whitespace-nowrap`}>{postCategoryLabel(post.category)}</td>
                      <td className={`${TD_CLASS} text-right`}>{formatNumber(post.views)}</td>
                      <td className={`${TD_CLASS} hidden whitespace-nowrap xl:table-cell`}>{formatDate(post.createdAt)}</td>
                      <td className={TD_CLASS}>
                        <StatusPill status={post.isPublished ? 'approved' : 'hidden'}>{post.isPublished ? 'Đang hiển thị' : 'Bản nháp'}</StatusPill>
                      </td>
                      <td className={TD_CLASS}>
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                          {post.isPublished && (
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Xem trên trang">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <Button size="sm" variant="ghost" icon={post.isPublished ? EyeOff : Eye} disabled={busyId === post._id} onClick={() => togglePublish(post)}>
                            {post.isPublished ? 'Ẩn' : 'Hiện'}
                          </Button>
                          <Button size="sm" variant="outline" icon={Pencil} to={`/admin/posts/${post._id}/edit`}>Sửa</Button>
                          <Button size="sm" variant="ghost" className="text-danger hover:bg-red-50" icon={Trash2} onClick={() => setDeleting(post)} aria-label="Xóa bài viết" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page || page} totalPages={pagination.totalPages} onChange={setPage} />
        </>
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Xóa bài viết"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>Hủy</Button>
            <Button variant="danger" loading={busyId === deleting?._id} onClick={confirmDelete}>Xóa bài viết</Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Bài viết <span className="font-medium text-ink">{deleting?.title}</span> sẽ bị xóa vĩnh viễn và không thể khôi phục. Nếu chỉ muốn tạm ẩn, hãy chuyển về bản nháp.
        </p>
      </Modal>
    </div>
  );
}
