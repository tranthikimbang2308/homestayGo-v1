import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search, MessageCircle } from 'lucide-react';
import client from '../api/client.js';

const buildGroups = (feePercent) => [
  {
    key: 'dat-phong',
    title: 'Đặt phòng',
    items: [
      {
        q: 'Làm sao để đặt phòng trên HomestayGo?',
        a: 'Tìm phòng theo địa điểm, ngày và số khách, mở trang chi tiết để xem ảnh, tiện nghi, bản đồ và đánh giá. Chọn ngày nhận, ngày trả phòng rồi bấm "Đặt phòng", điền thông tin liên hệ và chọn hình thức thanh toán. Bạn cần đăng nhập bằng tài khoản khách hàng để đặt.',
      },
      {
        q: 'Vì sao một số ngày không chọn được trên lịch?',
        a: 'Đó là những ngày đã có khách đặt hoặc chủ phòng tạm khóa (bảo trì, việc riêng). Một số phòng cũng yêu cầu số đêm tối thiểu, hệ thống sẽ báo nếu khoảng ngày bạn chọn chưa đủ.',
      },
      {
        q: 'Giá cuối tuần khác ngày thường không?',
        a: 'Có thể. Chủ phòng được đặt giá riêng cho đêm thứ 6 và thứ 7. Khung đặt phòng hiển thị chi tiết giá từng đêm trước khi bạn xác nhận.',
      },
      {
        q: 'Sau khi đặt, bao lâu thì đơn được xác nhận?',
        a: 'Đơn ở trạng thái "Chờ xác nhận" cho đến khi chủ phòng duyệt, thường trong vài giờ. Bạn sẽ nhận thông báo trên hệ thống khi đơn được xác nhận hoặc bị từ chối.',
      },
      {
        q: 'Tôi có thể nhắn tin cho chủ phòng trước khi đặt không?',
        a: 'Có. Trên trang chi tiết phòng, bấm nút nhắn tin để trao đổi trực tiếp với chủ phòng về giờ nhận phòng, đường đi hay yêu cầu đặc biệt.',
      },
    ],
  },
  {
    key: 'thanh-toan',
    title: 'Thanh toán và chi phí',
    items: [
      {
        q: 'HomestayGo hỗ trợ những hình thức thanh toán nào?',
        a: 'Bạn có thể thanh toán trực tuyến qua VNPay (thẻ ATM nội địa, thẻ quốc tế, QR ngân hàng) hoặc chọn trả tiền mặt trực tiếp tại homestay khi nhận phòng.',
      },
      {
        q: 'Tổng tiền gồm những khoản nào?',
        a: `Tổng tiền = tiền phòng theo số đêm + phí dọn dẹp (nếu có) + phí dịch vụ ${feePercent}% tính trên tiền phòng, trừ đi số tiền giảm từ mã ưu đãi. Mọi khoản đều hiển thị rõ trước khi bạn bấm đặt.`,
      },
      {
        q: 'Dùng mã giảm giá như thế nào?',
        a: 'Xem các mã đang có tại trang Ưu đãi, sao chép mã và nhập ở bước đặt phòng. Mỗi mã có điều kiện riêng về giá trị đơn tối thiểu, thời hạn và phạm vi phòng áp dụng.',
      },
      {
        q: 'Thanh toán VNPay bị trừ tiền nhưng đơn vẫn chưa thanh toán?',
        a: 'Đôi khi ngân hàng phản hồi chậm vài phút. Hãy tải lại trang chi tiết đơn. Nếu sau 30 phút vẫn chưa cập nhật, gửi liên hệ kèm mã đơn và ảnh chụp giao dịch để chúng tôi kiểm tra.',
      },
      {
        q: 'Tôi có xuất được hóa đơn không?',
        a: 'Có. Trong chi tiết đơn đặt phòng, bấm "Xem hóa đơn" để xem và in hóa đơn cho các đơn chưa bị hủy hoặc từ chối.',
      },
    ],
  },
  {
    key: 'huy-phong',
    title: 'Hủy phòng và hoàn tiền',
    items: [
      {
        q: 'Tôi có thể hủy đơn không?',
        a: 'Bạn tự hủy được đơn đang "Chờ xác nhận" hoặc "Đã xác nhận" trước ngày nhận phòng, trong mục Đơn đặt phòng của tôi. Từ ngày nhận phòng trở đi, vui lòng liên hệ chủ phòng hoặc HomestayGo để được hỗ trợ.',
      },
      {
        q: 'Hủy đơn đã thanh toán VNPay thì hoàn tiền thế nào?',
        a: 'Đơn đã thanh toán được hoàn về tài khoản hoặc thẻ đã dùng, thường trong 5 đến 7 ngày làm việc tùy ngân hàng. Phí dịch vụ có thể không được hoàn nếu hủy sát ngày nhận phòng.',
      },
      {
        q: 'Chủ phòng từ chối đơn của tôi thì sao?',
        a: 'Bạn sẽ nhận thông báo kèm lý do. Nếu đã thanh toán, khoản tiền sẽ được hoàn đầy đủ. Bạn có thể tìm phòng khác phù hợp ngay sau đó.',
      },
      {
        q: 'Phòng thực tế không giống mô tả, tôi phải làm gì?',
        a: 'Chụp ảnh làm bằng chứng, trao đổi với chủ phòng và dùng nút "Báo cáo" trên trang phòng. Đội ngũ kiểm duyệt sẽ xem xét, có thể ẩn phòng vi phạm và hỗ trợ bạn quyền lợi phù hợp.',
      },
    ],
  },
  {
    key: 'danh-gia',
    title: 'Tài khoản và đánh giá',
    items: [
      {
        q: 'Khi nào tôi được viết đánh giá?',
        a: 'Chỉ khách đã hoàn thành lưu trú mới được đánh giá, mỗi đơn một lần. Điều này giúp các đánh giá trên HomestayGo đến từ trải nghiệm thật.',
      },
      {
        q: 'Vì sao đánh giá của tôi bị ẩn?',
        a: 'Đánh giá chứa ngôn từ xúc phạm, thông tin cá nhân, quảng cáo hoặc nội dung không liên quan có thể bị ẩn theo tiêu chuẩn cộng đồng. Đánh giá bị ẩn không được tính vào điểm trung bình của phòng.',
      },
      {
        q: 'Tôi quên mật khẩu thì làm sao?',
        a: 'Ở trang đăng nhập, chọn "Quên mật khẩu?" và nhập email đã đăng ký. Hệ thống sẽ gửi liên kết đặt lại mật khẩu có hiệu lực trong 30 phút.',
      },
    ],
  },
  {
    key: 'chu-phong',
    title: 'Dành cho chủ phòng',
    items: [
      {
        q: 'Làm sao để đăng phòng cho thuê?',
        a: 'Đăng ký tài khoản với vai trò Chủ phòng, vào Kênh chủ phòng và thêm phòng mới với đầy đủ ảnh, mô tả, giá, tiện nghi và vị trí trên bản đồ. Phòng sẽ hiển thị sau khi được quản trị viên duyệt.',
      },
      {
        q: 'Vì sao phòng của tôi bị từ chối?',
        a: 'Lý do từ chối được ghi rõ trong danh sách phòng, thường do ảnh mờ, thiếu thông tin hoặc địa chỉ không khớp bản đồ. Bạn chỉnh sửa theo góp ý và phòng sẽ được gửi duyệt lại.',
      },
      {
        q: 'Tôi quản lý lịch trống như thế nào?',
        a: 'Dùng trang Lịch phòng để xem các đơn theo tháng và khóa những ngày không nhận khách. Ngày bị khóa sẽ không thể đặt từ phía khách.',
      },
      {
        q: 'Chủ phòng có tạo được mã giảm giá riêng không?',
        a: 'Có. Trong mục Mã giảm giá của Kênh chủ phòng, bạn tạo mã theo phần trăm hoặc số tiền cố định, giới hạn thời gian, số lượt dùng và chọn các phòng áp dụng.',
      },
    ],
  },
];

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="border-b border-line last:border-b-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-sand/50">
        <span className={`font-medium ${open ? 'text-primary' : 'text-ink'}`}>{item.q}</span>
        <ChevronDown className={`mt-0.5 h-5 w-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180 text-primary' : ''}`} />
      </button>
      {open && <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">{item.a}</p>}
    </div>
  );
}

export default function FaqPage() {
  const [settings, setSettings] = useState(null);
  const [activeGroup, setActiveGroup] = useState('');
  const [keyword, setKeyword] = useState('');
  const [openKey, setOpenKey] = useState('dat-phong-0');

  useEffect(() => {
    client
      .get('/settings')
      .then((res) => setSettings(res.data.data))
      .catch(() => setSettings(null));
  }, []);

  const groups = useMemo(() => buildGroups(settings?.serviceFeePercent ?? 5), [settings?.serviceFeePercent]);

  const visibleGroups = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return groups
      .filter((group) => !activeGroup || group.key === activeGroup)
      .map((group) => ({
        ...group,
        items: group.items
          .map((item, index) => ({ ...item, key: `${group.key}-${index}` }))
          .filter((item) => !text || item.q.toLowerCase().includes(text) || item.a.toLowerCase().includes(text)),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, activeGroup, keyword]);

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Trung tâm trợ giúp</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Câu hỏi thường gặp</h1>
        <p className="mt-3 text-muted">Giải đáp nhanh về đặt phòng, thanh toán, hủy phòng và dành cho chủ phòng.</p>
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Nhập từ khóa, ví dụ: hoàn tiền, VNPay"
            className="input py-3 pl-10"
            aria-label="Tìm câu hỏi"
          />
        </div>
      </header>

      <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:flex-col lg:self-start lg:overflow-visible">
          {[{ key: '', title: 'Tất cả chủ đề' }, ...groups].map((group) => {
            const active = group.key === activeGroup;
            return (
              <button
                key={group.key || 'all'}
                type="button"
                onClick={() => setActiveGroup(group.key)}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-left text-sm font-medium transition-colors ${active ? 'bg-primary-light text-primary' : 'text-ink hover:bg-white'}`}
              >
                {group.title}
              </button>
            );
          })}
        </nav>

        <div className="space-y-8">
          {visibleGroups.length === 0 ? (
            <div className="card px-6 py-10 text-center">
              <p className="font-medium">Không tìm thấy câu hỏi phù hợp</p>
              <p className="mt-1 text-sm text-muted">Thử từ khóa khác hoặc gửi câu hỏi trực tiếp cho chúng tôi.</p>
            </div>
          ) : (
            visibleGroups.map((group) => (
              <section key={group.key}>
                <h2 className="mb-3 text-lg font-semibold">{group.title}</h2>
                <div className="card overflow-hidden">
                  {group.items.map((item) => (
                    <FaqItem
                      key={item.key}
                      item={item}
                      open={openKey === item.key || Boolean(keyword.trim())}
                      onToggle={() => setOpenKey((prev) => (prev === item.key ? '' : item.key))}
                    />
                  ))}
                </div>
              </section>
            ))
          )}

          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-line bg-white p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">Chưa tìm thấy câu trả lời?</p>
                <p className="text-sm text-muted">Gọi hotline {settings?.hotline || '1900 6868'} hoặc gửi liên hệ, chúng tôi phản hồi trong 24 giờ.</p>
              </div>
            </div>
            <Link to="/contact" className="btn btn-primary shrink-0">Gửi câu hỏi</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
