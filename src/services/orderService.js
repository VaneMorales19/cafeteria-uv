import config from '../config';

const API_URL = `${config.API_URL}/orders`;

export const orderService = {
  // Obtener mis pedidos
  getMyOrders: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener pedidos');
    }
    
    return response.json();
  },

  // Crear pedido
  createOrder: async (orderData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }
};
