export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Pending: { label: '待审核', cls: 'badge-warning' },
    Approved: { label: '已通过', cls: 'badge-success' },
    Rejected: { label: '已拒绝', cls: 'badge-danger' },
    Cancelled: { label: '已取消', cls: 'badge-secondary' },
    Available: { label: '可用', cls: 'badge-success' },
    Maintenance: { label: '维护中', cls: 'badge-warning' },
    User: { label: '用户', cls: 'badge-info' },
    Admin: { label: '管理员', cls: 'badge-warning' },
  };
  const info = map[status] || { label: status, cls: 'badge-secondary' };
  return <span className={`badge ${info.cls}`}>{info.label}</span>;
}
