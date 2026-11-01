import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import AuthShell from '../components/AuthShell.jsx';
import Button from '../components/ui/Button.jsx';

function PasswordField({ id, label, value, onChange, error, visible, onToggle, autoComplete, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`input pl-9 pr-10 ${error ? 'input-error' : ''}`}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState('');

  const validate = () => {
    const next = {};
    if (!form.password) next.password = 'Nhập mật khẩu mới';
    else if (form.password.length < 6) next.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (form.confirm !== form.password) next.confirm = 'Mật khẩu nhập lại không khớp';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setFailure('');
    try {
      const res = await client.post(`/auth/reset-password/${token}`, { password: form.password });
      toast.success(res.data.message || 'Đặt lại mật khẩu thành công');
      navigate('/login', { replace: true });
    } catch (err) {
      setFailure(getErrorMessage(err, 'Không đặt lại được mật khẩu'));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Đặt lại mật khẩu" subtitle="Tạo mật khẩu mới cho tài khoản HomestayGo của bạn.">
      {failure && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
          {failure}{' '}
          <Link to="/forgot-password" className="font-medium underline">
            Gửi lại liên kết
          </Link>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <PasswordField
          id="reset-password"
          label="Mật khẩu mới"
          placeholder="Tối thiểu 6 ký tự"
          autoComplete="new-password"
          value={form.password}
          error={errors.password}
          visible={visible}
          onToggle={() => setVisible((prev) => !prev)}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />
        <PasswordField
          id="reset-confirm"
          label="Nhập lại mật khẩu"
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          value={form.confirm}
          error={errors.confirm}
          visible={visible}
          onToggle={() => setVisible((prev) => !prev)}
          onChange={(event) => setForm((prev) => ({ ...prev, confirm: event.target.value }))}
        />
        <Button type="submit" loading={submitting} fullWidth size="lg">
          Cập nhật mật khẩu
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
