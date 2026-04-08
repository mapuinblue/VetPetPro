import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../config/database.js';

// Crear o actualizar disponibilidad horaria de una clínica
export const updateClinicSchedule = async (req, res) => {
  try {
    const { clinicId, dayOfWeek, startTime, endTime, isOpen } = req.body;

    if (!clinicId || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Verificar si ya existe
    const existing = await get(
      'SELECT id FROM availability WHERE clinicId = ? AND dayOfWeek = ?',
      [clinicId, dayOfWeek]
    );

    if (existing) {
      await run(
        'UPDATE availability SET startTime = ?, endTime = ?, isActive = ? WHERE id = ?',
        [startTime, endTime, isOpen ? 1 : 0, existing.id]
      );
    } else {
      const id = uuidv4();
      await run(
        `INSERT INTO availability (id, clinicId, dayOfWeek, startTime, endTime, isActive)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, clinicId, dayOfWeek, startTime, endTime, isOpen ? 1 : 0]
      );
    }

    res.json({ message: 'Horario actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Error al actualizar horario' });
  }
};

// Obtener disponibilidad de una clínica
export const getClinicSchedule = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const schedule = await all(
      'SELECT * FROM availability WHERE clinicId = ? ORDER BY dayOfWeek',
      [clinicId]
    );

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Error al obtener horario' });
  }
};

// Generar slots disponibles para una fecha y servicio específico
export const getAvailableSlots = async (req, res) => {
  try {
    const { clinicId, serviceId, date } = req.query;

    if (!clinicId || !serviceId || !date) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }

    // Obtener servicio y su duración
    const service = await get(
      'SELECT duration FROM services WHERE id = ? AND clinicId = ?',
      [serviceId, clinicId]
    );

    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Obtener horario de ese día
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0=domingo, 1=lunes, etc.

    const schedule = await get(
      'SELECT * FROM availability WHERE clinicId = ? AND dayOfWeek = ? AND isActive = 1',
      [clinicId, dayOfWeek]
    );

    if (!schedule) {
      return res.json({ slots: [] }); // Clínica cerrada ese día
    }

    // Generar slots de 30 minutos
    const slots = [];
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMin, 0, 0);

    while (currentTime < endTime) {
      // Verificar que no haya cita en este horario
      const slotTime = currentTime.toTimeString().slice(0, 5);
      const existingAppointment = await get(
        `SELECT id FROM appointments 
         WHERE clinicId = ? AND serviceId = ? AND appointmentDate = ? AND appointmentTime = ?`,
        [clinicId, serviceId, date, slotTime]
      );

      if (!existingAppointment) {
        slots.push({
          time: slotTime,
          available: true
        });
      }

      // Sumar duración del servicio (en minutos)
      currentTime = new Date(currentTime.getTime() + service.duration * 60000);
    }

    res.json({ slots });
  } catch (error) {
    console.error('Error generating slots:', error);
    res.status(500).json({ error: 'Error al generar slots disponibles' });
  }
};

// Obtener citas de una clínica para un día
export const getClinicAppointmentsForDay = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Fecha requerida' });
    }

    const appointments = await all(
      `SELECT a.*, p.name as petName, u.firstName, u.lastName, s.name as serviceName
       FROM appointments a
       JOIN pets p ON a.petId = p.id
       JOIN users u ON p.ownerId = u.id
       JOIN services s ON a.serviceId = s.id
       WHERE a.clinicId = ? AND DATE(a.appointmentDate) = ?
       ORDER BY a.appointmentTime`,
      [clinicId, date]
    );

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};
