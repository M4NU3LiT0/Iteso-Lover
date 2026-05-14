import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userServices } from '../services/services';
import useAuthStore from '../store/authStore';

const ALL_INTERESTS = [
  'Deportes', 'Música', 'Arte', 'Tecnología', 'Viajes', 'Comida', 'Películas', 'Libros',
  'Gaming', 'Moda', 'Ciencia', 'Naturaleza', 'Fotografía', 'Baile', 'Fitness', 'Yoga',
  'Emprendimiento', 'Política', 'Cocina', 'Animales', 'Teatro', 'Idiomas', 'Voluntariado',
  'Meditación', 'Astronomía'
];

const CAREERS = [
  'Ingeniería en Sistemas', 'Diseño Gráfico', 'Psicología', 'Administración de Empresas',
  'Arquitectura', 'Relaciones Internacionales', 'Comunicación', 'Medicina',
  'Ingeniería Ambiental', 'Derecho', 'Economía', 'Contaduría', 'Mercadotecnia',
  'Ingeniería Industrial', 'Filosofía'
];

const genderLabel = (gender) => {
  if (gender === 'male') return '👨 Hombre';
  if (gender === 'female') return '👩 Mujer';
  return '👤 Otro';
};

const messageClass = (type) => {
  if (type === 'success') return 'bg-green-100 text-green-800';
  if (type === 'error') return 'bg-red-100 text-red-800';
  return 'bg-blue-100 text-blue-800';
};

const calcAge = (birthDate) =>
  Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));

const interestChipClass = (interest, selectedInterests) =>
  selectedInterests.includes(interest)
    ? 'bg-pink-500 text-white border-pink-500'
    : 'bg-white text-gray-600 border-gray-300 hover:border-pink-300';

const highlightedChipClass = (interest, selectedInterests) =>
  selectedInterests.includes(interest)
    ? 'bg-pink-500 text-white'
    : 'bg-pink-100 text-pink-800';

const EMPTY_FILTERS = { interests: [], career: '', minAge: '', maxAge: '' };

const Discover = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const loadUsers = useCallback(async (activeFilters) => {
    setLoading(true);
    setStatusMsg('');
    try {
      const interestsParam = activeFilters.interests.join(',');
      // Use getCompatibleUsers to respect user gender preferences
      const response = await userServices.getCompatibleUsers();
      let compatibleUsers = response.users || [];

      // Apply manual filters on top of compatible results
      if (activeFilters.interests.length > 0) {
        const interestSet = new Set(activeFilters.interests);
        compatibleUsers = compatibleUsers.filter(u =>
          u.interests.some(i => interestSet.has(i))
        );
      }
      if (activeFilters.career) {
        compatibleUsers = compatibleUsers.filter(u =>
          u.careerName?.toLowerCase() === activeFilters.career.toLowerCase()
        );
      }
      if (activeFilters.minAge) {
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - parseInt(activeFilters.minAge));
        compatibleUsers = compatibleUsers.filter(u =>
          new Date(u.birthDate) <= minDate
        );
      }
      if (activeFilters.maxAge) {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - parseInt(activeFilters.maxAge) - 1);
        compatibleUsers = compatibleUsers.filter(u =>
          new Date(u.birthDate) >= maxDate
        );
      }

      setUsers(compatibleUsers);
      setCurrentIndex(0);
    } catch {
      setStatusMsg('Error al cargar usuarios');
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUsers(filters);
    } else {
      navigate('/login');
    }
  }, [user, navigate, loadUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleInterest = (interest) => {
    setFilters((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    loadUsers(filters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadUsers(EMPTY_FILTERS);
    setShowFilters(false);
  };

  const activeFilterCount =
    filters.interests.length +
    (filters.career ? 1 : 0) +
    (filters.minAge ? 1 : 0) +
    (filters.maxAge ? 1 : 0);

  const currentUser = users[currentIndex];

  const handlePass = () => {
    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStatusMsg('No hay más usuarios con estos filtros');
      setStatusType('info');
    }
  };

  const handleLike = () => {
    if (currentUser) navigate(`/request-date/${currentUser._id}`);
  };

  const handleReload = () => loadUsers(filters);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex items-center"
            >
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                ITESO-Lover
              </span>
            </button>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`relative flex items-center gap-1 px-4 py-2 rounded-full border-2 font-semibold text-sm transition ${
                  activeFilterCount > 0
                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                    : 'border-gray-300 text-gray-600 hover:border-pink-300'
                }`}
              >
                Filtros
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-gray-700 hover:text-pink-500 font-semibold"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
            {/* Interests */}
            <div>
              <p className="font-semibold text-gray-700 mb-2 text-sm">Intereses</p>
              <div className="flex flex-wrap gap-2">
                {ALL_INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${interestChipClass(interest, filters.interests)}`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Career */}
            <div>
              <label htmlFor="career-filter" className="font-semibold text-gray-700 mb-2 text-sm block">
                Carrera
              </label>
              <select
                id="career-filter"
                name="career"
                value={filters.career}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-pink-500"
              >
                <option value="">Todas las carreras</option>
                {CAREERS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Age range */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="min-age-filter" className="font-semibold text-gray-700 mb-2 text-sm block">
                  Edad mínima
                </label>
                <input
                  id="min-age-filter"
                  type="number"
                  name="minAge"
                  value={filters.minAge}
                  onChange={handleFilterChange}
                  min="18"
                  max="40"
                  placeholder="18"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-pink-500"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="max-age-filter" className="font-semibold text-gray-700 mb-2 text-sm block">
                  Edad máxima
                </label>
                <input
                  id="max-age-filter"
                  type="number"
                  name="maxAge"
                  value={filters.maxAge}
                  onChange={handleFilterChange}
                  min="18"
                  max="40"
                  placeholder="30"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={applyFilters}
                className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-2 rounded hover:opacity-90 text-sm"
              >
                Aplicar filtros
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded hover:bg-gray-50 text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {statusMsg && (
          <div className={`mb-6 p-4 rounded-lg text-center font-semibold ${messageClass(statusType)}`}>
            {statusMsg}
          </div>
        )}

        {/* Progress bar */}
        {(() => {
          const progressPct = users.length > 0 ? ((currentIndex + 1) / users.length) * 100 : 0;
          let progressLabel = 'Sin resultados';
          if (loading) progressLabel = 'Cargando...';
          else if (users.length > 0) progressLabel = `${currentIndex + 1} de ${users.length}`;
          return (
            <div className="mb-6">
              <div className="bg-white rounded-full h-2 overflow-hidden shadow">
                <div
                  className="bg-gradient-to-r from-pink-500 to-red-500 h-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-center text-gray-600 text-sm mt-2">{progressLabel}</p>
            </div>
          );
        })()}

        {loading && (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4" />
              <p className="text-gray-600">Cargando perfiles...</p>
            </div>
          </div>
        )}

        {!loading && users.length > 0 && currentUser && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-sm">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Photo */}
                <div className="relative h-96 bg-gradient-to-br from-pink-200 to-red-200 flex items-center justify-center overflow-hidden">
                  {currentUser.profilePhoto
                    ? <img src={currentUser.profilePhoto} alt={currentUser.firstName} className="w-full h-full object-cover" />
                    : <div className="text-6xl">👤</div>
                  }
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-transparent to-transparent h-32" />
                  {currentUser.compatibilityScore > 0 && (
                    <div className="absolute top-3 right-3 bg-white bg-opacity-90 text-pink-600 font-bold text-sm px-3 py-1 rounded-full shadow">
                      {currentUser.compatibilityScore}% compatible
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6">
                  <div className="mb-3">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {currentUser.firstName} {currentUser.lastName}
                      {currentUser.birthDate && (
                        <span className="text-gray-500 font-normal text-base ml-2">
                          {calcAge(currentUser.birthDate)} años
                        </span>
                      )}
                    </h2>
                    {currentUser.careerName && (
                      <p className="text-pink-600 font-semibold text-sm">{currentUser.careerName}</p>
                    )}
                    {currentUser.gender && (
                      <p className="text-gray-500 text-sm">{genderLabel(currentUser.gender)}</p>
                    )}
                  </div>

                  {currentUser.careerGoal && (
                    <p className="text-gray-700 font-semibold text-sm mb-3">🎯 {currentUser.careerGoal}</p>
                  )}

                  {currentUser.bio && (
                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">{currentUser.bio}</p>
                  )}

                  {currentUser.interests && currentUser.interests.length > 0 && (
                    <div>
                      <p className="text-gray-500 font-semibold text-xs mb-2 uppercase tracking-wide">Intereses</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentUser.interests.map((interest) => (
                          <span
                            key={interest}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${highlightedChipClass(interest, filters.interests)}`}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-6 mt-8 justify-center items-center">
                <button
                  type="button"
                  onClick={handlePass}
                  className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-2xl transition-all transform hover:scale-110 shadow-lg"
                  title="Pasar"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={handleLike}
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:shadow-2xl flex items-center justify-center text-3xl transition-all transform hover:scale-110 shadow-xl"
                  title="Solicitar cita"
                >
                  ❤️
                </button>
              </div>
              <p className="mt-4 text-center text-gray-500 text-xs">✕ Pasar &nbsp;|&nbsp; ❤️ Solicitar cita</p>
            </div>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-center">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-xl text-gray-800 font-semibold mb-2">
                {activeFilterCount > 0 ? 'Sin resultados con estos filtros' : '¡Sin más usuarios!'}
              </p>
              <p className="text-gray-500 mb-6 text-sm">
                {activeFilterCount > 0
                  ? 'Prueba con otros filtros o elimínalos'
                  : 'Vuelve más tarde para ver más perfiles'}
              </p>
              <div className="flex gap-3 justify-center">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="border border-pink-500 text-pink-500 font-semibold px-5 py-2 rounded-lg hover:bg-pink-50"
                  >
                    Quitar filtros
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleReload}
                  className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold px-5 py-2 rounded-lg hover:opacity-90"
                >
                  Recargar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
