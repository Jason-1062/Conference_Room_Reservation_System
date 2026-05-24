import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

const adminNavItems = [
  { path: '/profile', icon: '👤', label: '个人中心' },
  { path: '/rooms', icon: '🏢', label: '会议室管理' },
  { path: '/reservations', icon: '📅', label: '预约管理' },
  { path: '/departments', icon: '🏛️', label: '部门管理' },
  { path: '/employees', icon: '👥', label: '职工管理' },
  { path: '/users', icon: '🔑', label: '用户审核' },
];

const userNavItems = [
  { path: '/profile', icon: '👤', label: '个人中心' },
  { path: '/rooms', icon: '🏢', label: '会议室介绍' },
  { path: '/my-reservations', icon: '📋', label: '我的预约' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnread = async () => {
    try {
      const data = await api.getUnreadCount();
      setUnreadCount(data.count);
    } catch { }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="layout">
      <div className="bg-blobs">
        <div className="bg-blob" />
        <div className="bg-blob" />
        <div className="bg-blob" />
      </div>

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            {sidebarOpen && <><span className="logo-icon">📅</span><span className="logo-text">会议室预约</span></>}
            {!sidebarOpen && <span className="logo-icon">📅</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidebarOpen && isAdmin && <div className="sidebar-section-title">管理功能</div>}
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end={item.path === '/profile'}>
              <span className="nav-icon" style={{ position: 'relative' }}>
                {item.icon}
                {item.path === '/profile' && unreadCount > 0 && (
                  <span className="nav-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-avatar">{user?.employeeName?.charAt(0) || user?.username?.charAt(0).toUpperCase()}</div>
              <div className="user-details">
                <span className="user-name">{user?.employeeName || user?.username}</span>
                <span className="user-role">{isAdmin ? '管理员' : (user?.departmentName || '用户')}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left" />
          <div className="topbar-right">
            <button className="topbar-btn" onClick={handleLogout}>退出登录</button>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
