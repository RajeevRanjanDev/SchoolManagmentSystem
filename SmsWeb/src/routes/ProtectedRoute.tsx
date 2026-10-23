import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { RoleName } from '@/types/common.types';

interface Props {
  children: React.ReactNode;
  roles?: RoleName[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/403" replace />;

  return <>{children}</>;
}
