import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leadsApi, usersApi } from '../../api/endpoints.js';

function useInvalidateLeads() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useLeads(params) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useLead(id) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => (await leadsApi.get(id)).lead,
  });
}

export function useAssignableUsers(enabled = true) {
  return useQuery({
    queryKey: ['assignable-users'],
    queryFn: async () => (await usersApi.assignable()).users,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useCreateLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: async (body) => (await leadsApi.create(body)).lead,
    onSuccess: invalidate,
  });
}

export function useUpdateLead(id) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: async (body) => (await leadsApi.update(id, body)).lead,
    onSuccess: (lead) => {
      queryClient.setQueryData(['lead', id], lead);
      invalidate();
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (id) => leadsApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ['lead', id] });
      invalidate();
    },
  });
}
