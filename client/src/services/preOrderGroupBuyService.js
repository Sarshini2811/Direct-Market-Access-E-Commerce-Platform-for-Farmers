import api from './api';

export const preOrderService = {
  list: (params) => api.get('/preorders', { params }).then((r) => r.data),
  get: (id) => api.get(`/preorders/${id}`).then((r) => r.data),
  mine: () => api.get('/preorders/mine').then((r) => r.data),
  create: (formData) =>
    api.post('/preorders', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id, payload) => api.patch(`/preorders/${id}`, payload).then((r) => r.data),
  reserve: (id, quantity) => api.post(`/preorders/${id}/reserve`, { quantity }).then((r) => r.data),
  cancelReservation: (id, reservationId) =>
    api.patch(`/preorders/${id}/reservations/${reservationId}/cancel`).then((r) => r.data),
  confirmHarvest: (id, payload) => api.post(`/preorders/${id}/confirm-harvest`, payload).then((r) => r.data),
};

export const groupBuyService = {
  list: (params) => api.get('/groupbuys', { params }).then((r) => r.data),
  get: (id) => api.get(`/groupbuys/${id}`).then((r) => r.data),
  create: (payload) => api.post('/groupbuys', payload).then((r) => r.data),
  join: (id, quantity) => api.post(`/groupbuys/${id}/join`, { quantity }).then((r) => r.data),
  finalize: (id) => api.post(`/groupbuys/${id}/finalize`).then((r) => r.data),
};
