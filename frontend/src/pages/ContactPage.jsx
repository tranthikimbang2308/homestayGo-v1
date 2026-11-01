import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Clock, Mail, MapPin, MessageCircle, Phone, Send, CircleCheck } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../utils/leafletIcon.js';
import Input from '../components/ui/Input.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';

const OFFICE_POSITION = [10.8221, 106.6868];
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const SUBJECTS = ['Hỗ trợ đặt phòng', 'Thanh toán và hoàn tiền', 'Đăng ký làm chủ phòng', 'Góp ý sản phẩm', 'Hợp tác', 'Khác'];

const EMPTY_FORM = { name: '', email: '', phone: '', subject: SUBJECTS[0], message: '' };

export default function ContactPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    client
      .get('/settings')
      .then((res) => setSettings(res.data.data))
      .catch(() => setSettings(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({ ...prev, name: prev.name || user.name || '', email: prev.email || user.email || '', phone: prev.phone || user.phone || '' }));
  }, [user]);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Vui lòng nhập họ tên';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Email không hợp lệ';
    if (form.phone && !/^[0-9+\s.]{8,15}$/.test(form.phone.trim())) next.phone = 'Số điện thoại không hợp lệ';
    if (form.message.trim().length < 10) next.message = 'Nội dung cần tối thiểu 10 ký tự';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await client.post('/contacts', form);
      toast.success(res.data.message || 'Đã gửi liên hệ');
      setSent(true);
      setForm({ ...EMPTY_FORM, name: form.name, email: form.email, phone: form.phone });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không gửi được liên hệ'));
    } finally {
      setSubmitting(false);
    }
  };

  const info = [
    { icon: Phone, label: 'Hotline', value: settings?.hotline, href: settings?.hotline ? `tel:${settings.hotline.replace(/\s/g, '')}` : undefined },
    { icon: Mail, label: 'Email', value: settings?.email, href: settings?.email ? `mailto:${settings.email}` : undefined },
    { icon: MapPin, label: 'Văn phòng', value: settings?.address },
    { icon: MessageCircle, label: 'Zalo', value: settings?.zalo },
    { icon: Clock, label: 'Giờ làm việc', value: 'Thứ 2 - Chủ nhật, 8:00 - 22:00' },
  ].filter((item) => item.value);

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Liên hệ</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Chúng tôi luôn sẵn lòng lắng nghe</h1>
        <p className="mt-3 text-muted">
          Gửi câu hỏi, góp ý hoặc đề xuất hợp tác. Đội ngũ {settings?.siteName || 'HomestayGo'} thường phản hồi qua email trong vòng 24 giờ. Bạn cũng có thể xem nhanh{' '}
          <Link to="/faq" className="font-medium text-primary hover:underline">câu hỏi thường gặp</Link>.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-5 sm:p-8">
          {sent ? (
            <div className="flex flex-col items-start gap-4 py-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                <CircleCheck className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Đã nhận được liên hệ của bạn</h2>
                <p className="mt-1 text-muted">Chúng tôi sẽ trả lời qua email {form.email} sớm nhất có thể.</p>
              </div>
              <Button variant="outline" onClick={() => setSent(false)}>Gửi liên hệ khác</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <h2 className="text-xl font-semibold">Gửi tin nhắn</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Họ và tên" value={form.name} onChange={update('name')} error={errors.name} placeholder="Nguyễn Văn A" maxLength={100} />
                <Input label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} placeholder="ban@email.com" />
                <Input label="Số điện thoại (không bắt buộc)" value={form.phone} onChange={update('phone')} error={errors.phone} placeholder="0901 234 567" />
                <Select label="Chủ đề" value={form.subject} onChange={update('subject')} options={SUBJECTS} />
              </div>
              <Textarea
                label="Nội dung"
                rows={6}
                value={form.message}
                onChange={update('message')}
                error={errors.message}
                maxLength={3000}
                placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn. Nếu liên quan đến đơn đặt phòng, hãy ghi kèm mã đơn."
              />
              <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-xs text-muted">Thông tin của bạn chỉ dùng để phản hồi liên hệ này.</p>
                <Button type="submit" icon={Send} loading={submitting}>Gửi liên hệ</Button>
              </div>
            </form>
          )}
        </section>

        <aside className="space-y-6">
          <div className="card divide-y divide-line">
            {settings === null && info.length === 0 ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-line/60" />)}
              </div>
            ) : (
              info.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted">{label}</p>
                    {href ? (
                      <a href={href} className="break-words font-medium text-ink hover:text-primary">{value}</a>
                    ) : (
                      <p className="break-words font-medium text-ink">{value}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-line" style={{ height: 280 }}>
            <MapContainer center={OFFICE_POSITION} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
              <Marker position={OFFICE_POSITION}>
                <Popup>
                  <span className="font-sans text-sm font-semibold">{settings?.siteName || 'HomestayGo'}</span>
                  <span className="block font-sans text-xs">{settings?.address}</span>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </aside>
      </div>
    </div>
  );
}
