import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../config/database.js';

export const createClinic = async (req, res) => {
  try {
    const { name, email, phone, address, city, state, zipCode, website, description } = req.body;

    if (!name || !email || !phone || !address || !city || !state) {
      return res.status(400).json({ error: 'Campos requeridos: name, email, phone, address, city, state' });
    }

    const existingClinic = await get('SELECT id FROM clinics WHERE email = ?', [email]);
    if (existingClinic) {
      return res.status(400).json({ error: 'El email de la clínica ya existe' });
    }

    const clinicId = uuidv4();

    await run(
      `INSERT INTO clinics (id, name, email, phone, address, city, state, zipCode, website, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clinicId, name, email, phone, address, city, state, zipCode || null, website || null, description || null]
    );

    res.status(201).json({
      message: 'Clínica registrada exitosamente',
      clinic: {
        id: clinicId,
        name,
        email,
        phone,
        city
      }
    });
  } catch (error) {
    console.error('Create clinic error:', error);
    res.status(500).json({ error: 'Error al registrar clínica' });
  }
};

export const getClinicById = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const clinic = await get('SELECT * FROM clinics WHERE id = ? AND isActive = 1', [clinicId]);

    if (!clinic) {
      return res.status(404).json({ error: 'Clínica no encontrada' });
    }

    res.json(clinic);
  } catch (error) {
    console.error('Get clinic error:', error);
    res.status(500).json({ error: 'Error al obtener clínica' });
  }
};

export const getAllClinics = async (req, res) => {
  try {
    const { city, search } = req.query;

    let query = 'SELECT * FROM clinics WHERE isActive = 1';
    const params = [];

    if (city) {
      query += ' AND city = ?';
      params.push(city);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR city LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY name';

    const clinics = await all(query, params);
    res.json(clinics);
  } catch (error) {
    console.error('Get clinics error:', error);
    res.status(500).json({ error: 'Error al obtener clínicas' });
  }
};

export const updateClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { name, phone, address, city, state, zipCode, website, description, logo } = req.body;

    const clinic = await get('SELECT * FROM clinics WHERE id = ?', [clinicId]);
    if (!clinic) {
      return res.status(404).json({ error: 'Clínica no encontrada' });
    }

    await run(
      `UPDATE clinics 
       SET name = ?, phone = ?, address = ?, city = ?, state = ?, zipCode = ?, website = ?, description = ?, logo = ?, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        name || clinic.name,
        phone || clinic.phone,
        address || clinic.address,
        city || clinic.city,
        state || clinic.state,
        zipCode || clinic.zipCode,
        website || clinic.website,
        description || clinic.description,
        logo || clinic.logo,
        clinicId
      ]
    );

    res.json({ message: 'Clínica actualizada exitosamente' });
  } catch (error) {
    console.error('Update clinic error:', error);
    res.status(500).json({ error: 'Error al actualizar clínica' });
  }
};

export const deleteClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const clinic = await get('SELECT * FROM clinics WHERE id = ?', [clinicId]);
    if (!clinic) {
      return res.status(404).json({ error: 'Clínica no encontrada' });
    }

    // Soft delete
    await run('UPDATE clinics SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [clinicId]);

    res.json({ message: 'Clínica eliminada' });
  } catch (error) {
    console.error('Delete clinic error:', error);
    res.status(500).json({ error: 'Error al eliminar clínica' });
  }
};

export const getClinicStats = async (req, res) => {
  try {
    const { clinicId } = req.params;

    // Citas de hoy
    const todayAppointments = await get(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE clinicId = ? AND DATE(appointmentDate) = DATE('now')`,
      [clinicId]
    );

    // Servicios más solicitados
    const topServices = await all(
      `SELECT s.name, COUNT(*) as count FROM appointments a
       JOIN services s ON a.serviceId = s.id
       WHERE a.clinicId = ? AND a.status IN ('programada', 'confirmada', 'completada')
       GROUP BY s.id
       ORDER BY count DESC
       LIMIT 5`,
      [clinicId]
    );

    // Ingresos estimados
    const estimatedRevenue = await get(
      `SELECT SUM(s.price) as total FROM appointments a
       JOIN services s ON a.serviceId = s.id
       WHERE a.clinicId = ? AND a.status = 'completada'`,
      [clinicId]
    );

    res.json({
      todayAppointments: todayAppointments.count || 0,
      topServices: topServices || [],
      estimatedRevenue: estimatedRevenue.total || 0
    });
  } catch (error) {
    console.error('Get clinic stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
