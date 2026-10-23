import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../features/auth/useAuth.js';
import { Card, PageHeader } from '../components/ui/States.jsx';
import { Button } from '../components/ui/Button.jsx';
import { formatDate } from '../utils/format.js';

const PERMISSIONS = {
  admin: ['View and manage all leads', 'Assign leads to any active user', 'Delete leads', 'Create and deactivate users'],
  sales: ['View and update leads assigned to you', 'Create leads (assigned to you)', 'Leads can only be deleted by an admin'],
};

export default function ProfilePage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Profile" description="Your account details and permissions." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <dl className="space-y-4 text-sm">
            {[
              ['Name', user.name],
              ['Email', user.email],
              ['Role', <span className="capitalize">{user.role}</span>],
              ['Status', user.isActive ? 'Active' : 'Inactive'],
              ['Member since', formatDate(user.createdAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <Button
            variant="secondary"
            className="mt-6 w-full sm:w-auto"
            loading={logout.isPending}
            onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })}
          >
            Sign out
          </Button>
        </Card>
        <Card className="p-6">
          <h2 className="text-base font-semibold">What you can do</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {PERMISSIONS[user.role].map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-indigo-500" aria-hidden="true">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
