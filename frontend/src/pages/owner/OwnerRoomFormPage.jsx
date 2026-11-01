import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, LocateFixed, Save } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ImageUploader from '../../components/ImageUploader';
import { AMENITIES, ROOM_TYPES } from '../../utils/constants';
import { errorMessage, StatusPill, roomStatusLabel } from './dashboardShared';

const DEFAULT_CENTER = { lat: 11.9404, lng: 108.4583 };

const CITY_CENTERS = {
  'Đà Lạt': { lat: 11.9404, lng: 108.4583 },
  'Hội An': { lat: 15.8801, lng: 108.338 },
  'Sa Pa': { lat: 22.3364, lng: 103.8438 },
  'Vũng Tàu': { lat: 10.346, lng: 107.0843 },
  'Đà Nẵng': { lat: 16.0544, lng: 108.2022 },
  'Hà Nội': { lat: 21.0285, lng: 105.8542 },
  'Phú Quốc': { lat: 10.2899, lng: 103.984 },
  'Hồ Chí Minh': { lat: 10.7769, lng: 106.7009 },
  'Nha Trang': { lat: 12.2388, lng: 109.1967 },
  'Hạ Long': { lat: 20.9599, lng: 107.0425 },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  roomType: 'entire',
  address: '',
  city: '',
  district: '',
  lat: '',
  lng: '',
  pricePerNight: '',
  cleaningFee: '0',
  weekendPrice: '',
  minNights: '1',
  maxGuests: '2',
  bedrooms: '1',
  beds: '1',
  bathrooms: '1',
  area: '',
  amenities: [],
  images: [],
  rules: '',
  checkInTime: '14:00',
  checkOutTime: '12:00',
};

function Field({ label, error, required, children, hint, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

function FormSection({ title, description, children }) {
  return (
    <section className="grid gap-5 border-b border-line py-7 first:pt-0 last:border-b-0 lg:grid-cols-[16rem_1fr] lg:gap-10">
      <div>
        <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng);
    },
  });
  return null;
}

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
}

const toNumber = (value) => (value === '' || value === null || value === undefined ? undefined : Number(value));

export default function OwnerRoomFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;
    api
      .get(`/owner/rooms/${id}`)
      .then((res) => {
        if (ignore) return;
        const room = res.data.data || {};
        setCurrentStatus(room.status || '');
        setRejectReason(room.rejectReason || '');
        setForm({
          title: room.title || '',
          description: room.description || '',
          roomType: room.roomType || 'entire',
          address: room.address || '',
          city: room.city || '',
          district: room.district || '',
          lat: room.location?.lat ?? '',
          lng: room.location?.lng ?? '',
          pricePerNight: room.pricePerNight ?? '',
          cleaningFee: room.cleaningFee ?? '0',
          weekendPrice: room.weekendPrice ? room.weekendPrice : '',
          minNights: room.minNights ?? '1',
          maxGuests: room.maxGuests ?? '',
          bedrooms: room.bedrooms ?? '',
          beds: room.beds ?? '',
          bathrooms: room.bathrooms ?? '',
          area: room.area ?? '',
          amenities: room.amenities || [],
          images: room.images || [],
          rules: room.rules || '',
          checkInTime: room.checkInTime || '14:00',
          checkOutTime: room.checkOutTime || '12:00',
        });
      })
      .catch((error) => {
        toast.error(errorMessage(error, 'Không tải được thông tin phòng'));
        navigate('/owner/rooms');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id, isEdit, navigate]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleChange = (event) => setField(event.target.name, event.target.value);

  const toggleAmenity = (key) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(key) ? prev.amenities.filter((item) => item !== key) : [...prev.amenities, key],
    }));
  };

  const hasLocation = form.lat !== '' && form.lng !== '' && !Number.isNaN(Number(form.lat)) && !Number.isNaN(Number(form.lng));

  const mapCenter = useMemo(() => {
    if (hasLocation) return { lat: Number(form.lat), lng: Number(form.lng) };
    return CITY_CENTERS[form.city.trim()] || DEFAULT_CENTER;
  }, [hasLocation, form.lat, form.lng, form.city]);

  const pickLocation = ({ lat, lng }) => {
    setForm((prev) => ({ ...prev, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }));
    setErrors((prev) => ({ ...prev, location: undefined }));
  };

  const locateCurrentPosition = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => pickLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => toast.error('Không lấy được vị trí hiện tại, hãy chọn trên bản đồ')
    );
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Nhập tiêu đề phòng';
    else if (form.title.trim().length < 10) next.title = 'Tiêu đề cần ít nhất 10 ký tự';
    if (!form.description.trim()) next.description = 'Nhập mô tả phòng';
    if (!form.address.trim()) next.address = 'Nhập địa chỉ';
    if (!form.city.trim()) next.city = 'Nhập thành phố';
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0) next.pricePerNight = 'Giá mỗi đêm phải lớn hơn 0';
    if (Number(form.cleaningFee) < 0) next.cleaningFee = 'Phí dọn không được âm';
    if (form.weekendPrice !== '' && Number(form.weekendPrice) < 0) next.weekendPrice = 'Giá cuối tuần không được âm';
    if (form.minNights === '' || !Number.isInteger(Number(form.minNights)) || Number(form.minNights) < 1) next.minNights = 'Số đêm tối thiểu từ 1 trở lên';
    if (!form.maxGuests || Number(form.maxGuests) < 1) next.maxGuests = 'Ít nhất 1 khách';
    ['bedrooms', 'beds', 'bathrooms', 'area'].forEach((key) => {
      if (form[key] !== '' && Number(form[key]) < 0) next[key] = 'Không được âm';
    });
    if (!hasLocation) next.location = 'Bấm lên bản đồ để chọn vị trí phòng';
    else if (Math.abs(Number(form.lat)) > 90 || Math.abs(Number(form.lng)) > 180) next.location = 'Tọa độ không hợp lệ';
    if (form.images.length === 0) next.images = 'Thêm ít nhất 1 ảnh';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại các trường được đánh dấu');
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      roomType: form.roomType,
      address: form.address.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      location: { lat: Number(form.lat), lng: Number(form.lng) },
      pricePerNight: Number(form.pricePerNight),
      cleaningFee: toNumber(form.cleaningFee) || 0,
      weekendPrice: toNumber(form.weekendPrice) || 0,
      minNights: toNumber(form.minNights) || 1,
      maxGuests: toNumber(form.maxGuests),
      bedrooms: toNumber(form.bedrooms),
      beds: toNumber(form.beds),
      bathrooms: toNumber(form.bathrooms),
      area: toNumber(form.area),
      amenities: form.amenities,
      images: form.images,
      rules: form.rules.trim(),
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
    };
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/owner/rooms/${id}`, payload);
        toast.success(currentStatus === 'rejected' ? 'Đã lưu thay đổi và gửi duyệt lại' : 'Đã lưu thay đổi');
      } else {
        await api.post('/owner/rooms', payload);
        toast.success('Đã đăng phòng, phòng đang chờ quản trị viên duyệt');
      }
      navigate('/owner/rooms');
    } catch (error) {
      toast.error(errorMessage(error, 'Không lưu được phòng'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (name) => (errors[name] ? 'input input-error' : 'input');

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Link to="/owner/rooms" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        Phòng của tôi
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink sm:text-[1.75rem]">{isEdit ? 'Sửa thông tin phòng' : 'Đăng phòng mới'}</h1>
          <p className="mt-1 text-sm text-muted">
            {isEdit ? 'Cập nhật thông tin hiển thị với khách.' : 'Phòng sẽ hiển thị với khách sau khi quản trị viên duyệt.'}
          </p>
        </div>
        {isEdit && currentStatus && <StatusPill status={currentStatus}>{roomStatusLabel(currentStatus)}</StatusPill>}
      </div>

      {currentStatus === 'rejected' && rejectReason && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Phòng bị từ chối: {rejectReason}</p>
          <p className="mt-1">Sửa theo góp ý rồi lưu, phòng sẽ được gửi duyệt lại.</p>
        </div>
      )}

      <div className="rounded-xl border border-line bg-white p-5 sm:p-7">
        <FormSection title="Thông tin chung" description="Tiêu đề và mô tả là thứ khách đọc đầu tiên.">
          <div className="grid gap-4">
            <Field label="Tiêu đề" required error={errors.title}>
              <input name="title" value={form.title} onChange={handleChange} className={inputClass('title')} placeholder="VD: Nhà gỗ view đồi thông, có lò sưởi" maxLength={150} />
            </Field>
            <Field label="Loại phòng" required>
              <select name="roomType" value={form.roomType} onChange={handleChange} className={inputClass('roomType')}>
                {(ROOM_TYPES || []).map((type) => (
                  <option key={type.key} value={type.key}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mô tả" required error={errors.description}>
              <textarea
                name="description"
                rows={6}
                value={form.description}
                onChange={handleChange}
                className={inputClass('description')}
                placeholder="Không gian, phong cách, điểm đặc biệt, khoảng cách tới các điểm tham quan..."
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Vị trí" description="Bấm lên bản đồ để đặt ghim đúng vị trí phòng.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Địa chỉ" required error={errors.address} className="sm:col-span-2">
              <input name="address" value={form.address} onChange={handleChange} className={inputClass('address')} placeholder="Số nhà, tên đường" />
            </Field>
            <Field label="Thành phố" required error={errors.city}>
              <input name="city" list="city-suggestions" value={form.city} onChange={handleChange} className={inputClass('city')} placeholder="VD: Đà Lạt" />
              <datalist id="city-suggestions">
                {Object.keys(CITY_CENTERS).map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </Field>
            <Field label="Quận / Phường">
              <input name="district" value={form.district} onChange={handleChange} className={inputClass('district')} placeholder="VD: Phường 3" />
            </Field>
          </div>
          <div className="relative isolate mt-4 overflow-hidden rounded-xl border border-line">
            <div className="h-72 sm:h-80">
              <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={hasLocation ? 15 : 13} scrollWheelZoom className="h-full w-full">
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler onPick={pickLocation} />
                <MapRecenter center={mapCenter} />
                {hasLocation && (
                  <CircleMarker center={[Number(form.lat), Number(form.lng)]} radius={10} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1F5F4A', fillOpacity: 1 }} />
                )}
              </MapContainer>
            </div>
            <div className="flex flex-col gap-3 border-t border-line bg-sand/60 p-3 sm:flex-row sm:items-end">
              <div className="grid flex-1 grid-cols-2 gap-3">
                <Field label="Vĩ độ (lat)">
                  <input name="lat" type="number" step="any" value={form.lat} onChange={handleChange} className={inputClass('location')} placeholder="11.9404" />
                </Field>
                <Field label="Kinh độ (lng)">
                  <input name="lng" type="number" step="any" value={form.lng} onChange={handleChange} className={inputClass('location')} placeholder="108.4583" />
                </Field>
              </div>
              <button
                type="button"
                onClick={locateCurrentPosition}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-primary hover:text-primary"
              >
                <LocateFixed className="h-4 w-4" />
                Vị trí hiện tại
              </button>
            </div>
          </div>
          <p className={`mt-2 flex items-center gap-1 text-xs ${errors.location ? 'text-danger' : 'text-muted'}`}>
            <MapPin className="h-3.5 w-3.5" />
            {errors.location || (hasLocation ? `Đã chọn: ${form.lat}, ${form.lng}` : 'Chưa chọn vị trí')}
          </p>
        </FormSection>

        <FormSection title="Giá và sức chứa" description="Giá tính theo đêm, đơn vị đồng.">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Giá mỗi đêm (₫)" required error={errors.pricePerNight}>
              <input name="pricePerNight" type="number" min="0" step="10000" value={form.pricePerNight} onChange={handleChange} className={inputClass('pricePerNight')} placeholder="850000" />
            </Field>
            <Field label="Phí dọn dẹp (₫)" error={errors.cleaningFee}>
              <input name="cleaningFee" type="number" min="0" step="10000" value={form.cleaningFee} onChange={handleChange} className={inputClass('cleaningFee')} />
            </Field>
            <Field label="Giá cuối tuần (₫)" error={errors.weekendPrice} hint="Áp dụng cho đêm thứ 6 và thứ 7. Để trống nếu bằng giá thường.">
              <input name="weekendPrice" type="number" min="0" step="10000" value={form.weekendPrice} onChange={handleChange} className={inputClass('weekendPrice')} placeholder="Bằng giá thường" />
            </Field>
            <Field label="Số đêm tối thiểu" error={errors.minNights}>
              <input name="minNights" type="number" min="1" step="1" value={form.minNights} onChange={handleChange} className={inputClass('minNights')} />
            </Field>
            <Field label="Khách tối đa" required error={errors.maxGuests}>
              <input name="maxGuests" type="number" min="1" value={form.maxGuests} onChange={handleChange} className={inputClass('maxGuests')} />
            </Field>
            <Field label="Phòng ngủ" error={errors.bedrooms}>
              <input name="bedrooms" type="number" min="0" value={form.bedrooms} onChange={handleChange} className={inputClass('bedrooms')} />
            </Field>
            <Field label="Số giường" error={errors.beds}>
              <input name="beds" type="number" min="0" value={form.beds} onChange={handleChange} className={inputClass('beds')} />
            </Field>
            <Field label="Phòng tắm" error={errors.bathrooms}>
              <input name="bathrooms" type="number" min="0" value={form.bathrooms} onChange={handleChange} className={inputClass('bathrooms')} />
            </Field>
            <Field label="Diện tích (m²)" error={errors.area}>
              <input name="area" type="number" min="0" value={form.area} onChange={handleChange} className={inputClass('area')} />
            </Field>
            <Field label="Giờ nhận phòng">
              <input name="checkInTime" type="time" value={form.checkInTime} onChange={handleChange} className={inputClass('checkInTime')} />
            </Field>
            <Field label="Giờ trả phòng">
              <input name="checkOutTime" type="time" value={form.checkOutTime} onChange={handleChange} className={inputClass('checkOutTime')} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Tiện nghi" description={`Đã chọn ${form.amenities.length} tiện nghi.`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(AMENITIES || []).map((amenity) => {
              const checked = form.amenities.includes(amenity.key);
              return (
                <label
                  key={amenity.key}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    checked ? 'border-primary bg-primary-light text-primary' : 'border-line text-ink hover:border-primary/40'
                  }`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleAmenity(amenity.key)} className="h-4 w-4 rounded border-line accent-primary" />
                  {amenity.label}
                </label>
              );
            })}
          </div>
        </FormSection>

        <FormSection title="Hình ảnh" description="Ảnh đầu tiên là ảnh bìa. Nên có ảnh phòng ngủ, phòng tắm và view.">
          <ImageUploader value={form.images} onChange={(urls) => setField('images', urls)} />
          {errors.images && <p className="mt-2 text-xs text-danger">{errors.images}</p>}
        </FormSection>

        <FormSection title="Nội quy" description="Giờ yên tĩnh, hút thuốc, thú cưng, tiệc tùng...">
          <textarea name="rules" rows={4} value={form.rules} onChange={handleChange} className={inputClass('rules')} placeholder="VD: Không hút thuốc trong phòng. Giữ yên tĩnh sau 22:00." />
        </FormSection>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex items-center justify-end gap-2 border-t border-line bg-sand/95 px-4 py-3 sm:mx-0 sm:rounded-xl sm:border">
        <Button type="button" variant="outline" onClick={() => navigate('/owner/rooms')}>
          Hủy
        </Button>
        <Button type="submit" loading={saving} disabled={saving}>
          <Save className="h-4 w-4" />
          {isEdit ? 'Lưu thay đổi' : 'Đăng phòng'}
        </Button>
      </div>
    </form>
  );
}
