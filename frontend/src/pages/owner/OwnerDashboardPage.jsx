import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BedDouble, CalendarCheck, Wallet, Star, Plus } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
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
import { formatPrice } from '../../utils/format';
import {
  PageHeader,
  Panel,
  ChartTooltip,
  CHART_COLORS,
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_KEYS,
  bookingStatusLabel,
  compactPrice,
  shortMonth,
  errorMessage,
} from './dashboardShared';

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    api
      .get('/owner/stats')
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

  const statusData = useMemo(() => {
    const byStatus = stats?.bookingsByStatus || {};
    return BOOKING_STATUS_KEYS.map((key) => ({
      key,
      name: bookingStatusLabel(key),
      value: byStatus[key] || 0,
      fill: BOOKING_STATUS_COLORS[key],
    })).filter((item) => item.value > 0);
  }, [stats]);

  const monthly = stats?.monthlyRevenue || [];
  const topRooms = stats?.topRooms || [];
  const maxTopRevenue = Math.max(1, ...topRooms.map((room) => room.revenue || 0));

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return <EmptyState title="Chưa có dữ liệu thống kê" description="Tải lại trang để thử lại." />;
  }

  return (
    <div>
      <PageHeader
        title="Tổng quan"
        description="Doanh thu, đơn đặt phòng và hiệu quả từng phòng trong 12 tháng gần nhất."
        actions={
          <Link
            to="/owner/rooms/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Đăng phòng mới
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng số phòng"
          value={stats.totalRooms || 0}
          icon={BedDouble}
          hint={`${stats.approvedRooms || 0} đang hiển thị · ${stats.pendingRooms || 0} chờ duyệt`}
        />
        <StatCard
          label="Đơn đặt phòng"
          value={stats.totalBookings || 0}
          icon={CalendarCheck}
          hint={`${stats.bookingsByStatus?.pending || 0} đơn chờ xác nhận`}
        />
        <StatCard label="Doanh thu" value={formatPrice(stats.totalRevenue || 0)} icon={Wallet} hint="Tính trên đơn đã thanh toán" />
        <StatCard
          label="Điểm đánh giá"
          value={stats.ratingAvg ? Number(stats.ratingAvg).toFixed(1) : '0.0'}
          icon={Star}
          hint="Trung bình trên 5 sao"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Doanh thu theo tháng" description="Cột: doanh thu · Đường: số đơn" className="xl:col-span-2">
          {monthly.length === 0 ? (
            <EmptyState title="Chưa có doanh thu" description="Doanh thu xuất hiện khi đơn được thanh toán." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={CHART_COLORS.line} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={shortMonth} tick={{ fontSize: 11, fill: CHART_COLORS.muted }} tickLine={false} axisLine={{ stroke: CHART_COLORS.line }} />
                  <YAxis
                    yAxisId="revenue"
                    tickFormatter={compactPrice}
                    tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
                  <YAxis yAxisId="bookings" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: CHART_COLORS.muted }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip
                    cursor={{ fill: CHART_COLORS.primaryLight }}
                    content={<ChartTooltip valueFormatter={(value, key) => (key === 'revenue' ? formatPrice(value) : `${value} đơn`)} />}
                  />
                  <Bar yAxisId="revenue" dataKey="revenue" name="Doanh thu" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Line yAxisId="bookings" type="monotone" dataKey="bookings" name="Số đơn" stroke={CHART_COLORS.accent} strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Đơn theo trạng thái">
          {statusData.length === 0 ? (
            <EmptyState title="Chưa có đơn nào" />
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="#fff">
                      {statusData.map((item) => (
                        <Cell key={item.key} fill={item.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip valueFormatter={(value) => `${value} đơn`} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5">
                {statusData.map((item) => (
                  <li key={item.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.fill }} />
                      {item.name}
                    </span>
                    <span className="font-medium tabular-nums text-ink">{item.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <Panel title="Phòng hiệu quả nhất" description="Xếp theo doanh thu đã thanh toán" className="mt-6">
        {topRooms.length === 0 ? (
          <EmptyState title="Chưa có phòng nào phát sinh đơn" />
        ) : (
          <ol className="space-y-4">
            {topRooms.map((room, index) => (
              <li key={room._id || index} className="grid grid-cols-[2rem_1fr] items-center gap-3 sm:grid-cols-[2rem_1fr_9rem_5rem]">
                <span className="font-serif text-lg font-semibold text-muted">{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{room.title}</p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-sand">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(4, ((room.revenue || 0) / maxTopRevenue) * 100)}%` }} />
                  </div>
                </div>
                <span className="col-start-2 text-sm font-semibold text-accent sm:col-start-auto sm:text-right">{formatPrice(room.revenue || 0)}</span>
                <span className="col-start-2 text-xs text-muted sm:col-start-auto sm:text-right">{room.bookings || 0} đơn</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
