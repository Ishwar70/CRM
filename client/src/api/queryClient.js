import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

function handleUnauthorized(error) {
  if (error?.status === 401) queryClient.setQueryData(['me'], null);
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.queryKey[0] !== 'me') handleUnauthorized(error);
    },
  }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => error?.status === 0 && count < 1,
    },
  },
});
