import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.wooraentreprises.com';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies
});

client.interceptors.request.use((config) => {
  // We don't need to manually attach the token anymore if using cookies
  // But we can keep it as a fallback or for hybrid support if local storage is still used
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops and don't retry on login failure
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh') && !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token via cookie
        await client.post('/auth/refresh');

        // If successful, retry the original request
        return client(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear everything and redirect to login
        localStorage.removeItem('jwt_token'); // Clear legacy token if any
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default client;
