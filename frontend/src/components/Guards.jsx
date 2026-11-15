import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Spinner } from './ui.jsx';

/** Only signed-in users; others are sent to /login and returned afterwards. */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner className="py-32" />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />;
  return <Outlet />;
}

/** Only administrators. (The server checks the role again on every request.) */
export function RequireAdmin() {
  const { user, loading, isAdmin } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner className="py-32" />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Where a signed-in user belongs: back to the page they wanted, otherwise their own dashboard. */
export const dashboardFor = (user, from) => from || (user.role === 'admin' ? '/admin' : '/cabinet');

/** Login / registration pages: a user who is already signed in is sent to the dashboard instead. */
export function GuestOnly() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner className="py-32" />;
  if (user) return <Navigate to={dashboardFor(user, loc.state?.from)} replace />;
  return <Outlet />;
}
