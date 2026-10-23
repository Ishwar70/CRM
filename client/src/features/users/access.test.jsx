import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi, dashboardApi, usersApi } from '../../api/endpoints.js';
import { ApiRequestError } from '../../api/client.js';
import { adminUser, renderApp, salesUser } from '../../test/utils.jsx';

vi.mock('../../api/endpoints.js', () => ({
  authApi: { login: vi.fn(), logout: vi.fn(), me: vi.fn() },
  leadsApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  dashboardApi: { stats: vi.fn() },
  usersApi: { list: vi.fn(), assignable: vi.fn(), create: vi.fn(), setStatus: vi.fn() },
}));

const stats = {
  totals: { total: 13, new: 3, contacted: 2, qualified: 4, won: 3, lost: 1 },
  pipelineValue: 120000,
  wonValue: 45000,
  recentLeads: [
    { _id: 'l1', name: 'Priya Raman', company: 'Lumen Health', status: 'qualified', priority: 'high', createdAt: '2026-01-02' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  dashboardApi.stats.mockResolvedValue(stats);
});

describe('role-based access', () => {
  it('redirects Sales away from /users with a notice and hides the nav link', async () => {
    authApi.me.mockResolvedValue({ user: salesUser });
    renderApp('/users');

    expect(await screen.findByText('You do not have access to that page.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /welcome back, sam/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    expect(usersApi.list).not.toHaveBeenCalled();
  });

  it('lets Admin open the user management page', async () => {
    authApi.me.mockResolvedValue({ user: adminUser });
    usersApi.list.mockResolvedValue({ users: [{ ...adminUser, leadCount: 4 }, { ...salesUser, leadCount: 9 }] });
    renderApp('/users');

    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Deactivate Sam Sales' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deactivate avery admin/i })).not.toBeInTheDocument();
  });
});

describe('dashboard', () => {
  it('renders KPI cards and recent leads', async () => {
    authApi.me.mockResolvedValue({ user: adminUser });
    renderApp('/dashboard');

    expect(await screen.findByText('Priya Raman')).toBeInTheDocument();
    const total = screen.getByText('Total leads').closest('div');
    expect(within(total).getByText('13')).toBeInTheDocument();
    expect(screen.getByText('$120,000')).toBeInTheDocument();
  });

  it('shows an error state with retry when stats fail', async () => {
    authApi.me.mockResolvedValue({ user: adminUser });
    dashboardApi.stats.mockRejectedValue(new ApiRequestError(500, 'Database unavailable'));
    renderApp('/dashboard');
    expect(await screen.findByText('Could not load dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
