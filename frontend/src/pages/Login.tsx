import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return toast.error('请填写完整信息');
    setLoading(true);
    try {
      const data = await api.login({ username, password });
      login(data.token, data.user);
      toast.success('登录成功');
      if (data.user.role !== 'Admin' && !data.user.employeeId) {
        navigate('/link-account');
      } else {
        navigate('/profile');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-blobs">
        <div className="bg-blob" />
        <div className="bg-blob" />
        <div className="bg-blob" />
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">📅</div>
          <h1>会议室预约系统</h1>
          <p>请登录您的账号</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>用户名</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名" autoFocus />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '14px' }}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
        <div className="auth-footer">
          还没有账号？<Link to="/register">立即注册</Link>
        </div>
      </div>
    </div>
  );
}
