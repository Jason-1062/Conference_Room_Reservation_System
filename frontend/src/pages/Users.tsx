import { useState, useEffect } from 'react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function Users() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { load(); }, [filter]);
  const load = async () => { try { setList(await api.getUsers(filter || undefined)); } catch { } finally { setLoading(false); } };

  const handleApprove = async (id: number) => {
    try { await api.approveUser(id); toast.success('已通过'); load(); } catch (err: any) { toast.error(err.message); }
  };
  const handleReject = async (id: number) => {
    try { await api.rejectUser(id); toast.success('已拒绝'); load(); } catch (err: any) { toast.error(err.message); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此用户？')) return;
    try { await api.deleteUser(id); toast.success('已删除'); load(); } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="page-loading">加载中...</div>;

  return (
    <div className="page">
      <div className="page-header"><div><h1>用户审核</h1><p className="page-desc">管理用户注册审核</p></div></div>
      <div className="filter-bar">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="Pending">待审核</option>
          <option value="Approved">已通过</option>
          <option value="Rejected">已拒绝</option>
        </select>
      </div>
      <div className="table-wrapper card">
        <table>
          <thead><tr><th>用户名</th><th>角色</th><th>关联职工</th><th>部门</th><th>状态</th><th>注册时间</th><th>操作</th></tr></thead>
          <tbody>
            {list.map(u => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td><StatusBadge status={u.role} /></td>
                <td>{u.employeeName || '-'}</td>
                <td>{u.departmentName || '-'}</td>
                <td><StatusBadge status={u.status} /></td>
                <td className="text-nowrap">{dayjs(u.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                <td>
                  <div className="action-btns">
                    {u.status === 'Pending' && (<>
                      <button className="btn btn-xs btn-success" onClick={() => handleApprove(u.id)}>通过</button>
                      <button className="btn btn-xs btn-danger" onClick={() => handleReject(u.id)}>拒绝</button>
                    </>)}
                    {u.role !== 'Admin' && <button className="btn btn-xs btn-danger-outline" onClick={() => handleDelete(u.id)}>删除</button>}
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="empty-state">暂无用户</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
