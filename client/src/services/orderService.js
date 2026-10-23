import api from './api';

export const cartService = {
  get: () => api.get('/cart').then((r) => r.data),
  add: (payload) => api.post('/cart/items', payload).then((r) => r.data),
  update: (itemId, quantity) => api.patch(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`).then((r) => r.data),
  clear: () => api.delete('/cart').then((r) => r.data),
};

export const orderService = {
  place: (payload) => api.post('/orders', payload).then((r) => r.data),
  mine: (params) => api.get('/orders/mine', { params }).then((r) => r.data),
  farmerOrders: (params) => api.get('/orders/farmer', { params }).then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  updateStatus: (id, payload) => api.patch(`/orders/${id}/status`, payload).then((r) => r.data),
  cancel: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }).then((r) => r.data),
};

export const paymentService = {
  confirm: (payload) => api.post('/payments/confirm', payload).then((r) => r.data),
};

export const reviewService = {
  create: (payload) => api.post('/reviews', payload).then((r) => r.data),
  productReviews: (productId) => api.get(`/reviews/product/${productId}`).then((r) => r.data),
  eligible: () => api.get('/reviews/eligible').then((r) => r.data),
};
