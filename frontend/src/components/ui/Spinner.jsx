import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 'md', label, fullPage = false, className = '' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-7 w-7';
  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 text-primary ${className}`} role="status">
      <Loader2 className={`${sizeClass} animate-spin`} />
      {label && <span className="text-sm text-muted">{label}</span>}
      <span className="sr-only">Đang tải</span>
    </div>
  );
  if (fullPage) return <div className="flex min-h-[60vh] items-center justify-center">{spinner}</div>;
  return spinner;
}
