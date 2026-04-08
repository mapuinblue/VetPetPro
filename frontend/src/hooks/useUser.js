import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Verificar cambios en token cada 500ms para actualizar Header cuando hay login en otra parte
    const checkInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && !user) {
        // Token agregado recientemente, cargar usuario
        fetchUser();
      } else if (!token && user) {
        // Token eliminado recientemente
        setUser(null);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [user]);

  return { user, loading };
}
