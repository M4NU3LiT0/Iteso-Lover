import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userServices, uploadServices } from '../services/services';
import useAuthStore from '../store/authStore';
import apiClient from '../services/api';

const INTERESTS = [
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
const PREFERENCE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'male', label: 'Hombres' },
  { value: 'female', label: 'Mujeres' },
  { value: 'other', label: 'Otros' }
];

const EditProfile = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || '');
  const [gallery, setGallery] = useState([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    gender: user?.gender || '',
    interests: user?.interests || [],
    careerName: user?.careerName || '',
    careerGoal: user?.careerGoal || '',
    birthDate: user?.birthDate ? user.birthDate.split('T')[0] : '',
    phoneNumber: user?.phoneNumber || '',
    preferences: { interestedIn: user?.preferences?.interestedIn || 'all' }
  });

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const loadGallery = useCallback(async () => {
    try {
      const res = await apiClient.get('/photos');
      setGallery(res.data.photos || []);
    } catch {
      // Gallery is optional — silently fail
    }
  }, []);

  useEffect(() => { loadGallery(); }, [loadGallery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (value) => {
    setFormData((prev) => ({ ...prev, preferences: { interestedIn: value } }));
  };

  // ── Profile photo ────────────────────────────────────────────────────────

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no debe superar 5MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo se permiten imágenes JPEG, PNG o WebP');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    setError('');
    try {
      const response = await uploadServices.uploadProfilePhoto(file);
      updateUser(response.data.user);
      setSuccess('Foto de perfil actualizada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al subir la foto');
      setPhotoPreview(user?.profilePhoto || '');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) return;
    setUploading(true);
    try {
      const response = await uploadServices.deleteProfilePhoto();
      updateUser(response.user);
      setPhotoPreview('');
      setSuccess('Foto eliminada');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Error al eliminar la foto'); }
    finally { setUploading(false); }
  };

  // ── Gallery ──────────────────────────────────────────────────────────────

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (gallery.length >= 6) { setError('Máximo 6 fotos en la galería'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no debe superar 5MB'); return; }
    setGalleryUploading(true);
    setError('');
    try {
      const formDataObj = new FormData();
      formDataObj.append('photo', file);
      await apiClient.post('/photos', formDataObj, { headers: { 'Content-Type': 'multipart/form-data' } });
      loadGallery();
      setSuccess('Foto añadida a la galería');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al subir foto');
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleGalleryDelete = async (photoId) => {
    if (!window.confirm('¿Eliminar esta foto de la galería?')) return;
    try {
      await apiClient.delete(`/photos/${photoId}`);
      loadGallery();
    } catch { setError('Error al eliminar la foto'); }
  };

  const movePhoto = async (index, direction) => {
    const updated = [...gallery];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    setGallery(updated);
    try {
      await apiClient.put('/photos/reorder', {
        photos: updated.map((p, i) => ({ id: p._id, order: i }))
      });
    } catch { loadGallery(); }
  };

  // ── Interests ────────────────────────────────────────────────────────────

  const toggleInterest = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.firstName.length < 2 || formData.lastName.length < 2) {
      setError('El nombre y apellido deben tener al menos 2 caracteres');
      return;
    }
    if (formData.bio.length > 500) { setError('La bio no debe superar 500 caracteres'); return; }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await userServices.updateProfile(formData);
      if (response.success) {
        updateUser(response.user);
        setSuccess('Perfil actualizado correctamente');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent cursor-pointer"
          >
            ITESO-Lover
          </button>
          <button onClick={() => navigate('/dashboard')} className="text-gray-700 hover:text-pink-500">
            Volver
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-3xl font-bold">Editar Perfil</h2>
          {user.isVerified && (
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
              ✓ Verificado
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Profile photo ── */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Foto de Perfil</h3>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center text-white text-3xl">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input type="file" id="photo-input" accept="image/*" onChange={handlePhotoChange} disabled={uploading} className="hidden" />
                <label htmlFor="photo-input" className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 cursor-pointer text-center text-sm">
                  {uploading ? 'Subiendo...' : 'Cambiar Foto'}
                </label>
                {photoPreview && (
                  <button type="button" onClick={handleDeletePhoto} disabled={uploading}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm">
                    Eliminar Foto
                  </button>
                )}
                <p className="text-xs text-gray-500">Máximo 5MB — JPEG, PNG o WebP</p>
              </div>
            </div>
          </div>

          {/* ── Photo gallery ── */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Galería de Fotos ({gallery.length}/6)</h3>
              {gallery.length < 6 && (
                <>
                  <input type="file" id="gallery-input" accept="image/*" onChange={handleGalleryUpload} disabled={galleryUploading} className="hidden" />
                  <label htmlFor="gallery-input"
                    className="px-3 py-1.5 bg-pink-500 text-white rounded hover:bg-pink-600 cursor-pointer text-sm">
                    {galleryUploading ? 'Subiendo...' : '+ Agregar foto'}
                  </label>
                </>
              )}
            </div>

            {gallery.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No tienes fotos en tu galería todavía.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {gallery.map((photo, index) => (
                  <div key={photo._id} className="relative group aspect-square">
                    <img src={photo.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 rounded-lg transition flex items-center justify-center gap-1">
                      <button type="button" onClick={() => movePhoto(index, -1)} disabled={index === 0}
                        className="bg-white text-gray-700 rounded px-2 py-1 text-xs disabled:opacity-30 hover:bg-gray-100">
                        ←
                      </button>
                      <button type="button" onClick={() => handleGalleryDelete(photo._id)}
                        className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600">
                        ✕
                      </button>
                      <button type="button" onClick={() => movePhoto(index, 1)} disabled={index === gallery.length - 1}
                        className="bg-white text-gray-700 rounded px-2 py-1 text-xs disabled:opacity-30 hover:bg-gray-100">
                        →
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Personal info ── */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Información Personal</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-gray-700 font-semibold mb-1 text-sm">Nombre</label>
                <input id="firstName" type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                  required minLength="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-gray-700 font-semibold mb-1 text-sm">Apellido</label>
                <input id="lastName" type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                  required minLength="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" />
              </div>
            </div>

            <div>
              <label htmlFor="gender" className="block text-gray-700 font-semibold mb-1 text-sm">Género</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500">
                <option value="">Seleccionar género</option>
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-gray-700 font-semibold mb-1 text-sm">Fecha de nacimiento</label>
              <input id="birthDate" type="date" name="birthDate" value={formData.birthDate} onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" />
            </div>

            <div>
              <label htmlFor="careerName" className="block text-gray-700 font-semibold mb-1 text-sm">Carrera</label>
              <select id="careerName" name="careerName" value={formData.careerName} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500">
                <option value="">Seleccionar carrera</option>
                {CAREERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-gray-700 font-semibold mb-1 text-sm">Teléfono</label>
              <input id="phoneNumber" type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                placeholder="+521234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" />
            </div>

            <div>
              <label htmlFor="bio" className="block text-gray-700 font-semibold mb-1 text-sm">
                Bio ({formData.bio.length}/500)
              </label>
              <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange}
                placeholder="Cuéntanos sobre ti..." maxLength="500" rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" />
            </div>

            <div>
              <label htmlFor="careerGoal" className="block text-gray-700 font-semibold mb-1 text-sm">Meta Profesional</label>
              <input id="careerGoal" type="text" name="careerGoal" value={formData.careerGoal} onChange={handleChange}
                placeholder="¿Cuál es tu meta profesional?"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500" />
            </div>
          </div>

          {/* ── Preferences ── */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Preferencias de Búsqueda</h3>
            <p className="text-sm text-gray-500 mb-3">¿A quién te interesa conocer?</p>
            <div className="flex gap-3 flex-wrap">
              {PREFERENCE_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => handlePreferenceChange(value)}
                  className={`px-4 py-2 rounded-full border-2 font-semibold text-sm transition ${
                    formData.preferences.interestedIn === value
                      ? 'border-pink-500 bg-pink-50 text-pink-600'
                      : 'border-gray-300 text-gray-600 hover:border-pink-300'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Interests ── */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Mis Intereses</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTERESTS.map((interest) => (
                <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded transition text-sm ${
                    formData.interests.includes(interest)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}>
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading || uploading}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-3 rounded hover:opacity-90 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
