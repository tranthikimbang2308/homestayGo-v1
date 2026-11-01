import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { LayoutGrid, Map as MapIcon, MapPinOff, RotateCcw, SearchX, SlidersHorizontal, Star, X } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';
import RoomCard, { RoomCardSkeleton } from '../components/RoomCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { RoomsMap, hasLocation } from '../components/RoomMap.jsx';
import { AMENITIES, CITIES, ROOM_TYPES, SORT_OPTIONS } from '../utils/constants.js';
import { formatPrice } from '../utils/format.js';

const FILTER_KEYS = ['keyword', 'city', 'roomType', 'minPrice', 'maxPrice', 'guests', 'amenities', 'minRating', 'checkIn', 'checkOut', 'sort', 'page'];

const PRICE_PRESETS = [
  { label: 'Dưới 500.000 ₫', min: '', max: '500000' },
  { label: '500.000 - 1.000.000 ₫', min: '500000', max: '1000000' },
  { label: '1.000.000 - 2.000.000 ₫', min: '1000000', max: '2000000' },
  { label: 'Trên 2.000.000 ₫', min: '2000000', max: '' },
];

function FilterGroup({ title, children }) {
  return (
    <div className="border-b border-line py-5 first:pt-0 last:border-b-0">
      <h3 className="mb-3 font-sans text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function FilterPanel({ params, setFilter, setFilters, cityOptions }) {
  const [priceDraft, setPriceDraft] = useState({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });
  const selectedAmenities = (params.get('amenities') || '').split(',').filter(Boolean);
  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    setPriceDraft({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });
  }, [params]);

  const toggleAmenity = (key) => {
    const next = selectedAmenities.includes(key) ? selectedAmenities.filter((item) => item !== key) : [...selectedAmenities, key];
    setFilter('amenities', next.join(','));
  };

  const chipClass = (active) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      active ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary'
    }`;

  return (
    <div>
      <FilterGroup title="Thành phố">
        <select className="input" value={params.get('city') || ''} onChange={(event) => setFilter('city', event.target.value)}>
          <option value="">Tất cả thành phố</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup title="Ngày lưu trú">
        <div className="grid gap-2">
          <div>
            <span className="mb-1 block text-xs text-muted">Nhận phòng</span>
            <input
              type="date"
              className="input px-2.5"
              min={today}
              value={params.get('checkIn') || ''}
              onChange={(event) => {
                const value = event.target.value;
                const checkOut = params.get('checkOut');
                const nextCheckOut = value && checkOut && !dayjs(checkOut).isAfter(dayjs(value)) ? dayjs(value).add(1, 'day').format('YYYY-MM-DD') : checkOut;
                setFilters({ checkIn: value, checkOut: nextCheckOut || '' });
              }}
            />
          </div>
          <div>
            <span className="mb-1 block text-xs text-muted">Trả phòng</span>
            <input
              type="date"
              className="input px-2.5"
              min={params.get('checkIn') ? dayjs(params.get('checkIn')).add(1, 'day').format('YYYY-MM-DD') : today}
              value={params.get('checkOut') || ''}
              onChange={(event) => setFilter('checkOut', event.target.value)}
            />
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Số khách">
        <input
          type="number"
          min="1"
          className="input"
          placeholder="Số khách tối thiểu"
          value={params.get('guests') || ''}
          onChange={(event) => setFilter('guests', event.target.value)}
        />
      </FilterGroup>

      <FilterGroup title="Loại phòng">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chipClass(!params.get('roomType'))} onClick={() => setFilter('roomType', '')}>
            Tất cả
          </button>
          {ROOM_TYPES.map((type) => (
            <button key={type.key} type="button" className={chipClass(params.get('roomType') === type.key)} onClick={() => setFilter('roomType', type.key)}>
              {type.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Khoảng giá mỗi đêm">
        <div className="space-y-2">
          {PRICE_PRESETS.map((preset) => {
            const active = (params.get('minPrice') || '') === preset.min && (params.get('maxPrice') || '') === preset.max;
            return (
              <label key={preset.label} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="price-preset"
                  className="h-4 w-4 accent-primary"
                  checked={active}
                  onChange={() => setFilters({ minPrice: preset.min, maxPrice: preset.max })}
                />
                {preset.label}
              </label>
            );
          })}
        </div>
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters({ minPrice: priceDraft.min, maxPrice: priceDraft.max });
          }}
        >
          <input
            type="number"
            min="0"
            step="50000"
            className="input px-2.5"
            placeholder="Từ"
            value={priceDraft.min}
            onChange={(event) => setPriceDraft((prev) => ({ ...prev, min: event.target.value }))}
          />
          <span className="text-muted">-</span>
          <input
            type="number"
            min="0"
            step="50000"
            className="input px-2.5"
            placeholder="Đến"
            value={priceDraft.max}
            onChange={(event) => setPriceDraft((prev) => ({ ...prev, max: event.target.value }))}
          />
          <button type="submit" className="btn btn-outline btn-sm h-[42px] shrink-0">
            Áp dụng
          </button>
        </form>
      </FilterGroup>

      <FilterGroup title="Đánh giá tối thiểu">
        <div className="flex flex-wrap gap-2">
          {[0, 3, 4, 4.5].map((value) => {
            const active = Number(params.get('minRating') || 0) === value;
            return (
              <button key={value} type="button" className={chipClass(active)} onClick={() => setFilter('minRating', value ? String(value) : '')}>
                {value ? (
                  <span className="flex items-center gap-1">
                    <Star className={`h-3 w-3 ${active ? 'fill-white' : 'fill-accent text-accent'}`} /> Từ {value}
                  </span>
                ) : (
                  'Bất kỳ'
                )}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Tiện nghi">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {AMENITIES.map((amenity) => (
            <label key={amenity.key} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-primary"
                checked={selectedAmenities.includes(amenity.key)}
                onChange={() => toggleAmenity(amenity.key)}
              />
              <span className="truncate">{amenity.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

export default function RoomsPage() {
  const [params, setParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cityOptions, setCityOptions] = useState(CITIES);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mapRooms, setMapRooms] = useState([]);
  const isMapView = params.get('view') === 'map';

  const queryString = params.toString();

  useEffect(() => {
    client
      .get('/rooms/cities')
      .then((res) => {
        const list = (res.data.data || []).map((item) => item.city);
        if (list.length) setCityOptions(Array.from(new Set([...list, ...CITIES])));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const query = {};
    FILTER_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) query[key] = value;
    });
    setLoading(true);
    setError('');
    if (isMapView) {
      delete query.page;
      client
        .get('/rooms/map', { params: query })
        .then((res) => setMapRooms(res.data.data || []))
        .catch((err) => {
          setMapRooms([]);
          setError(getErrorMessage(err, 'Không tải được bản đồ phòng'));
        })
        .finally(() => setLoading(false));
      return;
    }
    query.limit = 12;
    client
      .get('/rooms', { params: query })
      .then((res) => {
        setRooms(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: (res.data.data || []).length });
      })
      .catch((err) => {
        setRooms([]);
        setError(getErrorMessage(err, 'Không tải được danh sách phòng'));
      })
      .finally(() => setLoading(false));
  }, [queryString]);

  const setFilters = (updates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, value);
    });
    if (!('page' in updates)) next.delete('page');
    setParams(next);
  };

  const setFilter = (key, value) => setFilters({ [key]: value });

  const resetFilters = () => setParams(isMapView ? new URLSearchParams({ view: 'map' }) : new URLSearchParams());

  const setView = (view) => {
    const next = new URLSearchParams(params);
    if (view === 'map') next.set('view', 'map');
    else next.delete('view');
    next.delete('page');
    setParams(next);
  };

  const locatedCount = useMemo(() => mapRooms.filter(hasLocation).length, [mapRooms]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (params.get('keyword')) chips.push({ keys: ['keyword'], label: `"${params.get('keyword')}"` });
    if (params.get('city')) chips.push({ keys: ['city'], label: params.get('city') });
    if (params.get('roomType')) chips.push({ keys: ['roomType'], label: ROOM_TYPES.find((t) => t.key === params.get('roomType'))?.label });
    if (params.get('minPrice') || params.get('maxPrice')) {
      const min = params.get('minPrice');
      const max = params.get('maxPrice');
      chips.push({
        keys: ['minPrice', 'maxPrice'],
        label: min && max ? `${formatPrice(min)} - ${formatPrice(max)}` : min ? `Từ ${formatPrice(min)}` : `Đến ${formatPrice(max)}`,
      });
    }
    if (params.get('guests')) chips.push({ keys: ['guests'], label: `${params.get('guests')}+ khách` });
    if (params.get('minRating')) chips.push({ keys: ['minRating'], label: `Từ ${params.get('minRating')} sao` });
    if (params.get('checkIn') && params.get('checkOut'))
      chips.push({ keys: ['checkIn', 'checkOut'], label: `${dayjs(params.get('checkIn')).format('DD/MM')} - ${dayjs(params.get('checkOut')).format('DD/MM')}` });
    (params.get('amenities') || '')
      .split(',')
      .filter(Boolean)
      .forEach((key) => {
        chips.push({
          keys: [],
          amenity: key,
          label: AMENITIES.find((item) => item.key === key)?.label || key,
        });
      });
    return chips;
  }, [params]);

  const removeChip = (chip) => {
    if (chip.amenity) {
      const next = (params.get('amenities') || '')
        .split(',')
        .filter((item) => item && item !== chip.amenity)
        .join(',');
      setFilter('amenities', next);
      return;
    }
    setFilters(Object.fromEntries(chip.keys.map((key) => [key, ''])));
  };

  const heading = params.get('city') || params.get('keyword') ? `Homestay tại ${params.get('city') || params.get('keyword')}` : 'Tất cả homestay';

  return (
    <div>
      <div className="border-b border-line bg-white">
        <div className="container-page py-6">
          <SearchBar
            compact
            initial={{
              keyword: params.get('keyword') || '',
              checkIn: params.get('checkIn') || '',
              checkOut: params.get('checkOut') || '',
              guests: params.get('guests') || '',
            }}
          />
        </div>
      </div>

      <div className="container-page py-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="card sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold">Bộ lọc</h2>
                <button type="button" onClick={resetFilters} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  <RotateCcw className="h-3.5 w-3.5" /> Đặt lại
                </button>
              </div>
              <FilterPanel params={params} setFilter={setFilter} setFilters={setFilters} cityOptions={cityOptions} />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl font-semibold sm:text-3xl">{heading}</h1>
                <p className="mt-1 text-sm text-muted">{loading
                    ? 'Đang tìm phòng...'
                    : isMapView
                      ? `${mapRooms.length} phòng phù hợp${mapRooms.length > locatedCount ? `, ${locatedCount} phòng có vị trí trên bản đồ` : ''}`
                      : `${pagination.total ?? rooms.length} phòng phù hợp`}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-line bg-white p-0.5" role="group" aria-label="Chế độ hiển thị">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    aria-pressed={!isMapView}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      !isMapView ? 'bg-primary text-white' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" /> Danh sách
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('map')}
                    aria-pressed={isMapView}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isMapView ? 'bg-primary text-white' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <MapIcon className="h-4 w-4" /> Bản đồ
                  </button>
                </div>
                <button type="button" onClick={() => setDrawerOpen(true)} className="btn btn-outline lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
                </button>
                <label className="flex items-center gap-2 text-sm">
                  <span className="hidden text-muted sm:inline">Sắp xếp</span>
                  <select className="input w-auto py-2" value={params.get('sort') || 'newest'} onChange={(event) => setFilter('sort', event.target.value)}>
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={`${chip.label}-${chip.amenity || chip.keys.join()}`}
                    type="button"
                    onClick={() => removeChip(chip)}
                    className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-light px-3 py-1 text-xs font-medium text-primary hover:border-primary"
                  >
                    {chip.label}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                <button type="button" onClick={resetFilters} className="text-xs font-medium text-muted hover:text-ink">
                  Xóa tất cả
                </button>
              </div>
            )}

            <div className="mt-6">
              {loading ? (
                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <RoomCardSkeleton key={index} />
                  ))}
                </div>
              ) : error ? (
                <EmptyState icon={SearchX} title="Không tải được danh sách phòng" description={error} />
              ) : isMapView ? (
                mapRooms.length === 0 ? (
                  <EmptyState
                    icon={SearchX}
                    title="Không có phòng nào khớp bộ lọc"
                    description="Thử bỏ bớt tiện nghi, mở rộng khoảng giá hoặc đổi ngày lưu trú."
                    action={
                      <button type="button" onClick={resetFilters} className="btn btn-outline">
                        <RotateCcw className="h-4 w-4" /> Xóa bộ lọc
                      </button>
                    }
                  />
                ) : locatedCount === 0 ? (
                  <EmptyState icon={MapPinOff} title="Chưa có phòng nào có vị trí" description="Các phòng phù hợp chưa được chủ phòng cập nhật tọa độ trên bản đồ." />
                ) : (
                  <RoomsMap rooms={mapRooms} height={640} />
                )
              ) : rooms.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="Không có phòng nào khớp bộ lọc"
                  description="Thử bỏ bớt tiện nghi, mở rộng khoảng giá hoặc đổi ngày lưu trú."
                  action={
                    <button type="button" onClick={resetFilters} className="btn btn-outline">
                      <RotateCcw className="h-4 w-4" /> Xóa bộ lọc
                    </button>
                  }
                />
              ) : (
                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                  {rooms.map((room) => (
                    <RoomCard key={room._id} room={room} />
                  ))}
                </div>
              )}
              {!isMapView && (
                <Pagination
                  page={Number(params.get('page')) || pagination.page || 1}
                  totalPages={pagination.totalPages}
                  onChange={(page) => {
                    setFilters({ page: String(page) });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[340px] max-w-[90vw] flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-serif text-lg font-semibold">Bộ lọc</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 hover:bg-sand" aria-label="Đóng bộ lọc">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterPanel params={params} setFilter={setFilter} setFilters={setFilters} cityOptions={cityOptions} />
            </div>
            <div className="flex gap-2 border-t border-line p-4">
              <button type="button" onClick={resetFilters} className="btn btn-outline flex-1">
                Đặt lại
              </button>
              <button type="button" onClick={() => setDrawerOpen(false)} className="btn btn-primary flex-1">
                Xem {isMapView ? mapRooms.length : pagination.total ?? ''} phòng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
