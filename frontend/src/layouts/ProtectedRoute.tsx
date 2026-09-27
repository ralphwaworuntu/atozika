import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useAuthHydration } from '@/hooks/useAuth';

type ProtectedRouteProps = {
  roles?: Array<'ADMIN' | 'MEMBER'>;
};

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const hydrated = useAuthHydration();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!hydrated) {
    return <div className="min-h-dvh bg-[#F4F7FC] dark:bg-[#070b12]" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (user?.role === 'MEMBER' && user.isEmailVerified === false) {
    return <Navigate to="/auth/verify" state={{ email: user.email }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    const fallback = user.role === 'ADMIN' ? '/admin' : '/app';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
