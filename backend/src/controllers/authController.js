import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { sendPasswordRecovery } from '../utils/email.js';

export const registerUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'owner' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Campos requeridos: email, password, firstName, lastName' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();

    await run(
      'INSERT INTO users (id, email, password, firstName, lastName, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, firstName, lastName, phone, role]
    );

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

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

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
