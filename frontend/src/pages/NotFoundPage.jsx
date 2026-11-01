import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage({ embedded = false }) {
  return (
    <div className={embedded ? 'py-16' : 'container-page py-20'}>
      <div className="mx-auto max-w-lg text-center">
        <p className="font-serif text-7xl font-semibold text-primary">404</p>
        <h1 className="mt-4 font-serif text-2xl font-semibold">Lạc đường rồi</h1>
        <p className="mt-2 text-muted">Trang bạn tìm không tồn tại hoặc đã được chuyển đi nơi khác.</p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to={embedded ? '..' : '/'} relative="path" className="btn btn-primary">
            Về trang chính
          </Link>
          {!embedded && (
            <Link to="/rooms" className="btn btn-outline">
              <Compass className="h-4 w-4" /> Khám phá homestay
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
