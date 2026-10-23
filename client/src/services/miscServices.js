import api from './api';

export const priceInsightService = {
  compare: (params) => api.get('/price-insights/compare', { params }).then((r) => r.data),
  trend: (params) => api.get('/price-insights/trend', { params }).then((r) => r.data),
  external: (params) => api.get('/price-insights/external', { params }).then((r) => r.data),
  estimateRevenue: (params) => api.get('/price-insights/estimate-revenue', { params }).then((r) => r.data),
};

export const notificationService = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
};

export const reportService = {
  create: (payload) => api.post('/reports', payload).then((r) => r.data),
  list: (params) => api.get('/reports', { params }).then((r) => r.data),
  resolve: (id, payload) => api.patch(`/reports/${id}/resolve`, payload).then((r) => r.data),
};

export const verificationService = {
  list: (params) => api.get('/verification', { params }).then((r) => r.data),
  get: (id) => api.get(`/verification/${id}`).then((r) => r.data),
  decide: (id, payload) => api.patch(`/verification/${id}/decide`, payload).then((r) => r.data),
};

export const adminService = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  updateUserStatus: (id, accountStatus) => api.patch(`/admin/users/${id}/status`, { accountStatus }).then((r) => r.data),
  listings: (params) => api.get('/admin/listings', { params }).then((r) => r.data),
  moderateListing: (id, isActive) => api.patch(`/admin/listings/${id}/moderate`, { isActive }).then((r) => r.data),
  orders: (params) => api.get('/admin/orders', { params }).then((r) => r.data),
  auditLog: (params) => api.get('/admin/audit-log', { params }).then((r) => r.data),
};

export const analyticsService = {
  farmer: () => api.get('/analytics/farmer').then((r) => r.data),
  admin: () => api.get('/analytics/admin').then((r) => r.data),
};
