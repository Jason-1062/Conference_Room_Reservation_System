import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import type { Reservation, Room } from '../types';

export default function MyReservations() {
  const [list, setList] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', roomId: 0, startTime: '', endTime: '', attendeesCount: 1 });

  useEffect(() => { load(); loadRooms(); }, []);

  const load = async () => {
    try { setList(await api.getMyReservations()); } catch { } finally { setLoading(false); }
  };

  const loadRooms = async () => {
    try { setRooms(await api.getRooms({ status: 'Available' })); } catch { }
  };

  const openCreate = () => {
    const now = dayjs();
    const start = now.add(1, 'hour').startOf('hour');
    setForm({
      title: '', description: '', roomId: rooms[0]?.id || 0,
      startTime: start.format('YYYY-MM-DDTHH:mm'),
      endTime: start.add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
      attendeesCount: 1
    });
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!form.title) return toast.error('请填写会议名称');
    if (!form.roomId) return toast.error('请选择会议室');
    if (!form.startTime || !form.endTime) return toast.error('请选择时间');
    try {
      await api.createReservation(form);
      toast.success('预约提交成功，等待审批');
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('确定取消此预约？')) return;
    try { await api.cancelReservation(id); toast.success('已取消'); load(); } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="page-loading">加载中...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>我的预约</h1><p className="page-desc">查看您的所有预约记录</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ 新建预约</button>
      </div>
      <div className="reservation-cards">
        {list.map(r => (
          <div key={r.id} className={`reservation-card status-${r.status.toLowerCase()}`}>
            <div className="reservation-card-top">
              <h3>{r.title}</h3>
              <StatusBadge status={r.status} />
            </div>
            <div className="reservation-card-body">
              <div className="reservation-info"><span>🏢</span>{r.roomName}{r.roomLocation && ` · ${r.roomLocation}`}</div>
              <div className="reservation-info"><span>🕐</span>{dayjs(r.startTime).format('YYYY-MM-DD HH:mm')} ~ {dayjs(r.endTime).format('HH:mm')}</div>
              <div className="reservation-info"><span>👥</span>{r.attendeesCount} 人</div>
              {r.description && <div className="reservation-info"><span>📝</span>{r.description}</div>}
            </div>
            {(r.status === 'Pending' || r.status === 'Approved') && (
              <div className="reservation-card-footer">
                <button className="btn btn-sm btn-danger-outline" onClick={() => handleCancel(r.id)}>取消预约</button>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <div className="empty-state full-width">暂无预约记录</div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="新建预约" width="520px">
        <div className="form-stack">
          <div className="form-group"><label>会议名称 *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="请输入会议名称" /></div>
          <div className="form-group"><label>会议室 *</label>
            <select value={form.roomId} onChange={e => setForm({...form, roomId: +e.target.value})}>
              <option value={0}>请选择</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.location}) - {r.capacity}人</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>开始时间 *</label><input type="datetime-local" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} /></div>
            <div className="form-group"><label>结束时间 *</label><input type="datetime-local" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} /></div>
          </div>
          <div className="form-group"><label>参会人数</label><input type="number" value={form.attendeesCount} onChange={e => setForm({...form, attendeesCount: +e.target.value})} min={1} /></div>
          <div className="form-group"><label>描述</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="会议描述(可选)" /></div>
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button><button className="btn btn-primary" onClick={handleCreate}>提交预约</button></div>
      </Modal>
    </div>
  );
}
