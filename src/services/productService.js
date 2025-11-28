import api from './api';

export const productService = {
  // Obtener todos los productos
  getAllProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  // Obtener productos por categoría
  getByCategory: async (categoria) => {
    const response = await api.get(`/products?categoria=${categoria}`);
    return response.data;
  },

  // Obtener un producto por ID
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  }
};