import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dateServices } from '../services/services';
import useAuthStore from '../store/authStore';

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

const DateCard = ({ date, currentUserId, onCancel, cancellingId }) => {
  const otherUser = date.requester._id === currentUserId ? date.receiver : date.requester;
  const isPast = new Date(date.preferredDate) < new Date();

  return (
    <div className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition ${isPast ? 'opacity-70' : ''}`}>
      <div className="flex items-center mb-4">
        {otherUser.profilePhoto
          ? <img src={otherUser.profilePhoto} alt={otherUser.firstName} className="w-12 h-12 rounded-full mr-4 object-cover" />
          : <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-red-500 mr-4 flex items-center justify-center text-white font-bold">{otherUser.firstName[0]}</div>
        }
        <div>
          <h3 className="font-semibold text-gray-800">{otherUser.firstName} {otherUser.lastName}</h3>
          {isPast
            ? <span className="text-xs text-gray-400 font-semibold">Pasada</span>
            : <span className="text-xs text-green-600 font-semibold">Próxima</span>
          }
        </div>
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-red-50 p-4 rounded mb-4">
        <p className="text-gray-800 font-semibold capitalize">📅 {formatDate(date.preferredDate)}</p>
        <p className="text-gray-700">🕐 {date.preferredTime}</p>
        <p className="text-gray-700">
          📍 {date.location}{date.customLocation ? ` — ${date.customLocation}` : ''}
        </p>
      </div>

      {date.message && (
        <p className="text-sm text-gray-500 italic mb-4">"{date.message}"</p>
      )}

      {!isPast && (
        <button
          type="button"
          onClick={() => onCancel(date._id)}
          disabled={cancellingId === date._id}
          className="w-full border border-red-400 text-red-500 font-semibold py-2 rounded hover:bg-red-50 disabled:opacity-50 text-sm transition"
        >
          {cancellingId === date._id ? 'Cancelando...' : 'Cancelar cita'}
        </button>
      )}
    </div>
  );
};

const ScheduledDates = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchDates();
    } else {
      navigate('/login');
    }
  }, [user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDates = async () => {
    setLoading(true);
    try {
      const response = await dateServices.getScheduledDates();
      setDates(response.dates || []);
    } catch {
      setError('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (dateId) => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    setCancellingId(dateId);
    try {
      await dateServices.cancelDate(dateId);
      setDates((prev) => prev.filter((d) => d._id !== dateId));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cancelar la cita');
    } finally {
      setCancellingId(null);
    }
  };

  const now = new Date();
  const upcoming = dates.filter((d) => new Date(d.preferredDate) >= now);
  const past = dates.filter((d) => new Date(d.preferredDate) < now);

  if (!user) return null;

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
              <button type="button" onClick={() => navigate('/dashboard')} className="text-gray-700 hover:text-pink-500">
                Volver
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8">Mis Citas</h2>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
        )}

        {loading ? (
          <div className="text-center text-gray-600">Cargando...</div>
        ) : (
          <>
            <section className="mb-10">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Próximas ({upcoming.length})</h3>
              {upcoming.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcoming.map((date) => (
                    <DateCard
                      key={date._id}
                      date={date}
                      currentUserId={user._id}
                      onCancel={handleCancel}
                      cancellingId={cancellingId}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                  <p className="mb-4">No tienes citas próximas</p>
                  <button
                    type="button"
                    onClick={() => navigate('/discover')}
                    className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold px-6 py-2 rounded hover:opacity-90"
                  >
                    Buscar Personas
                  </button>
                </div>
              )}
            </section>

            {past.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-400 mb-4">Pasadas ({past.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {past.map((date) => (
                    <DateCard
                      key={date._id}
                      date={date}
                      currentUserId={user._id}
                      onCancel={handleCancel}
                      cancellingId={cancellingId}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduledDates;
