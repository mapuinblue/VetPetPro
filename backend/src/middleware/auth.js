import { verifyToken } from '../utils/jwt.js';

/**
 * MIDDLEWARE DE AUTENTICACIÓN
 * 
 * Valida que las solicitudes sean de usuarios autenticados.
 * Extrae el JWT token del header Authorization y lo verifica.
 * 
 * USO EN RUTAS:
 * router.post('/ruta-protegida', authenticate, miControlador);
 * router.post('/ruta-restringida', authenticate, authorize(['clinic', 'admin']), miControlador);
 * 
 * HEADER REQUERIDO:
 * Authorization: Bearer <JWT_TOKEN>
 * 
 * El JWT contiene:
 * {
 *   userId: "uuid",
 *   role: "owner|clinic|admin",
 *   clinicId: "uuid" (opcional, solo si role='clinic'),
 *   iat: timestamp,
 *   exp: timestamp + 7 días
 * }
 */

/**
 * MIDDLEWARE: Authenticate
 * 
 * Verifica que el token JWT sea válido.
 * Si es válido, añade los datos decodificados a req.user
 * Si no es válido, responde con error 401.
 * 
 * @middleware
 * @throws 401 - Si no hay token o token inválido
 * 
 * DESPUÉS DE EJECUTAR:
 * - req.user.userId: ID del usuario
 * - req.user.role: Rol del usuario
 * - req.user.clinicId: ID de la clínica (si aplica)
 */
export const authenticate = (req, res, next) => {
  // Extraer token del header "Authorization: Bearer <token>"
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  // Verificar que el token sea válido
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Guardar datos del usuario decorados en req.user
  // Ahora están disponibles en controladores como: req.user.userId, req.user.role, etc.
  req.user = decoded;
  next();
};

/**
 * MIDDLEWARE: Authorize
 * 
 * Valida que el usuario autenticado tenga uno de los roles especificados.
 * Debe ejecutarse DESPUÉS de authenticate.
 * 
 * USO:
 * authorize(['clinic', 'admin']) - Solo clínicas y admins
 * authorize(['admin']) - Solo admins
 * 
 * @param {string[]} roles - Array de roles permitidos
 * @middleware
 * @throws 401 - Si no autenticado (auth middleware no ejecutado)
 * @throws 403 - Si rol no permitido
 * 
 * EJEMPLO COMPLETO:
 * router.delete(
 *   '/:serviceId',
 *   authenticate,         // Primero: verificar token
 *   authorize(['clinic']), // Luego: verificar rol
 *   deleteService          // Finalmente: ejecutar controlador
 * );
 */
export const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    next();
  };
};

/**
 * MIDDLEWARE: Error Handler Global
 * 
 * Captura errores no controlados y los formatea en respuestas JSON.
 * Útil para:
 * - ValidationErrors
 * - Errores de base de datos
 * - Errores inesperados
 * 
 * DEBE registrarse como último middleware en Express:
 * app.use(errorHandler);
 * 
 * @middleware
 * @param {Error} err - Error capturado
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Manejo especial para errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Error genérico
  res.status(500).json({ 
    error: 'Error interno del servidor',
    // En desarrollo, mostrar detalles del error; en producción, no
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
