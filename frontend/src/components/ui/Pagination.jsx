import { ChevronLeft, ChevronRight } from 'lucide-react';

const buildPages = (page, totalPages) => {
  const pages = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, page + 1);
  if (start > 1) pages.push(1);
  if (start > 2) pages.push('start-gap');
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < totalPages - 1) pages.push('end-gap');
  if (end < totalPages) pages.push(totalPages);
  return pages;
};

export default function Pagination({ page = 1, totalPages = 1, onChange }) {
  const current = Number(page) || 1;
  const total = Number(totalPages) || 1;
  if (total <= 1) return null;

  const go = (target) => {
    if (target < 1 || target > total || target === current) return;
    onChange?.(target);
  };

  const baseClass = 'flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition-colors';

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Phân trang">
      <button
        type="button"
        onClick={() => go(current - 1)}
        disabled={current === 1}
        className={`${baseClass} border-line bg-white text-ink hover:border-primary disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {buildPages(current, total).map((item) =>
        typeof item === 'string' ? (
          <span key={item} className="px-1 text-muted">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => go(item)}
            aria-current={item === current ? 'page' : undefined}
            className={`${baseClass} ${item === current ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary'}`}
          >
            {item}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => go(current + 1)}
        disabled={current === total}
        className={`${baseClass} border-line bg-white text-ink hover:border-primary disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
