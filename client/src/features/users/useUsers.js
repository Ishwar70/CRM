import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/endpoints.js';

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: async () => (await usersApi.list()).users });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['assignable-users'] });
  };
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: async (body) => (await usersApi.create(body)).user, onSuccess: invalidate });
}

export function useSetUserStatus() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async ({ id, isActive }) => (await usersApi.setStatus(id, isActive)).user,
    onSuccess: invalidate,
  });
}
