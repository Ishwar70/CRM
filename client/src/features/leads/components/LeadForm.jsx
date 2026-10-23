import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, Textarea } from '../../../components/ui/FormField.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES } from '../constants.js';
import { emptyLead, formToPayload, leadFormSchema } from '../schemas.js';
import { useAssignableUsers } from '../useLeads.js';

export function LeadForm({ initialValues = emptyLead, currentUser, onSubmit, onCancel, submitLabel, submitting, serverError }) {
  const isAdmin = currentUser.role === 'admin';
  const assignable = useAssignableUsers(isAdmin);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { ...initialValues, assignedTo: initialValues.assignedTo || currentUser._id },
  });

  const submit = (values) =>
    onSubmit(formToPayload(values, { isAdmin }), {
      onFieldErrors: (fieldErrors) =>
        fieldErrors.forEach(({ field, message }) => setError(field, { type: 'server', message })),
    });

  const assigneeOptions = (assignable.data ?? [{ _id: currentUser._id, name: currentUser.name, role: currentUser.role }]).map(
    (u) => ({ value: u._id, label: `${u.name}${u._id === currentUser._id ? ' (you)' : ''}` }),
  );

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      {serverError && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {serverError}
        </div>
      )}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="sr-only">Contact</legend>
        <Input label="Name" required autoComplete="off" error={errors.name?.message} {...register('name')} />
        <Input label="Company" error={errors.company?.message} {...register('company')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-3">
        <legend className="sr-only">Pipeline</legend>
        <Select label="Status" required options={LEAD_STATUSES} error={errors.status?.message} {...register('status')} />
        <Select label="Priority" required options={LEAD_PRIORITIES} error={errors.priority?.message} {...register('priority')} />
        <Select label="Source" options={LEAD_SOURCES} error={errors.source?.message} {...register('source')} />
        <Input
          label="Estimated value (USD)"
          type="number"
          min="0"
          step="100"
          inputMode="numeric"
          error={errors.estimatedValue?.message}
          {...register('estimatedValue')}
        />
        {isAdmin ? (
          <Select
            label="Assigned to"
            options={assigneeOptions}
            error={errors.assignedTo?.message}
            disabled={assignable.isPending}
            {...register('assignedTo')}
          />
        ) : (
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Assigned to</span>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
              {initialValues.assignedTo && initialValues.assignedTo !== currentUser._id ? 'Another user' : 'You'}
            </p>
          </div>
        )}
      </fieldset>

      <Textarea label="Notes" rows={4} hint="Up to 2000 characters" error={errors.notes?.message} {...register('notes')} />

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting} disabled={initialValues !== emptyLead && !isDirty}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
