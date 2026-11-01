import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Lock, LockOpen, Users } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { formatDate, initials } from '../../utils/format';
import { USER_CSV_COLUMNS, csvFilename, downloadCsv, fetchAllRows } from '../../utils/exportCsv';
import { PageHeader, SearchBox, StatusPill, roleLabel, ROLE_KEYS, errorMessage, TABLE_CLASS, TH_CLASS, TD_CLASS } from '../owner/dashboardShared';

const FILTER_SELECT_CLASS = 'input py-2 sm:w-44';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [roleChange, setRoleChange] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllRows('/admin/users', { role, isActive, keyword: appliedKeyword });
      if (!rows.length) {
        toast.error('Không có tài khoản nào để xuất');
        return;
      }
      downloadCsv(csvFilename('nguoi-dung'), rows, USER_CSV_COLUMNS);
      toast.success(`Đã xuất ${rows.length} tài khoản ra file CSV`);
    } catch {
      toast.error('Không xuất được file CSV');
    } finally {
      setExporting(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { role: role || undefined, isActive: isActive || undefined, keyword: appliedKeyword || undefined, page, limit: 10 },
      });
      setUsers(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được danh sách người dùng'));
    } finally {
      setLoading(false);
    }
  }, [role, isActive, appliedKeyword, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedKeyword(keyword.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const replaceUser = (updated) => setUsers((prev) => prev.map((item) => (item._id === updated._id ? { ...item, ...updated } : item)));

  const toggleStatus = async () => {
    const target = confirming;
    setBusyId(target._id);
    try {
      const res = await api.patch(`/admin/users/${target._id}/status`);
      const updated = res.data.data || { ...target, isActive: !target.isActive };
      replaceUser({ _id: target._id, isActive: updated.isActive });
      toast.success(updated.isActive ? `Đã mở khóa tài khoản ${target.name}` : `Đã khóa tài khoản ${target.name}`);
      setConfirming(null);
    } catch (error) {
      toast.error(errorMessage(error, 'Không đổi được trạng thái tài khoản'));
    } finally {
      setBusyId('');
    }
  };

  const changeRole = async () => {
    const { user, role: nextRole } = roleChange;
    setBusyId(user._id);
    try {
      await api.patch(`/admin/users/${user._id}/role`, { role: nextRole });
      replaceUser({ _id: user._id, role: nextRole });
      toast.success(`${user.name} giờ là ${roleLabel(nextRole).toLowerCase()}`);
      setRoleChange(null);
    } catch (error) {
      toast.error(errorMessage(error, 'Không đổi được vai trò'));
    } finally {
      setBusyId('');
    }
  };

  const isSelf = (user) => currentUser && (currentUser._id === user._id || currentUser.id === user._id);

  return (
    <div>
      <PageHeader
        title="Người dùng"
        description={`${pagination.total ?? users.length} tài khoản phù hợp bộ lọc.`}
        actions={
          <Button variant="outline" size="sm" icon={Download} loading={exporting} onClick={handleExportCsv}>
            Xuất CSV
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBox value={keyword} onChange={setKeyword} placeholder="Tên hoặc email" />
        <select
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(1);
          }}
          className={FILTER_SELECT_CLASS}
          aria-label="Lọc theo vai trò"
        >
          <option value="">Mọi vai trò</option>
          {ROLE_KEYS.map((key) => (
            <option key={key} value={key}>
              {roleLabel(key)}
            </option>
          ))}
        </select>
        <select
          value={isActive}
          onChange={(event) => {
            setIsActive(event.target.value);
            setPage(1);
          }}
          className={FILTER_SELECT_CLASS}
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Mọi trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
      </div>

      {loading ? (
        <Spinner fullPage />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="Không tìm thấy người dùng" description="Thử đổi từ khóa hoặc bỏ bộ lọc." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="overflow-x-auto">
              <table className={TABLE_CLASS}>
                <thead className="bg-sand/60">
                  <tr>
                    <th className={TH_CLASS}>Người dùng</th>
                    <th className={TH_CLASS}>Số điện thoại</th>
                    <th className={TH_CLASS}>Vai trò</th>
                    <th className={TH_CLASS}>Ngày tham gia</th>
                    <th className={TH_CLASS}>Trạng thái</th>
                    <th className={`${TH_CLASS} text-right`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.map((user) => {
                    const self = isSelf(user);
                    return (
                      <tr key={user._id} className={user.isActive === false ? 'bg-stone-50' : 'hover:bg-sand/40'}>
                        <td className={TD_CLASS}>
                          <div className="flex min-w-[14rem] items-center gap-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                                {initials(user.name || '?')}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium">
                                {user.name}
                                {self && <span className="ml-1.5 text-xs font-normal text-muted">(bạn)</span>}
                              </p>
                              <p className="truncate text-xs text-muted">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`${TD_CLASS} whitespace-nowrap`}>{user.phone || <span className="text-muted">—</span>}</td>
                        <td className={TD_CLASS}>
                          <select
                            value={user.role}
                            disabled={self || busyId === user._id}
                            onChange={(event) => setRoleChange({ user, role: event.target.value })}
                            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-sand"
                            aria-label={`Vai trò của ${user.name}`}
                          >
                            {ROLE_KEYS.map((key) => (
                              <option key={key} value={key}>
                                {roleLabel(key)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className={`${TD_CLASS} whitespace-nowrap`}>{formatDate(user.createdAt)}</td>
                        <td className={TD_CLASS}>
                          {user.isActive === false ? <StatusPill status="rejected">Đã khóa</StatusPill> : <StatusPill status="approved">Hoạt động</StatusPill>}
                        </td>
                        <td className={`${TD_CLASS} text-right`}>
                          {self ? (
                            <span className="text-xs text-muted">Tài khoản của bạn</span>
                          ) : (
                            <Button
                              size="sm"
                              variant={user.isActive === false ? 'primary' : 'outline'}
                              icon={user.isActive === false ? LockOpen : Lock}
                              disabled={busyId === user._id}
                              onClick={() => setConfirming(user)}
                            >
                              {user.isActive === false ? 'Mở khóa' : 'Khóa'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page || page} totalPages={pagination.totalPages} onChange={setPage} />
        </>
      )}

      <Modal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title={confirming?.isActive === false ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Quay lại
            </Button>
            <Button variant={confirming?.isActive === false ? 'primary' : 'danger'} loading={busyId === confirming?._id} onClick={toggleStatus}>
              {confirming?.isActive === false ? 'Mở khóa' : 'Khóa tài khoản'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink">
          {confirming?.isActive === false ? (
            <>
              <span className="font-semibold">{confirming?.name}</span> sẽ đăng nhập và sử dụng HomestayGo bình thường trở lại.
            </>
          ) : (
            <>
              <span className="font-semibold">{confirming?.name}</span> ({confirming?.email}) sẽ không đăng nhập được cho tới khi được mở khóa.
            </>
          )}
        </p>
      </Modal>

      <Modal
        open={Boolean(roleChange)}
        onClose={() => setRoleChange(null)}
        title="Đổi vai trò"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRoleChange(null)}>
              Quay lại
            </Button>
            <Button loading={busyId === roleChange?.user._id} onClick={changeRole}>
              Đổi vai trò
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink">
          Đổi <span className="font-semibold">{roleChange?.user.name}</span> từ {roleLabel(roleChange?.user.role).toLowerCase()} thành{' '}
          <span className="font-semibold">{roleLabel(roleChange?.role).toLowerCase()}</span>? Quyền truy cập thay đổi ở lần đăng nhập tiếp theo.
        </p>
      </Modal>
    </div>
  );
}
