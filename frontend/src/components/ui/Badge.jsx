const TONES = {
  neutral: 'bg-stone-100 text-ink border border-stone-200',
  primary: 'bg-primary-light text-primary border border-primary/20',
  accent: 'bg-accent-light text-accent-dark border border-accent/20',
  success: 'bg-green-50 text-success border border-green-200',
  warning: 'bg-amber-50 text-warning border border-amber-200',
  danger: 'bg-red-50 text-danger border border-red-200',
  info: 'bg-sky-50 text-sky-700 border border-sky-200',
};

export default function Badge({ children, tone = 'neutral', className = '', status, map }) {
  const fromMap = status && map ? map[status] : null;
  const toneClass = fromMap?.className || TONES[tone] || TONES.neutral;
  return <span className={`badge ${toneClass} ${className}`}>{children ?? fromMap?.label ?? status}</span>;
}
