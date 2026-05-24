import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import toast from 'react-hot-toast';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return toast.error('请填写完整信息');
    if (password.length < 6) return toast.error('密码至少6位');
    if (password !== confirmPwd) return toast.error('两次密码不一致');
    setLoading(true);
    try {
      await api.register({ username, password });
      toast.success('注册成功！审核通过后请关联职工账号。');
      navigate('/login');
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
          <p>注册新账号</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>用户名</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名" autoFocus />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="至少6位" />
          </div>
          <div className="form-group">
            <label>确认密码</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="再次输入密码" />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '14px' }}>
            {loading ? '注册中...' : '注 册'}
          </button>
        </form>
        <div className="auth-footer">
          已有账号？<Link to="/login">立即登录</Link>
        </div>
        <div className="auth-demo">
          <p>注册说明</p>
          <span>注册后需等待管理员审核，审核通过后需关联职工账号才能使用系统。</span>
        </div>
      </div>
    </div>
  );
}
