const AUTH_IMAGE = 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80';

export default function AuthShell({ title, subtitle, children, quote }) {
  return (
    <div className="container-page py-10 lg:py-14">
      <div className="card mx-auto grid max-w-5xl overflow-hidden lg:grid-cols-2">
        <div className="relative hidden bg-primary-dark lg:block">
          <img src={AUTH_IMAGE} alt="Căn nhà gỗ giữa rừng" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          <div className="absolute inset-x-0 bottom-0 bg-ink/60 p-8 text-white">
            <p className="text-2xl font-semibold leading-snug text-white">
              {quote || '“Nhà là nơi có người đợi mình về, dù chỉ một đêm.”'}
            </p>
            <p className="mt-3 text-sm text-white/75">HomestayGo - homestay khắp Việt Nam</p>
          </div>
        </div>
        <div className="p-6 sm:p-10">
          <h1 className="font-serif text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
