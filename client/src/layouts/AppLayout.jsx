import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../features/auth/useAuth.js';
import {
  CloseIcon,
  DashboardIcon,
  LeadsIcon,
  LogoMark,
  LogoutIcon,
  MenuIcon,
  ProfileIcon,
  UsersIcon,
} from '../components/icons.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/leads', label: 'Leads', icon: LeadsIcon },
  { to: '/users', label: 'Users', icon: UsersIcon, role: 'admin' },
  { to: '/profile', label: 'Profile', icon: ProfileIcon },
];

function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function Sidebar({ user, onNavigate, onLogout, loggingOut }) {
  const links = NAV.filter((item) => !item.role || item.role === user.role);
  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <LogoMark />
        <span className="text-lg font-semibold text-white">Pipeline CRM</span>
      </div>
      <nav aria-label="Main" className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: NavIcon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'
              }`
            }
          >
            <NavIcon />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white"
            aria-hidden="true"
          >
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs capitalize text-slate-400">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const notice = location.state?.notice;

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const handleLogout = () => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 md:block">
        <Sidebar user={user} onLogout={handleLogout} loggingOut={logout.isPending} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <LogoMark className="h-7 w-7" />
          <span className="font-semibold">Pipeline CRM</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
        >
          <MenuIcon />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <Sidebar
              user={user}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
              loggingOut={logout.isPending}
            />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-5 rounded-lg p-1.5 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Close navigation"
              autoFocus
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      <main id="main" className="md:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {notice && (
            <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {notice}
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
