import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, X, EyeOff, Eye, MapPin, Users, BedDouble, Bath, Ruler, Clock, ClipboardCheck, Mail, Phone, ExternalLink } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { formatPrice, formatDate, initials } from '../../utils/format';
import { CITIES } from '../../utils/constants';
import {
  PageHeader,
  SearchBox,
  FilterTabs,
  StatusPill,
  roomStatusLabel,
  roomTypeLabel,
  amenityLabel,
  ROOM_STATUS_KEYS,
  coverImage,
  errorMessage,
  TABLE_CLASS,
  TH_CLASS,
  TD_CLASS,
} from '../owner/dashboardShared';

const STATUS_OPTIONS = [...ROOM_STATUS_KEYS.map((key) => ({ value: key, label: roomStatusLabel(key) })), { value: '', label: 'Tất cả' }];

function RoomDetail({ room }) {
  const [activeImage, setActiveImage] = useState(0);
  const owner = room.owner || {};
  const images = room.images || [];

  return (
    <div className="space-y-5">
      {images.length > 0 ? (
        <div>
          <img src={images[activeImage] || images[0]} alt={room.title} className="aspect-[16/9] w-full rounded-xl object-cover" />
          {images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {images.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`shrink-0 overflow-hidden rounded-lg border-2 ${index === activeImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={url} alt="" className="h-14 w-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-sand text-sm text-muted">Phòng chưa có ảnh</div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={room.status}>{roomStatusLabel(room.status)}</StatusPill>
        <span className="text-xs text-muted">{roomTypeLabel(room.roomType)}</span>
        <span className="text-xs text-muted">· Đăng ngày {formatDate(room.createdAt)}</span>
      </div>

      {room.status === 'rejected' && room.rejectReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span className="font-medium">Lý do từ chối trước đó: </span>
          {room.rejectReason}
        </div>
      )}

      <div>
        <h4 className="font-serif text-xl font-semibold text-ink">{room.title}</h4>
        <p className="mt-1 flex items-start gap-1 text-sm text-muted">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          {[room.address, room.district, room.city].filter(Boolean).join(', ')}
          {room.location?.lat && room.location?.lng && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${room.location.lat}&mlon=${room.location.lng}#map=16/${room.location.lat}/${room.location.lng}`}
              target="_blank"
              rel="noreferrer"
              className="ml-1 inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              Bản đồ
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-line p-4 text-sm sm:grid-cols-4">
        <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{room.maxGuests || 0} khách</span>
        <span className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-primary" />{room.bedrooms || 0} PN · {room.beds || 0} giường</span>
        <span className="flex items-center gap-2"><Bath className="h-4 w-4 text-primary" />{room.bathrooms || 0} phòng tắm</span>
        <span className="flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" />{room.area || 0} m²</span>
        <span className="col-span-2 flex items-center gap-2 sm:col-span-4"><Clock className="h-4 w-4 text-primary" />Nhận phòng {room.checkInTime || '14:00'} · Trả phòng {room.checkOutTime || '12:00'}</span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="text-lg font-semibold text-accent">
          {formatPrice(room.pricePerNight)}
          <span className="text-sm font-normal text-muted"> /đêm</span>
        </p>
        <p className="text-sm text-muted">Phí dọn dẹp {formatPrice(room.cleaningFee || 0)}</p>
      </div>

      {room.description && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Mô tả</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{room.description}</p>
        </div>
      )}

      {room.amenities?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Tiện nghi</p>
          <div className="flex flex-wrap gap-1.5">
            {room.amenities.map((key) => (
              <span key={key} className="rounded-full border border-line bg-sand px-2.5 py-0.5 text-xs text-ink">
                {amenityLabel(key)}
              </span>
            ))}
          </div>
        </div>
      )}

      {room.rules && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Nội quy</p>
          <p className="whitespace-pre-line text-sm text-ink">{room.rules}</p>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-xl bg-sand p-4">
        {owner.avatar ? (
          <img src={owner.avatar} alt={owner.name} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{initials(owner.name || 'C')}</span>
        )}
        <div className="min-w-0 text-sm">
          <p className="text-xs text-muted">Chủ phòng</p>
          <p className="font-medium text-ink">{owner.name || 'Không rõ'}</p>
          <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-muted">
            {owner.email && <span className="flex items-center gap-1 break-all"><Mail className="h-3.5 w-3.5" />{owner.email}</span>}
            {owner.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{owner.phone}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('pending');
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/rooms', {
        params: { status: status || undefined, keyword: appliedKeyword || undefined, city: city || undefined, page, limit: 10 },
      });
      setRooms(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được danh sách phòng'));
    } finally {
      setLoading(false);
    }
  }, [status, appliedKeyword, city, page]);

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

  const runAction = async (room, path, body, successMessage) => {
    setBusyId(room._id);
    try {
      await api.patch(`/admin/rooms/${room._id}/${path}`, body);
      toast.success(successMessage);
      setViewing(null);
      fetchRooms();
      return true;
    } catch (error) {
      toast.error(errorMessage(error, 'Không cập nhật được phòng'));
      return false;
    } finally {
      setBusyId('');
    }
  };

  const approve = (room) => runAction(room, 'approve', undefined, 'Đã duyệt phòng, phòng đã hiển thị với khách');
  const hide = (room) => runAction(room, 'hide', undefined, 'Đã ẩn phòng');

  const openReject = (room) => {
    setReason('');
    setReasonError('');
    setRejecting(room);
  };

  const submitReject = async () => {
    if (!reason.trim()) {
      setReasonError('Lý do từ chối là bắt buộc');
      return;
    }
    const ok = await runAction(rejecting, 'reject', { reason: reason.trim() }, 'Đã từ chối phòng');
    if (ok) setRejecting(null);
  };

  const renderActions = (room, size = 'sm') => (
    <>
      {room.status !== 'approved' && (
        <Button size={size} icon={room.status === 'hidden' ? Eye : Check} disabled={busyId === room._id} onClick={() => approve(room)}>
          {room.status === 'hidden' ? 'Hiện lại' : 'Duyệt'}
        </Button>
      )}
      {room.status === 'pending' && (
        <Button size={size} variant="outline" icon={X} disabled={busyId === room._id} onClick={() => openReject(room)}>
          Từ chối
        </Button>
      )}
      {room.status !== 'hidden' && room.status !== 'rejected' && room.status !== 'pending' && (
        <Button size={size} variant="outline" icon={EyeOff} disabled={busyId === room._id} onClick={() => hide(room)}>
          Ẩn
        </Button>
      )}
    </>
  );

  return (
    <div>
      <PageHeader title="Duyệt phòng" description="Kiểm tra thông tin, ảnh và vị trí trước khi cho phòng hiển thị trên trang tìm kiếm." />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          options={STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setPage(1);
            }}
            className="input py-2 sm:w-40"
            aria-label="Lọc theo thành phố"
          >
            <option value="">Mọi thành phố</option>
            {CITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <SearchBox value={keyword} onChange={setKeyword} placeholder="Tên phòng, địa chỉ" />
        </div>
      </div>

      {loading ? (
        <Spinner fullPage />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={status === 'pending' && !appliedKeyword && !city ? 'Không còn phòng nào chờ duyệt' : 'Không có phòng phù hợp'}
          description={status === 'pending' && !appliedKeyword && !city ? 'Phòng mới do chủ phòng đăng sẽ xuất hiện ở đây.' : 'Thử đổi bộ lọc hoặc từ khóa.'}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead className="bg-sand/60">
                  <tr>
                    <th className={TH_CLASS}>Phòng</th>
                    <th className={TH_CLASS}>Chủ phòng</th>
                    <th className={`${TH_CLASS} text-right`}>Giá / đêm</th>
                    <th className={`${TH_CLASS} hidden 2xl:table-cell`}>Ngày đăng</th>
                    <th className={TH_CLASS}>Trạng thái</th>
                    <th className={`${TH_CLASS} text-right`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rooms.map((room) => (
                    <tr key={room._id} className="hover:bg-sand/40">
                      <td className={TD_CLASS}>
                        <button type="button" onClick={() => setViewing(room)} className="flex min-w-[13rem] max-w-[18rem] items-center gap-3 text-left">
                          {coverImage(room) ? (
                            <img src={coverImage(room)} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
                          ) : (
                            <div className="h-12 w-16 shrink-0 rounded-md bg-sand" />
                          )}
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-medium hover:text-primary">{room.title}</p>
                            <p className="text-xs text-muted">
                              {roomTypeLabel(room.roomType)} · {room.city}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className={TD_CLASS}>
                        <p className="whitespace-nowrap">{room.owner?.name}</p>
                        <p className="text-xs text-muted">{room.owner?.email}</p>
                      </td>
                      <td className={`${TD_CLASS} whitespace-nowrap text-right font-semibold text-accent`}>{formatPrice(room.pricePerNight)}</td>
                      <td className={`${TD_CLASS} hidden whitespace-nowrap 2xl:table-cell`}>{formatDate(room.createdAt)}</td>
                      <td className={TD_CLASS}>
                        <StatusPill status={room.status}>{roomStatusLabel(room.status)}</StatusPill>
                      </td>
                      <td className={TD_CLASS}>
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <Button size="sm" variant="ghost" onClick={() => setViewing(room)}>
                            Xem
                          </Button>
                          {renderActions(room)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page || page} totalPages={pagination.totalPages} onChange={setPage} />
        </>
      )}

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Chi tiết phòng" size="lg" footer={viewing ? renderActions(viewing, 'md') : null}>
        {viewing && <RoomDetail room={viewing} />}
      </Modal>

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Từ chối phòng"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Quay lại
            </Button>
            <Button variant="danger" loading={busyId === rejecting?._id} onClick={submitReject}>
              Từ chối phòng
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted">
          Chủ phòng sẽ thấy lý do này và có thể sửa rồi gửi duyệt lại <span className="font-medium text-ink">{rejecting?.title}</span>.
        </p>
        <Textarea
          label="Lý do từ chối"
          rows={4}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            if (reasonError) setReasonError('');
          }}
          error={reasonError}
          placeholder="VD: Ảnh mờ, thiếu ảnh phòng tắm, địa chỉ không khớp vị trí bản đồ"
          autoFocus
        />
      </Modal>
    </div>
  );
}
