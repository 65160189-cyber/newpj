import api from './authService';

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentOrders: () => api.get('/dashboard/recent-orders'),
  getLowStockItems: () => api.get('/dashboard/low-stock-items'),
  getOrderStatusChart: () => api.get('/dashboard/order-status-chart'),
};
