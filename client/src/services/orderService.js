import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const orderService = {
  getAllOrders: () => axios.get(`${API_URL}/orders`),
  getOrderById: (id) => axios.get(`${API_URL}/orders/${id}`),
  createOrder: (orderData) => axios.post(`${API_URL}/orders`, orderData),
  updateOrder: (id, orderData) => axios.put(`${API_URL}/orders/${id}`, orderData),
  deleteOrder: (id) => axios.delete(`${API_URL}/orders/${id}`),
  getOrderHistory: (id) => axios.get(`${API_URL}/orders/${id}/history`),
  importOrders: (formData) => {
    return axios.post(`${API_URL}/orders/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

export default orderService;
