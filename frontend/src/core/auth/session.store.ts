import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role } from '@/core/rbac/roles';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

interface SessionState {
  user: SessionUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: SessionUser, token: string) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'instituto-session',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
