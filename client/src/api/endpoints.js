import { request } from './client.js';

export const authApi = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
};

export const leadsApi = {
  list: (params) => request('/leads', { params }),
  get: (id) => request(`/leads/${id}`),
  create: (body) => request('/leads', { method: 'POST', body }),
  update: (id, body) => request(`/leads/${id}`, { method: 'PATCH', body }),
  remove: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
};

export const dashboardApi = {
  stats: () => request('/dashboard/stats'),
};

export const usersApi = {
  list: () => request('/users'),
  assignable: () => request('/users/assignable'),
  create: (body) => request('/users', { method: 'POST', body }),
  setStatus: (id, isActive) => request(`/users/${id}/status`, { method: 'PATCH', body: { isActive } }),
};
