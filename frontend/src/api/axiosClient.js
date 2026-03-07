import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

axiosClient.interceptors.request.use((config) => {
    // We bypassed login, so we use the mock token for all requests now.
    const token = 'mock-jwt-token';
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('llm_token');
            localStorage.removeItem('llm_user');
            window.location.href = '/login'; // Redirect on unauthorized
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
