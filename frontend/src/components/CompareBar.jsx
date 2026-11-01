import { Link, useLocation } from 'react-router-dom';
import { GitCompareArrows, Plus, X } from 'lucide-react';
import { COMPARE_MAX, useCompare } from '../context/CompareContext.jsx';
import { FALLBACK_IMAGE } from '../utils/constants.js';

export default function CompareBar() {
  const { items, remove, clear } = useCompare();
  const location = useLocation();

  if (!items.length || location.pathname.startsWith('/compare')) return null;

  const emptySlots = Math.max(0, COMPARE_MAX - items.length);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white">
      <div className="container-page flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink sm:w-40 sm:shrink-0">
          <GitCompareArrows className="h-4 w-4 text-primary" />
          So sánh ({items.length}/{COMPARE_MAX})
        </div>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {items.map((item) => (
            <div key={item._id} className="flex w-56 shrink-0 items-center gap-2 rounded-lg border border-line p-1.5 pr-2">
              <img
                src={item.image || FALLBACK_IMAGE}
                alt={item.title}
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
                className="h-10 w-12 shrink-0 rounded-md object-cover"
              />
              <span className="line-clamp-2 min-w-0 flex-1 text-xs font-medium text-ink">{item.title}</span>
              <button
                type="button"
                onClick={() => remove(item._id)}
                className="shrink-0 rounded-md p-1 text-muted hover:bg-sand hover:text-ink"
                aria-label={`Bỏ ${item.title} khỏi so sánh`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={index}
              className="hidden w-56 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed border-line text-xs text-muted md:flex"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm phòng
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={clear} className="btn btn-ghost btn-sm">
            Xóa hết
          </button>
          {items.length >= 2 ? (
            <Link to="/compare" className="btn btn-primary btn-sm">
              So sánh ngay
            </Link>
          ) : (
            <span className="btn btn-primary btn-sm cursor-not-allowed opacity-50" title="Chọn ít nhất 2 phòng để so sánh">
              So sánh ngay
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
