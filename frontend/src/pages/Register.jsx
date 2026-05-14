import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authServices } from '../services/services';
import useAuthStore from '../store/authStore';

const Register = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    password: '',
    passwordConfirm: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authServices.register(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
        formData.passwordConfirm,
        formData.gender
      );

      if (response.success) {
        setAuth(response.user);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Error al registrarse');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">ITESO-Lover</h1>
        <p className="text-center text-gray-600 mb-6">Regístrate para empezar</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Nombre</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Apellido</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Email (@iteso.mx)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@iteso.mx"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Género *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
            >
              <option value="">Seleccionar género</option>
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mín. 8 caracteres"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Debe contener mayúsculas, minúsculas y números
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Confirmar Contraseña</label>
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-2 rounded hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-pink-500 font-semibold hover:underline">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
