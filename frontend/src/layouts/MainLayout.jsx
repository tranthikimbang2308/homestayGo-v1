import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  ChevronDown,
  Heart,
  Bell,
  MessageCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES, CITIES } from '../utils/constants.js';
import Avatar from '../components/Avatar.jsx';
import Logo from '../components/Logo.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import CompareBar from '../components/CompareBar.jsx';

const NAV_LINKS = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/rooms', label: 'Tìm phòng' },
  { to: '/promotions', label: 'Ưu đãi' },
  { to: '/blog', label: 'Cẩm nang' },
  { to: '/contact', label: 'Liên hệ' },
];

const accountLinksFor = (role) => {
  const links = [];
  if (role === 'admin') links.push({ to: '/admin', label: 'Trang quản trị', icon: ShieldCheck });
  if (role === 'owner') links.push({ to: '/owner', label: 'Kênh chủ phòng', icon: LayoutDashboard });
  if (role === 'customer') {
    links.push({ to: '/account/bookings', label: 'Đơn đặt phòng', icon: CalendarCheck });
  }
  links.push({ to: '/account/favorites', label: 'Danh sách yêu thích', icon: Heart });
  links.push({ to: '/account/messages', label: 'Tin nhắn', icon: MessageCircle });
  links.push({ to: '/account/notifications', label: 'Thông báo', icon: Bell });
  links.push({ to: '/account/profile', label: 'Tài khoản của tôi', icon: UserRound });
  return links;
};

function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 hover:border-primary"
        aria-expanded={open}
      >
        <Avatar src={user.avatar} name={user.name} size="xs" />
        <span className="hidden max-w-[140px] truncate text-sm font-medium sm:inline">{user.name}</span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <div className="card card-shadow absolute right-0 z-50 mt-2 w-64 overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <span className={`badge mt-2 ${ROLES[user.role]?.className || ''}`}>{ROLES[user.role]?.label}</span>
          </div>
          <nav className="py-1.5">
            {accountLinksFor(user.role).map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-sand">
                <Icon className="h-4 w-4 text-muted" />
                {label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-sm text-danger hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { isAuthenticated, user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navClass = ({ isActive }) =>
    `relative py-1 text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-ink hover:text-primary'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-sand/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
                {link.label}
              </NavLink>
            ))}
            {(!isAuthenticated || user?.role === 'customer') && (
              <NavLink to="/register?role=owner" className={navClass}>
                Cho thuê homestay
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-line/60" />
          ) : isAuthenticated ? (
            <>
              {user.role === 'customer' && (
                <Link to="/account/favorites" className="hidden rounded-full p-2 text-ink hover:bg-white hover:text-accent sm:inline-flex" aria-label="Yêu thích">
                  <Heart className="h-5 w-5" />
                </Link>
              )}
              <NotificationBell />
              <AccountMenu />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn btn-ghost">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary">
                Đăng ký
              </Link>
            </div>
          )}
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-white md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Mở menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-line bg-sand md:hidden">
          <nav className="container-page flex flex-col py-3">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className="py-2 text-sm font-medium">
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/register?role=owner" className="py-2 text-sm font-medium">
              Cho thuê homestay
            </NavLink>
            {!isAuthenticated && (
              <div className="mt-2 flex gap-2">
                <Link to="/login" className="btn btn-outline flex-1">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary flex-1">
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

const FOOTER_DEFAULT_SETTINGS = {
  siteName: 'HomestayGo',
  hotline: '1900 6868',
  email: 'hotro@homestaygo.vn',
  address: '12 Nguyễn Văn Bảo, Gò Vấp, TP. Hồ Chí Minh',
};

const FOOTER_EXPLORE_LINKS = [
  { to: '/blog', label: 'Cẩm nang du lịch' },
  { to: '/promotions', label: 'Ưu đãi' },
  { to: '/faq', label: 'Câu hỏi thường gặp' },
  { to: '/about', label: 'Về chúng tôi' },
  { to: '/contact', label: 'Liên hệ' },
];

const FOOTER_SERVICE_LINKS = [
  { to: '/rooms', label: 'Tìm phòng' },
  { to: '/register?role=owner', label: 'Trở thành chủ phòng' },
  { to: '/account/bookings', label: 'Đơn đặt phòng của tôi' },
  { to: '/account/favorites', label: 'Danh sách yêu thích' },
];

function Footer() {
  const [settings, setSettings] = useState(FOOTER_DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && json.data) setSettings({ ...FOOTER_DEFAULT_SETTINGS, ...json.data });
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  const headingClass = 'mb-4 font-sans text-sm font-semibold text-ink';
  const linkClass = 'text-muted hover:text-primary';

  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Những căn nhà nhỏ có chủ nhà thật, bữa sáng thật và con dốc thật. Đặt phòng homestay khắp Việt Nam trong vài phút.
          </p>
          {(settings.facebook || settings.zalo) && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" className={linkClass}>
                  Facebook
                </a>
              )}
              {settings.zalo && <span className="text-muted">Zalo: {settings.zalo}</span>}
            </div>
          )}
        </div>
        <div>
          <h4 className={headingClass}>Điểm đến</h4>
          <ul className="space-y-2 text-sm">
            {CITIES.slice(0, 5).map((city) => (
              <li key={city}>
                <Link to={`/rooms?city=${encodeURIComponent(city)}`} className={linkClass}>
                  Homestay {city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className={headingClass}>Khám phá</h4>
          <ul className="space-y-2 text-sm">
            {FOOTER_EXPLORE_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className={headingClass}>Dịch vụ</h4>
          <ul className="space-y-2 text-sm">
            {FOOTER_SERVICE_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className={headingClass}>Liên hệ</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{settings.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <a href={`tel:${String(settings.hotline || '').replace(/\s/g, '')}`} className="hover:text-primary">
                {settings.hotline}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <a href={`mailto:${settings.email}`} className="break-all hover:text-primary">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {settings.siteName}. Đã đăng ký bản quyền.
          </span>
          <span>Thanh toán an toàn qua VNPay hoặc trả tại homestay.</span>
        </div>
      </div>
    </footer>
  );
}

export default function MainLayout() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
    </div>
  );
}
