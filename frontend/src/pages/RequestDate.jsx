import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dateServices, userServices } from '../services/services';
import useAuthStore from '../store/authStore';

const RequestDate = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const user = useAuthStore((state) => state.user);
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    preferredDate: '',
    preferredTime: '',
    location: 'Library',
    customLocation: '',
    message: ''
  });

  const locations = ['Library', 'Cafeteria', 'Sports Complex', 'Plaza Mayor', 'Other'];

  useEffect(() => {
    if (!user) navigate('/login');
    else fetchUser();
  }, [user, userId, navigate]);

  const fetchUser = async () => {
    try {
      const response = await userServices.getUserById(userId);
      setTargetUser(response.user);
    } catch (error) {
      setError('Usuario no encontrado');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await dateServices.createDateRequest(
        userId,
        formData.preferredDate,
        formData.preferredTime,
        formData.location,
        formData.customLocation,
        formData.message
      );

      if (response.success) {
        alert('Solicitud de cita enviada');
        navigate('/search');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (!targetUser) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
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
                onClick={() => navigate('/discover')}
                className="text-gray-700 hover:text-pink-500"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center mb-6">
            {targetUser.profilePhoto ? (
              <img src={targetUser.profilePhoto} alt={targetUser.firstName} className="w-20 h-20 rounded-full mr-6" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-red-500 mr-6"></div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{targetUser.firstName} {targetUser.lastName}</h2>
              {targetUser.careerGoal && <p className="text-gray-600">{targetUser.careerGoal}</p>}
            </div>
          </div>

          {targetUser.bio && (
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <p className="text-gray-700">{targetUser.bio}</p>
            </div>
          )}

          {targetUser.interests.length > 0 && (
            <div className="mb-6">
              <p className="text-gray-700 font-semibold mb-2">Intereses:</p>
              <div className="flex flex-wrap gap-2">
                {targetUser.interests.map(interest => (
                  <span key={interest} className="bg-pink-100 text-pink-800 px-3 py-1 rounded text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-2xl font-bold mb-6">Solicitar Cita</h3>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Fecha Preferida</label>
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Hora Preferida</label>
              <input
                type="time"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Ubicación</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {formData.location === 'Other' && (
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Especifica la ubicación</label>
                <input
                  type="text"
                  name="customLocation"
                  value={formData.customLocation}
                  onChange={handleChange}
                  placeholder="Ej: Biblioteca Central, Zona de descanso..."
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Mensaje (Opcional)</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Cuéntale por qué quieres conocerlo..."
                maxLength="500"
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-2 rounded hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestDate;
