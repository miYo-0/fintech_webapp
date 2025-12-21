// Axios API client with interceptors
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


// Track if we're currently refreshing to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If token expired, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, null, {
                    headers: {
                        Authorization: `Bearer ${refreshToken}`,
                    },
                });

                const { access_token } = response.data;
                localStorage.setItem('access_token', access_token);

                // Process queued requests
                processQueue(null, access_token);
                isRefreshing = false;

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                processQueue(refreshError, null);
                isRefreshing = false;

                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');

                // Only redirect if not already on login page
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);


export default api;

// API helper functions
export const authAPI = {
    register: (data: any) => api.post('/api/auth/register', data),
    login: (data: any) => api.post('/api/auth/login', data),
    getCurrentUser: () => api.get('/api/auth/me'),
    updateProfile: (data: any) => api.put('/api/auth/me', data),
    changePassword: (data: any) => api.post('/api/auth/change-password', data),
};

export const stocksAPI = {
    search: (query: string, limit = 10) => api.get(`/api/stocks/search?q=${query}&limit=${limit}`),
    getQuote: (symbol: string) => api.get(`/api/stocks/${symbol}/quote`),
    getHistorical: (symbol: string, period = '1y', interval = '1d') =>
        api.get(`/api/stocks/${symbol}/historical?period=${period}&interval=${interval}`),
    getInfo: (symbol: string) => api.get(`/api/stocks/${symbol}/info`),
    getIndicators: (symbol: string) => api.get(`/api/stocks/${symbol}/indicators`),
    list: (params: any) => api.get('/api/stocks/list', { params }),
};

export const portfolioAPI = {
    list: () => api.get('/api/portfolio/'),
    create: (data: any) => api.post('/api/portfolio/', data),
    get: (id: number) => api.get(`/api/portfolio/${id}`),
    delete: (id: number) => api.delete(`/api/portfolio/${id}`),
    addPosition: (id: number, data: any) => api.post(`/api/portfolio/${id}/positions`, data),
    getTransactions: (id: number, params: any) => api.get(`/api/portfolio/${id}/transactions`, { params }),
};

export const watchlistAPI = {
    list: () => api.get('/api/watchlist/'),
    create: (data: any) => api.post('/api/watchlist/', data),
    get: (id: number) => api.get(`/api/watchlist/${id}`),
    delete: (id: number) => api.delete(`/api/watchlist/${id}`),
    addStock: (id: number, data: any) => api.post(`/api/watchlist/${id}/items`, data),
    removeStock: (watchlistId: number, itemId: number) =>
        api.delete(`/api/watchlist/${watchlistId}/items/${itemId}`),
};

export const marketAPI = {
    getIndices: () => api.get('/api/market/indices'),
    getMovers: (market = 'US', limit = 10) => api.get(`/api/market/movers?market=${market}&limit=${limit}`),
    getOverview: () => api.get('/api/market/overview'),
};
