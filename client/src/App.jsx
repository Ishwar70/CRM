import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from './api/queryClient.js';
import { ToastProvider } from './components/ui/Toast.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
