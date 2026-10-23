import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi, leadsApi, usersApi } from '../../api/endpoints.js';
import { ApiRequestError } from '../../api/client.js';
import { adminUser, renderApp, salesUser } from '../../test/utils.jsx';

vi.mock('../../api/endpoints.js', () => ({
  authApi: { login: vi.fn(), logout: vi.fn(), me: vi.fn() },
  leadsApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  dashboardApi: { stats: vi.fn() },
  usersApi: { list: vi.fn(), assignable: vi.fn(), create: vi.fn(), setStatus: vi.fn() },
}));

const emptyPage = { items: [], page: 1, limit: 10, total: 0, totalPages: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  authApi.me.mockResolvedValue({ user: salesUser });
  usersApi.assignable.mockResolvedValue({ users: [adminUser, salesUser] });
});

describe('leads list', () => {
  it('shows an empty state with a create action when there are no leads', async () => {
    leadsApi.list.mockResolvedValue(emptyPage);
    renderApp('/leads');
    expect(await screen.findByText('No leads yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create lead' })).toHaveAttribute('href', '/leads/new');
    expect(screen.getByText('0 leads found')).toBeInTheDocument();
  });

  it('shows a retryable error state and recovers', async () => {
    leadsApi.list.mockRejectedValueOnce(new ApiRequestError(500, 'Server exploded')).mockResolvedValueOnce({
      ...emptyPage,
      items: [{ _id: 'l1', name: 'Recovered Lead', status: 'new', priority: 'high', createdAt: new Date().toISOString() }],
      total: 1,
    });
    const user = userEvent.setup();
    renderApp('/leads');

    expect(await screen.findByText('Could not load leads')).toBeInTheDocument();
    expect(screen.getByText('Server exploded')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect((await screen.findAllByText('Recovered Lead')).length).toBeGreaterThan(0);
  });

  it('sends debounced search and filter params to the API', async () => {
    leadsApi.list.mockResolvedValue(emptyPage);
    const user = userEvent.setup();
    renderApp('/leads');
    await screen.findByText('No leads yet');

    await user.type(screen.getByRole('searchbox'), 'acme');
    await user.selectOptions(screen.getByLabelText('Status'), 'qualified');

    await waitFor(() =>
      expect(leadsApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'acme', status: 'qualified', page: 1, limit: 10 }),
      ),
    );
    expect(screen.getByText('No leads match your filters')).toBeInTheDocument();
  });

  it('hides the assignee filter for Sales users', async () => {
    leadsApi.list.mockResolvedValue(emptyPage);
    renderApp('/leads');
    await screen.findByText('No leads yet');
    expect(screen.queryByLabelText('Assignee')).not.toBeInTheDocument();
  });
});

describe('create lead', () => {
  it('validates required fields before submitting', async () => {
    const user = userEvent.setup();
    renderApp('/leads/new');
    await user.click(await screen.findByRole('button', { name: 'Create lead' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(leadsApi.create).not.toHaveBeenCalled();
  });

  it('submits a valid lead and navigates to its detail page', async () => {
    const created = {
      _id: 'new1',
      name: 'Jamie Prospect',
      company: 'Globex',
      status: 'new',
      priority: 'high',
      source: 'website',
      estimatedValue: 2500,
      assignedTo: { _id: salesUser._id, name: salesUser.name },
      createdBy: { _id: salesUser._id, name: salesUser.name },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    leadsApi.create.mockResolvedValue({ lead: created });
    leadsApi.get.mockResolvedValue({ lead: created });
    const user = userEvent.setup();
    renderApp('/leads/new');

    await user.type(await screen.findByLabelText(/^name/i), 'Jamie Prospect');
    await user.type(screen.getByLabelText('Company'), 'Globex');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
    await user.type(screen.getByLabelText(/estimated value/i), '2500');
    await user.click(screen.getByRole('button', { name: 'Create lead' }));

    await waitFor(() => expect(leadsApi.create).toHaveBeenCalledTimes(1));
    const payload = leadsApi.create.mock.calls[0][0];
    expect(payload).toMatchObject({ name: 'Jamie Prospect', company: 'Globex', priority: 'high', estimatedValue: 2500 });
    expect(payload).not.toHaveProperty('assignedTo');

    expect(await screen.findByRole('heading', { name: 'Jamie Prospect' })).toBeInTheDocument();
    expect(screen.getByText('Lead "Jamie Prospect" created')).toBeInTheDocument();
  });

  it('maps server field errors onto the form', async () => {
    leadsApi.create.mockRejectedValue(
      new ApiRequestError(400, 'Validation failed', [{ field: 'email', message: 'Invalid email' }]),
    );
    const user = userEvent.setup();
    renderApp('/leads/new');
    await user.type(await screen.findByLabelText(/^name/i), 'Valid Name');
    await user.click(screen.getByRole('button', { name: 'Create lead' }));
    expect(await screen.findByText('Invalid email')).toBeInTheDocument();
  });
});
