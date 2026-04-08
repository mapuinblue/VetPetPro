import { v4 as uuidv4 } from 'uuid';
import { all, get, run } from '../config/database.js';

export const createPet = async (req, res) => {
  try {
    const { name, breed, age, weight, allergies, microchipNumber, birthDate } = req.body;
    const ownerId = req.user.userId;

    if (!name || !breed) {
      return res.status(400).json({ error: 'Nombre y raza son requeridos' });
    }

    const petId = uuidv4();

    await run(
      `INSERT INTO pets (id, ownerId, name, species, breed, age, weight, allergies, microchipNumber, birthDate) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [petId, ownerId, name, 'perro', breed, age || null, weight || null, allergies || null, microchipNumber || null, birthDate || null]
    );

    res.status(201).json({
      message: 'Mascota registrada exitosamente',
      pet: {
        id: petId,
        name,
        breed,
        age,
        weight,
        allergies,
        microchipNumber,
        birthDate
      }
    });
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({ error: 'Error al registrar mascota' });
  }
};

export const getPetsByOwner = async (req, res) => {
  try {
    const ownerId = req.user.userId;

    const pets = await all(
      'SELECT * FROM pets WHERE ownerId = ? AND isActive = 1 ORDER BY createdAt DESC',
      [ownerId]
    );

    res.json(pets);
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ error: 'Error al obtener mascotas' });
  }
};

export const getPetById = async (req, res) => {
  try {
    const { petId } = req.params;
    const ownerId = req.user.userId;

    const pet = await get(
      'SELECT * FROM pets WHERE id = ? AND ownerId = ? AND isActive = 1',
      [petId, ownerId]
    );

    if (!pet) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    res.json(pet);
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({ error: 'Error al obtener mascota' });
  }
};

export const updatePet = async (req, res) => {
  try {
    const { petId } = req.params;
    const ownerId = req.user.userId;
    const { name, breed, age, weight, allergies, microchipNumber, birthDate } = req.body;

    const pet = await get('SELECT * FROM pets WHERE id = ? AND ownerId = ?', [petId, ownerId]);
    if (!pet) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    await run(
      `UPDATE pets SET name = ?, breed = ?, age = ?, weight = ?, allergies = ?, microchipNumber = ?, birthDate = ?, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name || pet.name, breed || pet.breed, age || pet.age, weight || pet.weight, allergies || pet.allergies, microchipNumber || pet.microchipNumber, birthDate || pet.birthDate, petId]
    );

    res.json({ message: 'Mascota actualizada exitosamente' });
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({ error: 'Error al actualizar mascota' });
  }
};

export const deletePet = async (req, res) => {
  try {
    const { petId } = req.params;
    const ownerId = req.user.userId;

    const pet = await get('SELECT * FROM pets WHERE id = ? AND ownerId = ?', [petId, ownerId]);
    if (!pet) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    // Soft delete
    await run('UPDATE pets SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [petId]);

    res.json({ message: 'Mascota eliminada' });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ error: 'Error al eliminar mascota' });
  }
};

export const getPetMedicalHistory = async (req, res) => {
  try {
    const { petId } = req.params;
    const ownerId = req.user.userId;

    const pet = await get('SELECT id FROM pets WHERE id = ? AND ownerId = ?', [petId, ownerId]);
    if (!pet) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const history = await all(
      'SELECT * FROM medical_history WHERE petId = ? ORDER BY createdAt DESC',
      [petId]
    );

    res.json(history);
  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({ error: 'Error al obtener historial clínico' });
  }
};
