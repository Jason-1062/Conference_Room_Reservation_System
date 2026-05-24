import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import type { Department } from '../types';

export default function Departments() {
  const [list, setList] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const { isAdmin } = useAuth();

  useEffect(() => { load(); }, []);
  const load = async () => { try { setList(await api.getDepartments()); } catch { } finally { setLoading(false); } };

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true); };
  const openEdit = (d: Department) => { setEditing(d); setForm({ name: d.name, description: d.description || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) return toast.error('请填写部门名称');
    try {
      if (editing) { await api.updateDepartment(editing.id, form); toast.success('更新成功'); }
      else { await api.createDepartment(form); toast.success('创建成功'); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此部门？')) return;
    try { await api.deleteDepartment(id); toast.success('已删除'); load(); } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="page-loading">加载中...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>部门管理</h1><p className="page-desc">管理公司部门信息</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ 新增部门</button>}
      </div>
      <div className="table-wrapper card">
        <table>
          <thead><tr><th>部门名称</th><th>描述</th><th>职工人数</th>{isAdmin && <th>操作</th>}</tr></thead>
          <tbody>
            {list.map(d => (
              <tr key={d.id}>
                <td><strong>{d.name}</strong></td>
                <td className="text-muted">{d.description || '-'}</td>
                <td><span className="badge badge-info">{d.employeeCount} 人</span></td>
                {isAdmin && <td>
                  <div className="action-btns">
                    <button className="btn btn-xs btn-outline" onClick={() => openEdit(d)}>编辑</button>
                    <button className="btn btn-xs btn-danger-outline" onClick={() => handleDelete(d.id)}>删除</button>
                  </div>
                </td>}
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={4} className="empty-state">暂无部门</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? '编辑部门' : '新增部门'}>
        <div className="form-stack">
          <div className="form-group"><label>部门名称 *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="请输入部门名称" /></div>
          <div className="form-group"><label>描述</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder="部门描述(可选)" /></div>
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button><button className="btn btn-primary" onClick={handleSave}>保存</button></div>
      </Modal>
    </div>
  );
}
