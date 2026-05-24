export interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  employeeId: number | null;
  employeeName: string | null;
  departmentName: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  employeeCount: number;
  createdAt: string;
}

export interface Employee {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  departmentId: number;
  departmentName: string;
  hasAccount: boolean;
  createdAt: string;
}

export interface Room {
  id: number;
  name: string;
  location: string | null;
  capacity: number;
  description: string | null;
  imageUrl: string | null;
  status: string;
  equipment: string[];
  createdAt: string;
}

export interface Reservation {
  id: number;
  title: string;
  description: string | null;
  roomId: number;
  roomName: string;
  roomLocation: string | null;
  userId: number;
  username: string;
  startTime: string;
  endTime: string;
  status: string;
  attendeesCount: number;
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface RoomSchedule {
  roomId: number;
  roomName: string;
  roomStatus: string;
  date: string;
  schedule: ScheduleItem[];
}

export interface ScheduleItem {
  start: string;
  end: string;
  status: 'free' | 'reserved' | 'pending' | 'maintenance';
  title: string;
  username?: string;
  reservationId?: number;
}
