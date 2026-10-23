import { Link } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/useAuth.js';
import { useDashboardStats } from '../features/dashboard/useDashboard.js';
import { LEAD_STATUSES } from '../features/leads/constants.js';
import { PriorityBadge, StatusBadge } from '../features/leads/components/LeadBadges.jsx';
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui/States.jsx';
import { buttonClasses } from '../components/ui/Button.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

const KPIS = [
  { key: 'total', label: 'Total leads', accent: 'bg-indigo-500' },
  { key: 'new', label: 'New', accent: 'bg-sky-500', status: 'new' },
  { key: 'qualified', label: 'Qualified', accent: 'bg-amber-500', status: 'qualified' },
  { key: 'won', label: 'Won', accent: 'bg-emerald-500', status: 'won' },
];

function KpiCards({ stats, isPending }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {KPIS.map(({ key, label, accent, status }) => (
        <Card key={key} className="relative overflow-hidden p-5">
          <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden="true" />
          <p className="text-sm font-medium text-slate-500">{label}</p>
          {isPending ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{stats.totals[key]}</p>
          )}
          <Link
            to={status ? `/leads?status=${status}` : '/leads'}
            className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            View<span className="sr-only"> {label.toLowerCase()} leads</span> →
          </Link>
        </Card>
      ))}
    </div>
  );
}

function StatusDistribution({ stats }) {
  const total = stats.totals.total || 1;
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold">Leads by status</h2>
      <ul className="mt-4 space-y-3">
        {LEAD_STATUSES.map((s) => {
          const count = stats.totals[s.value];
          const pct = Math.round((count / total) * 100);
          return (
            <li key={s.value}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">{s.label}</span>
                <span className="tabular-nums text-slate-500">
                  {count} · {pct}%
                </span>
              </div>
              <div
                className="mt-1 h-2 rounded-full bg-slate-100"
                role="progressbar"
                aria-label={`${s.label} leads`}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className={`h-2 rounded-full ${s.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <div>
          <dt className="text-xs text-slate-500">Open pipeline</dt>
          <dd className="text-lg font-semibold tabular-nums">{formatCurrency(stats.pipelineValue)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Won value</dt>
          <dd className="text-lg font-semibold tabular-nums text-emerald-700">{formatCurrency(stats.wonValue)}</dd>
        </div>
      </dl>
    </Card>
  );
}

function RecentLeads({ leads }) {
  return (
    <Card className="overflow-hidden lg:col-span-2">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-base font-semibold">Recent leads</h2>
        <Link to="/leads" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          View all
        </Link>
      </div>
      {leads.length === 0 ? (
        <div className="px-5 pb-5">
          <EmptyState
            title="No leads yet"
            description="New leads will appear here."
            action={
              <Link to="/leads/new" className={buttonClasses()}>
                Create lead
              </Link>
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-5 py-3">Name</th>
                <th scope="col" className="hidden px-5 py-3 sm:table-cell">Company</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="hidden px-5 py-3 md:table-cell">Priority</th>
                <th scope="col" className="hidden px-5 py-3 lg:table-cell">Assignee</th>
                <th scope="col" className="hidden px-5 py-3 sm:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead._id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link to={`/leads/${lead._id}`} className="whitespace-nowrap font-medium text-slate-900 hover:text-indigo-600">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="hidden px-5 py-3 text-slate-600 sm:table-cell">{lead.company || '—'}</td>
                  <td className="px-5 py-3"><StatusBadge status={lead.status} /></td>
                  <td className="hidden px-5 py-3 md:table-cell"><PriorityBadge priority={lead.priority} /></td>
                  <td className="hidden whitespace-nowrap px-5 py-3 text-slate-600 lg:table-cell">{lead.assignedTo?.name ?? '—'}</td>
                  <td className="hidden whitespace-nowrap px-5 py-3 text-slate-500 sm:table-cell">{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const stats = useDashboardStats();
  const isAdmin = user.role === 'admin';

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        description={isAdmin ? 'Team-wide pipeline overview.' : 'Your assigned pipeline at a glance.'}
        actions={
          <Link to="/leads/new" className={buttonClasses()}>
            <PlusIcon className="h-4 w-4" />
            New lead
          </Link>
        }
      />

      {stats.isError ? (
        <ErrorState title="Could not load dashboard" error={stats.error} onRetry={() => stats.refetch()} />
      ) : (
        <div className="space-y-6">
          <KpiCards stats={stats.data} isPending={stats.isPending} />
          {stats.isPending ? (
            <div className="grid gap-6 lg:grid-cols-3" role="status" aria-label="Loading dashboard">
              <Skeleton className="h-72 lg:col-span-2" />
              <Skeleton className="h-72" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <RecentLeads leads={stats.data.recentLeads} />
              <StatusDistribution stats={stats.data} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
