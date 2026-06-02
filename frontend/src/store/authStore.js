import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      login: async (email, password) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          set({ user: data.user, token: data.token, loading: false });
          return { ok: true };
        } catch (err) {
          set({ loading: false });
          return { ok: false, error: err.response?.data?.error || 'Error al iniciar sesión' };
        }
      },

      register: async (name, email, password, username) => {
        set({ loading: true });
        try {
          const { data } = await api.post('/auth/register', { name, email, password, username: username || undefined });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          set({ user: data.user, token: data.token, loading: false });
          return { ok: true };
        } catch (err) {
          set({ loading: false });
          return { ok: false, error: err.response?.data?.error || 'Error al registrarse' };
        }
      },

      updateUser: (userData) => set(s => ({ user: { ...s.user, ...userData } })),

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null });
      },

      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'quiniela-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);

export default useAuthStore;
