import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/useAuth.js';
import { useCreateLead } from '../features/leads/useLeads.js';
import { LeadForm } from '../features/leads/components/LeadForm.jsx';
import { Card, PageHeader } from '../components/ui/States.jsx';
import { useToast } from '../components/ui/Toast.jsx';

export default function LeadNewPage() {
  const { data: user } = useCurrentUser();
  const createLead = useCreateLead();
  const navigate = useNavigate();
  const { notify } = useToast();

  const handleSubmit = (payload, { onFieldErrors }) =>
    createLead.mutate(payload, {
      onSuccess: (lead) => {
        notify(`Lead "${lead.name}" created`);
        navigate(`/leads/${lead._id}`);
      },
      onError: (error) => onFieldErrors(error.errors ?? []),
    });

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link to="/leads" className="hover:text-slate-900">
          Leads
        </Link>{' '}
        / New
      </nav>
      <PageHeader title="New lead" description="Capture a prospect and start tracking it through your pipeline." />
      <Card className="p-6">
        <LeadForm
          currentUser={user}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/leads')}
          submitLabel="Create lead"
          submitting={createLead.isPending}
          serverError={createLead.isError && !createLead.error.errors?.length ? createLead.error.message : null}
        />
      </Card>
    </>
  );
}
