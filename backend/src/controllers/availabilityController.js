import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../config/database.js';

/**
 * CONTROLADOR DE DISPONIBILIDAD
 * 
 * Maneja los horarios de atención y slots disponibles para agendamiento.
 * 
 * CONCEPTOS CLAVE:
 * - Disponibilidad: Horario de la clínica por día (ej: Lunes 9:00-17:00)
 * - Slots: Espacios de 30 min/15 min calculados dentro de esa disponibilidad
 * - Duración del servicio: Afecta cuanto tiempo necesita cada slot
 * 
 * EJEMPLO:
 * Lunes 9:00-11:00, servicio de 30 min:
 * → Slots: 9:00, 9:30, 10:00, 10:30
 * 
 * Lunes 9:00-11:00, servicio de 60 min:
 * → Slots: 9:00, 10:00
 */

/**
 * UPDATE CLINIC SCHEDULE - Crear o actualizar horario de un día
 * 
 * @route PUT /api/availability/schedule
 * @middleware authenticate, authorize(['clinic'])
 * @body {clinicId, dayOfWeek, startTime, endTime, isOpen}
 * @returns {statusCode: 200, message: "Actualizado"}
 * 
 * Parámetros:
 * - dayOfWeek: 0=domingo, 1=lunes, ..., 6=sábado
 * - startTime: "09:00" (formato HH:MM)
 * - endTime: "17:00"
 * - isOpen: true si el día tiene atención, false si está cerrado
 * 
 * Ejemplo de uso:
 * PUT /api/availability/schedule
 * Body: {
 *   clinicId: "xyz",
 *   dayOfWeek: 1,      // lunes
 *   startTime: "09:00",
 *   endTime: "18:00",
 *   isOpen: true
 * }
 */
export const updateClinicSchedule = async (req, res) => {
  try {
    const { clinicId, dayOfWeek, startTime, endTime, isOpen } = req.body;

    // Validar campos requeridos
    if (!clinicId || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Verificar si ya existe registro para este día
    const existing = await get(
      'SELECT id FROM availability WHERE clinicId = ? AND dayOfWeek = ?',
      [clinicId, dayOfWeek]
    );

    if (existing) {
      // UPDATE: Ya existe, actualizar
      await run(
        'UPDATE availability SET startTime = ?, endTime = ?, isActive = ? WHERE id = ?',
        [startTime, endTime, isOpen ? 1 : 0, existing.id]
      );
    } else {
      // INSERT: Nuevo registro
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

/**
 * GET CLINIC SCHEDULE - Obtener horarios completos de una clínica
 * 
 * @route GET /api/availability/schedule/:clinicId
 * @public (no requiere autenticación)
 * @param {clinicId} ID de la clínica
 * @returns {statusCode: 200, schedule: [
 *   {id, clinicId, dayOfWeek: 0-6, startTime, endTime, isActive},
 *   ...
 * ]}
 * 
 * Retorna los horarios para TODO S LOS DÍAS de la semana.
 * Ordenado por dayOfWeek (0=domingo primero)
 * 
 * Usando en frontend para:
 * - Mostrar horarios en perfil de clínica
 * - Calcular slots disponibles al agendar
 * - Validar si un día está cerrado
 */
export const getClinicSchedule = async (req, res) => {
  try {
    const { clinicId } = req.params;

    // Obtener todos los horarios, ordenados por día
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

/**
 * GET AVAILABLE SLOTS - Generar slots libres para agendamiento
 * 
 * @route GET /api/availability/slots?clinicId=X&serviceId=Y&date=2025-04-10
 * @public (no requiere autenticación)
 * @query {clinicId, serviceId, date}
 * @returns {statusCode: 200, slots: ["09:00", "09:30", "10:00", ...]}
 * 
 * ALGORITMO:
 * 1. Obtener duración del servicio
 * 2. Obtener horario de la clínica para ese día
 * 3. Generar slots de 30 minutos dentro del horario
 * 4. Obtener citas ya agendadas ese día
 * 5. Eliminar slots que conflictúan con citas existentes
 * 6. Retornar slots disponibles
 * 
 * EJEMPLO:
 * - Clínica abierta: 09:00-12:00
 * - Servicio duración: 30 min
 * - Citas agendadas: 10:00
 * 
 * Slots generados: 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
 * Slots ocupados: 10:00-10:30 (por cita)
 * Slots disponibles: 09:00, 09:30, 10:30, 11:00, 11:30
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { clinicId, serviceId, date } = req.query;

    // Validar parámetros
    if (!clinicId || !serviceId || !date) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }

    // Paso 1: Obtener duración del servicio
    const service = await get(
      'SELECT duration FROM services WHERE id = ? AND clinicId = ?',
      [serviceId, clinicId]
    );

    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Paso 2: Obtener horario de la clínica para ese día
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado

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
