import { http } from '@/lib/http';
import { useState, useEffect, useCallback } from 'react';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Función para obtener todos los usuarios
  const fetchUsers = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await http.get('/users', {
        params: { page, limit }
      });
      
      setUsers(response.data.data || response.data);
      
      // Si tu API devuelve información de paginación
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al cargar usuarios';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener un usuario específico
  const fetchUserById = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await http.get(`/users/${userId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al cargar el usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para crear un nuevo usuario (solo admin)
  const createUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await http.post('/users', userData);
      
      // Actualizar la lista de usuarios
      await fetchUsers(pagination.page, pagination.limit);
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al crear usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, pagination.page, pagination.limit]);

  // Función para actualizar un usuario
  const updateUser = useCallback(async (userId, userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await http.put(`/users/${userId}`, userData);
      
      // Actualizar el usuario en la lista local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, ...response.data } : user
        )
      );
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para eliminar un usuario
  const deleteUser = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      await http.delete(`/users/${userId}`);
      
      // Eliminar el usuario de la lista local
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para verificar si el usuario actual es admin
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

  // Hook para verificar permisos antes de ejecutar acciones
  const withAdminCheck = useCallback((callback) => {
    return async (...args) => {
      if (!isAdmin()) {
        setError('Acceso denegado. Solo administradores pueden realizar esta acción.');
        throw new Error('Access denied');
      }
      return callback(...args);
    };
  }, [isAdmin]);

  // Cargar usuarios al montar el componente (solo si es admin)
  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [fetchUsers, isAdmin]);

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    fetchUserById,
    createUser: withAdminCheck(createUser),
    updateUser: withAdminCheck(updateUser),
    deleteUser: withAdminCheck(deleteUser),
    isAdmin: isAdmin(),
    setPagination,
  };
};

export default useUsers;
