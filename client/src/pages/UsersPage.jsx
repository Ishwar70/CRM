import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCurrentUser } from '../features/auth/useAuth.js';
import { useCreateUser, useSetUserStatus, useUsers } from '../features/users/useUsers.js';
import { createUserSchema } from '../features/users/schemas.js';
import { Card, ErrorState, PageHeader, Skeleton } from '../components/ui/States.jsx';
import { Input, Select } from '../components/ui/FormField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { formatDate } from '../utils/format.js';
import { PlusIcon } from '../components/icons.jsx';

const ROLE_OPTIONS = [
  { value: 'sales', label: 'Sales' },
  { value: 'admin', label: 'Admin' },
];

function CreateUserForm({ onDone }) {
  const createUser = useCreateUser();
  const { notify } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'sales' },
  });

  const onSubmit = (values) =>
    createUser.mutate(values, {
      onSuccess: (user) => {
        notify(`User ${user.name} created`);
        reset();
        onDone();
      },
      onError: (error) => error.errors?.forEach(({ field, message }) => setError(field, { type: 'server', message })),
    });

  return (
    <Card className="mb-6 p-6">
      <h2 className="text-base font-semibold">Create user</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Full name" required error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
        <Input
          label="Temporary password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <Select label="Role" options={ROLE_OPTIONS} error={errors.role?.message} {...register('role')} />
        {createUser.isError && !createUser.error.errors?.length && (
          <p role="alert" className="text-sm text-rose-700 sm:col-span-2 lg:col-span-4">
            {createUser.error.message}
          </p>
        )}
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4 lg:justify-end">
          <Button variant="secondary" onClick={onDone} disabled={createUser.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={createUser.isPending}>
            Create user
          </Button>
        </div>
      </form>
    </Card>
  );
}

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-600 ring-slate-500/20'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function UsersPage() {
  const { data: me } = useCurrentUser();
  const users = useUsers();
  const setStatus = useSetUserStatus();
  const { notify } = useToast();
  const [showForm, setShowForm] = useState(false);

  const toggle = (user) =>
    setStatus.mutate(
      { id: user._id, isActive: !user.isActive },
      {
        onSuccess: (u) => notify(`${u.name} ${u.isActive ? 'activated' : 'deactivated'}`),
        onError: (error) => notify(error.message, 'error'),
      },
    );

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage who can sign in and which role they have."
        actions={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <PlusIcon className="h-4 w-4" />
              New user
            </Button>
          )
        }
      />

      {showForm && <CreateUserForm onDone={() => setShowForm(false)} />}

      <Card className="overflow-hidden">
        {users.isPending ? (
          <div className="space-y-3 p-5" role="status" aria-label="Loading users">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : users.isError ? (
          <div className="p-5">
            <ErrorState title="Could not load users" error={users.error} onRetry={() => users.refetch()} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-5 py-3">User</th>
                  <th scope="col" className="px-5 py-3">Role</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="hidden px-5 py-3 text-right sm:table-cell">Leads</th>
                  <th scope="col" className="hidden px-5 py-3 md:table-cell">Joined</th>
                  <th scope="col" className="px-5 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.data.map((user) => {
                  const isSelf = user._id === me._id;
                  const pending = setStatus.isPending && setStatus.variables?.id === user._id;
                  return (
                    <tr key={user._id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">
                          {user.name}
                          {isSelf && <span className="ml-1 text-xs font-normal text-slate-500">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-5 py-3 capitalize text-slate-700">{user.role}</td>
                      <td className="px-5 py-3">
                        <StatusPill active={user.isActive} />
                      </td>
                      <td className="hidden px-5 py-3 text-right tabular-nums text-slate-700 sm:table-cell">{user.leadCount}</td>
                      <td className="hidden whitespace-nowrap px-5 py-3 text-slate-500 md:table-cell">{formatDate(user.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant={user.isActive ? 'secondary' : 'primary'}
                            onClick={() => toggle(user)}
                            loading={pending}
                            aria-label={`${user.isActive ? 'Deactivate' : 'Activate'} ${user.name}`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
