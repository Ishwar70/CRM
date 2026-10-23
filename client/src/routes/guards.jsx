import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/useAuth.js';
import { FullPageSpinner } from '../components/ui/Spinner.jsx';
import { ErrorState } from '../components/ui/States.jsx';

export function ProtectedRoute() {
  const { data: user, isPending, isError, error, refetch } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <FullPageSpinner label="Checking your session" />;
  if (isError) {
    return (
      <div className="mx-auto max-w-md p-8">
        <ErrorState title="Unable to reach the CRM" error={error} onRetry={refetch} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function RequireRole({ role }) {
  const { data: user } = useCurrentUser();
  if (user?.role !== role) {
    return <Navigate to="/dashboard" replace state={{ notice: 'You do not have access to that page.' }} />;
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { data: user, isPending } = useCurrentUser();
  if (isPending) return <FullPageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
