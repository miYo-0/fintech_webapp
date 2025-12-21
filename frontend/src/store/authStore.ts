// Zustand store for authentication state
import { create } from 'zustand';
import { User, AuthTokens } from '@/types';
import { authAPI } from '@/lib/api';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
    updateUser: (data: any) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authAPI.login({ username, password });
            const { user, access_token, refresh_token } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Login failed',
                isLoading: false
            });
            throw error;
        }
    },

    register: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authAPI.register(data);
            const { user, access_token, refresh_token } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Registration failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
    },

    loadUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
        }

        set({ isLoading: true });
        try {
            const response = await authAPI.getCurrentUser();
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    updateUser: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authAPI.updateProfile(data);
            set({ user: response.data.user, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Update failed',
                isLoading: false
            });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
