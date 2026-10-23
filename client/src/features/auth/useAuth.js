import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/endpoints.js';

function removeNonSessionQueries(queryClient) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'me' });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const { user } = await authApi.me();
        return user;
      } catch (error) {
        if (error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(['me'], user);
      removeNonSessionQueries(queryClient);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Flip the session first so route guards unmount protected pages before their data disappears.
      queryClient.setQueryData(['me'], null);
      removeNonSessionQueries(queryClient);
    },
  });
}
