import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

/**
 * HOOK: useUser
 * 
 * Hook personalizado para manejar el estado de autenticación del usuario.
 * Se usa en toda la aplicación para obtener datos del usuario autenticado.
 * 
 * USO:
 * const { user, loading } = useUser();
 * 
 * if (loading) return <div>Cargando...</div>;
 * if (!user) return <div>No autenticado</div>;
 * 
 * console.log(user.id, user.email, user.role, user.clinicId);
 * 
 * DATOS DEL USUARIO RETORNADOS:
 * - id: UUID del usuario
 * - email: Email único del usuario
 * - firstName: Nombre del usuario
 * - lastName: Apellido del usuario
 * - role: 'owner', 'clinic', o 'admin'
 * - clinicId: ID de la clínica (solo si role='clinic')
 * 
 * FLUJO INTERNO:
 * 1. Al montar el componente, intenta obtener token de localStorage
 * 2. Si hay token, llama al backend para obtener datos del usuario
 * 3. Monitorea cambios en localStorage cada 500ms para sincronizar autenticación
 * 4. Si el token cambia (login/logout), actualiza el estado automáticamente
 */
export function useUser() {
  // Estado del usuario actual (null si no autenticado)
  const [user, setUser] = useState(null);
  
  // Estado de carga (true mientras se obtienen datos del backend)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Fetch del usuario actual desde el backend
     * Usa el token JWT almacenado en localStorage para obtener datos del usuario
     */
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      
      // Si no hay token, no hay usuario autenticado
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Obtener datos del usuario usando el token (incluido en headers por interceptor)
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
      } catch (error) {
        // Si hay error obtener el usuario, asumimos token inválido
        setUser(null);
      } finally {
        // Indicar que ya terminó la carga
        setLoading(false);
      }
    };

    // Ejecutar fetch al montar
    fetchUser();

    /**
     * MONITOREO DE CAMBIOS EN AUTENTICACIÓN
     * 
     * Verifica cada 500ms si ha habido cambios en el token.
     * Esto permite que el Header se actualice cuando hay login/logout
     * en formularios que están en el mismo componente.
     * 
     * Casos manejados:
     * - Token agregado: refetch del usuario
     * - Token eliminado: limpiar usuario
     */
    let lastToken = localStorage.getItem('token');
    const checkInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      
      // Solo actuar si el token cambió
      if (token !== lastToken) {
        lastToken = token;
        
        // Caso 1: Hay token pero no tenemos usuario cargado (login reciente)
        if (token && !user) {
          fetchUser();
        } 
        // Caso 2: No hay token pero tenemos usuario cargado (logout reciente)
        else if (!token && user) {
          setUser(null);
        }
      }
    }, 500);

    // Limpiar intervalo al desmontar
    return () => clearInterval(checkInterval);
  }, [user]);

  return { user, loading };
}
