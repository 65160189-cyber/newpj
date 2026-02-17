import api from './authService';

export const orderService = {
  getAllOrders: () => api.get('/orders'),
  createOrder: (orderData) => api.post('/orders', orderData),
  updateOrder: (id, updateData) => api.put(`/orders/${id}`, updateData),
  getOrderHistory: (id) => api.get(`/orders/${id}/history`),
};
