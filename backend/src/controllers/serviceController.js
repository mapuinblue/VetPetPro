import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../config/database.js';

export const createService = async (req, res) => {
  try {
    const { name, description, category, duration, price } = req.body;
    const clinicId = req.user.clinicId;

    if (!name || !category || !duration || price === undefined) {
      return res.status(400).json({ error: 'Campos requeridos: name, category, duration, price' });
    }

    const validCategories = ['salud', 'estética', 'nutrición', 'guardería', 'funeraria'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Categoría debe ser una de: ${validCategories.join(', ')}` });
    }

    const serviceId = uuidv4();

    await run(
      'INSERT INTO services (id, clinicId, name, description, category, duration, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [serviceId, clinicId, name, description || null, category, duration, price]
    );

    res.status(201).json({
      message: 'Servicio creado exitosamente',
      service: {
        id: serviceId,
        name,
        description,
        category,
        duration,
        price
      }
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
};

export const getServicesByClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const services = await all(
      'SELECT * FROM services WHERE clinicId = ? AND isActive = 1 ORDER BY category, name',
      [clinicId]
    );

    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
};

export const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    const { clinicId } = req.params;

    let query = 'SELECT * FROM services WHERE clinicId = ? AND isActive = 1';
    const params = [clinicId];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY name';

    const services = await all(query, params);
    res.json(services);
  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
};

export const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { name, description, category, duration, price, isActive } = req.body;
    const clinicId = req.user.clinicId;

    const service = await get('SELECT * FROM services WHERE id = ? AND clinicId = ?', [serviceId, clinicId]);
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    await run(
      'UPDATE services SET name = ?, description = ?, category = ?, duration = ?, price = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [name || service.name, description || service.description, category || service.category, duration || service.duration, price !== undefined ? price : service.price, isActive !== undefined ? isActive : service.isActive, serviceId]
    );

    res.json({ message: 'Servicio actualizado exitosamente' });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const clinicId = req.user.clinicId;

    const service = await get('SELECT * FROM services WHERE id = ? AND clinicId = ?', [serviceId, clinicId]);
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Soft delete
    await run('UPDATE services SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [serviceId]);

    res.json({ message: 'Servicio eliminado' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await get('SELECT * FROM services WHERE id = ? AND isActive = 1', [serviceId]);

    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Error al obtener servicio' });
  }
};
