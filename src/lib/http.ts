import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? __API_BASE_URL__ ?? '';

export const http = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false
});

http.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.debug('[HTTP] Request', config.method?.toUpperCase(), config.url, config.params, config.data);
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.debug('[HTTP] Response', response.status, response.config.url, response.data);
    }
    return response;
  },
  (error) => {
    console.error('[HTTP] Error', error);
    return Promise.reject(error);
  }
);
