import dayjs from 'dayjs';

export const startOfToday = () => dayjs().startOf('day').toDate();

export const normalizeDate = (value) => {
  if (!value) return null;
  const d = dayjs(value);
  if (!d.isValid()) return null;
  return d.startOf('day').toDate();
};

export const lastTwelveMonths = () => {
  const months = [];
  const now = dayjs().startOf('month');
  for (let i = 11; i >= 0; i -= 1) {
    const m = now.subtract(i, 'month');
    months.push({ key: m.format('YYYY-MM'), label: m.format('MM/YYYY') });
  }
  return { months, from: now.subtract(11, 'month').toDate() };
};
