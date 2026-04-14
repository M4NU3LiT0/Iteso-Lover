import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                ITESO-Lover
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user.firstName} {user.lastName}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Quick Action Cards */}
          <div 
            onClick={() => navigate('/discover')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-pink-50"
          >
            <h3 className="text-lg font-semibold text-gray-800">🔍 Buscar</h3>
            <p className="text-gray-600 mt-2">Descubre estudiantes con tus intereses</p>
          </div>

          <div 
            onClick={() => navigate('/requests')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-pink-50"
          >
            <h3 className="text-lg font-semibold text-gray-800">📬 Solicitudes</h3>
            <p className="text-gray-600 mt-2">Revisa tus solicitudes pendientes</p>
          </div>

          <div 
            onClick={() => navigate('/scheduled')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-pink-50"
          >
            <h3 className="text-lg font-semibold text-gray-800">📅 Mis Citas</h3>
            <p className="text-gray-600 mt-2">Visualiza tus citas programadas</p>
          </div>

          <div 
            onClick={() => navigate('/profile')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-pink-50"
          >
            <h3 className="text-lg font-semibold text-gray-800">👤 Perfil</h3>
            <p className="text-gray-600 mt-2">Edita tu información personal</p>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">
            ¡Bienvenido {user.firstName}!
          </h2>
          <p className="text-lg mb-4">
            Completa tu perfil y comienza a conocer estudiantes con intereses similares a los tuyos.
          </p>
          <button 
            onClick={() => navigate('/profile')}
            className="bg-white text-pink-500 font-bold px-6 py-2 rounded hover:opacity-90"
          >
            Completar Perfil
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
