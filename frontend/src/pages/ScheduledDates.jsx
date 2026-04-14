import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dateServices } from '../services/services';
import useAuthStore from '../store/authStore';

const ScheduledDates = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
    else fetchDates();
  }, [user, navigate]);

  const fetchDates = async () => {
    setLoading(true);
    try {
      const response = await dateServices.getScheduledDates();
      setDates(response.dates || []);
    } catch (error) {
      console.error('Error fetching dates:', error);
    } finally {
      setLoading(false);
    }
  };

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
                onClick={() => navigate('/dashboard')}
                className="text-gray-700 hover:text-pink-500"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8">Mis Citas Programadas</h2>

        {loading ? (
          <div className="text-center text-gray-600">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dates.length > 0 ? (
              dates.map(date => {
                const otherUser = date.requester._id === user._id ? date.receiver : date.requester;
                return (
                  <div key={date._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                    <div className="flex items-center mb-4">
                      {otherUser.profilePhoto ? (
                        <img src={otherUser.profilePhoto} alt={otherUser.firstName} className="w-12 h-12 rounded-full mr-4" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-red-500 mr-4"></div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-800">{otherUser.firstName} {otherUser.lastName}</h3>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-pink-50 to-red-50 p-4 rounded mb-4">
                      <p className="text-gray-800 font-semibold">📅 {new Date(date.preferredDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="text-gray-800">🕐 {date.preferredTime}</p>
                      <p className="text-gray-800">📍 {date.location}</p>
                    </div>

                    {date.message && (
                      <div className="bg-gray-50 p-3 rounded mb-4">
                        <p className="text-sm text-gray-700 italic">"{date.message}"</p>
                      </div>
                    )}

                    <div className="text-sm text-gray-600">
                      <p>Estado: <span className="font-semibold text-green-600">✓ Aceptada</span></p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center text-gray-600 bg-white rounded-lg p-12">
                <p className="text-lg">No tienes citas programadas aún</p>
                <button
                  onClick={() => navigate('/discover')}
                  className="mt-4 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold px-6 py-2 rounded hover:opacity-90"
                >
                  Buscar Personas
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledDates;
