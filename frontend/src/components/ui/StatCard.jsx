export default function StatCard({ label, value, icon: Icon, hint, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1.5 truncate font-serif text-2xl font-semibold text-ink">{value}</p>
        </div>
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      {hint && <p className="mt-3 border-t border-dashed border-line pt-2.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
