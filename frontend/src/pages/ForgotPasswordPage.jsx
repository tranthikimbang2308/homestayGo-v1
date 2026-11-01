import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import AuthShell from '../components/AuthShell.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = email.trim();
    if (!value) return setError('Nhập email');
    if (!/^\S+@\S+\.\S+$/.test(value)) return setError('Email không hợp lệ');
    setError('');
    setSubmitting(true);
    try {
      const res = await client.post('/auth/forgot-password', { email: value });
      setSentMessage(res.data.message || 'Vui lòng kiểm tra hộp thư của bạn.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không gửi được yêu cầu'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Quên mật khẩu" subtitle="Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu.">
      {sentMessage ? (
        <div className="space-y-6">
          <div className="flex gap-3 rounded-lg border border-line bg-primary-light px-4 py-4">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-medium text-ink">Đã gửi yêu cầu</p>
              <p className="mt-1 text-muted">{sentMessage}</p>
              <p className="mt-2 text-muted">Liên kết có hiệu lực trong 30 phút. Nhớ kiểm tra cả thư mục spam.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button to="/login" icon={ArrowLeft}>
              Về trang đăng nhập
            </Button>
            <Button variant="outline" onClick={() => setSentMessage('')}>
              Gửi lại
            </Button>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="ban@email.com"
              autoComplete="email"
              value={email}
              error={error}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="submit" loading={submitting} fullWidth size="lg">
              Gửi liên kết đặt lại
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            Đã nhớ mật khẩu?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
