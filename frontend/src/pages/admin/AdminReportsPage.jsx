import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, ExternalLink, Flag, X } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { formatDateTime } from '../../utils/format';
import { REPORT_REASONS } from '../../components/room/ReportRoomButton';
import { PageHeader, FilterTabs, StatusPill, roomStatusLabel, coverImage, errorMessage, TABLE_CLASS, TH_CLASS, TD_CLASS } from '../owner/dashboardShared';

const REPORT_STATUS = {
  pending: { label: 'Chờ xử lý', pill: 'pending' },
  resolved: { label: 'Đã xử lý', pill: 'approved' },
  rejected: { label: 'Không chấp nhận', pill: 'hidden' },
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'resolved', label: 'Đã xử lý' },
  { value: 'rejected', label: 'Không chấp nhận' },
  { value: '', label: 'Tất cả' },
];

const reasonLabel = (value) => REPORT_REASONS.find((item) => item.value === value)?.label || value;

function ReportStatus({ status }) {
  const meta = REPORT_STATUS[status] || REPORT_STATUS.pending;
  return <StatusPill status={meta.pill}>{meta.label}</StatusPill>;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('pending');
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [decision, setDecision] = useState('resolved');
  const [adminNote, setAdminNote] = useState('');
  const [hideRoom, setHideRoom] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports', { params: { status: status || undefined, reason: reason || undefined, page, limit: 10 } });
      setReports(res.data.data || []);
      const raw = res.data.counts || {};
      setCounts({ ...raw, all: Object.values(raw).reduce((sum, value) => sum + value, 0) });
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được danh sách khiếu nại'));
    } finally {
      setLoading(false);
    }
  }, [status, reason, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const openReport = (report) => {
    setViewing(report);
    setDecision('resolved');
    setAdminNote('');
    setHideRoom(false);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/reports/${viewing._id}`, { status: decision, adminNote: adminNote.trim(), hideRoom: decision === 'resolved' && hideRoom });
      toast.success(res.data.message || 'Đã cập nhật khiếu nại');
      setViewing(null);
      fetchReports();
    } catch (error) {
      toast.error(errorMessage(error, 'Không xử lý được khiếu nại'));
    } finally {
      setSaving(false);
    }
  };

  const room = viewing?.room;
  const pending = viewing?.status === 'pending';

  return (
    <div>
      <PageHeader title="Khiếu nại phòng" description="Xem xét báo cáo từ khách hàng, phản hồi kết quả và ẩn phòng vi phạm khi cần." />

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
        <select
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setPage(1);
          }}
          className="input py-2 sm:w-56"
          aria-label="Lọc theo lý do"
        >
          <option value="">Mọi lý do</option>
          {REPORT_REASONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Spinner fullPage />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Flag}
          title={status === 'pending' && !reason ? 'Không có khiếu nại chờ xử lý' : 'Không có khiếu nại phù hợp'}
          description={status === 'pending' && !reason ? 'Báo cáo mới từ khách hàng sẽ xuất hiện tại đây.' : 'Thử đổi bộ lọc.'}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead className="bg-sand/60">
                  <tr>
                    <th className={TH_CLASS}>Phòng</th>
                    <th className={TH_CLASS}>Lý do</th>
                    <th className={TH_CLASS}>Người báo cáo</th>
                    <th className={`${TH_CLASS} hidden xl:table-cell`}>Thời gian</th>
                    <th className={TH_CLASS}>Trạng thái</th>
                    <th className={`${TH_CLASS} text-right`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-sand/40">
                      <td className={TD_CLASS}>
                        <div className="flex min-w-[13rem] max-w-[18rem] items-center gap-3">
                          {coverImage(report.room) ? (
                            <img src={coverImage(report.room)} alt="" className="h-11 w-14 shrink-0 rounded-md object-cover" />
                          ) : (
                            <div className="h-11 w-14 shrink-0 rounded-md bg-sand" />
                          )}
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-medium">{report.room?.title || 'Phòng đã xóa'}</p>
                            <p className="text-xs text-muted">{report.room?.owner?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className={TD_CLASS}>
                        <p className="whitespace-nowrap font-medium">{reasonLabel(report.reason)}</p>
                        {report.description && <p className="line-clamp-1 max-w-[16rem] text-xs text-muted">{report.description}</p>}
                      </td>
                      <td className={TD_CLASS}>
                        <p className="whitespace-nowrap">{report.reporter?.name}</p>
                        <p className="text-xs text-muted">{report.reporter?.email}</p>
                      </td>
                      <td className={`${TD_CLASS} hidden whitespace-nowrap xl:table-cell`}>{formatDateTime(report.createdAt)}</td>
                      <td className={TD_CLASS}>
                        <ReportStatus status={report.status} />
                        {report.roomHidden && <p className="mt-1 text-xs text-muted">Đã ẩn phòng</p>}
                      </td>
                      <td className={TD_CLASS}>
                        <div className="flex justify-end">
                          <Button size="sm" variant={report.status === 'pending' ? 'primary' : 'ghost'} onClick={() => openReport(report)}>
                            {report.status === 'pending' ? 'Xử lý' : 'Xem'}
                          </Button>
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
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={pending ? 'Xử lý khiếu nại' : 'Chi tiết khiếu nại'}
        size="lg"
        footer={
          pending ? (
            <>
              <Button variant="outline" onClick={() => setViewing(null)}>Để sau</Button>
              <Button variant={decision === 'resolved' && hideRoom ? 'danger' : 'primary'} loading={saving} onClick={submit}>
                {decision === 'rejected' ? 'Không chấp nhận' : hideRoom ? 'Xác nhận và ẩn phòng' : 'Xác nhận đã xử lý'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setViewing(null)}>Đóng</Button>
          )
        }
      >
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-line p-3">
              {coverImage(room) ? <img src={coverImage(room)} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" /> : <div className="h-16 w-20 shrink-0 rounded-lg bg-sand" />}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-semibold">{room?.title || 'Phòng đã xóa'}</p>
                <p className="text-xs text-muted">
                  {room?.city} · Chủ phòng {room?.owner?.name || 'không rõ'}
                  {room?.owner?.phone ? ` · ${room.owner.phone}` : ''}
                </p>
                {room && <div className="mt-1"><StatusPill status={room.status}>{roomStatusLabel(room.status)}</StatusPill></div>}
              </div>
              {room?.slug && (
                <a href={`/rooms/${room.slug}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm shrink-0">
                  <ExternalLink className="h-4 w-4" /> Xem phòng
                </a>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted">Lý do</p>
                <p className="font-medium">{reasonLabel(viewing.reason)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Người báo cáo</p>
                <p className="font-medium">{viewing.reporter?.name}</p>
                <p className="text-xs text-muted">{viewing.reporter?.email}{viewing.reporter?.phone ? ` · ${viewing.reporter.phone}` : ''}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted">Mô tả · {formatDateTime(viewing.createdAt)}</p>
              <p className="mt-1 whitespace-pre-line rounded-lg bg-sand px-4 py-3 text-sm">{viewing.description || 'Không có mô tả.'}</p>
            </div>

            {pending ? (
              <div className="space-y-4 border-t border-line pt-5">
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { value: 'resolved', label: 'Khiếu nại đúng', hint: 'Ghi nhận và cảnh báo chủ phòng', icon: Check },
                    { value: 'rejected', label: 'Không chấp nhận', hint: 'Không đủ căn cứ vi phạm', icon: X },
                  ].map(({ value, label, hint, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDecision(value)}
                      className={`flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left ${decision === value ? 'border-primary bg-primary-light' : 'border-line hover:border-primary/40'}`}
                    >
                      <Icon className={`mt-0.5 h-4 w-4 ${decision === value ? 'text-primary' : 'text-muted'}`} />
                      <span>
                        <span className="block text-sm font-medium">{label}</span>
                        <span className="block text-xs text-muted">{hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {decision === 'resolved' && room && room.status !== 'hidden' && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3.5 py-3">
                    <input type="checkbox" checked={hideRoom} onChange={(event) => setHideRoom(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
                    <span>
                      <span className="block text-sm font-medium">Ẩn phòng khỏi hệ thống</span>
                      <span className="block text-xs text-muted">Phòng sẽ không còn hiển thị với khách cho đến khi được duyệt lại ở mục Duyệt phòng.</span>
                    </span>
                  </label>
                )}
                <Textarea
                  label="Ghi chú gửi người báo cáo và chủ phòng"
                  rows={3}
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  placeholder="VD: Đã liên hệ chủ phòng và yêu cầu cập nhật lại ảnh thực tế."
                />
              </div>
            ) : (
              <div className="rounded-lg border border-line px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <ReportStatus status={viewing.status} />
                  {viewing.resolvedAt && <span className="text-xs text-muted">lúc {formatDateTime(viewing.resolvedAt)}</span>}
                  {viewing.roomHidden && <span className="text-xs font-medium text-danger">Phòng đã bị ẩn</span>}
                </div>
                {viewing.adminNote && <p className="mt-2 whitespace-pre-line">{viewing.adminNote}</p>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
