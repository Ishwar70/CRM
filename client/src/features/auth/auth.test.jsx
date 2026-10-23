import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi, dashboardApi } from '../../api/endpoints.js';
import { ApiRequestError } from '../../api/client.js';
import { adminUser, renderApp, unauthorized } from '../../test/utils.jsx';

vi.mock('../../api/endpoints.js', () => ({
  authApi: { login: vi.fn(), logout: vi.fn(), me: vi.fn() },
  leadsApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  dashboardApi: { stats: vi.fn() },
  usersApi: { list: vi.fn(), assignable: vi.fn(), create: vi.fn(), setStatus: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  dashboardApi.stats.mockResolvedValue({
    totals: { total: 0, new: 0, contacted: 0, qualified: 0, won: 0, lost: 0 },
    pipelineValue: 0,
    recentLeads: [],
  });
});

describe('protected routes', () => {
  it('redirects unauthenticated users to the login page', async () => {
    authApi.me.mockRejectedValue(unauthorized());
    renderApp('/leads');
    expect(await screen.findByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
  });

  it('shows a retryable error when the API is unreachable', async () => {
    authApi.me.mockRejectedValue(new ApiRequestError(0, 'Cannot reach the server.'));
    renderApp('/dashboard');
    expect(await screen.findByText(/unable to reach the crm/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

describe('login page', () => {
  beforeEach(() => {
    authApi.me.mockRejectedValue(unauthorized());
  });

  it('shows validation messages without calling the API', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await user.click(await screen.findByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('shows the server error for invalid credentials', async () => {
    authApi.login.mockRejectedValue(new ApiRequestError(401, 'Invalid email or password'));
    const user = userEvent.setup();
    renderApp('/login');
    await user.type(await screen.findByLabelText(/email/i), 'admin@demo-crm.example');
    await user.type(screen.getByLabelText(/password/i), 'nope');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('signs in and lands on the dashboard with role-aware navigation', async () => {
    authApi.login.mockResolvedValue({ user: adminUser });
    const user = userEvent.setup();
    renderApp('/login');
    await user.click(await screen.findByRole('button', { name: /admin@demo-crm\.example/i }));
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(authApi.login.mock.calls[0][0]).toEqual({ email: 'admin@demo-crm.example', password: 'DemoPass123!' });
    expect(await screen.findAllByRole('link', { name: 'Users' })).not.toHaveLength(0);
  });
});
