import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Pencil, Plus, Power, TicketPercent, Trash2 } from 'lucide-react';
import api from '../../api/client.js';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Pagination from '../ui/Pagination.jsx';
import {
  PageHeader,
  SearchBox,
  FilterTabs,
  StatusPill,
  errorMessage,
  TABLE_CLASS,
  TH_CLASS,
  TD_CLASS,
} from '../../pages/owner/dashboardShared.jsx';
import { formatDate, formatPrice, toInputDate } from '../../utils/format.js';
import { describeCoupon } from './bookingUtils.js';

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  maxDiscount: '',
  minOrderValue: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  isPublic: true,
  isActive: true,
  rooms: [],
};

const couponState = (coupon) => {
  if (!coupon.isActive) return { key: 'hidden', label: 'Đã tắt' };
  const today = dayjs().startOf('day');
  if (coupon.endDate && dayjs(coupon.endDate).endOf('day').isBefore(dayjs())) return { key: 'rejected', label: 'Hết hạn' };
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return { key: 'cancelled', label: 'Hết lượt' };
  if (coupon.startDate && dayjs(coupon.startDate).startOf('day').isAfter(today)) return { key: 'pending', label: 'Sắp diễn ra' };
  return { key: 'approved', label: 'Đang chạy' };
};

const toForm = (coupon) => ({
  code: coupon.code || '',
  description: coupon.description || '',
  discountType: coupon.discountType || 'percent',
  discountValue: coupon.discountValue ?? '',
  maxDiscount: coupon.maxDiscount || '',
  minOrderValue: coupon.minOrderValue || '',
  startDate: toInputDate(coupon.startDate),
  endDate: toInputDate(coupon.endDate),
  usageLimit: coupon.usageLimit || '',
  isPublic: coupon.isPublic !== false,
  isActive: coupon.isActive !== false,
  rooms: (coupon.rooms || []).map((room) => room._id || room),
});

function FormField({ label, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
      {children}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function CheckboxRow({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

export default function CouponManager({ mode = 'owner' }) {
  const isAdmin = mode === 'admin';
  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('system');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState('');

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, status: status || undefined, keyword: appliedKeyword || undefined };
      if (isAdmin) params.scope = scope;
      const res = await api.get('/coupons', { params });
      setCoupons(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được danh sách mã giảm giá'));
    } finally {
      setLoading(false);
    }
  }, [page, status, appliedKeyword, scope, isAdmin]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedKeyword(keyword.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    if (isAdmin) return;
    api
      .get('/owner/rooms', { params: { limit: 100 } })
      .then((res) => setRooms(res.data.data || []))
      .catch(() => setRooms([]));
  }, [isAdmin]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditing({});
  };

  const openEdit = (coupon) => {
    setForm(toForm(coupon));
    setErrors({});
    setEditing(coupon);
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleRoom = (roomId) => {
    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.includes(roomId) ? prev.rooms.filter((id) => id !== roomId) : [...prev.rooms, roomId],
    }));
  };

  const validate = () => {
    const next = {};
    const code = form.code.trim().toUpperCase();
    if (!code) next.code = 'Nhập mã giảm giá';
    else if (!/^[A-Z0-9_-]{3,30}$/.test(code)) next.code = 'Chỉ gồm chữ in hoa không dấu, số, gạch ngang (3-30 ký tự)';
    const value = Number(form.discountValue);
    if (!form.discountValue || value <= 0) next.discountValue = 'Giá trị giảm phải lớn hơn 0';
    else if (form.discountType === 'percent' && value > 100) next.discountValue = 'Phần trăm tối đa là 100';
    if (form.maxDiscount !== '' && Number(form.maxDiscount) < 0) next.maxDiscount = 'Không được âm';
    if (form.minOrderValue !== '' && Number(form.minOrderValue) < 0) next.minOrderValue = 'Không được âm';
    if (form.usageLimit !== '' && (Number(form.usageLimit) < 0 || !Number.isInteger(Number(form.usageLimit)))) next.usageLimit = 'Số nguyên không âm';
    if (form.startDate && form.endDate && form.endDate < form.startDate) next.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscount: form.discountType === 'percent' ? Number(form.maxDiscount) || 0 : 0,
      minOrderValue: Number(form.minOrderValue) || 0,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      usageLimit: Number(form.usageLimit) || 0,
      isPublic: form.isPublic,
      isActive: form.isActive,
    };
    if (!isAdmin) payload.rooms = form.rooms;
    setSaving(true);
    try {
      if (editing?._id) {
        await api.put(`/coupons/${editing._id}`, payload);
        toast.success('Đã cập nhật mã giảm giá');
      } else {
        await api.post('/coupons', payload);
        toast.success('Đã tạo mã giảm giá');
      }
      setEditing(null);
      fetchCoupons();
    } catch (error) {
      toast.error(errorMessage(error, 'Không lưu được mã giảm giá'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon) => {
    setBusyId(coupon._id);
    try {
      const res = await api.patch(`/coupons/${coupon._id}/toggle`);
      toast.success(res.data.message || 'Đã cập nhật trạng thái');
      setCoupons((prev) => prev.map((item) => (item._id === coupon._id ? { ...item, isActive: res.data.data.isActive } : item)));
    } catch (error) {
      toast.error(errorMessage(error, 'Không cập nhật được trạng thái'));
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting._id);
    try {
      await api.delete(`/coupons/${deleting._id}`);
      toast.success('Đã xóa mã giảm giá');
      setDeleting(null);
      if (coupons.length === 1 && page > 1) setPage(page - 1);
      else fetchCoupons();
    } catch (error) {
      toast.error(errorMessage(error, 'Không xóa được mã giảm giá'));
    } finally {
      setBusyId('');
    }
  };

  const canManage = (coupon) => (isAdmin ? !coupon.owner : true);

  return (
    <div>
      <PageHeader
        title="Mã giảm giá"
        description={
          isAdmin
            ? 'Tạo mã toàn hệ thống áp dụng cho mọi homestay và theo dõi mã của chủ phòng.'
            : 'Tạo mã ưu đãi cho phòng của bạn, khách nhập mã ở bước đặt phòng.'
        }
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Tạo mã mới
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {isAdmin && (
            <FilterTabs
              options={[
                { value: 'system', label: 'Mã hệ thống' },
                { value: 'all', label: 'Tất cả mã' },
              ]}
              value={scope}
              onChange={(value) => {
                setScope(value);
                setPage(1);
              }}
            />
          )}
          <FilterTabs
            options={[
              { value: '', label: 'Mọi trạng thái' },
              { value: 'active', label: 'Đang bật' },
              { value: 'inactive', label: 'Đã tắt' },
            ]}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
        </div>
        <SearchBox value={keyword} onChange={setKeyword} placeholder="Tìm theo mã hoặc mô tả" />
      </div>

      {loading ? (
        <Spinner fullPage />
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title="Chưa có mã giảm giá"
          description={appliedKeyword || status ? 'Thử đổi bộ lọc hoặc từ khóa.' : 'Tạo mã đầu tiên để thu hút khách đặt phòng.'}
          action={
            <Button icon={Plus} onClick={openCreate}>
              Tạo mã mới
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead className="bg-sand/60">
                  <tr>
                    <th className={TH_CLASS}>Mã</th>
                    <th className={TH_CLASS}>Ưu đãi</th>
                    <th className={TH_CLASS}>Thời hạn</th>
                    <th className={`${TH_CLASS} text-right`}>Đã dùng</th>
                    <th className={TH_CLASS}>Phạm vi</th>
                    <th className={TH_CLASS}>Trạng thái</th>
                    <th className={`${TH_CLASS} text-right`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {coupons.map((coupon) => {
                    const state = couponState(coupon);
                    const manageable = canManage(coupon);
                    return (
                      <tr key={coupon._id} className="hover:bg-sand/40">
                        <td className={TD_CLASS}>
                          <p className="whitespace-nowrap font-semibold tracking-wide text-primary">{coupon.code}</p>
                          <p className="text-xs text-muted">{coupon.isPublic ? 'Công khai' : 'Không công khai'}</p>
                        </td>
                        <td className={TD_CLASS}>
                          <p className="whitespace-nowrap font-medium">{describeCoupon(coupon)}</p>
                          <p className="text-xs text-muted">
                            {coupon.minOrderValue > 0 ? `Đơn từ ${formatPrice(coupon.minOrderValue)}` : 'Không yêu cầu tối thiểu'}
                          </p>
                        </td>
                        <td className={`${TD_CLASS} whitespace-nowrap text-sm`}>
                          <p>{coupon.startDate ? formatDate(coupon.startDate) : 'Ngay khi tạo'}</p>
                          <p className="text-xs text-muted">{coupon.endDate ? `đến ${formatDate(coupon.endDate)}` : 'Không giới hạn'}</p>
                        </td>
                        <td className={`${TD_CLASS} whitespace-nowrap text-right`}>
                          {coupon.usedCount}
                          <span className="text-muted"> / {coupon.usageLimit > 0 ? coupon.usageLimit : '∞'}</span>
                        </td>
                        <td className={TD_CLASS}>
                          <div className="max-w-[14rem] text-sm">
                            {isAdmin && coupon.owner && <p className="font-medium">{coupon.owner.name || 'Chủ phòng'}</p>}
                            <p className="line-clamp-2 text-xs text-muted">
                              {coupon.rooms?.length
                                ? coupon.rooms.map((room) => room.title).join(', ')
                                : coupon.owner
                                  ? 'Mọi phòng của chủ phòng'
                                  : 'Mọi homestay'}
                            </p>
                          </div>
                        </td>
                        <td className={TD_CLASS}>
                          <StatusPill status={state.key}>{state.label}</StatusPill>
                        </td>
                        <td className={`${TD_CLASS} text-right`}>
                          {manageable ? (
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggle(coupon)}
                                disabled={busyId === coupon._id}
                                className={`rounded-lg p-2 hover:bg-sand disabled:opacity-50 ${coupon.isActive ? 'text-primary' : 'text-muted'}`}
                                title={coupon.isActive ? 'Tắt mã' : 'Bật mã'}
                                aria-label={coupon.isActive ? 'Tắt mã' : 'Bật mã'}
                              >
                                <Power className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => openEdit(coupon)} className="rounded-lg p-2 text-ink hover:bg-sand" title="Sửa" aria-label="Sửa mã">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => setDeleting(coupon)} className="rounded-lg p-2 text-danger hover:bg-red-50" title="Xóa" aria-label="Xóa mã">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">Mã của chủ phòng</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
        </>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => !saving && setEditing(null)}
        title={editing?._id ? `Sửa mã ${editing.code}` : 'Tạo mã giảm giá'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing?._id ? 'Lưu thay đổi' : 'Tạo mã'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Mã giảm giá" error={errors.code} hint="Viết liền, không dấu, ví dụ HE2026">
            <input value={form.code} onChange={(event) => setField('code', event.target.value.toUpperCase())} className={`input uppercase ${errors.code ? 'input-error' : ''}`} placeholder="HE2026" />
          </FormField>
          <FormField label="Loại giảm">
            <select value={form.discountType} onChange={(event) => setField('discountType', event.target.value)} className="input cursor-pointer">
              <option value="percent">Theo phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (₫)</option>
            </select>
          </FormField>
          <FormField label="Mô tả" className="sm:col-span-2">
            <input value={form.description} onChange={(event) => setField('description', event.target.value)} className="input" placeholder="Ví dụ: Giảm 10% cho kỳ nghỉ hè" />
          </FormField>
          <FormField label={form.discountType === 'percent' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (₫)'} error={errors.discountValue}>
            <input type="number" min="0" step={form.discountType === 'percent' ? 1 : 10000} value={form.discountValue} onChange={(event) => setField('discountValue', event.target.value)} className={`input ${errors.discountValue ? 'input-error' : ''}`} />
          </FormField>
          {form.discountType === 'percent' ? (
            <FormField label="Giảm tối đa (₫)" error={errors.maxDiscount} hint="Để trống nếu không giới hạn">
              <input type="number" min="0" step="10000" value={form.maxDiscount} onChange={(event) => setField('maxDiscount', event.target.value)} className={`input ${errors.maxDiscount ? 'input-error' : ''}`} />
            </FormField>
          ) : (
            <div className="hidden sm:block" />
          )}
          <FormField label="Tiền phòng tối thiểu (₫)" error={errors.minOrderValue} hint="Tính trên tiền phòng trước phí">
            <input type="number" min="0" step="10000" value={form.minOrderValue} onChange={(event) => setField('minOrderValue', event.target.value)} className={`input ${errors.minOrderValue ? 'input-error' : ''}`} />
          </FormField>
          <FormField label="Giới hạn lượt dùng" error={errors.usageLimit} hint="Để trống hoặc 0 là không giới hạn">
            <input type="number" min="0" step="1" value={form.usageLimit} onChange={(event) => setField('usageLimit', event.target.value)} className={`input ${errors.usageLimit ? 'input-error' : ''}`} />
          </FormField>
          <FormField label="Ngày bắt đầu">
            <input type="date" value={form.startDate} onChange={(event) => setField('startDate', event.target.value)} className="input" />
          </FormField>
          <FormField label="Ngày kết thúc" error={errors.endDate}>
            <input type="date" value={form.endDate} onChange={(event) => setField('endDate', event.target.value)} className={`input ${errors.endDate ? 'input-error' : ''}`} />
          </FormField>

          {!isAdmin && (
            <FormField label="Áp dụng cho phòng" className="sm:col-span-2" hint="Không chọn phòng nào nghĩa là áp dụng cho mọi phòng của bạn">
              {rooms.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-sm text-muted">Bạn chưa có phòng nào.</p>
              ) : (
                <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-line p-3">
                  {rooms.map((room) => (
                    <label key={room._id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                      <input type="checkbox" checked={form.rooms.includes(room._id)} onChange={() => toggleRoom(room._id)} className="h-4 w-4 accent-primary" />
                      <span className="line-clamp-1">{room.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </FormField>
          )}

          <div className="space-y-3 sm:col-span-2">
            <CheckboxRow checked={form.isPublic} onChange={(value) => setField('isPublic', value)} label="Hiển thị trên trang Ưu đãi" description="Khách có thể thấy và sao chép mã ở trang Ưu đãi" />
            <CheckboxRow checked={form.isActive} onChange={(value) => setField('isActive', value)} label="Kích hoạt mã" description="Tắt để tạm ngừng mà không xóa mã" />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Xóa mã giảm giá"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Hủy
            </Button>
            <Button variant="danger" icon={Trash2} loading={busyId === deleting?._id} onClick={handleDelete}>
              Xóa mã
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Bạn chắc chắn muốn xóa mã <span className="font-semibold text-primary">{deleting?.code}</span>? Các đơn đã dùng mã vẫn giữ nguyên số tiền giảm.
        </p>
      </Modal>
    </div>
  );
}
