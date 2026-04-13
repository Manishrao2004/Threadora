import { Outlet } from 'react-router-dom';

/**
 * GuestRoute — A passthrough route wrapper that allows both authenticated
 * and unauthenticated users to access the wrapped pages.
 *
 * Pages inside this wrapper are responsible for conditionally rendering
 * auth-gated UI based on the `user` value from `useAuth()`.
 */
const GuestRoute = () => {
  return <Outlet />;
};

export default GuestRoute;
