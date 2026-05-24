import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import LinkAccount from './pages/LinkAccount';
import Profile from './pages/Profile';
import Rooms from './pages/Rooms';
import RoomSchedule from './pages/RoomSchedule';
import Reservations from './pages/Reservations';
import MyReservations from './pages/MyReservations';
import Departments from './pages/Departments';
import Employees from './pages/Employees';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/link-account" element={<ProtectedRoute><LinkAccount /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute requireLinked><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/profile" replace />} />
            <Route path="profile" element={<Profile />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="rooms/schedule" element={<RoomSchedule />} />
            <Route path="rooms/:id/schedule" element={<RoomSchedule />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="my-reservations" element={<MyReservations />} />
            <Route path="departments" element={<ProtectedRoute adminOnly><Departments /></ProtectedRoute>} />
            <Route path="employees" element={<ProtectedRoute adminOnly><Employees /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '20px',
          background: 'rgba(30, 20, 60, 0.9)',
          backdropFilter: 'blur(20px)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.25)',
        }
      }} />
    </AuthProvider>
  );
}

export default App;
