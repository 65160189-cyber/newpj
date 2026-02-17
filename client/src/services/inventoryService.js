import api from './authService';

export const inventoryService = {
  getAllItems: () => api.get('/inventory'),
  createItem: (itemData) => api.post('/inventory', itemData),
  updateItem: (id, itemData) => api.put(`/inventory/${id}`, itemData),
  deleteItem: (id) => api.delete(`/inventory/${id}`),
  getLowStockItems: () => api.get('/inventory/low-stock'),
};
