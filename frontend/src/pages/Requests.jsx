import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dateServices } from '../services/services';
import useAuthStore from '../store/authStore';

const Requests = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
    else fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await dateServices.getPendingRequests();
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await dateServices.acceptDateRequest(requestId);
      setRequests(requests.filter(r => r._id !== requestId));
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await dateServices.rejectDateRequest(requestId, '');
      setRequests(requests.filter(r => r._id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
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
        <h2 className="text-3xl font-bold mb-8">Solicitudes de Cita</h2>

        {loading ? (
          <div className="text-center text-gray-600">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {requests.length > 0 ? (
              requests.map(request => (
                <div key={request._id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {request.requester.profilePhoto ? (
                        <img src={request.requester.profilePhoto} alt={request.requester.firstName} className="w-16 h-16 rounded-full mr-4" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 mr-4"></div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {request.requester.firstName} {request.requester.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">quiere agendar una cita contigo</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded mb-4">
                    <p className="text-gray-800 font-semibold">📅 {new Date(request.preferredDate).toLocaleDateString()}</p>
                    <p className="text-gray-800">🕐 {request.preferredTime}</p>
                    <p className="text-gray-800">📍 {request.location}</p>
                    {request.message && <p className="text-gray-700 mt-2 italic">"{request.message}"</p>}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAccept(request._id)}
                      className="flex-1 bg-green-500 text-white font-semibold py-2 rounded hover:bg-green-600"
                    >
                      ✓ Aceptar
                    </button>
                    <button
                      onClick={() => handleReject(request._id)}
                      className="flex-1 bg-red-500 text-white font-semibold py-2 rounded hover:bg-red-600"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-600 bg-white rounded-lg p-12">
                <p className="text-lg">No tienes solicitudes pendientes</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
