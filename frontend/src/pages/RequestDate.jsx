import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dateServices, userServices } from '../services/services';
import useAuthStore from '../store/authStore';

const LOCATIONS = [
  'Biblioteca', 'Cafetería', 'Complejo Deportivo', 'Plaza Mayor',
  'Jardines', 'Auditorio', 'Centro de Lenguas', 'Área de Descanso', 'Otro'
];

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const RequestDate = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const user = useAuthStore((state) => state.user);
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    preferredDate: getTomorrowDate(),
    preferredTime: '',
    location: 'Biblioteca',
    customLocation: '',
    message: ''
  });

  useEffect(() => {
    if (user) {
      fetchUser();
    } else {
      navigate('/login');
    }
  }, [user, userId, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUser = async () => {
    try {
      const response = await userServices.getUserById(userId);
      setTargetUser(response.user);
    } catch {
      setError('Usuario no encontrado');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const [hours, minutes] = formData.preferredTime.split(':').map(Number);
    if (Number.isNaN(hours) || hours < 8 || hours >= 22) {
      setError('La hora debe estar entre las 8:00 y las 22:00');
      return;
    }
    if (minutes === undefined || Number.isNaN(minutes)) {
      setError('Ingresa una hora válida');
      return;
    }

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
        navigate('/discover');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (!targetUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {error
          ? <p className="text-red-600">{error}</p>
          : <p className="text-gray-600">Cargando...</p>
        }
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <button type="button" onClick={() => navigate('/dashboard')} className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                ITESO-Lover
              </span>
            </button>
            <div className="flex items-center">
              <button type="button" onClick={() => navigate('/discover')} className="text-gray-700 hover:text-pink-500">
                Volver
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Target user card */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center mb-4">
            {targetUser.profilePhoto
              ? <img src={targetUser.profilePhoto} alt={targetUser.firstName} className="w-20 h-20 rounded-full mr-6 object-cover" />
              : <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-red-500 mr-6 flex items-center justify-center text-white text-2xl font-bold">{targetUser.firstName[0]}</div>
            }
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{targetUser.firstName} {targetUser.lastName}</h2>
              {targetUser.careerName && <p className="text-pink-600 font-semibold text-sm">{targetUser.careerName}</p>}
              {targetUser.careerGoal && <p className="text-gray-500 text-sm">{targetUser.careerGoal}</p>}
            </div>
          </div>

          {targetUser.bio && (
            <p className="text-gray-700 text-sm mb-4 bg-gray-50 p-3 rounded">{targetUser.bio}</p>
          )}

          {targetUser.interests && targetUser.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {targetUser.interests.map((interest) => (
                <span key={interest} className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-semibold">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-2xl font-bold mb-6">Solicitar Cita</h3>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="preferredDate" className="block text-gray-700 font-semibold mb-2 text-sm">
                Fecha
              </label>
              <input
                id="preferredDate"
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label htmlFor="preferredTime" className="block text-gray-700 font-semibold mb-2 text-sm">
                Hora <span className="text-gray-400 font-normal">(8:00 – 22:00)</span>
              </label>
              <input
                id="preferredTime"
                type="time"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                required
                min="08:00"
                max="22:00"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-gray-700 font-semibold mb-2 text-sm">
                Lugar en el ITESO
              </label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {formData.location === 'Otro' && (
              <div>
                <label htmlFor="customLocation" className="block text-gray-700 font-semibold mb-2 text-sm">
                  Especifica el lugar
                </label>
                <input
                  id="customLocation"
                  type="text"
                  name="customLocation"
                  value={formData.customLocation}
                  onChange={handleChange}
                  placeholder="Ej: Terraza del edificio H, Sala de estudio 3..."
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="message" className="block text-gray-700 font-semibold mb-2 text-sm">
                Mensaje <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={`¡Hola ${targetUser.firstName}! Me gustaría conocerte...`}
                maxLength="500"
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-3 rounded hover:opacity-90 disabled:opacity-50"
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
