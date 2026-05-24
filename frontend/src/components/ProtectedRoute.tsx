import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
  requireLinked?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false, requireLinked = false }: Props) {
  const { isLoggedIn, isAdmin, isLinked } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/profile" replace />;
  if (requireLinked && !isLinked && !isAdmin) return <Navigate to="/link-account" replace />;

  return <>{children}</>;
}
