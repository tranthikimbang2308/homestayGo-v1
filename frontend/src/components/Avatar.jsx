import { initials } from '../utils/format.js';

const SIZES = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

export default function Avatar({ src, name = '', size = 'sm', className = '' }) {
  const sizeClass = SIZES[size] || SIZES.sm;
  if (src) {
    return <img src={src} alt={name} className={`${sizeClass} shrink-0 rounded-full border border-line object-cover ${className}`} />;
  }
  return (
    <span className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary ${className}`}>
      {initials(name) || 'HG'}
    </span>
  );
}
