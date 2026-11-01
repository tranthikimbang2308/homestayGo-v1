import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, BedDouble, CalendarCheck, Wallet, ArrowRight } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatPrice, formatDate } from '../../utils/format';
import {
  PageHeader,
  Panel,
  ChartTooltip,
  StatusPill,
  CHART_COLORS,
  ROOM_STATUS_COLORS,
  ROOM_STATUS_KEYS,
  roomStatusLabel,
  bookingStatusLabel,
  compactPrice,
  shortMonth,
  errorMessage,
  TABLE_CLASS,
  TH_CLASS,
  TD_CLASS,
} from '../owner/dashboardShared';

const AXIS_TICK = { fontSize: 11, fill: CHART_COLORS.muted };

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    api
      .get('/admin/stats')
      .then((res) => {
        if (!ignore) setStats(res.data.data);
      })
      .catch((error) => toast.error(errorMessage(error, 'Không tải được thống kê')))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const roomStatusData = useMemo(() => {
    const byStatus = stats?.roomsByStatus || {};
    return ROOM_STATUS_KEYS.map((key) => ({ key, name: roomStatusLabel(key), value: byStatus[key] || 0, fill: ROOM_STATUS_COLORS[key] })).filter(
      (item) => item.value > 0
    );
  }, [stats]);

  if (loading) return <Spinner fullPage />;
  if (!stats) return <EmptyState title="Chưa có dữ liệu thống kê" description="Tải lại trang để thử lại." />;

  const usersByRole = stats.usersByRole || {};
  const monthly = stats.monthlyRevenue || [];
  const newUsers = stats.newUsersByMonth || [];
  const topCities = stats.topCities || [];
  const recent = stats.recentBookings || [];
  const maxCity = Math.max(1, ...topCities.map((item) => item.bookings || 0));
  const pendingRooms = stats.roomsByStatus?.pending || 0;

  return (
    <div>
      <PageHeader title="Tổng quan hệ thống" description="Người dùng, phòng, đơn đặt và doanh thu toàn HomestayGo." />

      {pendingRooms > 0 && (
        <Link
          to="/admin/rooms"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900 hover:border-warning"
        >
          <span>
            <span className="font-semibold">{pendingRooms} phòng</span> đang chờ duyệt
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            Duyệt ngay
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Người dùng"
          value={stats.totalUsers || 0}
          icon={Users}
          hint={`${usersByRole.customer || 0} khách · ${usersByRole.owner || 0} chủ phòng · ${usersByRole.admin || 0} quản trị`}
        />
        <StatCard label="Phòng" value={stats.totalRooms || 0} icon={BedDouble} hint={`${stats.roomsByStatus?.approved || 0} đang hiển thị`} />
        <StatCard
          label="Đơn đặt phòng"
          value={stats.totalBookings || 0}
          icon={CalendarCheck}
          hint={`${stats.bookingsByStatus?.completed || 0} hoàn thành · ${stats.bookingsByStatus?.pending || 0} chờ xác nhận`}
        />
        <StatCard label="Doanh thu" value={formatPrice(stats.totalRevenue || 0)} icon={Wallet} hint="Tổng các đơn đã thanh toán" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Doanh thu theo tháng" description="12 tháng gần nhất" className="xl:col-span-2">
          {monthly.length === 0 ? (
            <EmptyState title="Chưa có doanh thu" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={CHART_COLORS.line} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={shortMonth} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART_COLORS.line }} />
                  <YAxis tickFormatter={compactPrice} tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} />
                  <Tooltip
                    cursor={{ fill: CHART_COLORS.primaryLight }}
                    content={<ChartTooltip valueFormatter={(value, key) => (key === 'revenue' ? formatPrice(value) : `${value} đơn`)} />}
                  />
                  <Bar dataKey="revenue" name="Doanh thu" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Phòng theo trạng thái">
          {roomStatusData.length === 0 ? (
            <EmptyState title="Chưa có phòng" />
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roomStatusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={2} stroke="#fff">
                      {roomStatusData.map((item) => (
                        <Cell key={item.key} fill={item.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip valueFormatter={(value) => `${value} phòng`} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5">
                {roomStatusData.map((item) => (
                  <li key={item.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.fill }} />
                      {item.name}
                    </span>
                    <span className="font-medium tabular-nums">{item.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Người dùng mới" description="Số tài khoản đăng ký mỗi tháng" className="xl:col-span-2">
          {newUsers.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu" />
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={newUsers} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={CHART_COLORS.line} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={shortMonth} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART_COLORS.line }} />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} />
                  <Tooltip content={<ChartTooltip valueFormatter={(value) => `${value} người`} />} />
                  <Area type="monotone" dataKey="count" name="Người dùng mới" stroke={CHART_COLORS.accent} strokeWidth={2} fill="#EAF1EE" fillOpacity={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Thành phố nhiều đơn nhất">
          {topCities.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu" />
          ) : (
            <ul className="space-y-3.5">
              {topCities.map((item) => (
                <li key={item.city}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{item.city}</span>
                    <span className="tabular-nums text-muted">{item.bookings} đơn</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-sand">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(4, ((item.bookings || 0) / maxCity) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Đơn gần đây"
        className="mt-6"
        bodyClassName=""
        actions={
          <Link to="/admin/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        {recent.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Chưa có đơn nào" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={TABLE_CLASS}>
              <thead className="bg-sand/60">
                <tr>
                  <th className={TH_CLASS}>Mã đơn</th>
                  <th className={TH_CLASS}>Phòng</th>
                  <th className={TH_CLASS}>Khách</th>
                  <th className={TH_CLASS}>Nhận phòng</th>
                  <th className={`${TH_CLASS} text-right`}>Tổng tiền</th>
                  <th className={TH_CLASS}>Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((booking) => (
                  <tr key={booking._id}>
                    <td className={`${TD_CLASS} font-mono font-semibold text-primary`}>{booking.code}</td>
                    <td className={TD_CLASS}>
                      <span className="line-clamp-1 min-w-[12rem]">{booking.room?.title || '—'}</span>
                    </td>
                    <td className={`${TD_CLASS} whitespace-nowrap`}>{booking.customer?.name || booking.contactName}</td>
                    <td className={`${TD_CLASS} whitespace-nowrap`}>{formatDate(booking.checkIn)}</td>
                    <td className={`${TD_CLASS} whitespace-nowrap text-right font-semibold text-accent`}>{formatPrice(booking.totalPrice)}</td>
                    <td className={TD_CLASS}>
                      <StatusPill status={booking.status}>{bookingStatusLabel(booking.status)}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
