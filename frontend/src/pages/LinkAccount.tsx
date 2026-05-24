import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LinkAccount() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return toast.error('请填写姓名和手机号');
    setLoading(true);
    try {
      const updated = await api.linkAccount({ name, phone });
      updateUser(updated);
      toast.success('账号关联成功！');
      navigate('/profile');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    logout();
    navigate('/login');
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
          <div className="auth-logo">🔗</div>
          <h1>关联职工账号</h1>
          <p>请输入您的职工信息以完成账号关联</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>姓名</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="请输入您的姓名" autoFocus />
          </div>
          <div className="form-group">
            <label>手机号</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入您的手机号" />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '14px' }}>
            {loading ? '关联中...' : '关联账号'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={handleSkip}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline'
            }}
          >
            暂不关联，退出登录
          </button>
        </div>
        <div className="auth-demo">
          <p>说明</p>
          <span>系统将通过姓名和手机号自动匹配您的职工档案。关联后可使用系统全部功能。如无法匹配，请联系管理员在职工管理中添加您的信息。</span>
        </div>
      </div>
    </div>
  );
}
