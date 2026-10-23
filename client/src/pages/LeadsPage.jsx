import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/useAuth.js';
import { useAssignableUsers, useLeads } from '../features/leads/useLeads.js';
import { LeadFilters } from '../features/leads/components/LeadFilters.jsx';
import { LeadCards, LeadsSkeleton, LeadsTable } from '../features/leads/components/LeadsList.jsx';
import { PAGE_SIZE } from '../features/leads/constants.js';
import { Card, EmptyState, ErrorState, PageHeader } from '../components/ui/States.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Button, buttonClasses } from '../components/ui/Button.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { useDebouncedValue } from '../utils/useDebouncedValue.js';

const FILTER_KEYS = ['status', 'priority', 'assignedTo'];
const DEFAULT_SORT = '-createdAt';

export default function LeadsPage() {
  const { data: user } = useCurrentUser();
  const isAdmin = user.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const filters = {
    status: searchParams.get('status') ?? '',
    priority: searchParams.get('priority') ?? '',
    assignedTo: isAdmin ? (searchParams.get('assignedTo') ?? '') : '',
    sort: searchParams.get('sort') ?? DEFAULT_SORT,
  };
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const updateParams = (changes) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === '' || value == null || (key === 'sort' && value === DEFAULT_SORT) || (key === 'page' && value === 1)) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        }
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    if ((searchParams.get('search') ?? '') !== debouncedSearch) updateParams({ search: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const params = { search: debouncedSearch, ...filters, page, limit: PAGE_SIZE };
  const leads = useLeads(params);
  const assignees = useAssignableUsers(isAdmin);

  const hasFilters = Boolean(search || FILTER_KEYS.some((k) => filters[k]) || filters.sort !== DEFAULT_SORT);
  const resetFilters = () => {
    setSearch('');
    setSearchParams({}, { replace: true });
  };

  const data = leads.data;

  return (
    <>
      <PageHeader
        title="Leads"
        description={isAdmin ? 'All leads across your team.' : 'Leads assigned to you.'}
        actions={
          <Link to="/leads/new" className={buttonClasses()}>
            <PlusIcon className="h-4 w-4" />
            New lead
          </Link>
        }
      />

      <Card>
        <LeadFilters
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFilterChange={(key, value) => updateParams({ [key]: value, page: 1 })}
          onReset={resetFilters}
          assignees={isAdmin ? (assignees.data ?? []) : null}
          canReset={hasFilters}
        />

        <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-600">
          <span aria-live="polite">
            {data ? `${data.total} ${data.total === 1 ? 'lead' : 'leads'} found` : 'Loading leads…'}
          </span>
          {leads.isFetching && data && <span className="text-xs text-slate-400">Updating…</span>}
        </div>

        {leads.isPending ? (
          <LeadsSkeleton />
        ) : leads.isError ? (
          <div className="p-4">
            <ErrorState title="Could not load leads" error={leads.error} onRetry={() => leads.refetch()} />
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-4">
            {hasFilters ? (
              <EmptyState
                title="No leads match your filters"
                description="Try a different search term or clear the filters."
                action={<Button variant="secondary" onClick={resetFilters}>Reset filters</Button>}
              />
            ) : (
              <EmptyState
                title="No leads yet"
                description="Create your first lead to start building your pipeline."
                action={
                  <Link to="/leads/new" className={buttonClasses()}>
                    Create lead
                  </Link>
                }
              />
            )}
          </div>
        ) : (
          <>
            <LeadsTable leads={data.items} showAssignee={isAdmin} />
            <LeadCards leads={data.items} showAssignee={isAdmin} />
            <div className="border-t border-slate-200 px-4 py-3">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                limit={data.limit}
                onPageChange={(p) => updateParams({ page: p })}
              />
            </div>
          </>
        )}
      </Card>
    </>
  );
}
