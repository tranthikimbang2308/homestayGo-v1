import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, EyeOff, MapPin, Star, Users, AlertCircle, BedDouble } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { formatPrice } from '../../utils/format';
import {
  PageHeader,
  SearchBox,
  FilterTabs,
  StatusPill,
  roomStatusLabel,
  roomTypeLabel,
  ROOM_STATUS_KEYS,
  coverImage,
  errorMessage,
} from './dashboardShared';

const STATUS_OPTIONS = [{ value: '', label: 'Tất cả' }, ...ROOM_STATUS_KEYS.map((key) => ({ value: key, label: roomStatusLabel(key) }))];

export default function OwnerRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState('');

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/owner/rooms', { params: { status: status || undefined, keyword: appliedKeyword || undefined, page, limit: 9 } });
      setRooms(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được danh sách phòng'));
    } finally {
      setLoading(false);
    }
  }, [status, appliedKeyword, page]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedKeyword(keyword.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const handleToggleVisibility = async (room) => {
    setBusyId(room._id);
    try {
      const res = await api.patch(`/owner/rooms/${room._id}/visibility`);
      const nextStatus = res.data.data?.status;
      toast.success(nextStatus === 'hidden' ? 'Đã ẩn phòng khỏi trang tìm kiếm' : 'Phòng đã hiển thị trở lại');
      fetchRooms();
    } catch (error) {
      toast.error(errorMessage(error, 'Không đổi được trạng thái hiển thị'));
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting._id);
    try {
      await api.delete(`/owner/rooms/${deleting._id}`);
      toast.success('Đã xóa phòng');
      setDeleting(null);
      if (rooms.length === 1 && page > 1) setPage(page - 1);
      else fetchRooms();
    } catch (error) {
      toast.error(errorMessage(error, 'Không xóa được phòng'));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <PageHeader
        title="Phòng của tôi"
        description="Phòng mới và phòng vừa sửa sau khi bị từ chối sẽ chờ quản trị viên duyệt trước khi hiển thị."
        actions={
          <Link
            to="/owner/rooms/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Đăng phòng mới
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          options={STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <SearchBox value={keyword} onChange={setKeyword} placeholder="Tìm theo tên phòng" />
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title={status || appliedKeyword ? 'Không có phòng phù hợp' : 'Bạn chưa đăng phòng nào'}
          description={status || appliedKeyword ? 'Thử bỏ bộ lọc hoặc đổi từ khóa.' : 'Đăng phòng đầu tiên để bắt đầu nhận khách.'}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <article key={room._id} className="flex flex-col overflow-hidden rounded-xl border border-line bg-white">
                <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-sand">
                  {coverImage(room) && <img src={coverImage(room)} alt={room.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
                  <div className="absolute left-3 top-3">
                    <StatusPill status={room.status}>{roomStatusLabel(room.status)}</StatusPill>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">{roomTypeLabel(room.roomType)}</p>
                  <h3 className="mt-1 line-clamp-2 font-serif text-base font-semibold text-ink">{room.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {[room.district, room.city].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      {room.ratingAvg ? Number(room.ratingAvg).toFixed(1) : 'Chưa có'} ({room.ratingCount || 0})
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Tối đa {room.maxGuests || 0} khách
                    </span>
                    <span>{room.bookingCount || 0} lượt đặt</span>
                  </div>
                  {room.status === 'rejected' && room.rejectReason && (
                    <div className="mt-3 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p>
                        <span className="font-medium">Lý do từ chối: </span>
                        {room.rejectReason}
                      </p>
                    </div>
                  )}
                  <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                    <p className="text-base font-semibold text-accent">
                      {formatPrice(room.pricePerNight)}
                      <span className="text-xs font-normal text-muted"> /đêm</span>
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                    <Link
                      to={`/owner/rooms/${room._id}/edit`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-primary hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                      Sửa
                    </Link>
                    {(room.status === 'approved' || room.status === 'hidden') && (
                      <button
                        type="button"
                        disabled={busyId === room._id}
                        onClick={() => handleToggleVisibility(room)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-primary hover:text-primary disabled:opacity-50"
                      >
                        {room.status === 'approved' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {room.status === 'approved' ? 'Ẩn' : 'Hiện'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleting(room)}
                      aria-label="Xóa phòng"
                      className="inline-flex items-center justify-center rounded-lg border border-line p-2 text-danger hover:border-danger hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={pagination.page || page} totalPages={pagination.totalPages} onChange={setPage} />
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Xóa phòng"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Giữ lại
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={busyId === deleting?._id} disabled={busyId === deleting?._id}>
              Xóa phòng
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink">
          Xóa vĩnh viễn <span className="font-semibold">{deleting?.title}</span>? Phòng đang có đơn chờ xác nhận, đã xác nhận hoặc đang lưu trú sẽ không xóa được.
        </p>
      </Modal>
    </div>
  );
}
