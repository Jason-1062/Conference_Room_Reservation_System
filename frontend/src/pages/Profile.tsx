import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import type { Reservation, Notification } from '../types';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reservations, notifs] = await Promise.all([
        api.getMyReservations(),
        api.getNotifications(),
      ]);
      setMyReservations(reservations || []);
      setNotifications(notifs || []);
    } catch { } finally { setLoading(false); }
  };

  const handleSavePhone = async () => {
    try {
      const updated = await api.updateProfile({ phone });
      updateUser(updated);
      setEditingPhone(false);
      toast.success('手机号已更新');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSaveEmail = async () => {
    try {
      const updated = await api.updateProfile({ email });
      updateUser(updated);
      setEditingEmail(false);
      toast.success('邮箱已更新');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleMarkRead = async (id: number) => {
    try { await api.markAsRead(id); loadData(); } catch { }
  };

  const handleCancelReservation = async (id: number) => {
    if (!confirm('确定取消此预约？')) return;
    try { await api.cancelReservation(id); toast.success('已取消'); loadData(); } catch (err: any) { toast.error(err.message); }
  };

  const upcomingReservations = myReservations
    .filter(r => (r.status === 'Pending' || r.status === 'Approved') && dayjs(r.endTime).isAfter(dayjs()))
    .sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)))
    .slice(0, 5);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="page-loading">加载中...</div>;

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1>个人中心</h1>
          <p className="page-desc">管理您的个人信息、预约与通知</p>
        </div>
      </div>

      <div className="profile-new-layout">
        {/* Left Sidebar */}
        <div className="profile-sidebar">
          <div className="card profile-hero">
            <div className="profile-avatar-large">
              {user?.employeeName?.[0] || user?.username?.[0] || 'U'}
            </div>
            <h2>{user?.employeeName || user?.username}</h2>
            <div className="profile-tags">
              <StatusBadge status={user?.role || 'User'} />
              {user?.departmentName && <span className="badge badge-secondary">{user?.departmentName}</span>}
              {!user?.employeeName && <span className="badge badge-warning">未关联职工</span>}
            </div>

            <div className="profile-stats-row">
              <div className="profile-stat-box">
                <span className="stat-num">{upcomingReservations.length}</span>
                <span className="stat-text">即将参与</span>
              </div>
              <div className="profile-stat-box">
                <span className="stat-num" style={{ color: unreadCount > 0 ? '#fca5a5' : 'inherit' }}>{unreadCount}</span>
                <span className="stat-text">未读通知</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '1.05rem', fontWeight: 600 }}>联系信息</h3>
            <div className="profile-section">
              <div className="profile-field-minimal">
                <span className="profile-field-label">用户名</span>
                <span className="profile-field-value">{user?.username}</span>
              </div>
              <div className="profile-field-minimal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="profile-field-label">手机号</span>
                  {!editingPhone && <button className="btn btn-xs btn-outline" onClick={() => setEditingPhone(true)}>修改</button>}
                </div>
                {editingPhone ? (
                  <div className="profile-edit-row">
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="手机号" />
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      <button className="btn btn-xs btn-primary" onClick={handleSavePhone}>保存</button>
                      <button className="btn btn-xs btn-secondary" onClick={() => { setPhone(user?.phone || ''); setEditingPhone(false); }}>取消</button>
                    </div>
                  </div>
                ) : (
                  <span className="profile-field-value">{user?.phone || '未设置'}</span>
                )}
              </div>
              <div className="profile-field-minimal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="profile-field-label">邮箱</span>
                  {!editingEmail && <button className="btn btn-xs btn-outline" onClick={() => setEditingEmail(true)}>修改</button>}
                </div>
                {editingEmail ? (
                  <div className="profile-edit-row">
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" />
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      <button className="btn btn-xs btn-primary" onClick={handleSaveEmail}>保存</button>
                      <button className="btn btn-xs btn-secondary" onClick={() => { setEmail(user?.email || ''); setEditingEmail(false); }}>取消</button>
                    </div>
                  </div>
                ) : (
                  <span className="profile-field-value">{user?.email || '未设置'}</span>
                )}
              </div>
              <div className="profile-field-minimal">
                <span className="profile-field-label">注册时间</span>
                <span className="profile-field-value">{dayjs(user?.createdAt).format('YYYY-MM-DD')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Panel */}
        <div className="profile-main">
          {/* Upcoming Reservations */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>即将到来的预约</h3>
            </div>
            {upcomingReservations.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>暂无即将到来的预约</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>会议名称</th><th>会议室</th><th>时间</th><th>状态</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    {upcomingReservations.map(r => (
                      <tr key={r.id}>
                        <td><strong>{r.title}</strong></td>
                        <td>{r.roomName}</td>
                        <td className="text-nowrap">{dayjs(r.startTime).format('MM-DD HH:mm')} ~ {dayjs(r.endTime).format('HH:mm')}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>
                          {(r.status === 'Pending' || r.status === 'Approved') && (
                            <button className="btn btn-xs btn-danger-outline" onClick={() => handleCancelReservation(r.id)}>取消</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>通知消息</h3>
              {unreadCount > 0 && <span className="badge badge-warning">{unreadCount} 条未读</span>}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto', paddingRight: '4px' }}>
                {notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px', height: '100%' }}>暂无通知</div>
                ) : (
                  <div className="notification-list">
                    {notifications.map(n => (
                      <div key={n.id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`} onClick={() => !n.isRead && handleMarkRead(n.id)}>
                        <div className="notification-dot" />
                        <div className="notification-content">
                          <div className="notification-title">{n.title}</div>
                          <div className="notification-message">{n.message}</div>
                          <div className="notification-time">{dayjs(n.createdAt).format('MM-DD HH:mm')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
