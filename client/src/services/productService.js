import api from './api';

export const productService = {
  list: (params) => api.get('/products', { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  mine: (params) => api.get('/products/mine', { params }).then((r) => r.data),
  categories: () => api.get('/products/meta/categories').then((r) => r.data),
  create: (formData) =>
    api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id, formData) =>
    api.patch(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  updateStock: (id, payload) => api.patch(`/products/${id}/stock`, payload).then((r) => r.data),
  removeImage: (id, imageUrl) => api.delete(`/products/${id}/image`, { data: { imageUrl } }).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};

export const farmerService = {
  myProfile: () => api.get('/farmers/me').then((r) => r.data),
  publicProfile: (farmerId) => api.get(`/farmers/${farmerId}`).then((r) => r.data),
  updateProfile: (payload) => api.patch('/farmers/me', payload).then((r) => r.data),
  submitVerification: (payload) => api.post('/farmers/me/verification', payload).then((r) => r.data),
};
