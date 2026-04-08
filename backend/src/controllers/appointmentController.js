import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../config/database.js';
import { sendAppointmentConfirmation, sendCancellationNotification } from '../utils/email.js';

export const createAppointment = async (req, res) => {
  try {
    const { petId, serviceId, appointmentDate, appointmentTime, clinicId, notes } = req.body;
    const ownerId = req.user.userId;

    if (!petId || !serviceId || !appointmentDate || !appointmentTime || !clinicId) {
      return res.status(400).json({ error: 'Campos requeridos: petId, serviceId, appointmentDate, appointmentTime, clinicId' });
    }

    // Validar que la mascota pertenece al usuario
    const pet = await get('SELECT * FROM pets WHERE id = ? AND ownerId = ?', [petId, ownerId]);
    if (!pet) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    // Validar que el servicio existe
    const service = await get('SELECT * FROM services WHERE id = ? AND clinicId = ? AND isActive = 1', [serviceId, clinicId]);
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Validar que no exista una cita en el mismo horario
    const conflictingAppointment = await get(
      `SELECT * FROM appointments 
       WHERE clinicId = ? AND serviceId = ? AND appointmentDate = ? AND appointmentTime = ? 
       AND status IN ('programada', 'confirmada')`,
      [clinicId, serviceId, appointmentDate, appointmentTime]
    );

    if (conflictingAppointment) {
      return res.status(400).json({ error: 'No hay disponibilidad en ese horario' });
    }

    const appointmentId = uuidv4();

    await run(
      `INSERT INTO appointments (id, clinicId, petId, serviceId, ownerId, appointmentDate, appointmentTime, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [appointmentId, clinicId, petId, serviceId, ownerId, appointmentDate, appointmentTime, 'programada', notes || null]
    );

    // Obtener información para notificación
    const clinic = await get('SELECT name FROM clinics WHERE id = ?', [clinicId]);
    const user = await get('SELECT email, firstName FROM users WHERE id = ?', [ownerId]);

    // Enviar confirmación por email
    try {
      await sendAppointmentConfirmation(user.email, pet.name, service.name, `${appointmentDate} ${appointmentTime}`, clinic.name);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    res.status(201).json({
      message: 'Cita agendada exitosamente',
      appointment: {
        id: appointmentId,
        petName: pet.name,
        serviceName: service.name,
        appointmentDate,
        appointmentTime,
        status: 'programada'
      }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Error al agendar cita' });
  }
};

export const getAppointmentsByOwner = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { filter } = req.query;

    let query = `
      SELECT a.*, p.name as petName, s.name as serviceName, c.name as clinicName, c.phone as clinicPhone
      FROM appointments a
      JOIN pets p ON a.petId = p.id
      JOIN services s ON a.serviceId = s.id
      JOIN clinics c ON a.clinicId = c.id
      WHERE a.ownerId = ?
    `;
    const params = [ownerId];

    // Aplicar filtros
    const now = new Date().toISOString();
    
    if (filter === 'upcoming') {
      query += ` AND a.appointmentDate >= ? AND a.status IN ('programada', 'confirmada')`;
      params.push(now);
    } else if (filter === 'completed') {
      query += ` AND a.status = 'completada'`;
    } else if (filter === 'cancelled') {
      query += ` AND a.status = 'cancelada'`;
    }

    query += ' ORDER BY a.appointmentDate DESC';

    const appointments = await all(query, params);
    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// Alias para compatibilidad con frontend
export const getAppointments = getAppointmentsByOwner;

export const getAppointmentsByClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { date, status } = req.query;

    let query = `
      SELECT a.*, p.name as petName, s.name as serviceName, u.firstName as ownerName, u.email, u.phone
      FROM appointments a
      JOIN pets p ON a.petId = p.id
      JOIN services s ON a.serviceId = s.id
      JOIN users u ON a.ownerId = u.id
      WHERE a.clinicId = ?
    `;
    const params = [clinicId];

    if (date) {
      query += ` AND DATE(a.appointmentDate) = ?`;
      params.push(date);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.appointmentDate';

    const appointments = await all(query, params);
    res.json(appointments);
  } catch (error) {
    console.error('Get clinic appointments error:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    const { reason } = req.body;
    const ownerId = req.user.userId;

    const appointment = await get(
      `SELECT a.*, p.name as petName, s.name as serviceName, c.name as clinicName, u.email
       FROM appointments a
       JOIN pets p ON a.petId = p.id
       JOIN services s ON a.serviceId = s.id
       JOIN clinics c ON a.clinicId = c.id
       JOIN users u ON a.ownerId = u.id
       WHERE a.id = ? AND a.ownerId = ?`,
      [appointmentId, ownerId]
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (appointment.status === 'cancelada') {
      return res.status(400).json({ error: 'Esta cita ya fue cancelada' });
    }

    if (appointment.status === 'completada') {
      return res.status(400).json({ error: 'No se puede cancelar una cita completada' });
    }

    // Validar que haya al menos 24 horas de anticipación (opcional, based on requirements)
    // const appointmentDate = new Date(appointment.appointmentDate + ' ' + appointment.appointmentTime);
    // const now = new Date();
    // const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
    // if (hoursUntilAppointment < 24) {
    //   return res.status(400).json({ error: 'Solo se pueden cancelar citas con al menos 24 horas de anticipación' });
    // }

    await run(
      'UPDATE appointments SET status = ?, cancelReason = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelada', reason || 'Cancelada por usuario', appointmentId]
    );

    // Enviar notificación
    try {
      await sendCancellationNotification(appointment.email, appointment.petName, appointment.serviceName, appointment.clinicName);
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
    }

    res.json({ message: 'Cita cancelada exitosamente' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Error al cancelar cita' });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await get(
      `SELECT a.*, p.name as petName, s.name as serviceName, c.name as clinicName, c.phone as clinicPhone, pr.specialization
       FROM appointments a
       JOIN pets p ON a.petId = p.id
       JOIN services s ON a.serviceId = s.id
       JOIN clinics c ON a.clinicId = c.id
       LEFT JOIN professionals pr ON a.professionalId = pr.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Error al obtener cita' });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;
    const clinicId = req.user.clinicId;

    const validStatuses = ['programada', 'confirmada', 'completada', 'cancelada', 'no-presentada'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status debe ser uno de: ${validStatuses.join(', ')}` });
    }

    const appointment = await get(
      'SELECT * FROM appointments WHERE id = ? AND clinicId = ?',
      [appointmentId, clinicId]
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    await run(
      'UPDATE appointments SET status = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [status, notes || appointment.notes, appointmentId]
    );

    res.json({ message: 'Estado de cita actualizado' });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
};
