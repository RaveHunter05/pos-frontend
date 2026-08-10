// hooks/useApi.ts
import { useAuth } from '@clerk/clerk-react';
import axios, { AxiosRequestConfig } from 'axios';
import { useCallback } from 'react';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? __API_BASE_URL__ ?? '';

export const useApi = () => {
	const { getToken } = useAuth();

	const authRequest = useCallback(
		async <T>(
			method: 'get' | 'post' | 'put' | 'delete',
			url: string,
			data?: any,
			config: AxiosRequestConfig = {},
		): Promise<T> => {
			const token = await getToken();

			const defaultConfig = {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json', // ← AGREGAR ESTO
				},
				...config,
			};

			try {
				let response;
				switch (method) {
					case 'get':
						response = await axios.get(`${baseURL}${url}`, defaultConfig);
						break;
					case 'post':
						response = await axios.post(
							`${baseURL}${url}`,
							data,
							defaultConfig,
						);
						break;
					case 'put':
						response = await axios.put(`${baseURL}${url}`, data, defaultConfig);
						break;
					case 'delete':
						response = await axios.delete(`${baseURL}${url}`, defaultConfig);
						break;
					default:
						throw new Error(`Método HTTP no soportado: ${method}`);
				}
				return response.data as T;
			} catch (error) {
				throw error;
			}
		},
		[getToken],
	);

	return {
		get: <T>(url: string, config?: AxiosRequestConfig) =>
			authRequest<T>('get', url, null, config),
		post: <T>(url: string, data: any, config?: AxiosRequestConfig) =>
			authRequest<T>('post', url, data, config),
		put: <T>(url: string, data: any, config?: AxiosRequestConfig) =>
			authRequest<T>('put', url, data, config),
		apiDelete: <T>(url: string) => authRequest<T>('delete', url),
	};
};
