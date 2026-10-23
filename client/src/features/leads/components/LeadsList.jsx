import { Link } from 'react-router-dom';
import { PriorityBadge, StatusBadge } from './LeadBadges.jsx';
import { Skeleton } from '../../../components/ui/States.jsx';
import { formatCurrency, formatDate } from '../../../utils/format.js';

export function LeadsTable({ leads, showAssignee }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th scope="col" className="px-4 py-3">Name</th>
            <th scope="col" className="px-4 py-3">Company</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Priority</th>
            <th scope="col" className="px-4 py-3 text-right">Value</th>
            {showAssignee && <th scope="col" className="px-4 py-3">Assignee</th>}
            <th scope="col" className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {leads.map((lead) => (
            <tr key={lead._id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link
                  to={`/leads/${lead._id}`}
                  className="font-medium text-slate-900 hover:text-indigo-600 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  {lead.name}
                </Link>
                {lead.email && <div className="text-xs text-slate-500">{lead.email}</div>}
              </td>
              <td className="px-4 py-3 text-slate-600">{lead.company || '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
              <td className="px-4 py-3"><PriorityBadge priority={lead.priority} /></td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatCurrency(lead.estimatedValue)}</td>
              {showAssignee && <td className="px-4 py-3 text-slate-600">{lead.assignedTo?.name ?? '—'}</td>}
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(lead.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeadCards({ leads, showAssignee }) {
  return (
    <ul className="divide-y divide-slate-100 md:hidden">
      {leads.map((lead) => (
        <li key={lead._id}>
          <Link
            to={`/leads/${lead._id}`}
            className="block px-4 py-4 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{lead.name}</p>
                <p className="truncate text-sm text-slate-500">{lead.company || 'No company'}</p>
              </div>
              <StatusBadge status={lead.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
              <div>
                <dt className="sr-only">Priority</dt>
                <dd><PriorityBadge priority={lead.priority} /></dd>
              </div>
              <div className="text-right">
                <dt className="sr-only">Estimated value</dt>
                <dd className="font-medium tabular-nums text-slate-700">{formatCurrency(lead.estimatedValue)}</dd>
              </div>
              {showAssignee && (
                <div>
                  <dt className="inline">Assignee: </dt>
                  <dd className="inline">{lead.assignedTo?.name ?? '—'}</dd>
                </div>
              )}
              <div className={showAssignee ? 'text-right' : 'col-span-2'}>
                <dt className="inline">Created </dt>
                <dd className="inline">{formatDate(lead.createdAt)}</dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function LeadsSkeleton({ rows = 6 }) {
  return (
    <div className="divide-y divide-slate-100" role="status" aria-label="Loading leads">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
