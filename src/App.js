import React, { useState } from 'react';
import { ShoppingCart, Coffee, Utensils, CreditCard, Star, Download, LogOut, Trash2 } from 'lucide-react';

// Datos de ejemplo
const desayunos = [
  { id: 1, nombre: 'Chilaquiles', precio: 45, descripcion: 'Con salsa verde o roja' },
  { id: 2, nombre: 'Molletes', precio: 35, descripcion: 'Con frijoles y queso' },
  { id: 3, nombre: 'Quesadillas', precio: 40, descripcion: 'De queso o guisado' },
  { id: 4, nombre: 'Sincronizadas', precio: 38, descripcion: 'Jamón y queso' },
];

const comidas = [
  { id: 5, nombre: 'Tacos de Guisado', precio: 50, descripcion: '3 tacos con guisado del día' },
  { id: 6, nombre: 'Torta', precio: 45, descripcion: 'Variedad de ingredientes' },
  { id: 7, nombre: 'Hamburguesa', precio: 55, descripcion: 'Con papas' },
  { id: 8, nombre: 'Ensalada', precio: 48, descripcion: 'Fresca y saludable' },
];

const bebidas = [
  { id: 9, nombre: 'Café', precio: 20, descripcion: 'Americano o con leche' },
  { id: 10, nombre: 'Agua Fresca', precio: 15, descripcion: 'Del día' },
  { id: 11, nombre: 'Refresco', precio: 18, descripcion: 'Varios sabores' },
  { id: 12, nombre: 'Jugo Natural', precio: 25, descripcion: 'Naranja o zanahoria' },
];

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderNumber, setOrderNumber] = useState(null);

  // Componente de Login
  const LoginView = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({
      matricula: '', nombre: '', apellido: '', correo: '', password: ''
    });

    const handleSubmit = () => {
      if (isRegistering) {
        if (formData.matricula && formData.nombre && formData.apellido && formData.correo && formData.password) {
          setUser({ ...formData });
          alert('¡Registro exitoso! Ahora puedes iniciar sesión');
          setIsRegistering(false);
        } else {
          alert('Por favor completa todos los campos');
        }
      } else {
        if (formData.matricula && formData.password) {
          setUser({ matricula: formData.matricula, nombre: 'Usuario' });
          setCurrentView('menu');
        } else {
          alert('Por favor completa todos los campos');
        }
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Matrícula</label>
              <input type="text" value={formData.matricula}
                onChange={(e) => setFormData({...formData, matricula: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="S20012345" />
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
                    placeholder="estudiante@uv.mx" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <input type="password" value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>

            <button onClick={handleSubmit}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition duration-200">
              {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
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

  // Componente de Menú
  const MenuView = () => {
    const [activeCategory, setActiveCategory] = useState('desayunos');

    const addToCart = (item) => {
      const existingItem = cart.find(c => c.id === item.id);
      if (existingItem) {
        setCart(cart.map(c => c.id === item.id ? {...c, cantidad: c.cantidad + 1} : c));
      } else {
        setCart([...cart, {...item, cantidad: 1}]);
      }
    };

    const items = activeCategory === 'desayunos' ? desayunos : 
                  activeCategory === 'comidas' ? comidas : bebidas;

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
                <button onClick={() => { setUser(null); setCart([]); setCurrentView('login'); }}
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
              Bienvenido, {user?.nombre || 'Estudiante'}
            </h2>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button onClick={() => setActiveCategory('desayunos')}
                className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                  activeCategory === 'desayunos' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}>
                <Utensils className="w-5 h-5 inline mr-2" />
                Desayunos
              </button>
              <button onClick={() => setActiveCategory('comidas')}
                className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                  activeCategory === 'comidas' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}>
                <Utensils className="w-5 h-5 inline mr-2" />
                Comidas
              </button>
              <button onClick={() => setActiveCategory('bebidas')}
                className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                  activeCategory === 'bebidas' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}>
                <Coffee className="w-5 h-5 inline mr-2" />
                Bebidas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition duration-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800">{item.nombre}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.descripcion}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xl font-bold text-orange-500">${item.precio}</p>
                  </div>
                </div>
                <button onClick={() => addToCart(item)}
                  className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition duration-200">
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Componente de Carrito
  const CartView = () => {
    const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    const updateQuantity = (id, delta) => {
      setCart(cart.map(item => {
        if (item.id === id) {
          const newQuantity = item.cantidad + delta;
          return newQuantity > 0 ? {...item, cantidad: newQuantity} : item;
        }
        return item;
      }).filter(item => item.cantidad > 0));
    };

    const removeItem = (id) => {
      setCart(cart.filter(item => item.id !== id));
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
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-4 border-b last:border-b-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
                      <p className="text-sm text-gray-600">${item.precio} c/u</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg transition">-</button>
                        <span className="font-semibold w-8 text-center">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg transition">+</button>
                      </div>
                      <p className="font-bold text-orange-500 w-20 text-right">${item.precio * item.cantidad}</p>
                      <button onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-orange-500">${total}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setCurrentView('payment')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl text-lg font-semibold transition">
                Proceder al pago
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Componente de Pago
  const PaymentView = () => {
    const [paymentData, setPaymentData] = useState({
      cardNumber: '', cardName: '', expiry: '', cvv: ''
    });
    const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    const handlePayment = () => {
      if (paymentData.cardNumber && paymentData.cardName && paymentData.expiry && paymentData.cvv) {
        const orderNum = Math.floor(100000 + Math.random() * 900000);
        setOrderNumber(orderNum);
        setCurrentView('confirmation');
      } else {
        alert('Por favor completa todos los campos de pago');
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
              Información de Pago
            </h2>

            <div className="space-y-4">
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

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold">Total a pagar:</span>
                  <span className="text-2xl font-bold text-orange-500">${total}</span>
                </div>

                <button onClick={handlePayment}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl text-lg font-semibold transition">
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Confirmación
  const ConfirmationView = () => {
    const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">¡Pago Exitoso!</h1>
            <p className="text-gray-600 mb-8">Tu pedido ha sido procesado correctamente</p>

            <div className="bg-orange-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Número de Orden</p>
              <p className="text-4xl font-bold text-orange-500 mb-4">{orderNumber}</p>
              <div className="w-32 h-32 bg-white mx-auto rounded-lg flex items-center justify-center border-4 border-gray-200">
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">CÓDIGO QR</div>
                  <div className="grid grid-cols-8 gap-1">
                    {[...Array(64)].map((_, i) => (
                      <div key={i} className={`w-1 h-1 ${Math.random() > 0.5 ? 'bg-gray-800' : 'bg-white'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-bold text-gray-800 mb-4">Resumen del Pedido</h3>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between py-2 border-b last:border-b-0">
                  <span className="text-gray-700">{item.nombre} x{item.cantidad}</span>
                  <span className="font-semibold">${item.precio * item.cantidad}</span>
                </div>
              ))}
              <div className="flex justify-between pt-4 mt-4 border-t font-bold text-lg">
                <span>Total</span>
                <span className="text-orange-500">${total}</span>
              </div>
            </div>

            <button onClick={() => alert('En una implementación real, aquí se generaría un PDF con el resumen de tu orden.')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition mb-4 flex items-center justify-center">
              <Download className="w-5 h-5 mr-2" />
              Descargar Comprobante PDF
            </button>

            <button onClick={() => setCurrentView('review')}
              className="w-full bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 py-3 rounded-lg font-semibold transition">
              Dejar una Reseña
            </button>

            <button onClick={() => { setCart([]); setOrderNumber(null); setCurrentView('menu'); }}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 py-2 transition">
              Volver al menú
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Reseña
  const ReviewView = () => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');

    const handleSubmit = () => {
      if (rating > 0 && review.trim()) {
        alert('¡Gracias por tu reseña! Tu opinión nos ayuda a mejorar.');
        setCart([]);
        setOrderNumber(null);
        setCurrentView('menu');
      } else {
        alert('Por favor selecciona una calificación y escribe tu reseña');
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

              <button onClick={handleSubmit} disabled={rating === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl text-lg font-semibold transition">
                Enviar Reseña
              </button>

              <button onClick={() => { setCart([]); setOrderNumber(null); setCurrentView('menu'); }}
                className="w-full text-gray-600 hover:text-gray-800 py-2 transition">
                Omitir y volver al menú
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado condicional de vistas
  return (
    <div>
      {currentView === 'login' && <LoginView />}
      {currentView === 'menu' && <MenuView />}
      {currentView === 'cart' && <CartView />}
      {currentView === 'payment' && <PaymentView />}
      {currentView === 'confirmation' && <ConfirmationView />}
      {currentView === 'review' && <ReviewView />}
    </div>
  );
}

export default App;