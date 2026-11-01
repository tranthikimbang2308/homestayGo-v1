import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const FORMAT = 'YYYY-MM-DD';

export const buildBlockedNights = (bookedDates = []) => {
  const blocked = new Set();
  bookedDates.forEach(({ checkIn, checkOut }) => {
    let cursor = dayjs(checkIn).startOf('day');
    const end = dayjs(checkOut).startOf('day');
    let guard = 0;
    while (cursor.isBefore(end) && guard < 400) {
      blocked.add(cursor.format(FORMAT));
      cursor = cursor.add(1, 'day');
      guard += 1;
    }
  });
  return blocked;
};

export const rangeHasBlocked = (start, end, blocked) => {
  if (!start || !end) return false;
  let cursor = dayjs(start);
  const last = dayjs(end);
  while (cursor.isBefore(last)) {
    if (blocked.has(cursor.format(FORMAT))) return true;
    cursor = cursor.add(1, 'day');
  }
  return false;
};

function MonthGrid({ month, checkIn, checkOut, hoverDate, setHoverDate, onPick, isDisabled }) {
  const start = month.startOf('month');
  const offset = (start.day() + 6) % 7;
  const days = start.daysInMonth();
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let d = 1; d <= days; d += 1) cells.push(start.date(d));

  const rangeEnd = checkOut || (checkIn && hoverDate && dayjs(hoverDate).isAfter(dayjs(checkIn)) ? hoverDate : null);

  return (
    <div>
      <p className="mb-3 text-center text-sm font-semibold capitalize">Tháng {month.format('M/YYYY')}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="pb-1 text-[11px] font-medium text-muted">
            {day}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />;
          const key = date.format(FORMAT);
          const disabled = isDisabled(date);
          const isStart = checkIn === key;
          const isEnd = rangeEnd === key;
          const inRange = checkIn && rangeEnd && key > checkIn && key < rangeEnd;
          return (
            <div key={key} className={`relative ${inRange ? 'bg-primary-light' : ''} ${isStart && rangeEnd ? 'rounded-l-full bg-primary-light' : ''} ${isEnd && checkIn ? 'rounded-r-full bg-primary-light' : ''}`}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(key)}
                onMouseEnter={() => setHoverDate(key)}
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                  isStart || isEnd
                    ? 'bg-primary font-semibold text-white'
                    : disabled
                      ? 'cursor-not-allowed text-muted/40 line-through'
                      : 'text-ink hover:border hover:border-ink'
                }`}
              >
                {date.date()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangeCalendar({ checkIn, checkOut, onChange, blocked = new Set(), months = 2, minNights = 1 }) {
  const minStay = Math.max(1, Number(minNights) || 1);
  const today = dayjs().startOf('day');
  const [viewMonth, setViewMonth] = useState(() => (checkIn ? dayjs(checkIn) : today).startOf('month'));
  const [hoverDate, setHoverDate] = useState(null);

  const isDisabled = useMemo(
    () => (date) => {
      if (date.isBefore(today)) return true;
      const key = date.format(FORMAT);
      if (checkIn && !checkOut) {
        if (key <= checkIn) return blocked.has(key) || date.isBefore(today);
        if (date.diff(dayjs(checkIn), 'day') < minStay) return true;
        return rangeHasBlocked(checkIn, key, blocked);
      }
      return blocked.has(key);
    },
    [checkIn, checkOut, blocked, today, minStay]
  );

  const handlePick = (key) => {
    if (!checkIn || checkOut || key <= checkIn) {
      onChange({ checkIn: key, checkOut: '' });
      return;
    }
    if (dayjs(key).diff(dayjs(checkIn), 'day') < minStay) return;
    if (rangeHasBlocked(checkIn, key, blocked)) {
      onChange({ checkIn: key, checkOut: '' });
      return;
    }
    onChange({ checkIn, checkOut: key });
  };

  const canGoBack = viewMonth.isAfter(today.startOf('month'));

  return (
    <div onMouseLeave={() => setHoverDate(null)}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth((prev) => prev.subtract(1, 'month'))}
          disabled={!canGoBack}
          className="rounded-full p-1.5 hover:bg-sand disabled:opacity-30"
          aria-label="Tháng trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setViewMonth((prev) => prev.add(1, 'month'))} className="rounded-full p-1.5 hover:bg-sand" aria-label="Tháng sau">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className={`grid gap-6 ${months > 1 ? 'sm:grid-cols-2' : ''}`}>
        {Array.from({ length: months }).map((_, index) => (
          <div key={index} className={index > 0 ? 'hidden sm:block' : ''}>
            <MonthGrid
              month={viewMonth.add(index, 'month')}
              checkIn={checkIn}
              checkOut={checkOut}
              hoverDate={hoverDate}
              setHoverDate={setHoverDate}
              onPick={handlePick}
              isDisabled={isDisabled}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-primary" /> Ngày đã chọn
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-muted/50 line-through">15</span> Đã kín lịch hoặc không nhận khách
        </span>
        {minStay > 1 && <span>Đặt tối thiểu {minStay} đêm</span>}
      </div>
    </div>
  );
}
