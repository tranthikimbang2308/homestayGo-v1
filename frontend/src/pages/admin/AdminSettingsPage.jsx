import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import { formatDateTime, formatPrice } from '../../utils/format';
import { PageHeader, Panel, errorMessage } from '../owner/dashboardShared';

const FIELDS = ['siteName', 'hotline', 'email', 'address', 'serviceFeePercent', 'about', 'facebook', 'zalo', 'policies'];

const toForm = (data = {}) =>
  FIELDS.reduce((acc, key) => ({ ...acc, [key]: data[key] === undefined || data[key] === null ? '' : String(data[key]) }), {});

export default function AdminSettingsPage() {
  const [form, setForm] = useState(toForm());
  const [initial, setInitial] = useState(toForm());
  const [updatedAt, setUpdatedAt] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        const next = toForm(res.data.data);
        setForm(next);
        setInitial(next);
        setUpdatedAt(res.data.data?.updatedAt || null);
      })
      .catch((error) => toast.error(errorMessage(error, 'Không tải được cài đặt')))
      .finally(() => setLoading(false));
  }, []);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.siteName.trim()) next.siteName = 'Vui lòng nhập tên website';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Email không hợp lệ';
    const fee = Number(form.serviceFeePercent);
    if (form.serviceFeePercent === '' || !Number.isFinite(fee) || fee < 0 || fee > 30) next.serviceFeePercent = 'Phí dịch vụ từ 0 đến 30%';
    if (form.facebook && !/^https?:\/\//.test(form.facebook.trim())) next.facebook = 'Đường dẫn phải bắt đầu bằng http:// hoặc https://';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await api.put('/settings', { ...form, serviceFeePercent: Number(form.serviceFeePercent) });
      const next = toForm(res.data.data);
      setForm(next);
      setInitial(next);
      setUpdatedAt(res.data.data?.updatedAt || null);
      toast.success('Đã lưu cài đặt hệ thống');
    } catch (error) {
      toast.error(errorMessage(error, 'Không lưu được cài đặt'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner fullPage />;

  const dirty = FIELDS.some((key) => form[key] !== initial[key]);
  const fee = Number(form.serviceFeePercent) || 0;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        title="Cài đặt hệ thống"
        description={updatedAt ? `Cập nhật lần cuối ${formatDateTime(updatedAt)}` : 'Thông tin chung hiển thị trên website và tham số tính phí.'}
        actions={
          <>
            {dirty && <Button variant="outline" onClick={() => { setForm(initial); setErrors({}); }}>Hoàn tác</Button>}
            <Button type="submit" icon={Save} loading={saving} disabled={!dirty}>Lưu cài đặt</Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Thông tin liên hệ" description="Hiển thị ở chân trang, trang Liên hệ và email gửi khách.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input containerClassName="sm:col-span-2" label="Tên website" value={form.siteName} onChange={update('siteName')} error={errors.siteName} />
            <Input label="Hotline" value={form.hotline} onChange={update('hotline')} placeholder="1900 6868" />
            <Input label="Email hỗ trợ" type="email" value={form.email} onChange={update('email')} error={errors.email} />
            <Input containerClassName="sm:col-span-2" label="Địa chỉ văn phòng" value={form.address} onChange={update('address')} />
            <Input label="Facebook" value={form.facebook} onChange={update('facebook')} error={errors.facebook} placeholder="https://facebook.com/..." />
            <Input label="Zalo" value={form.zalo} onChange={update('zalo')} placeholder="Số điện thoại Zalo" />
          </div>
        </Panel>

        <Panel title="Phí dịch vụ" description="Áp dụng cho các đơn đặt phòng tạo sau khi lưu.">
          <div className="space-y-4">
            <Input
              label="Phí dịch vụ (%)"
              type="number"
              min={0}
              max={30}
              step={0.5}
              value={form.serviceFeePercent}
              onChange={update('serviceFeePercent')}
              error={errors.serviceFeePercent}
              hint="Tính trên tiền phòng (trước giảm giá), từ 0 đến 30%."
            />
            <div className="rounded-lg bg-sand px-4 py-3 text-sm">
              <p className="text-muted">Ví dụ đơn 2 đêm, giá 800.000 ₫ mỗi đêm</p>
              <div className="mt-2 space-y-1">
                <p className="flex justify-between"><span>Tiền phòng</span><span>{formatPrice(1600000)}</span></p>
                <p className="flex justify-between"><span>Phí dịch vụ {fee}%</span><span>{formatPrice(Math.round(1600000 * fee / 100))}</span></p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Giới thiệu" description="Đoạn mô tả ngắn trên trang Về chúng tôi.">
          <Textarea rows={5} value={form.about} onChange={update('about')} aria-label="Giới thiệu" />
        </Panel>

        <Panel title="Chính sách chung" description="Hiển thị trên trang Về chúng tôi. Xuống dòng để tách ý.">
          <Textarea rows={5} value={form.policies} onChange={update('policies')} aria-label="Chính sách chung" />
        </Panel>
      </div>
    </form>
  );
}
