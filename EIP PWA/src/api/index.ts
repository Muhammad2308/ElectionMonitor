import axios, { type AxiosRequestConfig } from 'axios';
import { getDeviceId } from '../utils/deviceIdentity';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://elect-monitor.cybernetsystems.ng');

/**
 * The response interceptor below unwraps AxiosResponse down to `.data` at
 * runtime, but axios's own types don't know that — left alone, every call
 * site would see `.get()` etc. as resolving to `AxiosResponse<T>` and have
 * to fight it with casts. This interface says what actually comes back.
 */
interface DataClient {
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const client = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor to add the auth token and device identity.
// Protected endpoints require both — DeviceBindingMiddleware rejects any
// request missing X-Device-ID, independent of a valid bearer token.
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Device-ID'] = getDeviceId();
    return config;
});

// Response interceptor for handling common errors
client.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized (e.g., redirect to login)
            localStorage.removeItem('auth_token');
            window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(error);
    }
);

const api = client as unknown as DataClient;

export default api;
