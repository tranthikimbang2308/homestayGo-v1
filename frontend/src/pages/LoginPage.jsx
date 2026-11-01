import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/client.js';
import AuthShell from '../components/AuthShell.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

export const homePathFor = (role, redirect) => {
  if (role === 'admin') return redirect && redirect.startsWith('/admin') ? redirect : '/admin';
  if (role === 'owner') return redirect && (redirect.startsWith('/owner') || redirect.startsWith('/account') || redirect.startsWith('/rooms')) ? redirect : '/owner';
  return redirect && redirect.startsWith('/') && !redirect.startsWith('/login') ? redirect : '/';
};

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '';
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user && !submitting) return <Navigate to={homePathFor(user.role, redirect)} replace />;

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Email không hợp lệ';
    if (!form.password) next.password = 'Nhập mật khẩu';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      toast.success(`Chào mừng ${loggedIn.name} quay lại`);
      navigate(homePathFor(loggedIn.role, redirect), { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Đăng nhập thất bại'));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Đăng nhập" subtitle="Tiếp tục hành trình của bạn với HomestayGo.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="ban@email.com"
          autoComplete="email"
          value={form.email}
          error={errors.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor="login-password" className="text-sm font-medium text-ink">
              Mật khẩu
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className={`input pl-9 pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
        </div>
        <Button type="submit" loading={submitting} fullWidth size="lg">
          Đăng nhập
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Chưa có tài khoản?{' '}
        <Link to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-medium text-primary hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </AuthShell>
  );
}
