import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './ui/Spinner.jsx';
import EmptyState from './ui/EmptyState.jsx';
import Button from './ui/Button.jsx';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner fullPage label="Đang kiểm tra đăng nhập..." />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShieldAlert}
          title="Bạn không có quyền truy cập trang này"
          description="Trang này dành cho vai trò khác. Hãy quay về trang chủ hoặc đăng nhập bằng tài khoản phù hợp."
          action={<Button to="/">Về trang chủ</Button>}
        />
      </div>
    );
  }

  return children;
}
