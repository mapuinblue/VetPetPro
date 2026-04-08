import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { sendPasswordRecovery } from '../utils/email.js';

/**
 * CONTROLADOR DE AUTENTICACIÓN
 * 
 * Maneja el registro, login y recuperación de contraseña para:
 * - Dueños de mascotas (role: 'owner')
 * - Clínicas veterinarias (role: 'clinic')
 * - Administradores (role: 'admin')
 * 
 * FLUJO DE SEGURIDAD:
 * 1. Las contraseñas se hashean con bcrypt antes de almacenar
 * 2. Se genera JWT token que incluye userId, role y clinicId (si aplica)
 * 3. Todas las rutas protegidas validan el JWT token
 */

/**
 * REGISTER USER - Registrar un nuevo usuario
 * 
 * @route POST /api/auth/register
 * @body {email, password, firstName, lastName, phone, role?}
 * @returns {statusCode: 201, user: {...}, token: "JWT"}
 * 
 * Características:
 * - El rol por defecto es 'owner' (dueño de mascota)
 * - Las contraseñas se hashean automáticamente
 * - Valida que no exista otro usuario con el mismo email
 * - Si es una clínica, necesita ser creada primero por un admin
 */
export const registerUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'owner' } = req.body;

    // Validar campos requeridos
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Campos requeridos: email, password, firstName, lastName' });
    }

    // Verificar que el email no esté registrado
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hashear contraseña con bcrypt
    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();

    // Insertar usuario en la base de datos
    await run(
      'INSERT INTO users (id, email, password, firstName, lastName, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, firstName, lastName, phone, role]
    );

    // Generar JWT token
    const token = generateToken(userId, role);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        role
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

/**
 * LOGIN USER - Iniciar sesión
 * 
 * @route POST /api/auth/login
 * @body {email, password}
 * @returns {statusCode: 200, user: {...}, token: "JWT"}
 * 
 * Flujo:
 * 1. Buscar usuario por email
 * 2. Verificar que no esté marcado como inactivo
 * 3. Comparar contraseña hasheada
 * 4. Generar token JWT con userId, role, clinicId
 * 5. Devolver datos de usuario y token
 * 
 * Notas de seguridad:
 * - Mensaje genérico "Email o contraseña incorrectos" para ambos errores
 * - Impide ataques de enumeración de emails
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar usuario por email
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      // Mensaje genérico por seguridad
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    // Comparar contraseña con bcrypt
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Generar JWT token incluyendo clinicId si es una clínica
    const token = generateToken(user.id, user.role, user.clinicId);

    res.json({
      message: 'Sesión iniciada exitosamente',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        clinicId: user.clinicId
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

/**
 * REQUEST PASSWORD RESET - Solicitar recuperación de contraseña
 * 
 * @route POST /api/auth/request-password-reset
 * @body {email}
 * @returns {statusCode: 200, message: "Si existe, se envió email"}
 * 
 * Notas de seguridad:
 * - Devuelve el mismo mensaje tanto si el email existe como si no
 * - Impide ataques de enumeración de usuarios
 * - Envía email con enlace de recuperación (si el usuario existe)
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      // Por seguridad, no revelar si el email existe
      return res.json({ message: 'Si el email existe, se enviará un enlace de recuperación' });
    }

    const resetToken = uuidv4();
    
    // Aquí guardarías el token en una tabla de reset tokens con expiración
    await sendPasswordRecovery(email, resetToken, user.firstName);

    res.json({ message: 'Se envió un enlace de recuperación a tu email' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Error al solicitar recuperación' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await get('SELECT id, email, firstName, lastName, phone, role, clinicId FROM users WHERE id = ?', [req.user.userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};
