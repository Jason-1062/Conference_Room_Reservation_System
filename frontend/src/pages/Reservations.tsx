import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import type { Reservation, Room } from '../types';

export default function Reservations() {
  const [list, setList] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', roomId: '', date: '' });
  const { isAdmin } = useAuth();

  useEffect(() => { load(); loadRooms(); }, []);

  const load = async () => {
    try {
      const params: any = {};
      if (filter.status) params.status = filter.status;
      if (filter.roomId) params.roomId = +filter.roomId;
      if (filter.date) params.date = filter.date;
      setList(await api.getReservations(params));
    } catch { } finally { setLoading(false); }
  };

  const loadRooms = async () => {
    try { setRooms(await api.getRooms()); } catch { }
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id: number) => {
    try { await api.approveReservation(id); toast.success('已通过'); load(); } catch (err: any) { toast.error(err.message); }
  };
  const handleReject = async (id: number) => {
    try { await api.rejectReservation(id); toast.success('已拒绝'); load(); } catch (err: any) { toast.error(err.message); }
  };
  const handleCancel = async (id: number) => {
    if (!confirm('确定取消此预约？')) return;
    try { await api.cancelReservation(id); toast.success('已取消'); load(); } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="page-loading">加载中...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>预约管理</h1><p className="page-desc">审批和管理所有预约</p></div>
      </div>

      <div className="filter-bar">
        <select value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}>
          <option value="">全部状态</option>
          <option value="Pending">待审批</option>
          <option value="Approved">已通过</option>
          <option value="Rejected">已拒绝</option>
          <option value="Cancelled">已取消</option>
        </select>
        <select value={filter.roomId} onChange={e => setFilter({...filter, roomId: e.target.value})}>
          <option value="">全部会议室</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input type="date" value={filter.date} onChange={e => setFilter({...filter, date: e.target.value})} />
      </div>

      <div className="table-wrapper card">
        <table>
          <thead>
            <tr><th>会议名称</th><th>会议室</th><th>时间</th><th>人数</th><th>预约人</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id}>
                <td><strong>{r.title}</strong>{r.description && <div className="text-muted text-sm">{r.description}</div>}</td>
                <td>{r.roomName}</td>
                <td className="text-nowrap">{dayjs(r.startTime).format('MM-DD HH:mm')} ~ {dayjs(r.endTime).format('HH:mm')}</td>
                <td>{r.attendeesCount}</td>
                <td>{r.username}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  <div className="action-btns">
                    {isAdmin && r.status === 'Pending' && (<>
                      <button className="btn btn-xs btn-success" onClick={() => handleApprove(r.id)}>通过</button>
                      <button className="btn btn-xs btn-danger" onClick={() => handleReject(r.id)}>拒绝</button>
                    </>)}
                    {(r.status === 'Pending' || r.status === 'Approved') && (
                      <button className="btn btn-xs btn-danger-outline" onClick={() => handleCancel(r.id)}>取消</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="empty-state">暂无预约记录</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
