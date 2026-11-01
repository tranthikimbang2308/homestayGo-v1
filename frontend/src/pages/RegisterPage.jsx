import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Lock, Mail, Phone, UserRound, Luggage } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/client.js';
import AuthShell from '../components/AuthShell.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { homePathFor } from './LoginPage.jsx';

const ROLE_OPTIONS = [
  { key: 'customer', label: 'Khách hàng', text: 'Tìm và đặt homestay cho chuyến đi', icon: Luggage },
  { key: 'owner', label: 'Chủ phòng', text: 'Đăng phòng và quản lý đơn đặt', icon: Building2 },
];

export default function RegisterPage() {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '';
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: params.get('role') === 'owner' ? 'owner' : 'customer',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user && !submitting) return <Navigate to={homePathFor(user.role, redirect)} replace />;

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Nhập họ và tên';
    if (!form.email.trim()) next.email = 'Nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Email không hợp lệ';
    if (form.phone && !/^(0|\+84)\d{9,10}$/.test(form.phone.replace(/\s/g, ''))) next.phone = 'Số điện thoại không hợp lệ';
    if (form.password.length < 6) next.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Mật khẩu nhập lại không khớp';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const created = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\s/g, ''),
        password: form.password,
        role: form.role,
      });
      toast.success('Tạo tài khoản thành công');
      navigate(homePathFor(created.role, redirect), { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Đăng ký thất bại'));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Chỉ mất một phút để bắt đầu."
      quote={form.role === 'owner' ? '“Mở cửa căn nhà của bạn, đón những vị khách từ khắp nơi.”' : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <span className="label">Bạn là</span>
          <div className="grid grid-cols-2 gap-3" role="radiogroup">
            {ROLE_OPTIONS.map(({ key, label, text, icon: Icon }) => {
              const active = form.role === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setForm((prev) => ({ ...prev, role: key }))}
                  className={`rounded-lg border p-3 text-left transition-colors ${active ? 'border-primary bg-primary-light' : 'border-line bg-white hover:border-primary/50'}`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted'}`} />
                  <span className="mt-2 block text-sm font-semibold">{label}</span>
                  <span className="block text-xs text-muted">{text}</span>
                </button>
              );
            })}
          </div>
        </div>
        <Input label="Họ và tên" icon={UserRound} placeholder="Nguyễn Văn A" value={form.name} error={errors.name} onChange={update('name')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" icon={Mail} placeholder="ban@email.com" value={form.email} error={errors.email} onChange={update('email')} />
          <Input label="Số điện thoại" icon={Phone} placeholder="0901234567" value={form.phone} error={errors.phone} onChange={update('phone')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Mật khẩu"
            type="password"
            icon={Lock}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            value={form.password}
            error={errors.password}
            onChange={update('password')}
          />
          <Input
            label="Nhập lại mật khẩu"
            type="password"
            icon={Lock}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={update('confirmPassword')}
          />
        </div>
        <Button type="submit" loading={submitting} fullWidth size="lg">
          {form.role === 'owner' ? 'Đăng ký làm chủ phòng' : 'Tạo tài khoản'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Đã có tài khoản?{' '}
        <Link to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
