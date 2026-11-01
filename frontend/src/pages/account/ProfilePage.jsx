import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, KeyRound, Loader2, Mail, Phone, UserRound } from 'lucide-react';
import client, { getErrorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import AccountShell from '../../components/AccountShell.jsx';
import Avatar from '../../components/Avatar.jsx';
import Input from '../../components/ui/Input.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Button from '../../components/ui/Button.jsx';
import { ROLES } from '../../utils/constants.js';
import { formatDate } from '../../utils/format.js';

function ProfileContent() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ name: '', phone: '', bio: '', avatar: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', bio: user.bio || '', avatar: user.avatar || '' });
  }, [user?._id]);

  const saveProfile = async (payload, successMessage = 'Đã lưu thông tin') => {
    const res = await client.put('/auth/profile', payload);
    updateUser(res.data.data);
    toast.success(successMessage);
  };

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chọn một tệp ảnh');
      return;
    }
    const formData = new FormData();
    formData.append('images', file);
    setUploading(true);
    try {
      const res = await client.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.data?.urls?.[0];
      if (!url) throw new Error('missing url');
      setForm((prev) => ({ ...prev, avatar: url }));
      await saveProfile({ name: form.name || user.name, phone: form.phone, bio: form.bio, avatar: url }, 'Đã cập nhật ảnh đại diện');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Tải ảnh đại diện thất bại'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Nhập họ và tên';
    if (form.phone && !/^(0|\+84)\d{9,10}$/.test(form.phone.replace(/\s/g, ''))) next.phone = 'Số điện thoại không hợp lệ';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await saveProfile({ name: form.name.trim(), phone: form.phone.replace(/\s/g, ''), bio: form.bio.trim(), avatar: form.avatar });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Lưu thông tin thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    const next = {};
    if (!passwordForm.currentPassword) next.currentPassword = 'Nhập mật khẩu hiện tại';
    if (passwordForm.newPassword.length < 6) next.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự';
    if (passwordForm.confirmPassword !== passwordForm.newPassword) next.confirmPassword = 'Mật khẩu nhập lại không khớp';
    setPasswordErrors(next);
    if (Object.keys(next).length) return;
    setChangingPassword(true);
    try {
      await client.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Đã đổi mật khẩu');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Đổi mật khẩu thất bại'));
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="card h-fit p-6 text-center">
        <div className="relative mx-auto w-fit">
          <Avatar src={form.avatar} name={user.name} size="xl" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-white hover:bg-primary-dark"
            aria-label="Đổi ảnh đại diện"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
        </div>
        <p className="mt-4 text-lg font-semibold">{user.name}</p>
        <p className="text-sm text-muted">{user.email}</p>
        <span className={`badge mt-3 ${ROLES[user.role]?.className || ''}`}>{ROLES[user.role]?.label}</span>
        {user.createdAt && <p className="mt-4 border-t border-dashed border-line pt-4 text-xs text-muted">Thành viên từ {formatDate(user.createdAt)}</p>}
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="card p-6" noValidate>
          <h2 className="font-serif text-xl font-semibold">Thông tin cá nhân</h2>
          <p className="mt-1 text-sm text-muted">Tên và số điện thoại hiển thị cho chủ phòng hoặc khách khi có đơn đặt.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input label="Họ và tên" icon={UserRound} value={form.name} error={errors.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            <Input label="Email" icon={Mail} value={user.email} disabled hint="Email dùng để đăng nhập, không thể thay đổi" />
            <Input
              label="Số điện thoại"
              icon={Phone}
              value={form.phone}
              error={errors.phone}
              placeholder="0901234567"
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <Textarea
              label="Giới thiệu bản thân"
              containerClassName="sm:col-span-2"
              rows={3}
              placeholder="Vài dòng về bạn..."
              value={form.bio}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <Button type="submit" loading={saving}>
              Lưu thay đổi
            </Button>
          </div>
        </form>

        <form onSubmit={handlePassword} className="card p-6" noValidate>
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
            <KeyRound className="h-5 w-5 text-primary" /> Đổi mật khẩu
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              error={passwordErrors.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            />
            <Input
              label="Mật khẩu mới"
              type="password"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              error={passwordErrors.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            />
            <Input
              label="Nhập lại mật khẩu mới"
              type="password"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              error={passwordErrors.confirmPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <Button type="submit" variant="outline" loading={changingPassword}>
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage({ embedded = false }) {
  if (embedded) return <ProfileContent />;
  return (
    <AccountShell title="Tài khoản của tôi" description="Quản lý thông tin cá nhân, ảnh đại diện và mật khẩu.">
      <ProfileContent />
    </AccountShell>
  );
}
