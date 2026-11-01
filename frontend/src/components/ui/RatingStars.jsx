import { useState } from 'react';
import { Star } from 'lucide-react';

const SIZE_MAP = { xs: 'h-3 w-3', sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6', xl: 'h-8 w-8' };

export default function RatingStars({ value = 0, size = 'md', onChange, className = '' }) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === 'function';
  const display = hover || Number(value) || 0;
  const sizeClass = typeof size === 'number' ? '' : SIZE_MAP[size] || SIZE_MAP.md;
  const style = typeof size === 'number' ? { width: size, height: size } : undefined;

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} onMouseLeave={() => interactive && setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, display - (star - 1)));
        const icon = (
          <span className="relative inline-block" style={style}>
            <Star className={`${sizeClass} text-line`} style={style} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${sizeClass} text-accent`} style={style} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
        if (!interactive) return <span key={star}>{icon}</span>;
        return (
          <button
            key={star}
            type="button"
            className="cursor-pointer p-0.5"
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange(star)}
            aria-label={`${star} sao`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
