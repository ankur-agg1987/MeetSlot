import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// requiredRole: 'advisor' | 'master_admin' | undefined (any logged-in role)
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/login" replace />;

  return children;
}
