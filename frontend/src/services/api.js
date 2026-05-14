import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_URL = '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Required so the browser sends httpOnly auth cookies and the CSRF cookie
  withCredentials: true
});

// Read CSRF token from the readable csrf_token cookie
const CSRF_COOKIE_RE = /(?:^|;\s*)csrf_token=([^;]+)/;
const getCsrfToken = () => {
  const match = CSRF_COOKIE_RE.exec(document.cookie);
  return match ? match[1] : null;
};

// Inject CSRF token header on all state-changing requests
apiClient.interceptors.request.use(
  (config) => {
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const token = getCsrfToken();
      if (token) config.headers['X-CSRF-Token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

// Handle 401 — attempt one silent token refresh before logging out
// BUT: don't intercept auth endpoints (they return 401 for invalid credentials, not expired tokens)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original.url?.includes('/auth/login') || original.url?.includes('/auth/register');

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(original))
          .catch((e) => { throw e; });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // The refresh token is in an httpOnly cookie — no body needed
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        processQueue(null);
        return apiClient(original);
      } catch (refreshError) {
        processQueue(refreshError);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    throw error;
  }
);

export default apiClient;
