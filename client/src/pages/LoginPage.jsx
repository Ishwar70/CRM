import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLogin } from '../features/auth/useAuth.js';
import { DEMO_ACCOUNTS, loginSchema } from '../features/auth/schemas.js';
import { Input } from '../components/ui/FormField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { LogoMark } from '../components/icons.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = (values) =>
    login.mutate(values, {
      onSuccess: () => navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true }),
    });

  const fillDemo = (account) => {
    setValue('email', account.email, { shouldValidate: true });
    setValue('password', account.password, { shouldValidate: true });
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <span className="text-xl font-semibold">Pipeline CRM</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-4xl font-semibold leading-tight">Every lead, every stage, one clear pipeline.</h2>
          <p className="mt-4 text-indigo-100">
            Track prospects from first contact to closed deal with role-based access for admins and sales teams.
          </p>
        </div>
        <p className="text-sm text-indigo-200">Portfolio demo · fictional data only</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoMark />
            <span className="text-lg font-semibold">Pipeline CRM</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to your account</h1>
          <p className="mt-1 text-sm text-slate-500">Use a demo account below to explore the app.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
            {login.isError && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {login.error.message}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full" loading={login.isPending}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts</p>
            <ul className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => fillDemo(account)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <span>
                      <span className="font-medium text-slate-900">{account.label}</span>
                      <span className="block text-slate-500">{account.email}</span>
                    </span>
                    <span className="text-xs font-medium text-indigo-600">Use</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 px-3 text-xs text-slate-500">
              Password: <code className="font-mono">{DEMO_ACCOUNTS[0].password}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
