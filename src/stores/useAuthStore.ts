import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'developer' | 'viewer';
  avatar: string; // single uppercase letter
  avatarColor: string;
  joinedAt: string;
}

// Demo users for the system
export const DEMO_USERS: Array<User & { password: string }> = [
  {
    id: 'user-bobo',
    username: 'Bobo',
    password: 'bobo123',
    displayName: 'Bobo',
    role: 'admin',
    avatar: 'B',
    avatarColor: '#00FFFF',
    joinedAt: '2026-02-02',
  },
  {
    id: 'user-admin',
    username: 'Admin',
    password: 'admin123',
    displayName: 'Admin',
    role: 'admin',
    avatar: 'A',
    avatarColor: '#FF00FF',
    joinedAt: '2026-01-01',
  },
  {
    id: 'user-guest',
    username: 'Guest',
    password: 'guest',
    displayName: 'Guest User',
    role: 'viewer',
    avatar: 'G',
    avatarColor: '#FFFF00',
    joinedAt: '2026-02-10',
  },
];

interface AuthStore {
  currentUser: User | null;
  isAuthenticated: boolean;
  loginError: string | null;

  login: (username: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, 'displayName'>>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      loginError: null,

      login: (username: string, password: string) => {
        const user = DEMO_USERS.find(
          (u) =>
            u.username.toLowerCase() === username.toLowerCase() &&
            u.password === password
        );

        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          set({
            currentUser: userWithoutPassword,
            isAuthenticated: true,
            loginError: null,
          });
          return true;
        }

        set({ loginError: '用户名或密码错误' });
        return false;
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          loginError: null,
        });
      },

      updateProfile: (updates) => {
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, ...updates }
            : null,
        }));
      },

      clearError: () => set({ loginError: null }),
    }),
    {
      name: 'knowgraph-auth',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
