import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/ui/Toast.jsx';
import { AppRoutes } from '../routes/AppRoutes.jsx';
import { ApiRequestError } from '../api/client.js';

export const adminUser = { _id: 'a1', name: 'Avery Admin', email: 'admin@demo-crm.example', role: 'admin', isActive: true };
export const salesUser = { _id: 's1', name: 'Sam Sales', email: 'sales@demo-crm.example', role: 'sales', isActive: true };

export const unauthorized = () => new ApiRequestError(401, 'Authentication required');

export function renderApp(route = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            <AppRoutes />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>,
    ),
  };
}
