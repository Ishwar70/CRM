import { Link } from 'react-router-dom';
import { buttonClasses } from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you are looking for does not exist.</p>
      <Link to="/dashboard" className={buttonClasses({ className: 'mt-6' })}>
        Back to dashboard
      </Link>
    </div>
  );
}
