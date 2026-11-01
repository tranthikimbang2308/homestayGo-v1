import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Archive, Inbox, Mail, Phone, Reply, Send, Trash2 } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { formatDateTime } from '../../utils/format';
import { PageHeader, SearchBox, FilterTabs, StatusPill, errorMessage } from '../owner/dashboardShared';

const CONTACT_STATUS = {
  new: { label: 'Mới', pill: 'pending' },
  replied: { label: 'Đã trả lời', pill: 'approved' },
  closed: { label: 'Đã đóng', pill: 'hidden' },
};

const STATUS_OPTIONS = [
  { value: 'new', label: 'Mới' },
  { value: 'replied', label: 'Đã trả lời' },
  { value: 'closed', label: 'Đã đóng' },
  { value: '', label: 'Tất cả' },
];

function ContactStatus({ status }) {
  const meta = CONTACT_STATUS[status] || CONTACT_STATUS.new;
  return <StatusPill status={meta.pill}>{meta.label}</StatusPill>;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('new');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');
  const [busy, setBusy] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/contacts', { params: { status: status || undefined, keyword: appliedKeyword || undefined, page, limit: 10 } });
      setContacts(res.data.data || []);
      const raw = res.data.counts || {};
      setCounts({ ...raw, '': Object.values(raw).reduce((sum, value) => sum + value, 0), all: Object.values(raw).reduce((sum, value) => sum + value, 0) });
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được hộp thư liên hệ'));
    } finally {
      setLoading(false);
    }
  }, [status, appliedKeyword, page]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedKeyword(keyword.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const openContact = (contact) => {
    setViewing(contact);
    setReply('');
    setReplyError('');
  };

  const sendReply = async () => {
    if (reply.trim().length < 5) {
      setReplyError('Nội dung trả lời cần tối thiểu 5 ký tự');
      return;
    }
    setBusy('reply');
    try {
      const res = await api.patch(`/contacts/${viewing._id}/reply`, { reply: reply.trim() });
      const updated = res.data.data;
      if (updated.mailSent) toast.success('Đã gửi trả lời qua email');
      else toast(res.data.message || 'Đã lưu trả lời, email chưa được gửi');
      setViewing(updated);
      setReply('');
      fetchContacts();
    } catch (error) {
      toast.error(errorMessage(error, 'Không gửi được trả lời'));
    } finally {
      setBusy('');
    }
  };

  const closeContact = async (contact) => {
    setBusy('close');
    try {
      const res = await api.patch(`/contacts/${contact._id}/close`);
      toast.success('Đã đóng liên hệ');
      if (viewing?._id === contact._id) setViewing(res.data.data);
      fetchContacts();
    } catch (error) {
      toast.error(errorMessage(error, 'Không đóng được liên hệ'));
    } finally {
      setBusy('');
    }
  };

  const confirmDelete = async () => {
    setBusy('delete');
    try {
      await api.delete(`/contacts/${deleting._id}`);
      toast.success('Đã xóa liên hệ');
      if (viewing?._id === deleting._id) setViewing(null);
      setDeleting(null);
      if (contacts.length === 1 && page > 1) setPage(page - 1);
      else fetchContacts();
    } catch (error) {
      toast.error(errorMessage(error, 'Không xóa được liên hệ'));
    } finally {
      setBusy('');
    }
  };

  return (
    <div>
      <PageHeader title="Hộp thư liên hệ" description="Câu hỏi và góp ý gửi từ trang Liên hệ. Trả lời sẽ được gửi tới email của người gửi." />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          options={STATUS_OPTIONS}
          value={status}
          counts={counts}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <SearchBox value={keyword} onChange={setKeyword} placeholder="Tên, email, nội dung" />
      </div>

      {loading ? (
        <Spinner fullPage />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status === 'new' && !appliedKeyword ? 'Không có liên hệ mới' : 'Không có liên hệ phù hợp'}
          description={status === 'new' && !appliedKeyword ? 'Liên hệ mới từ khách sẽ xuất hiện tại đây.' : 'Thử đổi bộ lọc hoặc từ khóa.'}
        />
      ) : (
        <>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
            {contacts.map((contact) => (
              <li key={contact._id}>
                <button type="button" onClick={() => openContact(contact)} className="flex w-full flex-col gap-2 px-5 py-4 text-left hover:bg-sand/40 sm:flex-row sm:items-start sm:gap-5">
                  <div className="flex items-center gap-2 sm:w-56 sm:shrink-0 sm:flex-col sm:items-start sm:gap-0.5">
                    <p className={`truncate ${contact.status === 'new' ? 'font-semibold' : 'font-medium'}`}>{contact.name}</p>
                    <p className="truncate text-xs text-muted">{contact.email}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`line-clamp-1 text-sm ${contact.status === 'new' ? 'font-semibold text-ink' : 'text-ink'}`}>{contact.subject || 'Không có chủ đề'}</p>
                    <p className="line-clamp-1 text-sm text-muted">{contact.message}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                    <ContactStatus status={contact.status} />
                    <span className="whitespace-nowrap text-xs text-muted">{formatDateTime(contact.createdAt)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <Pagination page={pagination.page || page} totalPages={pagination.totalPages} onChange={setPage} />
        </>
      )}

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title="Chi tiết liên hệ"
        size="lg"
        footer={
          viewing && (
            <>
              <Button variant="ghost" className="mr-auto text-danger hover:bg-red-50" icon={Trash2} onClick={() => setDeleting(viewing)}>Xóa</Button>
              {viewing.status !== 'closed' && (
                <Button variant="outline" icon={Archive} loading={busy === 'close'} onClick={() => closeContact(viewing)}>Đóng liên hệ</Button>
              )}
              <Button icon={Send} loading={busy === 'reply'} onClick={sendReply}>Gửi trả lời</Button>
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{viewing.subject || 'Không có chủ đề'}</p>
                <p className="text-xs text-muted">Gửi lúc {formatDateTime(viewing.createdAt)}</p>
              </div>
              <ContactStatus status={viewing.status} />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-sand px-4 py-3 text-sm">
              <span className="font-medium">{viewing.name}</span>
              <a href={`mailto:${viewing.email}`} className="flex items-center gap-1.5 text-muted hover:text-primary"><Mail className="h-4 w-4" />{viewing.email}</a>
              {viewing.phone && <a href={`tel:${viewing.phone}`} className="flex items-center gap-1.5 text-muted hover:text-primary"><Phone className="h-4 w-4" />{viewing.phone}</a>}
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{viewing.message}</p>

            {viewing.reply && (
              <div className="rounded-lg border border-primary/20 bg-primary-light px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Reply className="h-3.5 w-3.5" /> Đã trả lời {viewing.repliedAt ? `lúc ${formatDateTime(viewing.repliedAt)}` : ''}
                  {viewing.repliedBy?.name ? ` · ${viewing.repliedBy.name}` : ''}
                </p>
                <p className="mt-1.5 whitespace-pre-line text-sm text-ink">{viewing.reply}</p>
              </div>
            )}

            <Textarea
              label={viewing.reply ? 'Gửi thêm trả lời' : 'Nội dung trả lời'}
              rows={5}
              value={reply}
              onChange={(event) => {
                setReply(event.target.value);
                if (replyError) setReplyError('');
              }}
              error={replyError}
              hint={`Email sẽ được gửi tới ${viewing.email}, kèm lời chào và nội dung khách đã gửi.`}
              placeholder="Chào bạn, cảm ơn bạn đã liên hệ HomestayGo..."
            />
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Xóa liên hệ"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>Hủy</Button>
            <Button variant="danger" loading={busy === 'delete'} onClick={confirmDelete}>Xóa</Button>
          </>
        }
      >
        <p className="text-sm text-muted">Xóa vĩnh viễn liên hệ của <span className="font-medium text-ink">{deleting?.name}</span>?</p>
      </Modal>
    </div>
  );
}
