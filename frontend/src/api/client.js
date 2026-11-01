import axios from 'axios';

export const TOKEN_KEY = 'hg_token';

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('hg:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request && !error?.response) return 'Không kết nối được máy chủ';
  return fallback;
};

export default client;
