import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import apiClient from '../services/api';

const TABS = ['Estadísticas', 'Usuarios', 'Reportes', 'Security Logs'];

const Badge = ({ text, color }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{text}</span>
);

const AdminPanel = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/dashboard');
  }, [user, navigate]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const loadStats = useCallback(async () => {
    const res = await apiClient.get('/admin/stats');
    setStats(res.data.stats);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.get(`/admin/users?search=${search}&limit=30`);
    setUsers(res.data.users);
    setLoading(false);
  }, [search]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.get('/admin/security-logs?limit=50');
    setLogs(res.data.logs);
    setLoading(false);
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.get('/admin/reports?limit=30');
    setReports(res.data.reports);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 0) loadStats();
    else if (tab === 1) loadUsers();
    else if (tab === 2) loadReports();
    else if (tab === 3) loadLogs();
  }, [tab, loadStats, loadUsers, loadLogs, loadReports]);

  const handleVerify = async (id, verified) => {
    await apiClient.put(`/admin/users/${id}/${verified ? 'unverify' : 'verify'}`);
    flash(verified ? 'Verificación removida' : 'Usuario verificado');
    loadUsers();
  };

  const handleToggleActive = async (id, active) => {
    await apiClient.put(`/admin/users/${id}/${active ? 'deactivate' : 'activate'}`);
    flash(active ? 'Usuario desactivado' : 'Usuario activado');
    loadUsers();
  };

  const severityColor = (s) => ({
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800'
  }[s] || 'bg-gray-100 text-gray-800');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1
            onClick={() => navigate('/dashboard')}
            className="text-xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent cursor-pointer"
          >
            ITESO-Lover · Admin
          </h1>
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-pink-500">
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {msg && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-4 py-2 font-semibold text-sm border-b-2 transition ${
                tab === i
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Stats ── */}
        {tab === 0 && stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total usuarios', value: stats.totalUsers, color: 'bg-blue-500' },
              { label: 'Activos', value: stats.activeUsers, color: 'bg-green-500' },
              { label: 'Verificados', value: stats.verifiedUsers, color: 'bg-purple-500' },
              { label: 'Bloqueados', value: stats.lockedUsers, color: 'bg-yellow-500' },
              { label: 'Alertas críticas', value: stats.criticalLogs, color: 'bg-red-500' }
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-lg shadow p-4 text-center">
                <div className={`text-3xl font-bold text-white ${color} rounded-lg py-2 mb-2`}>
                  {value}
                </div>
                <p className="text-sm text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Users ── */}
        {tab === 1 && (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-pink-500"
              />
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
              >
                Buscar
              </button>
            </div>

            {loading ? (
              <p className="text-center text-gray-500">Cargando...</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Nombre', 'Email', 'Estado', 'Verificado', 'Último login', 'Acciones'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {u.firstName} {u.lastName}
                          {u.role === 'admin' && (
                            <Badge text="Admin" color="bg-purple-100 text-purple-800 ml-1" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge
                            text={u.isActive ? 'Activo' : 'Inactivo'}
                            color={u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            text={u.isVerified ? '✓ Verificado' : 'Sin verificar'}
                            color={u.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVerify(u._id, u.isVerified)}
                              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              {u.isVerified ? 'Quitar verificación' : 'Verificar'}
                            </button>
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleActive(u._id, u.isActive)}
                                className={`text-xs px-2 py-1 rounded ${
                                  u.isActive
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {u.isActive ? 'Desactivar' : 'Activar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No se encontraron usuarios</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Reports ── */}
        {tab === 2 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Reportado por', 'Motivo', 'Usuario reportado', 'Fecha'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {r.userId ? `${r.userId.firstName} ${r.userId.lastName}` : 'Desconocido'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {r.details?.reason || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.details?.reportedUserId}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && (
              <p className="text-center text-gray-400 py-8">No hay reportes pendientes</p>
            )}
          </div>
        )}

        {/* ── Security Logs ── */}
        {tab === 3 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Evento', 'Usuario', 'Severidad', 'IP', 'Fecha'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{l.event}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {l.userId ? `${l.userId.firstName} ${l.userId.lastName}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge text={l.severity} color={severityColor(l.severity)} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{l.ip}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <p className="text-center text-gray-400 py-8">No hay registros de seguridad</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
