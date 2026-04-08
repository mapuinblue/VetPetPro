import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../config/database.js';

/**
 * CONTROLADOR DE SERVICIOS
 * 
 * Maneja todas las operaciones CRUD para los servicios de las clínicas.
 * Los servicios son las atenciones veterinarias que ofrece cada clínica
 * (ej: vacunación, limpieza dental, cirugía general, etc.)
 * 
 * CATEGORÍAS VÁLIDAS:
 * - salud: Servicios médicos preventivos y curativas
 * - estética: Grooming, baño, corte de pelo
 * - nutrición: Consulta nutricional, dietas especiales
 * - guardería: Cuidado diario, entrenamiento
 * - funeraria: Cremación, entierro
 */

/**
 * CREATE SERVICE - Crear un nuevo servicio
 * 
 * @route POST /api/services
 * @middleware authenticate, authorize(['clinic'])
 * @body {name, description, category, duration, price}
 * @returns {statusCode: 201, service: {...}}
 * 
 * Notas importantes:
 * - clinicId se obtiene del token JWT autenticado
 * - duration debe ser múltiplo de 15 (slot de 15 min)
 * - price se almacena en pesos colombianos (entero)
 * - Se valida que category esté en la lista permitida
 */
export const createService = async (req, res) => {
  try {
    const { name, description, category, duration, price } = req.body;
    const clinicId = req.user.clinicId; // Obtenido del token JWT

    // Validar campos requeridos
    if (!name || !category || !duration || price === undefined) {
      return res.status(400).json({ error: 'Campos requeridos: name, category, duration, price' });
    }

    // Validar que la categoría sea una de las permitidas
    const validCategories = ['salud', 'estética', 'nutrición', 'guardería', 'funeraria'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Categoría debe ser una de: ${validCategories.join(', ')}` });
    }

    // Generar ID único para el servicio
    const serviceId = uuidv4();

    // Insertar en la base de datos
    await run(
      'INSERT INTO services (id, clinicId, name, description, category, duration, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [serviceId, clinicId, name, description || null, category, duration, price]
    );

    // Responder con el servicio creado
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

/**
 * GET SERVICES BY CLINIC - Obtener todos los servicios activos de una clínica
 * 
 * @route GET /api/services/clinic/:clinicId
 * @public (no requiere autenticación)
 * @param {clinicId} ID de la clínica
 * @returns {statusCode: 200, services: [...]}
 * 
 * Notas:
 * - Solo devuelve servicios con isActive = 1
 * - Ordenados por categoría y luego nombre
 * - Se usa en el formulario de agendamiento de citas
 */
export const getServicesByClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;

    // Obtener solo servicios activos, ordenados por categoría
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

/**
 * GET SERVICES BY CATEGORY - Filtrar servicios por categoría
 * 
 * @route GET /api/services/search/:clinicId?category=salud
 * @public (no requiere autenticación)
 * @param {clinicId} ID de la clínica
 * @query {category} Categoría a filtrar (opcional)
 * @returns {statusCode: 200, services: [...]}
 */
export const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    const { clinicId } = req.params;

    // Construir query dinámicamente si se proporciona categoría
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

/**
 * UPDATE SERVICE - Actualizar un servicio existente
 * 
 * @route PUT /api/services/:serviceId
 * @middleware authenticate, authorize(['clinic'])
 * @param {serviceId} ID del servicio a actualizar
 * @body {name?, description?, category?, duration?, price?, isActive?}
 * @returns {statusCode: 200, message: 'Actualizado'}
 * 
 * Notas:
 * - Solo la clínica propietaria puede actualizar
 * - Los campos son opcionales (usa valores existentes si no se proporciona)
 * - Se valida que el servicio pertenezca a la clínica autenticada
 */
export const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { name, description, category, duration, price, isActive } = req.body;
    const clinicId = req.user.clinicId; // Obtener clínica del token

    // Verificar que el servicio existe y pertenece a esta clínica
    const service = await get('SELECT * FROM services WHERE id = ? AND clinicId = ?', [serviceId, clinicId]);
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Actualizar solo los campos proporcionados, mantener los otros
    await run(
      'UPDATE services SET name = ?, description = ?, category = ?, duration = ?, price = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [
        name || service.name,
        description || service.description,
        category || service.category,
        duration || service.duration,
        price !== undefined ? price : service.price,
        isActive !== undefined ? isActive : service.isActive,
        serviceId
      ]
    );

    res.json({ message: 'Servicio actualizado exitosamente' });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};

/**
 * DELETE SERVICE - Eliminar un servicio (soft delete)
 * 
 * @route DELETE /api/services/:serviceId
 * @middleware authenticate, authorize(['clinic'])
 * @param {serviceId} ID del servicio a eliminar
 * @returns {statusCode: 200, message: 'Eliminado'}
 * 
 * Notas:
 * - Usa SOFT DELETE: marca isActive = 0 en lugar de borrar del DB
 * - Permite recuperar servicios si es necesario
 * - El servicio seguirá existiendo en historial de citas
 */
export const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const clinicId = req.user.clinicId;

    // Verificar propiedad del servicio
    const service = await get('SELECT * FROM services WHERE id = ? AND clinicId = ?', [serviceId, clinicId]);
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Soft delete: marcar como inactivo en lugar de eliminar
    await run('UPDATE services SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [serviceId]);

    res.json({ message: 'Servicio eliminado' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
};

/**
 * GET SERVICE BY ID - Obtener detalles de un servicio específico
 * 
 * @route GET /api/services/:serviceId
 * @public (no requiere autenticación)
 * @param {serviceId} ID del servicio
 * @returns {statusCode: 200, service: {...}}
 * 
 * Notas:
 * - Solo devuelve servicios activos (isActive = 1)
 * - Usado al confirmar detalles antes de crear una cita
 */
export const getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Obtener servicio activo
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
