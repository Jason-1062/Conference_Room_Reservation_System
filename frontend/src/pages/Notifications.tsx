import { useState, useEffect } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function Notifications() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => { try { setList(await api.getNotifications()); } catch { } finally { setLoading(false); } };

  const handleRead = async (id: number) => {
    try { await api.markAsRead(id); load(); } catch { }
  };
  const handleReadAll = async () => {
    try { await api.markAllAsRead(); toast.success('全部已读'); load(); } catch { }
  };

  const unreadCount = list.filter(n => !n.isRead).length;
  if (loading) return <div className="page-loading">加载中...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>通知中心</h1><p className="page-desc">{unreadCount > 0 ? `${unreadCount} 条未读通知` : '所有通知已读'}</p></div>
        {unreadCount > 0 && <button className="btn btn-outline" onClick={handleReadAll}>全部已读</button>}
      </div>
      <div className="notification-list">
        {list.map(n => (
          <div key={n.id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`} onClick={() => !n.isRead && handleRead(n.id)}>
            <div className="notification-dot" />
            <div className="notification-content">
              <div className="notification-title">{n.title}</div>
              <div className="notification-message">{n.message}</div>
              <div className="notification-time">{dayjs(n.createdAt).format('YYYY-MM-DD HH:mm')}</div>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="empty-state">暂无通知</div>}
      </div>
    </div>
  );
}
