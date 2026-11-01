import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, PenLine, Save } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import ImageUploader from '../../components/ImageUploader';
import { POST_CATEGORIES, PostContent, readingMinutes } from '../BlogDetailPage';
import { PageHeader, Panel, errorMessage } from '../owner/dashboardShared';

const EMPTY_FORM = { title: '', excerpt: '', content: '', coverImage: '', category: 'kinh-nghiem', tags: '', isPublished: true };

const CONTENT_HINT = 'Cách dòng trống để tách đoạn. Dòng bắt đầu bằng "## " là tiêu đề mục, "- " là gạch đầu dòng, "1. " là danh sách đánh số.';

export default function AdminPostFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('write');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoading(true);
    api
      .get(`/posts/admin/${id}`)
      .then((res) => {
        if (cancelled) return;
        const post = res.data.data;
        setSlug(post.slug);
        setForm({
          title: post.title || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          coverImage: post.coverImage || '',
          category: post.category || 'kinh-nghiem',
          tags: (post.tags || []).join(', '),
          isPublished: Boolean(post.isPublished),
        });
      })
      .catch((error) => {
        toast.error(errorMessage(error, 'Không tải được bài viết'));
        navigate('/admin/posts', { replace: true });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate]);

  const update = (field) => (event) => {
    const value = event?.target ? (event.target.type === 'checkbox' ? event.target.checked : event.target.value) : event;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Vui lòng nhập tiêu đề';
    else if (form.title.trim().length > 200) next.title = 'Tiêu đề tối đa 200 ký tự';
    if (form.excerpt.length > 500) next.excerpt = 'Tóm tắt tối đa 500 ký tự';
    if (form.content.trim().length < 50) next.content = 'Nội dung cần tối thiểu 50 ký tự';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      setTab('write');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    };
    try {
      if (isEdit) {
        await api.put(`/posts/${id}`, payload);
        toast.success('Đã cập nhật bài viết');
      } else {
        await api.post('/posts', payload);
        toast.success('Đã tạo bài viết');
      }
      navigate('/admin/posts');
    } catch (error) {
      toast.error(errorMessage(error, 'Không lưu được bài viết'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Link to="/admin/posts" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Danh sách bài viết
      </Link>
      <PageHeader
        title={isEdit ? 'Sửa bài viết' : 'Viết bài mới'}
        description={isEdit && slug ? `Đường dẫn: /blog/${slug}` : 'Bài viết hiển thị tại chuyên mục Cẩm nang du lịch.'}
        actions={
          <>
            <Button variant="outline" to="/admin/posts">Hủy</Button>
            <Button type="submit" icon={Save} loading={saving}>{isEdit ? 'Lưu thay đổi' : 'Đăng bài'}</Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel>
            <div className="space-y-4">
              <Input label="Tiêu đề" value={form.title} onChange={update('title')} error={errors.title} maxLength={200} placeholder="VD: Kinh nghiệm du lịch Đà Lạt 3 ngày 2 đêm" />
              <Textarea
                label="Tóm tắt"
                rows={3}
                value={form.excerpt}
                onChange={update('excerpt')}
                error={errors.excerpt}
                hint={`${form.excerpt.length}/500 ký tự · hiển thị ở danh sách bài viết`}
                maxLength={500}
              />
            </div>
          </Panel>

          <section className="rounded-xl border border-line bg-white">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <div className="flex gap-1">
                {[
                  { key: 'write', label: 'Soạn thảo', icon: PenLine },
                  { key: 'preview', label: 'Xem trước', icon: Eye },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${tab === key ? 'bg-primary-light text-primary' : 'text-muted hover:text-ink'}`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted">Khoảng {readingMinutes(form.content)} phút đọc</span>
            </header>
            <div className="p-5">
              {tab === 'write' ? (
                <Textarea
                  label="Nội dung"
                  rows={20}
                  value={form.content}
                  onChange={update('content')}
                  error={errors.content}
                  hint={CONTENT_HINT}
                  className="font-sans leading-relaxed"
                  placeholder={'Đoạn mở đầu...\n\n## Tiêu đề mục\n\nNội dung mục...'}
                />
              ) : form.content.trim() ? (
                <div className="mx-auto max-w-2xl py-2">
                  <h1 className="text-2xl font-semibold">{form.title || 'Chưa có tiêu đề'}</h1>
                  {form.excerpt && <p className="mt-2 text-muted">{form.excerpt}</p>}
                  {form.coverImage && <img src={form.coverImage} alt="" className="mt-5 aspect-[16/9] w-full rounded-xl object-cover" />}
                  <PostContent content={form.content} className="mt-6" />
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted">Chưa có nội dung để xem trước.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <Panel title="Xuất bản">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={form.isPublished} onChange={update('isPublished')} className="mt-1 h-4 w-4 accent-primary" />
              <span>
                <span className="block text-sm font-medium">Hiển thị công khai</span>
                <span className="block text-xs text-muted">Bỏ chọn để lưu dưới dạng bản nháp.</span>
              </span>
            </label>
          </Panel>
          <Panel title="Phân loại">
            <div className="space-y-4">
              <Select label="Danh mục" value={form.category} onChange={update('category')} options={POST_CATEGORIES} />
              <Input label="Thẻ" value={form.tags} onChange={update('tags')} placeholder="Đà Lạt, săn mây" hint="Cách nhau bằng dấu phẩy, tối đa 10 thẻ" />
            </div>
          </Panel>
          <Panel title="Ảnh bìa" bodyClassName="p-5 [&_.grid]:!grid-cols-1">
            <ImageUploader
              value={form.coverImage ? [form.coverImage] : []}
              onChange={(urls) => update('coverImage')(urls[0] || '')}
              multiple={false}
            />
            <Input
              containerClassName="mt-3"
              label="Hoặc dán đường dẫn ảnh"
              value={form.coverImage}
              onChange={update('coverImage')}
              placeholder="https://..."
            />
          </Panel>
        </div>
      </div>
    </form>
  );
}
