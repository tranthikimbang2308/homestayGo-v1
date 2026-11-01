import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { CalendarDays, MapPin, Search, Users } from 'lucide-react';

export default function SearchBar({ initial = {}, compact = false }) {
  const navigate = useNavigate();
  const today = dayjs().format('YYYY-MM-DD');
  const [form, setForm] = useState({
    keyword: initial.keyword || initial.city || '',
    checkIn: initial.checkIn || '',
    checkOut: initial.checkOut || '',
    guests: initial.guests || '',
  });

  useEffect(() => {
    setForm({
      keyword: initial.keyword || initial.city || '',
      checkIn: initial.checkIn || '',
      checkOut: initial.checkOut || '',
      guests: initial.guests || '',
    });
  }, [initial.keyword, initial.city, initial.checkIn, initial.checkOut, initial.guests]);

  const update = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'checkIn' && next.checkOut && !dayjs(next.checkOut).isAfter(dayjs(value))) {
        next.checkOut = dayjs(value).add(1, 'day').format('YYYY-MM-DD');
      }
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (form.keyword.trim()) params.set('keyword', form.keyword.trim());
    if (form.checkIn) params.set('checkIn', form.checkIn);
    if (form.checkOut) params.set('checkOut', form.checkOut);
    if (form.guests) params.set('guests', form.guests);
    navigate(`/rooms?${params.toString()}`);
  };

  const fieldClass = 'w-full bg-transparent text-sm font-medium text-ink placeholder:font-normal placeholder:text-muted focus:outline-none';

  return (
    <form
      onSubmit={handleSubmit}
      className={`card grid grid-cols-1 overflow-hidden sm:grid-cols-2 ${compact ? 'lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]' : 'lg:grid-cols-[1.5fr_1fr_1fr_0.8fr_auto]'} ${compact ? '' : 'card-shadow'}`}
    >
      <label className="flex flex-col gap-0.5 border-b border-line px-4 py-3 sm:col-span-2 lg:col-span-1 lg:border-b-0 lg:border-r">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <MapPin className="h-3.5 w-3.5" /> Địa điểm
        </span>
        <input className={fieldClass} placeholder="Đà Lạt, Hội An, Sa Pa..." value={form.keyword} onChange={update('keyword')} />
      </label>
      <label className="flex flex-col gap-0.5 border-b border-line px-4 py-3 sm:border-r lg:border-b-0">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <CalendarDays className="h-3.5 w-3.5" /> Nhận phòng
        </span>
        <input type="date" className={fieldClass} min={today} value={form.checkIn} onChange={update('checkIn')} />
      </label>
      <label className="flex flex-col gap-0.5 border-b border-line px-4 py-3 lg:border-b-0 lg:border-r">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <CalendarDays className="h-3.5 w-3.5" /> Trả phòng
        </span>
        <input
          type="date"
          className={fieldClass}
          min={form.checkIn ? dayjs(form.checkIn).add(1, 'day').format('YYYY-MM-DD') : today}
          value={form.checkOut}
          onChange={update('checkOut')}
        />
      </label>
      <label className="flex flex-col gap-0.5 border-b border-line px-4 py-3 sm:col-span-2 lg:col-span-1 lg:border-b-0">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <Users className="h-3.5 w-3.5" /> Số khách
        </span>
        <input type="number" min="1" max="30" className={fieldClass} placeholder="2 khách" value={form.guests} onChange={update('guests')} />
      </label>
      <div className="p-2 sm:col-span-2 lg:col-span-1">
        <button type="submit" className="btn btn-accent h-full w-full px-6 lg:min-h-[56px]">
          <Search className="h-4 w-4" />
          Tìm phòng
        </button>
      </div>
    </form>
  );
}
