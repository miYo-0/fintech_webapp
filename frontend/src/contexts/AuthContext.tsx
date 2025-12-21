'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

interface RegisterData {
    email: string;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('access_token');

            // If no token exists, no need to make API call
            if (!token) {
                setLoading(false);
                return;
            }

            // Token exists, verify it with the server
            try {
                const response = await authAPI.getCurrentUser();
                setUser(response.data.user);
            } catch (error: any) {
                // Only clear tokens on authentication errors, not network errors
                if (error.response?.status === 401) {
                    console.log('Authentication expired, clearing tokens');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    setUser(null);
                } else {
                    // For network errors or other issues, assume user is still valid if we have a token
                    // The API interceptor will handle token refresh if needed
                    console.error('Auth check failed (non-auth error):', error.message);

                    // Don't clear user state on transient failures
                    // Just log the error and keep the user logged in
                }
            }
        } catch (error) {
            console.error('Unexpected error in checkAuth:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        try {
            const response = await authAPI.login({ username, password });
            const { user, access_token, refresh_token } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            setUser(user);
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const register = async (data: RegisterData) => {
        try {
            const response = await authAPI.register(data);
            const { user, access_token, refresh_token } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            setUser(user);
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Registration failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        window.location.href = '/';
    };

    // Improved isAuthenticated check
    // User is authenticated if:
    // 1. We have a user object in state, OR
    // 2. We have a valid access token in localStorage (means we're in the process of loading user data)
    // Note: Check if window exists to avoid SSR errors
    const isAuthenticated = !!user || (typeof window !== 'undefined' && !!localStorage.getItem('access_token'));

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
