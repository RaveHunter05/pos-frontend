// hooks/useApi.ts
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { useCallback } from 'react';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? __API_BASE_URL__ ?? '';

export const useApi = () => {
  const { getToken } = useAuth();

  const authRequest = useCallback(async (method: 'get' | 'post' | 'put' | 'delete', url: string, data?: any) => {
    const token = await getToken();
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    try {
      let response;
      switch (method) {
        case 'get':
          response = await axios.get(`${baseURL}${url}`, config);
          break;
        case 'post':
          response = await axios.post(`${baseURL}${url}`, data, config);
          break;
        case 'put':
          response = await axios.put(`${baseURL}${url}`, data, config);
          break;
        case 'delete':
          response = await axios.delete(`${baseURL}${url}`, config);
          break;
        default:
          throw new Error(`Método HTTP no soportado: ${method}`);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  }, [getToken]);

  return {
    get: (url: string) => authRequest('get', url),
    post: (url: string, data: any) => authRequest('post', url, data),
    put: (url: string, data: any) => authRequest('put', url, data),
    apiDelete: (url: string) => authRequest('delete', url)
  };
};
