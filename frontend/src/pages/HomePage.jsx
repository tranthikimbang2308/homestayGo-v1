import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, HandHeart, KeyRound, Leaf, MapPin, Wallet } from 'lucide-react';
import client from '../api/client.js';
import SearchBar from '../components/SearchBar.jsx';
import RoomCard, { RoomCardSkeleton } from '../components/RoomCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { FALLBACK_IMAGE } from '../utils/constants.js';
import RecentlyViewed from '../components/home/RecentlyViewed.jsx';
import LatestPosts from '../components/home/LatestPosts.jsx';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1400&q=80';

const REASONS = [
  {
    icon: BadgeCheck,
    title: 'Phòng được duyệt trước khi lên sàn',
    text: 'Mỗi homestay đều qua bước kiểm duyệt của đội ngũ HomestayGo: ảnh thật, địa chỉ thật, giá rõ ràng.',
  },
  {
    icon: Wallet,
    title: 'Giá minh bạch đến từng đồng',
    text: 'Tiền phòng, phí dọn dẹp và phí dịch vụ 5% hiển thị đầy đủ trước khi bạn bấm đặt.',
  },
  {
    icon: KeyRound,
    title: 'Trả trước hoặc trả tại chỗ',
    text: 'Thanh toán qua VNPay ngay khi đặt, hoặc trả tiền mặt khi nhận phòng nếu bạn muốn.',
  },
  {
    icon: HandHeart,
    title: 'Đánh giá từ khách đã ở thật',
    text: 'Chỉ khách đã hoàn thành lưu trú mới được viết đánh giá, chủ nhà phản hồi công khai.',
  },
];

const STEPS = [
  { title: 'Chọn nơi và ngày', text: 'Gõ tên thành phố, chọn ngày nhận và trả phòng.' },
  { title: 'Xem kỹ căn phòng', text: 'Ảnh, tiện nghi, nội quy, vị trí trên bản đồ và đánh giá.' },
  { title: 'Đặt và thanh toán', text: 'Điền thông tin liên hệ, chọn VNPay hoặc trả tại homestay.' },
];

export default function HomePage() {
  const [cities, setCities] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    client
      .get('/rooms/cities')
      .then((res) => setCities(res.data.data || []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
    client
      .get('/rooms/featured')
      .then((res) => setFeatured(res.data.data || []))
      .catch(() => setFeatured([]))
      .finally(() => setLoadingFeatured(false));
  }, []);

  return (
    <>
      <section className="border-b border-line">
        <div className="container-page grid items-center gap-10 py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-16">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Homestay khắp Việt Nam
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-[3.6rem]">
              Ngủ trong nhà người địa phương,
              <span className="block">thức dậy giữa nơi bạn muốn đến.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted">
              Căn gỗ trên đồi thông Đà Lạt, nhà cổ ven sông Hoài, bungalow sát biển Phú Quốc. Tìm, so sánh và đặt phòng trực tiếp với chủ nhà.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted">
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" /> Phòng đã kiểm duyệt
              </span>
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Thanh toán VNPay an toàn
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-sand-dark lg:aspect-[5/6]">
              <img src={HERO_IMAGE} alt="Căn nhà gỗ bên hồ giữa núi" className="h-full w-full object-cover" />
            </div>
            <div className="card absolute -bottom-5 left-4 hidden items-center gap-3 px-4 py-3 sm:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{cities.length || 7} điểm đến</p>
                <p className="text-xs text-muted">từ núi rừng Tây Bắc đến đảo ngọc phương Nam</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container-page relative -mt-2 pb-12 lg:-mt-6">
          <SearchBar />
        </div>
      </section>

      <section className="container-page py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Điểm đến</p>
            <h2 className="section-title mt-2">Thành phố đang được yêu thích</h2>
          </div>
          <Link to="/rooms" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Xem tất cả phòng <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {!loadingCities && cities.length === 0 ? (
          <EmptyState icon={MapPin} title="Chưa có điểm đến" description="Các thành phố có homestay đã được duyệt sẽ xuất hiện tại đây." />
        ) : loadingCities ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-[3/4] animate-pulse rounded-xl bg-line/60" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cities.slice(0, 8).map((item, index) => (
              <Link
                key={item.city}
                to={`/rooms?city=${encodeURIComponent(item.city)}`}
                className={`group relative overflow-hidden rounded-xl bg-sand-dark ${index === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-auto' : 'aspect-[4/5]'}`}
              >
                <img
                  src={item.image || FALLBACK_IMAGE}
                  alt={item.city}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-ink/55 px-4 py-3 text-white">
                  <p className={`font-serif font-semibold ${index === 0 ? 'text-2xl' : 'text-lg'}`}>{item.city}</p>
                  <p className="text-xs text-white/80">{item.count} homestay</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-line bg-white">
        <div className="container-page py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Được đánh giá cao</p>
              <h2 className="section-title mt-2">Những căn phòng khách khen nhiều nhất</h2>
            </div>
            <Link to="/rooms?sort=rating" className="btn btn-outline">
              Xem thêm <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loadingFeatured ? (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <RoomCardSkeleton key={index} />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <EmptyState title="Chưa có phòng nổi bật" description="Các phòng được duyệt và có đánh giá tốt sẽ xuất hiện tại đây." />
          ) : (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((room) => (
                <RoomCard key={room._id} room={room} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Vì sao chọn HomestayGo</p>
            <h2 className="section-title mt-2">Đặt phòng như hỏi thăm một người quen</h2>
            <p className="mt-4 text-muted">
              Chúng tôi giữ mọi thứ đơn giản: căn phòng thật, giá thật, và một chủ nhà sẵn lòng chỉ cho bạn quán cà phê ngon nhất trong hẻm.
            </p>
            <div className="mt-8 border-l-2 border-primary pl-5">
              <p className="text-sm font-semibold text-ink">Đặt phòng trong ba bước</p>
              <ol className="mt-3 space-y-3">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-3 text-sm">
                    <span className="font-serif text-lg font-semibold leading-none text-accent">{index + 1}.</span>
                    <span>
                      <span className="font-medium text-ink">{step.title}</span>
                      <span className="block text-muted">{step.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-white p-6">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-sans text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RecentlyViewed />
      <LatestPosts />

      <section className="container-page">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-primary px-6 py-10 text-white sm:px-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-white sm:text-3xl">Bạn có một căn nhà muốn cho thuê?</h2>
            <p className="mt-2 max-w-xl text-white/80">Đăng phòng miễn phí, tự quản lý lịch đặt, nhận thanh toán qua VNPay và theo dõi doanh thu từng tháng.</p>
          </div>
          <Link to="/register?role=owner" className="btn shrink-0 bg-white text-primary hover:bg-sand">
            Đăng ký làm chủ phòng <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
