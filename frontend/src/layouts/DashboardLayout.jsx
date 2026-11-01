import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../utils/constants.js';
import Avatar from '../components/Avatar.jsx';
import Logo from '../components/Logo.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import NotificationBell from '../components/NotificationBell.jsx';

export default function DashboardLayout({ menu = [], title = 'Bảng điều khiển' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const rootPath = menu[0]?.to;

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentItem =
    [...menu].sort((a, b) => b.to.length - a.to.length).find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)) ||
    menu[0];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-line px-5">
        <Logo />
        <button type="button" className="rounded-lg p-1.5 hover:bg-sand lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="px-5 pb-2 pt-5">
        <p className="eyebrow">{title}</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {menu.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end ?? to === rootPath}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-white' : 'text-ink hover:bg-sand'
              }`
            }
          >
            {Icon && <Icon className="h-[18px] w-[18px]" />}
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-sand hover:text-ink">
          <ExternalLink className="h-[18px] w-[18px]" />
          Về trang khách
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-danger hover:bg-red-50"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sand">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white lg:block">{sidebar}</aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85vw] bg-white">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="rounded-lg p-2 hover:bg-sand lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Mở menu">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate font-serif text-lg font-semibold">{currentItem?.label || title}</h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                <p className="text-xs text-muted">{ROLES[user.role]?.label}</p>
              </div>
              <Avatar src={user.avatar} name={user.name} size="sm" />
            </div>
          )}
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<Spinner fullPage label="Đang tải trang..." />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
