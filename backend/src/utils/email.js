import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { run } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

let transporter;

const initTransporter = () => {
  if (transporter) return;

  if (config.EMAIL_AUTH_USER && config.EMAIL_AUTH_PASS) {
    transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_SECURE,
      auth: {
        user: config.EMAIL_AUTH_USER,
        pass: config.EMAIL_AUTH_PASS
      }
    });
  } else {
    // Modo desarrollo: usar Ethereal
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'mariah.huel@ethereal.email',
        pass: 'VfPgvCKnEMYGN5AyFu'
      }
    });
  }
};

export const sendAppointmentConfirmation = async (email, petName, serviceName, appointmentDate, clinic) => {
  initTransporter();

  const mailOptions = {
    from: config.EMAIL_FROM,
    to: email,
    subject: `Confirmación de cita - ${petName} en ${clinic}`,
    html: `
      <h2>Confirmación de Cita Veterinaria</h2>
      <p>Tu cita ha sido confirmada exitosamente.</p>
      <ul>
        <li><strong>Mascota:</strong> ${petName}</li>
        <li><strong>Servicio:</strong> ${serviceName}</li>
        <li><strong>Fecha:</strong> ${new Date(appointmentDate).toLocaleDateString('es-ES')}</li>
        <li><strong>Hora:</strong> ${new Date(appointmentDate).toLocaleTimeString('es-ES')}</li>
        <li><strong>Clínica:</strong> ${clinic}</li>
      </ul>
      <p>Por favor, llega con 15 minutos de anticipación.</p>
      <p>¿Necesitas cancelar? Puedes hacerlo con al menos 24 horas de anticipación.</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    const logId = uuidv4();
    await run(
      'INSERT INTO email_logs (id, to_email, subject, type, status, sentAt) VALUES (?, ?, ?, ?, ?, ?)',
      [logId, email, mailOptions.subject, 'APPOINTMENT_CONFIRMATION', 'SENT', new Date()]
    );

    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    const logId = uuidv4();
    await run(
      'INSERT INTO email_logs (id, to_email, subject, type, status) VALUES (?, ?, ?, ?, ?)',
      [logId, email, mailOptions.subject, 'APPOINTMENT_CONFIRMATION', 'FAILED']
    );
    throw error;
  }
};

export const sendAppointmentReminder = async (email, petName, appointmentDate, clinic) => {
  initTransporter();

  const mailOptions = {
    from: config.EMAIL_FROM,
    to: email,
    subject: `Recordatorio: Cita mañana - ${petName}`,
    html: `
      <h2>Recordatorio de Cita</h2>
      <p>Te recordamos que tienes una cita mañana.</p>
      <ul>
        <li><strong>Mascota:</strong> ${petName}</li>
        <li><strong>Fecha:</strong> ${new Date(appointmentDate).toLocaleDateString('es-ES')}</li>
        <li><strong>Hora:</strong> ${new Date(appointmentDate).toLocaleTimeString('es-ES')}</li>
        <li><strong>Clínica:</strong> ${clinic}</li>
      </ul>
      <p>Por favor, llega con anticipación.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
};

export const sendPasswordRecovery = async (email, resetToken, userName) => {
  initTransporter();

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password/${resetToken}`;

  const mailOptions = {
    from: config.EMAIL_FROM,
    to: email,
    subject: 'Recuperación de contraseña - VetPetPro',
    html: `
      <h2>Recuperación de Contraseña</h2>
      <p>Hola ${userName},</p>
      <p>Recibimos una solicitud para recuperar tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
      <p><a href="${resetLink}">Recuperar contraseña</a></p>
      <p>Este enlace es válido por 24 horas.</p>
      <p>Si no solicitaste esto, ignora este correo.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password recovery email:', error);
  }
};

export const sendCancellationNotification = async (email, petName, serviceName, clinic) => {
  initTransporter();

  const mailOptions = {
    from: config.EMAIL_FROM,
    to: email,
    subject: `Cancelación de cita - ${petName}`,
    html: `
      <h2>Cita Cancelada</h2>
      <p>Tu cita ha sido cancelada.</p>
      <ul>
        <li><strong>Mascota:</strong> ${petName}</li>
        <li><strong>Servicio:</strong> ${serviceName}</li>
        <li><strong>Clínica:</strong> ${clinic}</li>
      </ul>
      <p>Puedes agendar una nueva cita en cualquier momento.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending cancellation email:', error);
  }
};
