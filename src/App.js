import React, { useState, useEffect } from 'react';
import { ShoppingCart, Coffee, Utensils, CreditCard, Star, Download, LogOut, Trash2, Plus, Minus, X, User, Bell, CheckCircle, Search } from 'lucide-react';
import { authService } from './services/authService';
import { productService } from './services/productService';
import { orderService } from './services/orderService';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import io from 'socket.io-client';
/* eslint-disable react-hooks/exhaustive-deps */

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderNumber, setOrderNumber] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  // Socket guardado en el useEffect pero no necesitamos el state

  // Conectar Socket.IO cuando el usuario inicie sesión
  useEffect(() => {
    if (user && user._id) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket', 'polling']
      });

      // Registrar usuario
      newSocket.on('connect', () => {
        console.log('Conectado a Socket.IO');
        newSocket.emit('register-user', user._id);
        
        // Si es admin, unirse a sala de admin
        if (user.rol === 'admin') {
          newSocket.emit('join-admin');
        }
      });

      // Escuchar cambios de estado de pedidos
      newSocket.on('order-status-changed', (data) => {
        console.log('Notificación recibida:', data);
        
        // Mostrar notificación
        setNotifications(prev => [...prev, {
          id: Date.now(),
          message: data.message,
          orderId: data.orderId,
          numeroOrden: data.numeroOrden
        }]);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== Date.now()));
        }, 5000);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);
  // Componente de notificaciones 
  const NotificationToast = () => {
    if (notifications.length === 0) return null;

    return (
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 max-w-md animate-slide-in">
            <div className="flex items-start">
              <Bell className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">
                  Pedido #{notification.numeroOrden}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotifications(prev => 
                  prev.filter(n => n.id !== notification.id)
                )}
                className="ml-3 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setCurrentView('menu');
      loadProducts();
    }
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const LoginView = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [userType, setUserType] = useState('estudiante'); // 'estudiante' o 'docente'
  const [formData, setFormData] = useState({
    identificador: '', // Matrícula o número de empleado
    nombre: '', 
    apellido: '', 
    correo: '', 
    password: ''
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (isRegistering) {
        // Registro
        const endpoint = userType === 'estudiante' 
          ? 'http://localhost:5000/api/auth/register/estudiante'
          : 'http://localhost:5000/api/auth/register/docente';

        const body = userType === 'estudiante'
          ? {
              matricula: formData.identificador,
              nombre: formData.nombre,
              apellido: formData.apellido,
              correo: formData.correo,
              password: formData.password
            }
          : {
              numeroEmpleado: formData.identificador,
              nombre: formData.nombre,
              apellido: formData.apellido,
              correo: formData.correo,
              password: formData.password
            };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error en el registro');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.usuario));
        setUser(data.usuario);
        alert('¡Registro exitoso!');
        await loadProducts();
        setCurrentView('menu');
      } else {
        // Login
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identificador: formData.identificador,
            password: formData.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error en el login');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.usuario));
        setUser(data.usuario);
        await loadProducts();
        setCurrentView('menu');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Coffee className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Cafetería UV</h1>
          <p className="text-gray-600">Sistema de pedidos en línea</p>
        </div>

        {/* Pestañas de tipo de usuario (solo en registro) */}
        {isRegistering && (
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setUserType('estudiante')}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                userType === 'estudiante'
                  ? 'bg-white text-orange-500 shadow'
                  : 'text-gray-600'
              }`}>
              Estudiante
            </button>
            <button
              onClick={() => setUserType('docente')}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                userType === 'docente'
                  ? 'bg-white text-orange-500 shadow'
                  : 'text-gray-600'
              }`}>
              Docente
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isRegistering 
                ? (userType === 'estudiante' ? 'Matrícula' : 'Número de Empleado')
                : 'Matrícula / Número de Empleado'}
            </label>
            <input 
              type="text" 
              value={formData.identificador}
              onChange={(e) => setFormData({...formData, identificador: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={isRegistering 
                ? (userType === 'estudiante' ? 'S20012345' : '123456')
                : 'S20012345 o 123456'} 
            />
          </div>

          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input type="text" value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                <input type="text" value={formData.apellido}
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo Institucional</label>
                <input type="email" value={formData.correo}
                  onChange={(e) => setFormData({...formData, correo: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="usuario@uv.mx" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input type="password" value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200">
            {loading ? 'Cargando...' : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => setIsRegistering(!isRegistering)}
            className="text-orange-500 hover:text-orange-600 text-sm font-medium">
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
};

  const ProductOptionsModal = ({ product, onClose, onAdd }) => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [comments, setComments] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleOptionChange = (optionName, value, precioExtra) => {
    setSelectedOptions({
      ...selectedOptions,
      [optionName]: { valor: value, precioExtra }
    });
  };

  const calculateTotal = () => {
    let total = product.precio * quantity;
    Object.values(selectedOptions).forEach(opt => {
      total += (opt.precioExtra || 0) * quantity;
    });
    return total;
  };

  const handleAdd = () => {
    const requiredOptions = product.opciones?.filter(opt => opt.requerido) || [];
    const missingOptions = requiredOptions.filter(
      opt => !selectedOptions[opt.nombre]
    );

    if (missingOptions.length > 0) {
      alert(`Por favor selecciona: ${missingOptions.map(o => o.nombre).join(', ')}`);
      return;
    }

    const productWithOptions = {
      ...product,
      cantidad: quantity,
      opcionesSeleccionadas: Object.entries(selectedOptions).map(([nombre, data]) => ({
        nombre,
        valor: data.valor,
        precioExtra: data.precioExtra || 0
      })),
      comentarios: comments,
      precioTotal: calculateTotal()
    };

    console.log('Producto con opciones:', productWithOptions);

    onAdd(productWithOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{product.nombre}</h2>
              <p className="text-gray-600">{product.descripcion}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {product.imagen && (
            <img src={product.imagen} alt={product.nombre} 
              className="w-full h-48 object-cover rounded-lg mb-4" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          {product.opciones && product.opciones.length > 0 && (
            <div className="space-y-4 mb-4">
              {product.opciones.map((option, idx) => (
                <div key={idx} className="border-b pb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {option.nombre} {option.requerido && <span className="text-red-500">*</span>}
                  </h3>
                  <div className="space-y-2">
                    {option.opciones.map((opt, optIdx) => (
                      <label key={optIdx} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={option.nombre}
                          onChange={() => handleOptionChange(option.nombre, opt.valor, opt.precioExtra)}
                          className="text-orange-500 focus:ring-orange-500"
                        />
                        <span className="flex-1">{opt.valor}</span>
                        {opt.precioExtra > 0 && (
                          <span className="text-green-600">+${opt.precioExtra}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios especiales (opcional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Ej: Sin cebolla, extra salsa..."
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="font-medium">Cantidad:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg transition flex items-center justify-center">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-semibold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg transition flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total:</p>
              <p className="text-2xl font-bold text-orange-500">${calculateTotal()}</p>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition">
            Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
};
 const MenuView = () => {
  const [activeCategory, setActiveCategory] = useState('todos');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // NUEVOS ESTADOS PARA BÚSQUEDA Y FILTROS
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const addToCart = (productWithOptions) => {
    const existingItemIndex = cart.findIndex(item => 
      item._id === productWithOptions._id &&
      JSON.stringify(item.opcionesSeleccionadas) === JSON.stringify(productWithOptions.opcionesSeleccionadas) &&
      item.comentarios === productWithOptions.comentarios
    );

    if (existingItemIndex > -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].cantidad += productWithOptions.cantidad;
      setCart(newCart);
    } else {
      setCart([...cart, productWithOptions]);
    }
  };

  // FUNCIÓN PARA APLICAR FILTROS
  const getFilteredProducts = () => {
    let filtered = [...products];

    // Filtro por categoría
    if (activeCategory !== 'todos') {
      filtered = filtered.filter(p => p.categoria === activeCategory);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por rango de precio
    if (priceFilter.min) {
      filtered = filtered.filter(p => p.precio >= parseFloat(priceFilter.min));
    }
    if (priceFilter.max) {
      filtered = filtered.filter(p => p.precio <= parseFloat(priceFilter.max));
    }

    // Ordenamiento
    switch(sortBy) {
      case 'precio-asc':
        filtered.sort((a, b) => a.precio - b.precio);
        break;
      case 'precio-desc':
        filtered.sort((a, b) => b.precio - a.precio);
        break;
      case 'nombre-asc':
        filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'nombre-desc':
        filtered.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      default:
        // Mantener orden original
        break;
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Coffee className="w-8 h-8 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-800">Cafetería UV</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => setCurrentView('cart')} className="relative p-2 hover:bg-gray-100 rounded-lg transition">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.cantidad, 0)}
                  </span>
                )}
              </button>
              
              <button onClick={() => setCurrentView('profile')} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <User className="w-6 h-6 text-gray-700" />
              </button>
              
              <button onClick={() => setCurrentView('orders')} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Bell className="w-6 h-6 text-gray-700" />
              </button>
              
              <button onClick={() => {
                authService.logout();
                setUser(null);
                setCart([]);
                setCurrentView('login');
              }}
                className="p-2 hover:bg-gray-100 rounded-lg transition">
                <LogOut className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Bienvenido, {user?.nombre || 'Usuario'}
          </h2>

          {/* BARRA DE BÚSQUEDA */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  showFilters ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                {showFilters ? '✕ Cerrar Filtros' : 'Filtros'}
              </button>
            </div>

            {/* PANEL DE FILTROS EXPANDIBLE */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t space-y-4">
                {/* Filtro de precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango de Precio
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="number"
                      placeholder="Precio mínimo"
                      value={priceFilter.min}
                      onChange={(e) => setPriceFilter({...priceFilter, min: e.target.value})}
                      className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      placeholder="Precio máximo"
                      value={priceFilter.max}
                      onChange={(e) => setPriceFilter({...priceFilter, max: e.target.value})}
                      className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Ordenamiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">Sin ordenar</option>
                    <option value="nombre-asc">Nombre: A-Z</option>
                    <option value="nombre-desc">Nombre: Z-A</option>
                    <option value="precio-asc">Precio: Menor a Mayor</option>
                    <option value="precio-desc">Precio: Mayor a Menor</option>
                  </select>
                </div>

                {/* Botón limpiar filtros */}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPriceFilter({ min: '', max: '' });
                    setSortBy('');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition">
                  Limpiar todos los filtros
                </button>
              </div>
            )}
          </div>

          {/* CATEGORÍAS */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button 
              onClick={() => setActiveCategory('todos')}
              className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                activeCategory === 'todos' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}>
              Todos
            </button>
            {['desayunos', 'comidas', 'bebidas'].map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                  activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}>
                {cat === 'desayunos' && <Utensils className="w-5 h-5 inline mr-2" />}
                {cat === 'comidas' && <Utensils className="w-5 h-5 inline mr-2" />}
                {cat === 'bebidas' && <Coffee className="w-5 h-5 inline mr-2" />}
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/*CONTADOR DE RESULTADOS */}
          {(searchTerm || priceFilter.min || priceFilter.max) && (
            <div className="mt-4 text-sm text-gray-600">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-600">Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <p className="text-gray-600 text-lg mb-2">No se encontraron productos</p>
            <p className="text-gray-500 text-sm">Intenta ajustar tus filtros de búsqueda</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setPriceFilter({ min: '', max: '' });
                setSortBy('');
                setActiveCategory('todos');
              }}
              className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition">
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-200">
                {product.imagen && (
                  <img src={product.imagen} alt={product.nombre} 
                    className="w-full h-48 object-cover" 
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=Sin+Imagen'; }}
                  />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800">{product.nombre}</h3>
                      <p className="text-sm text-gray-600 mt-1">{product.descripcion}</p>
                      
                      {/* INDICADORES DE STOCK */}
                      {product.stock === 0 ? (
                        <p className="text-xs text-red-500 mt-1 font-semibold">Agotado</p>
                      ) : product.stock < 10 ? (
                        <p className="text-xs text-orange-500 mt-1">¡Solo quedan {product.stock}!</p>
                      ) : (
                        <p className="text-xs text-green-500 mt-1">Disponible</p>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-xl font-bold text-orange-500">${product.precio}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedProduct(product)}
                    disabled={product.stock === 0}
                    className="w-full mt-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 rounded-lg transition duration-200">
                    {product.stock === 0 ? 'Agotado' : 'Agregar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductOptionsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={addToCart}
        />
      )}
    </div>
  );
};

  const CartView = () => {
    const [orderNotes, setOrderNotes] = useState('');

    const calculateItemTotal = (item) => {
      let total = item.precio * item.cantidad;
      if (item.opcionesSeleccionadas) {
        item.opcionesSeleccionadas.forEach(opt => {
          total += (opt.precioExtra || 0) * item.cantidad;
        });
      }
      return total;
    };

    const total = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);

    const updateQuantity = (index, delta) => {
      const newCart = [...cart];
      newCart[index].cantidad += delta;
      if (newCart[index].cantidad <= 0) {
        newCart.splice(index, 1);
      }
      setCart(newCart);
    };

    const removeItem = (index) => {
      const newCart = cart.filter((_, i) => i !== index);
      setCart(newCart);
    };

    const proceedToPayment = () => {
      if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
      }
      setCurrentView('payment');
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <button onClick={() => setCurrentView('menu')} className="text-orange-500 hover:text-orange-600 font-medium">
                ← Volver al menú
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Mi Pedido</h1>
              <div className="w-24"></div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-24 h-24 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-600">Tu carrito está vacío</h2>
              <button onClick={() => setCurrentView('menu')}
                className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg transition">
                Explorar menú
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Artículos</h2>
                {cart.map((item, index) => (
  <div key={index} className="py-4 border-b last:border-b-0">
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
        <p className="text-sm text-gray-600">${item.precio} c/u</p>
        
        {/*  DEBE MOSTRAR LAS OPCIONES AQUÍ */}
        {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {item.opcionesSeleccionadas.map((opt, idx) => (
              <p key={idx}>
                • {opt.nombre}: {opt.valor}
                {opt.precioExtra > 0 && ` (+$${opt.precioExtra})`}
              </p>
            ))}
          </div>
        )}
                        
                        {item.comentarios && (
                          <p className="mt-2 text-sm text-gray-600 italic">
                            Nota: {item.comentarios}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => updateQuantity(index, -1)}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg transition flex items-center justify-center">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-semibold w-8 text-center">{item.cantidad}</span>
                          <button onClick={() => updateQuantity(index, 1)}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg transition flex items-center justify-center">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-bold text-orange-500 w-20 text-right">
                          ${calculateItemTotal(item)}
                        </p>
                        <button onClick={() => removeItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-6 pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instrucciones especiales para tu pedido (opcional)
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: Sin hielo en las bebidas, entrega en salón 302..."
                  />
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-orange-500">${total}</span>
                  </div>
                </div>
              </div>
              <button onClick={proceedToPayment}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl text-lg font-semibold transition">
                Proceder al pago
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const PaymentView = () => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '', cardName: '', expiry: '', cvv: ''
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [useNewCard, setUseNewCard] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/payment-methods', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setPaymentMethods(data);
      
      // Seleccionar la tarjeta por defecto automáticamente
      const defaultCard = data.find(card => card.isDefault);
      if (defaultCard && data.length > 0) {
        setSelectedCard(defaultCard._id);
      }
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
    }
  };

  const calculateItemTotal = (item) => {
    let total = item.precio * item.cantidad;
    if (item.opcionesSeleccionadas) {
      item.opcionesSeleccionadas.forEach(opt => {
        total += (opt.precioExtra || 0) * item.cantidad;
      });
    }
    return total;
  };

  const total = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);

const handlePayment = async () => {
  // Validaciones
  if (!useNewCard && !selectedCard) {
    alert('Por favor selecciona una tarjeta o ingresa datos de una nueva');
    return;
  }

  if (useNewCard && (!paymentData.cardNumber || !paymentData.cardName || !paymentData.expiry || !paymentData.cvv)) {
    alert('Por favor completa todos los campos de pago');
    return;
  }

  try {
    setLoading(true);

    console.log('Carrito antes de enviar:', cart);

    // Guardar método de pago
    if (useNewCard) {
      setSelectedPaymentMethod({
        tipo: 'tarjeta',
        numero: paymentData.cardNumber
      });
    } else {
      const selectedMethod = paymentMethods.find(m => m._id === selectedCard);
      setSelectedPaymentMethod({
        tipo: 'tarjeta',
        numero: selectedMethod?.cardNumber || ''
      });
    }

    const orderData = {
      items: cart.map(item => {
        console.log('Procesando item para pedido:', item);
        
        return {
          producto: item._id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad,
          opcionesSeleccionadas: item.opcionesSeleccionadas || [],
          comentarios: item.comentarios || ''
        };
      }),
      total,
      metodoPago: {
        cardNumber: useNewCard ? paymentData.cardNumber : 
          paymentMethods.find(m => m._id === selectedCard)?.cardNumber || ''
      },
      notasAdicionales: ''
    };

    console.log('orderData completo:', orderData);
    console.log('Items del pedido:', orderData.items);

    const order = await orderService.createOrder(orderData);
    
    console.log('Pedido creado:', order);
    
    setCurrentOrder(order);
    setOrderNumber(order.numeroOrden);
    setCurrentView('confirmation');
  } catch (error) {
    console.error('Error al crear pedido:', error);
    alert(error.response?.data?.message || 'Error al procesar el pago');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => setCurrentView('cart')} className="text-orange-500 hover:text-orange-600 font-medium">
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Pago</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <CreditCard className="w-6 h-6 mr-2 text-orange-500" />
            Método de Pago
          </h2>

          {/* Tarjetas Guardadas */}
          {paymentMethods.length > 0 && !useNewCard && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Tus tarjetas guardadas:</h3>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method._id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedCard === method._id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={selectedCard === method._id}
                      onChange={() => setSelectedCard(method._id)}
                      className="mr-3"
                    />
                    <CreditCard className="w-6 h-6 text-gray-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium">**** **** **** {method.cardNumber}</p>
                      <p className="text-sm text-gray-600">{method.cardName}</p>
                      <p className="text-xs text-gray-500">Vence: {method.expiry}</p>
                    </div>
                    {method.isDefault && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Predeterminada
                      </span>
                    )}
                  </label>
                ))}
              </div>

              <button
                onClick={() => setUseNewCard(true)}
                className="mt-4 w-full text-orange-500 hover:text-orange-600 font-medium">
                + Usar una tarjeta diferente
              </button>
            </div>
          )}

          {/* Nueva Tarjeta */}
          {(paymentMethods.length === 0 || useNewCard) && (
            <div className="space-y-4">
              {useNewCard && paymentMethods.length > 0 && (
                <button
                  onClick={() => {
                    setUseNewCard(false);
                    setPaymentData({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
                  }}
                  className="text-orange-500 hover:text-orange-600 font-medium mb-4">
                  ← Usar tarjeta guardada
                </button>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Tarjeta</label>
                <input type="text" maxLength={16} value={paymentData.cardNumber}
                  onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="1234 5678 9012 3456" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre en la Tarjeta</label>
                <input type="text" value={paymentData.cardName}
                  onChange={(e) => setPaymentData({...paymentData, cardName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="JUAN PÉREZ" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Expiración</label>
                  <input type="text" maxLength={5} value={paymentData.expiry}
                    onChange={(e) => setPaymentData({...paymentData, expiry: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="MM/AA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input type="text" maxLength={3} value={paymentData.cvv}
                    onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="123" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold">Total a pagar:</span>
              <span className="text-2xl font-bold text-orange-500">${total}</span>
            </div>

            <button onClick={handlePayment} disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white py-4 rounded-xl text-lg font-semibold transition">
              {loading ? 'Procesando...' : 'Confirmar Pago'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  };
 // Componente de Confirmación
  const ConfirmationView = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Función para calcular el total de cada item
  const calculateItemTotal = (item) => {
    return item.precio * item.cantidad;
  };

  // Calcular el total del pedido
  const total = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  // Generar código QR
  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = JSON.stringify({
          numeroOrden: orderNumber,
          total: total,
          fecha: new Date().toISOString(),
          items: cart.length
        });
        
        const qrUrl = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error generando QR:', error);
      }
    };

    generateQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Cafetería UV', 105, 25, { align: 'center' });
    
    // Número de orden
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(`Orden #${orderNumber}`, 20, 60);
    
    // Fecha
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleString('es-MX')}`, 20, 70);
    
    // Tabla de productos
    let yPosition = 85;
    doc.setFontSize(12);
    doc.text('Productos:', 20, yPosition);
    yPosition += 10;
    
    cart.forEach(item => {
      doc.setFontSize(10);
      doc.text(`${item.cantidad}x ${item.nombre}`, 25, yPosition);
      
      if (item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0) {
        yPosition += 5;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        item.opcionesSeleccionadas.forEach((opt) => {
          doc.text(`  • ${opt.nombre}: ${opt.valor}`, 30, yPosition);
          yPosition += 4;
       });
       doc.setTextColor(0, 0, 0);
      } 
      
      if (item.comentarios) {
        yPosition += 5;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`  Nota: ${item.comentarios}`, 30, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 4;
      }
      
      doc.setFontSize(10);
      doc.text(`$${calculateItemTotal(item).toFixed(2)}`, 180, yPosition, { align: 'right' });
      yPosition += 10;
    });
    
    // Total
    yPosition += 5;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', 20, yPosition);
    doc.text(`$${total.toFixed(2)}`, 180, yPosition, { align: 'right' });
    
    // Método de pago
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Verificar si hay método de pago seleccionado
    const paymentText = selectedPaymentMethod 
      ? (selectedPaymentMethod.tipo === 'tarjeta' 
        ? `Tarjeta **** ${selectedPaymentMethod.numero.slice(-4)}`
        : 'Efectivo')
      : 'Efectivo';
    
    doc.text(`Método de pago: ${paymentText}`, 20, yPosition);
    
    // QR Code
    if (qrCodeUrl) {
      doc.addImage(qrCodeUrl, 'PNG', 75, yPosition + 10, 60, 60);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Gracias por su compra - Cafetería UV', 105, 280, { align: 'center' });
    
    doc.save(`orden-${orderNumber}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header de éxito */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">¡Pedido Confirmado!</h2>
            <p className="text-green-100">Tu orden ha sido recibida exitosamente</p>
          </div>

          {/* Información del pedido */}
          <div className="p-8">
            {/* Número de orden */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Número de Orden</p>
              <p className="text-4xl font-bold text-gray-800">#{orderNumber}</p>
            </div>

            {/* Código QR */}
            {qrCodeUrl && (
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 mb-3">Muestra este código al recoger tu pedido</p>
                <div className="inline-block bg-white p-4 rounded-xl shadow-md">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}

            {/* Detalles del pedido */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Pedido</h3>
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-start py-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {item.cantidad}x {item.nombre}
                      </p>
                      {item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          {item.opcionesSeleccionadas.map((opt, i) => (
                            <span key={i} className="mr-2">• {opt.nombre}: {opt.valor}</span>
                          ))}
                       </div>
                      )}
                      {item.comentarios && (
                        <p className="text-sm text-gray-500 mt-1">Nota: {item.comentarios}</p>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800 ml-4">
                      ${calculateItemTotal(item).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-green-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Método de pago */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Método de pago</p>
                <p className="font-semibold text-gray-800">
                  {selectedPaymentMethod 
                    ? (selectedPaymentMethod.tipo === 'tarjeta' 
                      ? `Tarjeta terminada en ${selectedPaymentMethod.numero.slice(-4)}`
                      : 'Efectivo')
                    : 'Efectivo'}
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-8 space-y-3">
              <button
                onClick={downloadPDF}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Descargar Comprobante PDF
              </button>
              
              <button
                onClick={() => {
                  setCart([]);
                  setCurrentView('menu');
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition">
                Volver al Menú
              </button>
            </div>
            <button
              onClick={() => setCurrentView('review')}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2">
              <Star className="w-5 h-5" />
               Dejar una Reseña
            </button>

            {/* Información adicional */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Recoger en:</strong> Cafetería UV - Edificio Principal
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                <strong> Tiempo estimado:</strong> 10-20 minutos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  };

  const ReviewView = () => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (rating === 0 || !review.trim()) {
        alert('Por favor selecciona una calificación y escribe tu reseña');
        return;
      }

      try {
        setSubmitting(true);
        
        const response = await fetch('http://localhost:5000/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            pedidoId: currentOrder?._id,
            calificacion: rating,
            comentario: review
          })
        });

        if (response.ok) {
          alert('¡Gracias por tu reseña! Tu opinión nos ayuda a mejorar.');
          setCart([]);
          setOrderNumber(null);
          setCurrentOrder(null);
          setCurrentView('menu');
        } else {
          throw new Error('Error al enviar reseña');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al enviar la reseña');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Déjanos tu Reseña</h1>
            <p className="text-gray-600 mb-8 text-center">Tu opinión nos ayuda a mejorar</p>

            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-4 text-center">
                  ¿Cómo calificarías tu experiencia?
                </label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)}
                      className="focus:outline-none transition transform hover:scale-110">
                      <Star className={`w-12 h-12 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Cuéntanos sobre tu experiencia
                </label>
                <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="¿Cómo fue tu pedido? ¿Qué te pareció la atención?" />
              </div>

              <button onClick={handleSubmit} disabled={rating === 0 || submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl text-lg font-semibold transition">
                {submitting ? 'Enviando...' : 'Enviar Reseña'}
              </button>

              <button onClick={() => { setCart([]); setOrderNumber(null); setCurrentOrder(null); setCurrentView('menu'); }}
                className="w-full text-gray-600 hover:text-gray-800 py-2 transition">
                Omitir y volver al menú
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [filterStatus, setFilterStatus] = useState('todos');
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('nombre-asc');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: 'desayunos',
    stock: '',
    imagen: '',
    opciones: []
  });
  const [editingOptions, setEditingOptions] = useState([]);
  const [currentOption, setCurrentOption] = useState({
    nombre: '',
    requerido: false,
    opciones: [{ valor: '', precioExtra: 0 }]
  });

 useEffect(() => {
  if (user?.rol === 'admin') {
    loadAdminData();
    loadReviews();
    const interval = setInterval(() => {
      loadAdminData();
      loadReviews();
    }, 30000);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => clearInterval(interval);
  }
 
}, [user, filterStatus]);

 const loadAdminData = async () => {
  try {
    setLoading(true);
    
    // Cargar estadísticas
    const statsRes = await fetch('http://localhost:5000/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const statsData = await statsRes.json();
    console.log('Stats:', statsData);
    setStats(statsData);

    // Cargar pedidos
    let url = 'http://localhost:5000/api/admin/orders';
    if (filterStatus !== 'todos') {
      url += `?estado=${filterStatus}`;
    }
    
    console.log('Fetching orders from:', url);
    
    const ordersRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('Response status:', ordersRes.status);
    
    const ordersData = await ordersRes.json();
    console.log('Orders data:', ordersData);
    console.log('Is array?', Array.isArray(ordersData));
    
    if (Array.isArray(ordersData)) {
      setOrders(ordersData);
    } else {
      console.error('La respuesta no es un array:', ordersData);
      setOrders([]);
    }
    
  } catch (error) {
    console.error(' Error cargando datos:', error);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};

  const loadReviews = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reviews', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error cargando reseñas:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log('Actualizando pedido:', orderId, 'a estado:', newStatus);
      
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ estado: newStatus })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Pedido actualizado:', data);
        alert(`Pedido actualizado a: ${newStatus}`);
        loadAdminData(); // Recargar pedidos
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        alert(errorData.message || 'Error al actualizar pedido');
      }
    } catch (error) {
      console.error('Error actualizando pedido:', error);
      alert('Error al actualizar pedido: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'preparando': 'bg-blue-100 text-blue-800',
      'listo': 'bg-green-100 text-green-800',
      'entregado': 'bg-gray-100 text-gray-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

 const getStatusIcon = (status) => {
  switch(status) {
    case 'pendiente': return ;
    case 'preparando': return ;
    case 'listo': return ;
    case 'entregado': return ;
    case 'cancelado': return;
    default: return;
  }
};

const filteredOrders = React.useMemo(() => {
  if (!Array.isArray(orders)) {
    console.error('orders no es un array:', orders);
    return [];
  }
  
  if (filterStatus === 'todos') {
    return orders;
  }
  
  return orders.filter(order => order.estado === filterStatus);
}, [orders, filterStatus]);
  const loadProducts = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/admin/products?';
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter !== 'todos') params.append('categoria', categoryFilter);
      if (priceFilter.min) params.append('precioMin', priceFilter.min);
      if (priceFilter.max) params.append('precioMax', priceFilter.max);
      if (sortBy) params.append('ordenar', sortBy);
      
      const response = await fetch(url + params.toString(), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setProducts(data.productos || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
  try {
    if (!productForm.nombre || !productForm.precio || !productForm.categoria) {
      alert('Nombre, precio y categoría son requeridos');
      return;
    }

    // INCLUIR LAS OPCIONES
    const productData = {
      ...productForm,
      opciones: editingOptions // Agregar las opciones dinámicas
    };

    const response = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(productData)
    });

    const data = await response.json();

    if (response.ok) {
      alert('Producto creado exitosamente');
      setShowAddProduct(false);
      setProductForm({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: 'desayunos',
        stock: '',
        imagen: '',
        opciones: []
      });
      setEditingOptions([]); // LIMPIAR OPCIONES
      setCurrentOption({
        nombre: '',
        requerido: false,
        opciones: [{ valor: '', precioExtra: 0 }]
      });
      loadProducts();
    } else {
      alert(data.message || 'Error al crear producto');
    }
  } catch (error) {
    console.error('Error creando producto:', error);
    alert('Error al crear producto');
  }
};

  // ==================== FUNCIONES PARA GESTIONAR OPCIONES ====================

const addOptionToProduct = () => {
  if (!currentOption.nombre) {
    alert('El nombre de la opción es requerido');
    return;
  }

  if (currentOption.opciones.some(opt => !opt.valor)) {
    alert('Todas las opciones deben tener un valor');
    return;
  }

  setEditingOptions([...editingOptions, currentOption]);
  setCurrentOption({
    nombre: '',
    requerido: false,
    opciones: [{ valor: '', precioExtra: 0 }]
  });
};

const addSubOption = () => {
  setCurrentOption({
    ...currentOption,
    opciones: [...currentOption.opciones, { valor: '', precioExtra: 0 }]
  });
};

const updateSubOption = (index, field, value) => {
  const newOpciones = [...currentOption.opciones];
  newOpciones[index][field] = value;
  setCurrentOption({ ...currentOption, opciones: newOpciones });
};

const removeSubOption = (index) => {
  if (currentOption.opciones.length === 1) {
    alert('Debe haber al menos una opción');
    return;
  }
  const newOpciones = currentOption.opciones.filter((_, i) => i !== index);
  setCurrentOption({ ...currentOption, opciones: newOpciones });
};

const removeOption = (index) => {
  setEditingOptions(editingOptions.filter((_, i) => i !== index));
};

  const handleUpdateProduct = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(productForm)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Producto actualizado exitosamente');
        setEditingProduct(null);
        setProductForm({
          nombre: '',
          descripcion: '',
          precio: '',
          categoria: 'desayunos',
          stock: '',
          imagen: '',
          opciones: []
        });
        loadProducts();
      } else {
        alert(data.message || 'Error al actualizar producto');
      }
    } catch (error) {
      console.error('Error actualizando producto:', error);
      alert('Error al actualizar producto');
    }
  };

  const handleUpdateStock = async (productId, operacion, cantidad) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ operacion, cantidad })
      });

      if (response.ok) {
        loadProducts();
      } else {
        alert('Error al actualizar stock');
      }
    } catch (error) {
      console.error('Error actualizando stock:', error);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${productName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Producto eliminado exitosamente');
        loadProducts();
      } else {
        alert('Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error al eliminar producto');
    }
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      categoria: product.categoria,
      stock: product.stock,
      imagen: product.imagen,
      opciones: product.opciones || []
    });
  };

  // Cargar productos cuando se muestra el inventario
  useEffect(() => {
    if (showInventory) {
      loadProducts();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInventory, searchTerm, categoryFilter, priceFilter, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Coffee className="w-8 h-8 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Admin: {user?.nombre}</span>
              <button onClick={() => {
                authService.logout();
                setUser(null);
                setCurrentView('login');
              }}
                className="p-2 hover:bg-gray-100 rounded-lg transition">
                <LogOut className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pedidos Pendientes</p>
                <p className="text-3xl font-bold text-orange-500">{stats.pendingOrders || 0}</p>
              </div>
              <div className="text-4xl"></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pedidos</p>
                <p className="text-3xl font-bold text-blue-500">{stats.totalOrders || 0}</p>
              </div>
              <div className="text-4xl"></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas del Día</p>
                <p className="text-3xl font-bold text-green-500">${stats.todaySales || 0}</p>
              </div>
              <div className="text-4xl"></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Productos Bajos</p>
                <p className="text-3xl font-bold text-red-500">{stats.lowStock || 0}</p>
              </div>
              <div className="text-4xl">
              </div>
            </div>
          </div>
        </div>
         {/* Botones de navegación */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setShowReviews(false);
              setShowInventory(false);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              !showReviews && !showInventory
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}>
            Pedidos
          </button>
          
          <button
            onClick={() => {
              setShowReviews(true);
              setShowInventory(false);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              showReviews && !showInventory
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}>
            Reseñas ({reviews.length})
          </button>

          <button
            onClick={() => {
              setShowReviews(false);
              setShowInventory(true);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              showInventory
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}>
            Inventario
          </button>
        </div>

        {/* Vista de Inventario */}
        {showInventory && (
          <div className="space-y-6">
            {/* Barra de búsqueda y filtros */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Búsqueda */}
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Categoría */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="todos">Todas las categorías</option>
                  <option value="desayunos">Desayunos</option>
                  <option value="comidas">Comidas</option>
                  <option value="bebidas">Bebidas</option>
                </select>

                {/* Ordenar */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="nombre-asc">Nombre A-Z</option>
                  <option value="nombre-desc">Nombre Z-A</option>
                  <option value="precio-asc">Precio: Menor a Mayor</option>
                  <option value="precio-desc">Precio: Mayor a Menor</option>
                  <option value="stock-asc">Stock: Menor a Mayor</option>
                  <option value="stock-desc">Stock: Mayor a Menor</option>
                </select>
              </div>

              {/* Filtro de precio */}
              <div className="flex gap-4 items-center">
                <span className="text-sm font-medium text-gray-700">Precio:</span>
                <input
                  type="number"
                  placeholder="Mín"
                  value={priceFilter.min}
                  onChange={(e) => setPriceFilter({...priceFilter, min: e.target.value})}
                  className="w-24 px-3 py-2 border rounded-lg"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={priceFilter.max}
                  onChange={(e) => setPriceFilter({...priceFilter, max: e.target.value})}
                  className="w-24 px-3 py-2 border rounded-lg"
                />
                <button
                  onClick={() => setPriceFilter({ min: '', max: '' })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                  Limpiar filtros
                </button>
              </div>
            </div>

            {/* Botón agregar producto */}
            <button
              onClick={() => setShowAddProduct(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Agregar Nuevo Producto
            </button>
            {/* Lista de productos */}
            {loading ? (
              <div className="text-center py-16">
                <p className="text-gray-600">Cargando productos...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <p className="text-gray-600">No se encontraron productos</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imagen</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            {product.imagen ? (
                              <img 
                                src={product.imagen} 
                                alt={product.nombre}
                                className="w-16 h-16 object-cover rounded-lg"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Sin imagen</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-800">{product.nombre}</p>
                            <p className="text-sm text-gray-500">{product.descripcion}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {product.categoria}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-green-600">
                            ${product.precio}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateStock(product._id, 'reducir', 1)}
                                className="w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded flex items-center justify-center">
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className={`font-semibold ${
                                product.stock === 0 ? 'text-red-500' : 
                                product.stock < 10 ? 'text-orange-500' : 
                                'text-gray-800'
                              }`}>
                                {product.stock}
                              </span>
                              <button
                                onClick={() => handleUpdateStock(product._id, 'agregar', 1)}
                                className="w-6 h-6 bg-green-100 hover:bg-green-200 text-green-600 rounded flex items-center justify-center">
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {product.stock === 0 ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                                Agotado
                              </span>
                            ) : product.stock < 10 ? (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                                Stock bajo
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                                Disponible
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditProduct(product)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Editar">
                                E
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product._id, product.nombre)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Eliminar">
                                D
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            
            {/* Modal: Agregar Producto */}
{showAddProduct && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Agregar Nuevo Producto</h2>
          <button 
            onClick={() => {
              setShowAddProduct(false);
              setProductForm({
                nombre: '', descripcion: '', precio: '', categoria: 'desayunos',
                stock: '', imagen: '', opciones: []
              });
              setEditingOptions([]);
            }}
            className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Campos básicos existentes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto *</label>
            <input
              type="text"
              value={productForm.nombre}
              onChange={(e) => setProductForm({...productForm, nombre: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Chilaquiles Verdes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <textarea
              value={productForm.descripcion}
              onChange={(e) => setProductForm({...productForm, descripcion: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del producto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Precio *</label>
              <input
                type="number"
                step="0.01"
                value={productForm.precio}
                onChange={(e) => setProductForm({...productForm, precio: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Inicial</label>
              <input
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
            <select
              value={productForm.categoria}
              onChange={(e) => setProductForm({...productForm, categoria: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="desayunos">Desayunos</option>
              <option value="comidas">Comidas</option>
              <option value="bebidas">Bebidas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL de Imagen</label>
            <input
              type="text"
              value={productForm.imagen}
              onChange={(e) => setProductForm({...productForm, imagen: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            {productForm.imagen && (
              <img 
                src={productForm.imagen} 
                alt="Preview"
                className="mt-2 w-32 h-32 object-cover rounded-lg"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </div>
          {/* ==================== SECCIÓN DE OPCIONES ==================== */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Opciones del Producto (Opcional)
            </h3>

            {/* Opciones ya agregadas */}
            {editingOptions.length > 0 && (
              <div className="mb-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Opciones configuradas:</p>
                {editingOptions.map((opt, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {opt.nombre} 
                          {opt.requerido && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <div className="mt-2 space-y-1">
                          {opt.opciones.map((subOpt, subIdx) => (
                            <p key={subIdx} className="text-sm text-gray-600">
                              • {subOpt.valor} 
                              {subOpt.precioExtra > 0 && (
                                <span className="text-green-600"> (+${subOpt.precioExtra})</span>
                              )}
                            </p>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => removeOption(idx)}
                        className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario para nueva opción */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la opción
                  </label>
                  <input
                    type="text"
                    value={currentOption.nombre}
                    onChange={(e) => setCurrentOption({...currentOption, nombre: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Ej: Tipo, Tamaño, Salsa"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer mt-6">
                    <input
                      type="checkbox"
                      checked={currentOption.requerido}
                      onChange={(e) => setCurrentOption({...currentOption, requerido: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      ¿Es requerida?
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valores de la opción
                </label>
                {currentOption.opciones.map((subOpt, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={subOpt.valor}
                      onChange={(e) => updateSubOption(idx, 'valor', e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg"
                      placeholder="Ej: Pequeño, Grande"
                    />
                    <input
                      type="number"
                      value={subOpt.precioExtra}
                      onChange={(e) => updateSubOption(idx, 'precioExtra', parseFloat(e.target.value) || 0)}
                      className="w-32 px-4 py-2 border rounded-lg"
                      placeholder="Precio extra"
                    />
                    {currentOption.opciones.length > 1 && (
                      <button
                        onClick={() => removeSubOption(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Minus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={addSubOption}
                  className="mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar valor
                </button>
              </div>

              <button
                onClick={addOptionToProduct}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold">
                ✓ Guardar esta opción
              </button>
            </div>
          </div>

          {/* Botón crear producto */}
          <button
            onClick={handleCreateProduct}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition">
            Crear Producto
          </button>
        </div>
      </div>
    </div>
  </div>
)}

          

            {/* Modal: Editar Producto */}
            {editingProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">Editar Producto</h2>
                      <button 
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({
                            nombre: '',
                            descripcion: '',
                            precio: '',
                            categoria: 'desayunos',
                            stock: '',
                            imagen: '',
                            opciones: []
                          });
                        }}
                        className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre del Producto *
                        </label>
                        <input
                          type="text"
                          value={productForm.nombre}
                          onChange={(e) => setProductForm({...productForm, nombre: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción
                        </label>
                        <textarea
                          value={productForm.descripcion}
                          onChange={(e) => setProductForm({...productForm, descripcion: e.target.value})}
                          rows={3}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={productForm.precio}
                            onChange={(e) => setProductForm({...productForm, precio: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock
                          </label>
                          <input
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoría *
                        </label>
                        <select
                          value={productForm.categoria}
                          onChange={(e) => setProductForm({...productForm, categoria: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                          <option value="desayunos">Desayunos</option>
                          <option value="comidas">Comidas</option>
                          <option value="bebidas">Bebidas</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL de Imagen
                        </label>
                        <input
                          type="text"
                          value={productForm.imagen}
                          onChange={(e) => setProductForm({...productForm, imagen: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        {productForm.imagen && (
                          <img 
                            src={productForm.imagen} 
                            alt="Preview"
                            className="mt-2 w-32 h-32 object-cover rounded-lg"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                      </div>

                      <button
                        onClick={handleUpdateProduct}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition">
                        Actualizar Producto
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de Reseñas */}
        {showReviews && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Reseñas de Clientes</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No hay reseñas todavía</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {review.usuario?.nombre} {review.usuario?.apellido}
                        </p>
                        <p className="text-sm text-gray-600">
                          Pedido #{review.pedido?.numeroOrden}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.calificacion ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comentario}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lista de Pedidos */}
              {!showReviews && !showInventory && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex items-center space-x-2 overflow-x-auto">
                {['todos', 'pendiente', 'preparando', 'listo', 'entregado'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                      filterStatus === status
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Pedidos */}
            {loading ? (
              <div className="text-center py-16">
                <p className="text-gray-600">Cargando pedidos...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-md">
                <p className="text-gray-600">No hay pedidos para mostrar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{getStatusIcon(order.estado)}</span>
                          <h3 className="text-xl font-bold text-gray-800">
                            Orden #{order.numeroOrden}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.estado)}`}>
                            {order.estado}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Cliente: {order.usuario?.nombre} {order.usuario?.apellido}
                        </p>
                        <p className="text-sm text-gray-600">
                          Matrícula: {order.usuario?.matricula}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-500">${order.total}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Productos:</h4>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="mb-3 pb-3 border-b last:border-b-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                {item.cantidad}x {item.nombre}
                              </p>
                              
                              {((item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0) || 
                                (item.opciones && item.opciones.length > 0)) && (
                                <div className="mt-2 ml-4 space-y-1">
                                  <p className="text-xs font-semibold text-gray-700">Especificaciones:</p>
                                  {(item.opcionesSeleccionadas || item.opciones || []).map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-start text-sm text-gray-600">
                                      <span className="mr-2">•</span>
                                      <div className="flex-1">
                                        <span className="font-medium">{opt.nombre}:</span>{' '}
                                        <span className="text-gray-800">{opt.valor}</span>
                                        {opt.precioExtra > 0 && (
                                          <span className="text-green-600 ml-1">(+${opt.precioExtra})</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {item.comentarios && (
                                <div className="mt-2 ml-4">
                                  <p className="text-xs font-semibold text-gray-700">Nota especial:</p>
                                  <p className="text-sm text-gray-600 italic">{item.comentarios}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="ml-4 text-right">
                              <p className="font-semibold text-gray-800">
                                ${(item.precio * item.cantidad).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.notasAdicionales && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Instrucciones:</strong> {order.notasAdicionales}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {order.estado === 'pendiente' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'preparando')}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition">
                          Iniciar Preparación
                        </button>
                      )}
                      {order.estado === 'preparando' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'listo')}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition">
                          Marcar como Listo
                        </button>
                      )}
                      {order.estado === 'listo' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'entregado')}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition">
                          Marcar como Entregado
                        </button>
                      )}
                      {(order.estado === 'pendiente' || order.estado === 'preparando') && (
                        <button
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de cancelar este pedido?')) {
                              updateOrderStatus(order._id, 'cancelado');
                            }
                          }}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition">
                          Cancelar Pedido
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
const OrderHistoryView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'preparando': 'bg-blue-100 text-blue-800',
      'listo': 'bg-green-100 text-green-800',
      'entregado': 'bg-gray-100 text-gray-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => setCurrentView('menu')} className="text-orange-500 hover:text-orange-600 font-medium">
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Mis Pedidos</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-600">Cargando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <p className="text-gray-600 mb-4">No tienes pedidos todavía</p>
            <button
              onClick={() => setCurrentView('menu')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition">
              Hacer un pedido
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        Orden #{order.numeroOrden}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.estado)}`}>
                        {order.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString('es-MX')}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-orange-500">${order.total}</p>
                </div>

                {/* Items */}
                <div className="border-t pt-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-2">
                      <span className="text-gray-700">{item.nombre} x{item.cantidad}</span>
                      <span className="font-medium">${item.precio * item.cantidad}</span>
                    </div>
                  ))}
                </div>

                {/* Estado actual con énfasis */}
                {order.estado === 'listo' && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold text-center">
                      ¡Tu pedido está listo! Recógelo en la cafetería
                    </p>
                  </div>
                )}

                {order.estado === 'preparando' && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-semibold text-center">
                      Tu pedido se está preparando...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  };
const ProfileView = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '', cardName: '', expiry: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    correo: user?.correo || '',
    telefono: user?.telefono || ''
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const updateProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser({ ...user, ...updatedUser });
        
        const storedUser = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...updatedUser }));
        
        alert('Perfil actualizado exitosamente');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      alert('Error al actualizar perfil');
    }
  };

  const loadPaymentMethods = async () => {
  try {
    console.log('Cargando métodos de pago...');
    console.log('Token:', localStorage.getItem('token') ? 'Existe' : 'No existe');
    
    const response = await fetch('http://localhost:5000/api/users/payment-methods', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Métodos de pago recibidos:', data);
    
    setPaymentMethods(data);
  } catch (error) {
    console.error('Error cargando métodos de pago:', error);
  }
};

const addPaymentMethod = async () => {
  if (!newCard.cardNumber || !newCard.cardName || !newCard.expiry) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    console.log('Intentando agregar tarjeta:', newCard);
    
    const response = await fetch('http://localhost:5000/api/users/payment-methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newCard)
    });

    console.log(' Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      alert('Tarjeta agregada exitosamente');
      setNewCard({ cardNumber: '', cardName: '', expiry: '' });
      setShowAddCard(false);
      loadPaymentMethods();
    } else {
      alert(data.message || 'Error al agregar tarjeta');
    }
  } catch (error) {
    console.error('Error agregando tarjeta:', error);
    alert('Error al agregar tarjeta');
  }
};

  const deletePaymentMethod = async (id) => {
    if (!window.confirm('¿Eliminar esta tarjeta?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/users/payment-methods/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Tarjeta eliminada');
        loadPaymentMethods();
      }
    } catch (error) {
      console.error('Error eliminando tarjeta:', error);
    }
  };

  return (        
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => setCurrentView('menu')} className="text-orange-500 hover:text-orange-600 font-medium">
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Información Personal */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Información Personal</h2>
            <button
              onClick={() => {
                if (isEditing) {
                  setEditData({
                    nombre: user?.nombre || '',
                    apellido: user?.apellido || '',
                    correo: user?.correo || '',
                    telefono: user?.telefono || ''
                  });
                }
                setIsEditing(!isEditing);
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition">
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={editData.nombre}
                  onChange={(e) => setEditData({...editData, nombre: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                <input
                  type="text"
                  value={editData.apellido}
                  onChange={(e) => setEditData({...editData, apellido: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo</label>
                <input
                  type="email"
                  value={editData.correo}
                  onChange={(e) => setEditData({...editData, correo: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={editData.telefono}
                  onChange={(e) => setEditData({...editData, telefono: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="(opcional)"
                />
              </div>
              <button
                onClick={updateProfile}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg">
                Guardar Cambios
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p><strong>Nombre:</strong> {user?.nombre} {user?.apellido}</p>
              {user?.rol === 'docente' ? (
                <p><strong>Número de Empleado:</strong> {user?.numeroEmpleado}</p>
              ) : (
                <p><strong>Matrícula:</strong> {user?.matricula}</p>
              )}
              <p><strong>Correo:</strong> {user?.correo}</p>
              <p><strong>Teléfono:</strong> {user?.telefono || 'No especificado'}</p>
            </div>
          )}
        </div>

        {/* Métodos de Pago */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <CreditCard className="w-6 h-6 mr-2 text-orange-500" />
            Métodos de Pago
          </h2>

          {!showAddCard && (
            <button
              onClick={() => setShowAddCard(true)}
              className="w-full mb-4 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Agregar Nueva Tarjeta
            </button>
          )}

          {showAddCard && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3">Nueva Tarjeta</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Número de tarjeta"
                  maxLength={16}
                  value={newCard.cardNumber}
                  onChange={(e) => setNewCard({...newCard, cardNumber: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Nombre en la tarjeta"
                  value={newCard.cardName}
                  onChange={(e) => setNewCard({...newCard, cardName: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="MM/AA"
                  maxLength={5}
                  value={newCard.expiry}
                  onChange={(e) => setNewCard({...newCard, expiry: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addPaymentMethod}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg">
                    Guardar Tarjeta
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCard(false);
                      setNewCard({ cardNumber: '', cardName: '', expiry: '' });
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {paymentMethods.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No tienes tarjetas guardadas</p>
            ) : (
              paymentMethods.map((method) => (
                <div key={method._id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-6 h-6 text-gray-600" />
                    <div>
                      <p className="font-medium">**** **** **** {method.cardNumber}</p>
                      <p className="text-sm text-gray-600">{method.cardName}</p>
                      <p className="text-xs text-gray-500">Vence: {method.expiry}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deletePaymentMethod(method._id)}
                    className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
  
return (
    <div>
       <NotificationToast />
      {currentView === 'login' && <LoginView />}
      {currentView === 'menu' && (user?.rol === 'admin' ? <AdminDashboard /> : <MenuView />)}
      {currentView === 'profile' && <ProfileView />}
      {currentView === 'orders' && <OrderHistoryView />}
      {currentView === 'cart' && <CartView />}
      {currentView === 'payment' && <PaymentView />}
      {currentView === 'confirmation' && <ConfirmationView />}
      {currentView === 'review' && <ReviewView />}
      
    </div>
  );
}

export default App;