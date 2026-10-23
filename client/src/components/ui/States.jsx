import { Button } from './Button.jsx';

export function ErrorState({ title = 'Something went wrong', error, onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
      <p className="font-medium text-rose-900">{title}</p>
      {error?.message && <p className="mt-1 text-sm text-rose-700">{error.message}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} aria-hidden="true" />;
}

export function Card({ className = '', children }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
