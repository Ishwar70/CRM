import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/useAuth.js';
import { useDeleteLead, useLead, useUpdateLead } from '../features/leads/useLeads.js';
import { LeadForm } from '../features/leads/components/LeadForm.jsx';
import { PriorityBadge, StatusBadge } from '../features/leads/components/LeadBadges.jsx';
import { findOption, LEAD_SOURCES } from '../features/leads/constants.js';
import { leadToForm } from '../features/leads/schemas.js';
import { Card, ErrorState, PageHeader, Skeleton } from '../components/ui/States.jsx';
import { Button, buttonClasses } from '../components/ui/Button.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children || '—'}</dd>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const { data: user } = useCurrentUser();
  const isAdmin = user.role === 'admin';
  const lead = useLead(id);
  const updateLead = useUpdateLead(id);
  const deleteLead = useDeleteLead();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (lead.isPending) {
    return (
      <div role="status" aria-label="Loading lead" className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (lead.isError) {
    const notFound = lead.error.status === 404;
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState
          title={notFound ? 'Lead not found' : 'Could not load lead'}
          error={notFound ? { message: 'It may have been deleted or is not assigned to you.' } : lead.error}
          onRetry={notFound ? undefined : () => lead.refetch()}
        />
        <div className="mt-4 text-center">
          <Link to="/leads" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            ← Back to leads
          </Link>
        </div>
      </div>
    );
  }

  const data = lead.data;

  const handleUpdate = (payload, { onFieldErrors }) =>
    updateLead.mutate(payload, {
      onSuccess: () => {
        notify('Lead updated');
        setEditing(false);
      },
      onError: (error) => onFieldErrors(error.errors ?? []),
    });

  const handleDelete = () =>
    deleteLead.mutate(id, {
      onSuccess: () => {
        notify(`Lead "${data.name}" deleted`);
        navigate('/leads', { replace: true });
      },
      onError: (error) => {
        notify(error.message, 'error');
        setConfirming(false);
      },
    });

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link to="/leads" className="hover:text-slate-900">
          Leads
        </Link>{' '}
        / {data.name}
      </nav>
      <PageHeader
        title={data.name}
        description={data.company || 'No company'}
        actions={
          !editing && (
            <>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit
              </Button>
              {isAdmin && (
                <Button variant="danger" onClick={() => setConfirming(true)}>
                  Delete
                </Button>
              )}
            </>
          )
        }
      />

      {editing ? (
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold">Edit lead</h2>
          <LeadForm
            initialValues={leadToForm(data)}
            currentUser={user}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            submitLabel="Save changes"
            submitting={updateLead.isPending}
            serverError={updateLead.isError && !updateLead.error.errors?.length ? updateLead.error.message : null}
          />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-4 text-base font-semibold">Contact details</h2>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Detail label="Email">
                {data.email && (
                  <a href={`mailto:${data.email}`} className="text-indigo-600 hover:underline">
                    {data.email}
                  </a>
                )}
              </Detail>
              <Detail label="Phone">{data.phone}</Detail>
              <Detail label="Company">{data.company}</Detail>
              <Detail label="Source">{findOption(LEAD_SOURCES, data.source)?.label}</Detail>
            </dl>
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{data.notes || 'No notes yet.'}</p>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold">Pipeline</h2>
            <dl className="space-y-4">
              <Detail label="Status">
                <StatusBadge status={data.status} />
              </Detail>
              <Detail label="Priority">
                <PriorityBadge priority={data.priority} />
              </Detail>
              <Detail label="Estimated value">{formatCurrency(data.estimatedValue)}</Detail>
              <Detail label="Assigned to">{data.assignedTo?.name}</Detail>
              <Detail label="Created by">{data.createdBy?.name}</Detail>
              <Detail label="Created">{formatDate(data.createdAt)}</Detail>
              <Detail label="Last updated">{formatDate(data.updatedAt)}</Detail>
            </dl>
          </Card>
        </div>
      )}

      {!editing && (
        <div className="mt-6">
          <Link to="/leads" className={buttonClasses({ variant: 'ghost' })}>
            ← Back to leads
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="Delete this lead?"
        description={`"${data.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete lead"
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
        loading={deleteLead.isPending}
      />
    </>
  );
}
