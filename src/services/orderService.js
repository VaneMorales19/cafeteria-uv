import api from './api';

export const orderService = {
  // Crear pedido
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Obtener pedidos del usuario
  getMyOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  // Obtener un pedido específico
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  }
};