import { create } from 'zustand';

// Tokens are stored in httpOnly cookies managed by the server.
// Only the user object (non-sensitive) is kept in localStorage for UI state.
const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  isLoading: false,
  error: null,

  setAuth: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  updateUser: (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  isAuthenticated: () => {
    return !!useAuthStore.getState().user;
  }
}));

export default useAuthStore;
