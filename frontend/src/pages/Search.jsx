import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userServices } from '../services/services';
import useAuthStore from '../store/authStore';

const Search = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedGender, setSelectedGender] = useState('all');

  const interests = ['Sports', 'Music', 'Art', 'Technology', 'Travel', 'Food', 'Movies', 'Books', 'Gaming', 'Fashion', 'Science', 'Nature'];

  useEffect(() => {
    if (!user) navigate('/login');
    searchUsers();
  }, [user, navigate]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const response = await userServices.searchUsers(searchQuery, selectedInterests.join(','), selectedGender);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchUsers();
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
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
        <h2 className="text-3xl font-bold mb-8">Buscar Estudiantes</h2>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Por Nombre</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Género</label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
                >
                  <option value="all">Todos</option>
                  <option value="male">Hombres</option>
                  <option value="female">Mujeres</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3">Filtrar por Intereses</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {interests.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded transition ${
                      selectedInterests.includes(interest)
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-2 rounded hover:opacity-90"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center text-gray-600">Buscando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.length > 0 ? (
              users.map(u => (
                <div key={u._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div className="flex items-center mb-4">
                    {u.profilePhoto ? (
                      <img src={u.profilePhoto} alt={u.firstName} className="w-12 h-12 rounded-full mr-4" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-red-500 mr-4"></div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">{u.firstName} {u.lastName}</h3>
                      <p className="text-sm text-gray-600">{u.careerGoal}</p>
                    </div>
                  </div>
                  {u.bio && <p className="text-gray-600 text-sm mb-3">{u.bio}</p>}
                  {u.interests.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Intereses:</p>
                      <div className="flex flex-wrap gap-2">
                        {u.interests.map(interest => (
                          <span key={interest} className="bg-pink-100 text-pink-800 text-xs px-3 py-1 rounded">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/request-date/${u._id}`)}
                    className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-2 rounded hover:opacity-90"
                  >
                    Solicitar Cita
                  </button>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-600">No se encontraron estudiantes</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
