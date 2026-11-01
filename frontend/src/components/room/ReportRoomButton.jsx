import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Flag } from 'lucide-react';
import client, { getErrorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Textarea from '../ui/Textarea.jsx';

export const REPORT_REASONS = [
  { value: 'sai_thong_tin', label: 'Thông tin sai sự thật', hint: 'Ảnh, giá, tiện nghi hoặc địa chỉ không đúng thực tế' },
  { value: 'lua_dao', label: 'Nghi lừa đảo', hint: 'Yêu cầu chuyển khoản ngoài hệ thống, phòng không tồn tại' },
  { value: 've_sinh', label: 'Vệ sinh kém', hint: 'Phòng bẩn, có côn trùng, đồ dùng không sạch' },
  { value: 'thai_do', label: 'Thái độ chủ phòng', hint: 'Thiếu tôn trọng, gây khó dễ cho khách' },
  { value: 'khac', label: 'Khác', hint: 'Vấn đề khác, vui lòng mô tả chi tiết' },
];

export default function ReportRoomButton({ room }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!room?._id) return null;
  if (isAuthenticated && user?.role !== 'customer') return null;

  const openModal = () => {
    if (!isAuthenticated) {
      toast('Vui lòng đăng nhập để báo cáo phòng');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    setReason('');
    setDescription('');
    setError('');
    setOpen(true);
  };

  const submit = async () => {
    if (!reason) {
      setError('Vui lòng chọn lý do báo cáo');
      return;
    }
    if (reason === 'khac' && description.trim().length < 10) {
      setError('Vui lòng mô tả rõ vấn đề (tối thiểu 10 ký tự)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await client.post('/reports', { roomId: room._id, reason, description: description.trim() });
      toast.success(res.data.message || 'Đã gửi báo cáo');
      setOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không gửi được báo cáo'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" onClick={openModal} className="btn btn-ghost btn-sm">
        <Flag className="h-4 w-4" /> Báo cáo
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Báo cáo phòng"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button loading={submitting} onClick={submit}>Gửi báo cáo</Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-muted">
          Báo cáo của bạn về <span className="font-medium text-ink">{room.title}</span> sẽ được đội ngũ HomestayGo xem xét và phản hồi qua thông báo.
        </p>
        <fieldset>
          <legend className="label">Lý do</legend>
          <div className="space-y-2">
            {REPORT_REASONS.map((item) => {
              const active = reason === item.value;
              return (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-2.5 transition-colors ${active ? 'border-primary bg-primary-light' : 'border-line hover:border-primary/40'}`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={item.value}
                    checked={active}
                    onChange={() => {
                      setReason(item.value);
                      setError('');
                    }}
                    className="mt-1 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{item.label}</span>
                    <span className="block text-xs text-muted">{item.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <Textarea
          containerClassName="mt-4"
          label="Mô tả chi tiết"
          rows={4}
          maxLength={2000}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            if (error) setError('');
          }}
          placeholder="Mô tả cụ thể điều bạn gặp phải để chúng tôi xử lý nhanh hơn"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Modal>
    </>
  );
}
