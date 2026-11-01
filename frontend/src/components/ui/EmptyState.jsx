import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Chưa có dữ liệu', description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white/60 px-6 py-12 text-center ${className}`}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="font-serif text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
