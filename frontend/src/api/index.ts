const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('未授权');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `请求失败 (${res.status})`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: { username: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { username: string; password: string }) =>
    request<{ message: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),
  linkAccount: (data: { name: string; phone: string }) =>
    request<any>('/auth/link-account', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (data: { phone?: string; email?: string }) =>
    request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Users
  getUsers: (status?: string) => request<any[]>(`/users${status ? `?status=${status}` : ''}`),
  approveUser: (id: number) => request<any>(`/users/${id}/approve`, { method: 'PUT' }),
  rejectUser: (id: number) => request<any>(`/users/${id}/reject`, { method: 'PUT' }),
  deleteUser: (id: number) => request<any>(`/users/${id}`, { method: 'DELETE' }),

  // Departments
  getDepartments: () => request<any[]>('/departments'),
  createDepartment: (data: any) => request<any>('/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id: number, data: any) => request<any>(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDepartment: (id: number) => request<any>(`/departments/${id}`, { method: 'DELETE' }),

  // Employees
  getEmployees: (departmentId?: number) => request<any[]>(`/employees${departmentId ? `?departmentId=${departmentId}` : ''}`),
  createEmployee: (data: any) => request<any>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: number, data: any) => request<any>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id: number) => request<any>(`/employees/${id}`, { method: 'DELETE' }),

  // Rooms
  getRooms: (params?: { minCapacity?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.minCapacity) q.set('minCapacity', String(params.minCapacity));
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return request<any[]>(`/rooms${qs ? `?${qs}` : ''}`);
  },
  getRoom: (id: number) => request<any>(`/rooms/${id}`),
  createRoom: (data: any) => request<any>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id: number, data: any) => request<any>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id: number) => request<any>(`/rooms/${id}`, { method: 'DELETE' }),
  getRoomSchedule: (id: number, date: string) => request<any>(`/rooms/${id}/schedule?date=${date}`),

  // Reservations
  getReservations: (params?: { roomId?: number; status?: string; date?: string }) => {
    const q = new URLSearchParams();
    if (params?.roomId) q.set('roomId', String(params.roomId));
    if (params?.status) q.set('status', params.status);
    if (params?.date) q.set('date', params.date);
    const qs = q.toString();
    return request<any[]>(`/reservations${qs ? `?${qs}` : ''}`);
  },
  getMyReservations: () => request<any[]>('/reservations/my'),
  createReservation: (data: any) => request<any>('/reservations', { method: 'POST', body: JSON.stringify(data) }),
  approveReservation: (id: number) => request<any>(`/reservations/${id}/approve`, { method: 'PUT' }),
  rejectReservation: (id: number) => request<any>(`/reservations/${id}/reject`, { method: 'PUT' }),
  cancelReservation: (id: number) => request<any>(`/reservations/${id}/cancel`, { method: 'PUT' }),
  checkAvailability: (roomId: number, start: string, end: string) =>
    request<{ available: boolean; conflicts: any[] }>(`/reservations/check?roomId=${roomId}&start=${start}&end=${end}`),

  // Notifications
  getNotifications: () => request<any[]>('/notifications'),
  getUnreadCount: () => request<{ count: number }>('/notifications/unread-count'),
  markAsRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),

  // Dashboard
  getDashboardStats: () => request<any>('/dashboard/stats'),
};
