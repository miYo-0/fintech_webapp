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

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If token expired, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, null, {
                        headers: {
                            Authorization: `Bearer ${refreshToken}`,
                        },
                    });

                    const { access_token } = response.data;
                    localStorage.setItem('access_token', access_token);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
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
