import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/endpoints.js';

export function useDashboardStats() {
  return useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.stats });
}
