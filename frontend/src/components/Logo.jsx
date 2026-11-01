import { Link } from 'react-router-dom';

export default function Logo({ to = '/', light = false, className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`} aria-label="HomestayGo - Trang chủ">
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={light ? '#F7F3EC' : '#1F5F4A'} />
        <path d="M8 16 16 9l8 7v8h-5v-5h-6v5H8z" fill={light ? '#1F5F4A' : '#F7F3EC'} />
      </svg>
      <span className={`font-serif text-xl font-semibold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        Homestay<span className={light ? 'text-[#F2B79E]' : 'text-accent'}>Go</span>
      </span>
    </Link>
  );
}
