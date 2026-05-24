import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import type { Room } from '../types';

const EQUIPMENT_OPTIONS = ['投影仪', '白板', '视频会议系统', '音响系统', '无线麦克风', '电视屏幕', '电话会议'];

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', location: '', capacity: 10, description: '', status: 0, equipment: [] as string[] });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setRooms(await api.getRooms()); } catch { } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', location: '', capacity: 10, description: '', status: 0, equipment: [] });
    setShowModal(true);
  };

  const openEdit = (room: Room) => {
    setEditing(room);
    setForm({ name: room.name, location: room.location || '', capacity: room.capacity, description: room.description || '', status: room.status === 'Available' ? 0 : 1, equipment: [...room.equipment] });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('请填写会议室名称');
    try {
      if (editing) {
        await api.updateRoom(editing.id, form);
        toast.success('更新成功');
      } else {
        await api.createRoom(form);
        toast.success('创建成功');
      }
      setShowModal(false);
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此会议室？')) return;
    try { await api.deleteRoom(id); toast.success('已删除'); load(); } catch (err: any) { toast.error(err.message); }
  };

  const toggleEquipment = (eq: string) => {
    setForm(prev => ({ ...prev, equipment: prev.equipment.includes(eq) ? prev.equipment.filter(e => e !== eq) : [...prev.equipment, eq] }));
  };

  if (loading) return <div className="page-loading">加载中...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{isAdmin ? '会议室管理' : '会议室介绍'}</h1>
          <p className="page-desc">{isAdmin ? '管理所有会议室信息' : '查看可用会议室并预约'}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/rooms/schedule')}>时段总览</button>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ 新增会议室</button>}
        </div>
      </div>

      <div className="room-grid">
        {rooms.map(room => (
          <div key={room.id} className="room-card" onClick={() => navigate(`/rooms/${room.id}/schedule`)} style={{ cursor: 'pointer' }}>
            <div className="room-card-header">
              <h3>{room.name}</h3>
              <StatusBadge status={room.status} />
            </div>
            <div className="room-card-body">
              <div className="room-info-row"><span className="info-icon">📍</span>{room.location || '未设置位置'}</div>
              <div className="room-info-row"><span className="info-icon">👥</span>容纳 {room.capacity} 人</div>
              {room.description && <p className="room-desc">{room.description}</p>}
              {room.equipment.length > 0 && (
                <div className="room-equipment">
                  {room.equipment.map((eq, i) => <span key={i} className="equipment-tag">{eq}</span>)}
                </div>
              )}
            </div>
            <div className="room-card-footer">
              {isAdmin && (
                <>
                  <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openEdit(room); }}>编辑</button>
                  <button className="btn btn-sm btn-danger-outline" onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }}>删除</button>
                </>
              )}
            </div>
          </div>
        ))}
        {rooms.length === 0 && <div className="empty-state full-width">暂无会议室</div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? '编辑会议室' : '新增会议室'} width="560px">
        <div className="form-grid">
          <div className="form-group">
            <label>名称 *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="会议室名称" />
          </div>
          <div className="form-group">
            <label>位置</label>
            <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="如: A栋3楼301" />
          </div>
          <div className="form-group">
            <label>容纳人数</label>
            <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: +e.target.value})} min={1} />
          </div>
          <div className="form-group">
            <label>状态</label>
            <select value={form.status} onChange={e => setForm({...form, status: +e.target.value})}>
              <option value={0}>可用</option>
              <option value={1}>维护中</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label>描述</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="会议室描述" />
          </div>
          <div className="form-group full-width">
            <label>设备</label>
            <div className="equipment-selector">
              {EQUIPMENT_OPTIONS.map(eq => (
                <button key={eq} type="button" className={`equipment-btn ${form.equipment.includes(eq) ? 'active' : ''}`} onClick={() => toggleEquipment(eq)}>{eq}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </Modal>
    </div>
  );
}
