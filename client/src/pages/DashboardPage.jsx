import { useCurrentUser } from '../features/auth/useAuth.js';
import { PageHeader } from '../components/ui/States.jsx';

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  return <PageHeader title={`Welcome back, ${user.name.split(' ')[0]}`} description="Dashboard coming next." />;
}
