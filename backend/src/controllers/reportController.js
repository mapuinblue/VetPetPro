import { all, get } from '../config/database.js';

export const getAppointmentReport = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate y endDate son requeridos' });
    }

    const appointments = await all(
      `SELECT 
        a.appointmentDate,
        a.status,
        s.name as serviceName,
        s.price,
        p.name as petName,
        u.firstName as ownerName,
        u.email,
        u.phone
      FROM appointments a
      JOIN services s ON a.serviceId = s.id
      JOIN pets p ON a.petId = p.id
      JOIN users u ON a.ownerId = u.id
      WHERE a.clinicId = ? AND DATE(a.appointmentDate) BETWEEN ? AND ?
      ORDER BY a.appointmentDate DESC`,
      [clinicId, startDate, endDate]
    );

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completada').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelada').length;
    const noShowAppointments = appointments.filter(a => a.status === 'no-presentada').length;
    const totalRevenue = appointments
      .filter(a => a.status === 'completada')
      .reduce((sum, a) => sum + (a.price || 0), 0);

    res.json({
      period: { startDate, endDate },
      summary: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        completionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(2) + '%' : 'N/A',
        totalRevenue: totalRevenue.toFixed(2)
      },
      appointments
    });
  } catch (error) {
    console.error('Get appointment report error:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
};

export const getServiceReport = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const serviceStats = await all(
      `SELECT 
        s.id,
        s.name,
        s.category,
        s.price,
        COUNT(a.id) as totalAppointments,
        SUM(CASE WHEN a.status = 'completada' THEN 1 ELSE 0 END) as completedAppointments,
        SUM(CASE WHEN a.status = 'completada' THEN s.price ELSE 0 END) as totalRevenue
      FROM services s
      LEFT JOIN appointments a ON s.id = a.serviceId
      WHERE s.clinicId = ? AND s.isActive = 1
      GROUP BY s.id
      ORDER BY totalAppointments DESC`,
      [clinicId]
    );

    res.json({
      clinicId,
      services: serviceStats,
      topServices: serviceStats.slice(0, 5)
    });
  } catch (error) {
    console.error('Get service report error:', error);
    res.status(500).json({ error: 'Error al generar reporte de servicios' });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate y endDate son requeridos' });
    }

    const dailyRevenue = await all(
      `SELECT 
        DATE(a.appointmentDate) as date,
        COUNT(a.id) as appointmentCount,
        SUM(s.price) as totalRevenue
      FROM appointments a
      JOIN services s ON a.serviceId = s.id
      WHERE a.clinicId = ? AND a.status = 'completada' AND DATE(a.appointmentDate) BETWEEN ? AND ?
      GROUP BY DATE(a.appointmentDate)
      ORDER BY date DESC`,
      [clinicId, startDate, endDate]
    );

    const totalRevenue = dailyRevenue.reduce((sum, day) => sum + (day.totalRevenue || 0), 0);
    const averageDaily = dailyRevenue.length > 0 ? (totalRevenue / dailyRevenue.length).toFixed(2) : 0;

    res.json({
      period: { startDate, endDate },
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        daysWithAppointments: dailyRevenue.length,
        averageDailyRevenue: averageDaily
      },
      dailyBreakdown: dailyRevenue
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({ error: 'Error al generar reporte de ingresos' });
  }
};

export const getMostRequestedServices = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { limit = 10 } = req.query;

    const services = await all(
      `SELECT 
        s.id,
        s.name,
        s.category,
        COUNT(a.id) as requestCount,
        SUM(s.price) as totalRevenue
      FROM services s
      LEFT JOIN appointments a ON s.id = a.serviceId AND a.status = 'completada'
      WHERE s.clinicId = ? AND s.isActive = 1
      GROUP BY s.id
      ORDER BY requestCount DESC
      LIMIT ?`,
      [clinicId, limit]
    );

    res.json(services);
  } catch (error) {
    console.error('Get most requested services error:', error);
    res.status(500).json({ error: 'Error al obtener servicios más solicitados' });
  }
};
