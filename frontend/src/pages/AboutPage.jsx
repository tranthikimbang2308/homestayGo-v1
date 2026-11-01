import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, HeartHandshake, ShieldCheck, Sprout } from 'lucide-react';
import client from '../api/client.js';
import { formatNumber } from '../utils/format.js';

const ABOUT_IMAGE = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1400&q=80';

const VALUES = [
  { icon: BadgeCheck, title: 'Thật', text: 'Mỗi phòng đều được kiểm duyệt trước khi lên sàn. Ảnh, giá và địa chỉ phải khớp với thực tế.' },
  { icon: HeartHandshake, title: 'Gần gũi', text: 'Khách và chủ nhà trò chuyện trực tiếp, như hỏi thăm một người quen ở nơi mình sắp đến.' },
  { icon: ShieldCheck, title: 'An tâm', text: 'Thanh toán qua VNPay, đánh giá chỉ từ khách đã ở thật và kênh khiếu nại được xử lý nhanh.' },
  { icon: Sprout, title: 'Bền vững', text: 'Ưu tiên những homestay gắn với cộng đồng địa phương và cách vận hành thân thiện môi trường.' },
];

const MILESTONES = [
  { year: '2024', text: 'Ý tưởng HomestayGo ra đời từ những chuyến đi bụi và các chủ nhà dễ mến ở Đà Lạt.' },
  { year: '2025', text: 'Ra mắt nền tảng đặt phòng với các homestay đầu tiên ở Đà Lạt, Hội An và Phú Quốc.' },
  { year: '2026', text: 'Mở rộng ra nhiều tỉnh thành, bổ sung thanh toán trực tuyến, mã ưu đãi và cẩm nang du lịch.' },
];

export default function AboutPage() {
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    client.get('/settings/stats').then((res) => setStats(res.data.data)).catch(() => setStats(null));
    client.get('/settings').then((res) => setSettings(res.data.data)).catch(() => setSettings(null));
  }, []);

  const numbers = [
    { label: 'Homestay đang hoạt động', value: stats ? formatNumber(stats.rooms) : '...' },
    { label: 'Tỉnh thành có phòng', value: stats ? formatNumber(stats.cities) : '...' },
    { label: 'Lượt lưu trú hoàn thành', value: stats ? formatNumber(stats.completedBookings) : '...' },
    { label: 'Điểm đánh giá trung bình', value: stats ? `${Number(stats.ratingAvg || 0).toFixed(1)}/5` : '...' },
  ];

  return (
    <div>
      <section className="container-page grid items-center gap-10 py-10 lg:grid-cols-2 lg:gap-14 lg:py-16">
        <div>
          <p className="eyebrow">Về chúng tôi</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-[2.6rem]">Kết nối du khách với những ngôi nhà có người chờ đón</h1>
          <p className="mt-5 text-muted">
            {settings?.about || 'HomestayGo kết nối du khách với những homestay được chọn lọc trên khắp Việt Nam, giúp việc tìm chỗ ở gần gũi, minh bạch và an tâm hơn.'}
          </p>
          <p className="mt-4 text-muted">
            Chúng tôi tin rằng một chuyến đi đáng nhớ không chỉ nằm ở cảnh đẹp, mà còn ở bữa sáng chủ nhà tự tay nấu, ở lời chỉ đường tới quán cà phê nhỏ cuối hẻm.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/rooms" className="btn btn-primary">Khám phá homestay <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/register?role=owner" className="btn btn-outline">Trở thành chủ phòng</Link>
          </div>
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-xl bg-sand-dark">
          <img src={ABOUT_IMAGE} alt="Vịnh Hạ Long nhìn từ trên cao" className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="container-page grid grid-cols-2 divide-line py-10 lg:grid-cols-4 lg:divide-x">
          {numbers.map((item) => (
            <div key={item.label} className="px-4 py-4 text-center lg:py-2">
              <p className="text-3xl font-semibold text-primary sm:text-4xl">{item.value}</p>
              <p className="mt-1 text-sm text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="max-w-2xl">
          <p className="eyebrow">Giá trị cốt lõi</p>
          <h2 className="section-title mt-2">Điều chúng tôi theo đuổi</h2>
        </div>
        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Hành trình</p>
            <h2 className="section-title mt-2">Từ một chuyến đi đến một cộng đồng</h2>
            {stats && (
              <p className="mt-4 text-muted">
                Hôm nay, {formatNumber(stats.hosts)} chủ nhà và {formatNumber(stats.customers)} khách hàng đang cùng nhau xây dựng HomestayGo, với {formatNumber(stats.reviews)} đánh giá thật và {formatNumber(stats.posts)} bài viết cẩm nang.
              </p>
            )}
          </div>
          <ol className="relative space-y-6 border-l border-line pl-6">
            {MILESTONES.map((item) => (
              <li key={item.year} className="relative">
                <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-sm font-semibold text-primary">{item.year}</p>
                <p className="mt-1 text-ink">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {settings?.policies && (
        <section className="container-page pb-4">
          <div className="rounded-xl border border-line bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Chính sách chung</h2>
            <p className="mt-3 whitespace-pre-line text-muted">{settings.policies}</p>
            <p className="mt-4 text-sm text-muted">
              Có thắc mắc? Xem <Link to="/faq" className="font-medium text-primary hover:underline">câu hỏi thường gặp</Link> hoặc{' '}
              <Link to="/contact" className="font-medium text-primary hover:underline">liên hệ với chúng tôi</Link>.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
