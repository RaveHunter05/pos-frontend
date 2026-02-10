import { useState, useCallback } from 'react';
import { http } from '@/lib/http';
import { AssignUserToStore } from '@/types/domain';
import { useAuth } from '@clerk/clerk-react';

// Roles disponibles para asignación
export const AVAILABLE_ROLES = {
	OWNER: 'OWNER',
	MANAGER: 'MANAGER',
	SUPERVISOR: 'SUPERVISOR',
	CASHIER: 'CASHIER',
	EMPLOYEE: 'EMPLOYEE',
	VIEWER: 'VIEWER',
};

export const useStoreAssignments = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [assignments, setAssignments] = useState([]);

	const { getToken } = useAuth();

	// Función para asignar un rol a un usuario en una tienda
	const assignRole = useCallback(
		async ({ clerkId, storeId, role }: AssignUserToStore) => {
			setLoading(true);
			setError(null);

			try {
				const token = await getToken();
				// Validar que el rol sea válido
				if (!Object.values(AVAILABLE_ROLES).includes(role)) {
					throw new Error(
						`Rol inválido. Roles válidos: ${Object.values(AVAILABLE_ROLES).join(', ')}`,
					);
				}

				const response = await http.post(
					'/api/store-assignments',
					{
						clerkId,
						storeId,
						role,
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				);

				return response.data;
			} catch (err) {
				const errorMessage =
					err.response?.data?.message || err.message || 'Error al asignar rol';
				setError(errorMessage);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	// Función para actualizar el rol de una asignación existente
	const updateAssignment = useCallback(async (assignmentId, role) => {
		setLoading(true);
		setError(null);

		try {
			// Validar que el rol sea válido
			if (!Object.values(AVAILABLE_ROLES).includes(role)) {
				throw new Error(
					`Rol inválido. Roles válidos: ${Object.values(AVAILABLE_ROLES).join(', ')}`,
				);
			}

			const response = await http.put(
				`/api/store-assignments/${assignmentId}`,
				{ role },
			);

			return response.data;
		} catch (err) {
			const errorMessage =
				err.response?.data?.message ||
				err.message ||
				'Error al actualizar asignación';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	// Función para eliminar una asignación (remover rol)
	const removeAssignment = useCallback(async (assignmentId: string) => {
		setLoading(true);
		setError(null);

		try {
			const response = await http.delete(
				`/api/store-assignments/${assignmentId}`,
			);

			return response.data;
		} catch (err) {
			const errorMessage =
				err.response?.data?.message || 'Error al eliminar asignación';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	// Función para obtener todas las asignaciones de un usuario
	const getUserAssignments = useCallback(async (userId: string) => {
		setLoading(true);
		setError(null);

		try {
			const response = await http.get(`/api/store-assignments/user/${userId}`);
			setAssignments(response.data.data || response.data);
			return response.data;
		} catch (err) {
			const errorMessage =
				err.response?.data?.message ||
				'Error al obtener asignaciones del usuario';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	// Función para obtener todas las asignaciones de una tienda
	const getStoreAssignments = useCallback(async (storeId: string) => {
		setLoading(true);
		setError(null);

		try {
			const response = await http.get(
				`/api/store-assignments/store/${storeId}`,
			);
			setAssignments(response.data.data || response.data);
			return response.data;
		} catch (err) {
			const errorMessage =
				err.response?.data?.message ||
				'Error al obtener asignaciones de la tienda';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	// Función para obtener todas las asignaciones
	const getAllAssignments = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await http.get('/api/store-assignments');
			setAssignments(response.data.data || response.data);
			return response.data;
		} catch (err) {
			const errorMessage =
				err.response?.data?.message ||
				'Error al obtener todas las asignaciones';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	// Función para verificar si un usuario tiene acceso a una tienda específica
	const checkUserStoreAccess = useCallback(async (userId, storeId) => {
		setLoading(true);
		setError(null);

		try {
			const response = await http.get(
				`/api/store-assignments/check-access/${userId}/${storeId}`,
			);
			return response.data;
		} catch (err) {
			const errorMessage =
				err.response?.data?.message || 'Error al verificar acceso';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	// Función para obtener el rol de un usuario en una tienda específica
	const getUserStoreRole = useCallback(async (userId, storeId) => {
		setLoading(true);
		setError(null);

		try {
			const response = await http.get(
				`/api/store-assignments/user/${userId}/store/${storeId}`,
			);
			return response.data;
		} catch (err) {
			const errorMessage =
				err.response?.data?.message || 'Error al obtener rol';
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

	// Wrapper para acciones que requieren permisos de admin
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

	return {
		// Estado
		loading,
		error,
		assignments,

		// Roles disponibles
		availableRoles: AVAILABLE_ROLES,

		// Acciones básicas (públicas - para consultas)
		getUserAssignments,
		getStoreAssignments,
		getAllAssignments,
		checkUserStoreAccess,
		getUserStoreRole,

		// Acciones con permisos (solo admin)
		assignRole: assignRole,
		updateAssignment: withAdminCheck(updateAssignment),
		removeAssignment: withAdminCheck(removeAssignment),

		// Utilidades
		isAdmin: isAdmin(),
		clearError: () => setError(null),
		setAssignments,
	};
};

export default useStoreAssignments;
