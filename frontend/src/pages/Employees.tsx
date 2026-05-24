import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import type { Employee, Department } from '../types';

export default function Employees() {
  const [list, setList] = useState<Employee[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [filterDept, setFilterDept] = useState<number | undefined>();
  const [form, setForm] = useState({ name: '', phone: '', email: '', position: '', departmentId: 0 });
  const { isAdmin } = useAuth();

  useEffect(() => { load(); loadDepts(); }, []);
  useEffect(() => { load(); }, [filterDept]);

  const load = async () => { try { setList(await api.getEmployees(filterDept)); } catch { } finally { setLoading(false); } };
  const loadDepts = async () => { try { setDepts(await api.getDepartments()); } catch { } };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', phone: '', email: '', position: '', departmentId: depts[0]?.id || 0 });
    setShowModal(true);
  };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({ name: e.name, phone: e.phone || '', email: e.email || '', position: e.position || '', departmentId: e.departmentId });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.departmentId) return toast.error('请填写必要信息');
    try {
      if (editing) { await api.updateEmployee(editing.id, form); toast.success('更新成功'); }
      else { await api.createEmployee(form); toast.success('创建成功'); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此职工？')) return;
    try { await api.deleteEmployee(id); toast.success('已删除'); load(); } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="page-loading">加载中...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>职工管理</h1><p className="page-desc">管理公司职工信息</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ 新增职工</button>}
      </div>
      <div className="filter-bar">
        <select value={filterDept || ''} onChange={e => setFilterDept(e.target.value ? +e.target.value : undefined)}>
          <option value="">全部部门</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="table-wrapper card">
        <table>
          <thead><tr><th>姓名</th><th>部门</th><th>职位</th><th>电话</th><th>邮箱</th><th>账号</th>{isAdmin && <th>操作</th>}</tr></thead>
          <tbody>
            {list.map(e => (
              <tr key={e.id}>
                <td><strong>{e.name}</strong></td>
                <td>{e.departmentName}</td>
                <td>{e.position || '-'}</td>
                <td>{e.phone || '-'}</td>
                <td>{e.email || '-'}</td>
                <td>{e.hasAccount ? <span className="badge badge-success">已关联</span> : <span className="badge badge-secondary">未关联</span>}</td>
                {isAdmin && <td>
                  <div className="action-btns">
                    <button className="btn btn-xs btn-outline" onClick={() => openEdit(e)}>编辑</button>
                    <button className="btn btn-xs btn-danger-outline" onClick={() => handleDelete(e.id)}>删除</button>
                  </div>
                </td>}
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="empty-state">暂无职工</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? '编辑职工' : '新增职工'} width="480px">
        <div className="form-stack" style={{ gap: '16px' }}>
          <div className="form-group"><label>姓名 *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="职工姓名" /></div>
          <div className="form-group"><label>部门 *</label>
            <select value={form.departmentId} onChange={e => setForm({...form, departmentId: +e.target.value})}>
              <option value={0}>请选择部门</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>职位</label><input value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="如: 经理" /></div>
          <div className="form-group"><label>电话</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="手机号" /></div>
          <div className="form-group"><label>邮箱</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" /></div>
        </div>
        <div className="modal-actions" style={{ marginTop: '24px', paddingBottom: 0 }}>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </Modal>
    </div>
  );
}
