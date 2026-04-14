import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userServices, dateServices } from '../services/services';
import useAuthStore from '../store/authStore';

const Discover = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (!user) navigate('/login');
    else loadUsers();
  }, [user, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Load all users with their gender preference
      const response = await userServices.searchUsers('', '', 'all');
      setUsers(response.users || []);
      setMessage('');
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Error al cargar usuarios');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const currentUser = users[currentIndex];

  const handlePass = () => {
    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setMessage('No hay más usuarios');
      setMessageType('info');
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      // Auto-generate a date request with default values
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      const timeString = '18:00';

      await dateServices.createDateRequest(
        currentUser._id,
        dateString,
        timeString,
        'Library',
        '',
        `¡Hola ${currentUser.firstName}! Me gustaría conocerte 😊`
      );

      setMessage(`¡Le diste like a ${currentUser.firstName}! Se envió una solicitud de cita.`);
      setMessageType('success');

      // Move to next user
      if (currentIndex < users.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setMessage('¡Ya viste a todos! Espera más usuarios.');
        setMessageType('info');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error al enviar solicitud');
      setMessageType('error');
    }
  };

  const handleReload = () => {
    setCurrentIndex(0);
    loadUsers();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div 
              onClick={() => navigate('/dashboard')}
              className="flex items-center cursor-pointer"
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                ITESO-Lover
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-700 hover:text-pink-500 font-semibold"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-center font-semibold ${
            messageType === 'success' ? 'bg-green-100 text-green-800' :
            messageType === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* Progress */}
        <div className="mb-6">
          <div className="bg-white rounded-full h-2 overflow-hidden shadow">
            <div 
              className="bg-gradient-to-r from-pink-500 to-red-500 h-full transition-all duration-300"
              style={{ width: `${users.length > 0 ? ((currentIndex + 1) / users.length) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="text-center text-gray-600 text-sm mt-2">
            {loading ? 'Cargando...' : users.length > 0 ? `${currentIndex + 1} de ${users.length}` : 'No hay usuarios'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
              <p className="text-gray-600">Cargando perfiles...</p>
            </div>
          </div>
        ) : users.length > 0 && currentUser ? (
          <div className="flex flex-col items-center">
            {/* Card Container */}
            <div className="w-full max-w-sm">
              {/* User Card */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-transform duration-300 hover:shadow-3xl">
                {/* Image */}
                <div className="relative h-96 bg-gradient-to-br from-pink-200 to-red-200 flex items-center justify-center overflow-hidden">
                  {currentUser.profilePhoto ? (
                    <img 
                      src={currentUser.profilePhoto} 
                      alt={currentUser.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl">👤</div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-transparent to-transparent h-32"></div>
                </div>

                {/* Info Section */}
                <div className="p-6">
                  <div className="mb-4">
                    <h2 className="text-3xl font-bold text-gray-800">
                      {currentUser.firstName} {currentUser.lastName}
                    </h2>
                    {currentUser.gender && (
                      <p className="text-gray-600">
                        {currentUser.gender === 'male' ? '👨' : currentUser.gender === 'female' ? '👩' : '👤'}
                      </p>
                    )}
                  </div>

                  {currentUser.careerGoal && (
                    <p className="text-gray-700 font-semibold mb-4">
                      🎯 {currentUser.careerGoal}
                    </p>
                  )}

                  {currentUser.bio && (
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {currentUser.bio}
                    </p>
                  )}

                  {/* Interests */}
                  {currentUser.interests && currentUser.interests.length > 0 && (
                    <div className="mb-4">
                      <p className="text-gray-600 font-semibold text-sm mb-2">Intereses</p>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.interests.map(interest => (
                          <span 
                            key={interest}
                            className="bg-gradient-to-r from-pink-100 to-red-100 text-pink-800 px-4 py-1 rounded-full text-sm font-semibold"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  {currentUser.phoneNumber && (
                    <p className="text-gray-600 text-sm">
                      📱 {currentUser.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-6 mt-8 justify-center">
                {/* Pass Button */}
                <button
                  onClick={handlePass}
                  className="group w-16 h-16 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center text-2xl transition-all transform hover:scale-110 shadow-lg"
                  title="Pasar"
                >
                  ✕
                </button>

                {/* Like Button */}
                <button
                  onClick={handleLike}
                  className="group w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:shadow-2xl flex items-center justify-center text-2xl transition-all transform hover:scale-110 shadow-lg"
                  title="Like"
                >
                  ❤️
                </button>
              </div>

              {/* Stats */}
              <div className="mt-6 text-center text-gray-600 text-sm">
                <p>Presiona ❌ para pasar o ❤️ para dar like</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-center">
              <p className="text-4xl mb-4">🎉</p>
              <p className="text-xl text-gray-800 font-semibold mb-4">¡Sin más usuarios!</p>
              <p className="text-gray-600 mb-6">Vuelve más tarde para ver más perfiles</p>
              <button
                onClick={handleReload}
                className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold px-6 py-3 rounded-lg hover:opacity-90"
              >
                Recargar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
