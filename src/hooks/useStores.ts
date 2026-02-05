import { useState, useEffect, useCallback } from 'react';
import { http } from '@/lib/http';
import { useAuth } from '@clerk/clerk-react';
import { Store } from '@/types/domain';

export const useStores = () => {
	const [stores, setStores] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [selectedStore, setSelectedStore] = useState<Store | null>(null);

	const { getToken } = useAuth();

	// Función para obtener todas las tiendas
	const fetchStores = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const token = await getToken();
			const response = await http.get(
				'/api/stores',

				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			// Mapeamos solo id y name según lo solicitado
			const storesData = response.data.data || response.data;
			const simplifiedStores = storesData.map((store) => ({
				id: store.id,
				name: store.name,
			}));

			setStores(simplifiedStores);
			return simplifiedStores;
		} catch (err) {
			const errorMessage =
				err.response?.data?.message || 'Error al cargar tiendas';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	// Función para obtener una tienda específica
	const fetchStoreById = useCallback(async (storeId) => {
		setLoading(true);
		setError(null);

		try {
			const response = await http.get(`/stores/${storeId}`);
			const store = {
				id: response.data.id,
				name: response.data.name,
			};
			setSelectedStore(store);
			return store;
		} catch (err) {
			const errorMessage =
				err.response?.data?.message || 'Error al cargar la tienda';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	// Función para crear una nueva tienda (solo admin)
	const createStore = useCallback(async (storeData) => {
		setLoading(true);
		setError(null);

		try {
			const response = await http.post('/stores', storeData);
			const newStore = {
				id: response.data.id,
				name: response.data.name,
			};

			// Actualizar la lista de tiendas
			setStores((prevStores) => [...prevStores, newStore]);

			return newStore;
		} catch (err) {
			const errorMessage =
				err.response?.data?.message || 'Error al crear tienda';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	// Función para actualizar una tienda
	const updateStore = useCallback(
		async (storeId, storeData) => {
			setLoading(true);
			setError(null);

			try {
				const response = await http.put(`/stores/${storeId}`, storeData);
				const updatedStore = {
					id: response.data.id,
					name: response.data.name,
				};

				// Actualizar la tienda en la lista local
				setStores((prevStores) =>
					prevStores.map((store) =>
						store.id === storeId ? updatedStore : store,
					),
				);

				// Si está seleccionada, actualizarla también
				if (selectedStore && selectedStore.id === storeId) {
					setSelectedStore(updatedStore);
				}

				return updatedStore;
			} catch (err) {
				const errorMessage =
					err.response?.data?.message || 'Error al actualizar tienda';
				setError(errorMessage);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[selectedStore],
	);

	// Función para eliminar una tienda
	const deleteStore = useCallback(
		async (storeId) => {
			setLoading(true);
			setError(null);

			try {
				await http.delete(`/stores/${storeId}`);

				// Eliminar la tienda de la lista local
				setStores((prevStores) =>
					prevStores.filter((store) => store.id !== storeId),
				);

				// Si estaba seleccionada, limpiarla
				if (selectedStore && selectedStore.id === storeId) {
					setSelectedStore(null);
				}

				return true;
			} catch (err) {
				const errorMessage =
					err.response?.data?.message || 'Error al eliminar tienda';
				setError(errorMessage);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[selectedStore],
	);

	// Función para buscar tiendas por nombre
	const searchStores = useCallback(async (searchTerm: String) => {
		setLoading(true);
		setError(null);

		try {
			const response = await http.get('/stores', {
				params: { search: searchTerm },
			});

			const storesData = response.data.data || response.data;
			const simplifiedStores = storesData.map((store) => ({
				id: store.id,
				name: store.name,
			}));

			setStores(simplifiedStores);
			return simplifiedStores;
		} catch (err) {
			const errorMessage =
				err.response?.data?.message || 'Error al buscar tiendas';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	// Función para verificar permisos de admin
	const isAdmin = useCallback(() => {
		const userData = localStorage.getItem('user');
		if (!userData) return false;

		try {
			const user = JSON.parse(userData);
			return user.role === 'admin';
		} catch {
			return false;
		}
	}, []);

	// Hook para acciones que requieren permisos de admin
	const withAdminCheck = useCallback(
		(callback) => {
			return async (...args) => {
				if (!isAdmin()) {
					setError(
						'Acceso denegado. Solo administradores pueden realizar esta acción.',
					);
					throw new Error('Access denied');
				}
				return callback(...args);
			};
		},
		[isAdmin],
	);

	// Cargar tiendas al montar el componente
	useEffect(() => {
		fetchStores();
	}, [fetchStores]);

	return {
		// Estado
		stores,
		loading,
		error,
		selectedStore,

		// Acciones básicas
		fetchStores,
		fetchStoreById,
		searchStores,
		setSelectedStore,

		// Acciones con permisos (solo admin)
		createStore: withAdminCheck(createStore),
		updateStore: withAdminCheck(updateStore),
		deleteStore: withAdminCheck(deleteStore),

		// Utilidades
		isAdmin: isAdmin(),

		// Getters útiles
		getStoreById: useCallback(
			(id) => stores.find((store) => store.id === id),
			[stores],
		),

		getStoreName: useCallback(
			(id) => {
				const store = stores.find((store) => store.id === id);
				return store ? store.name : 'Tienda no encontrada';
			},
			[stores],
		),
	};
};

export default useStores;
