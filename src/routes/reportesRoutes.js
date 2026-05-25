const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { queryWithRole } = require('../config/db');

const router = express.Router();

router.get('/consultas-mes', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT
         EXTRACT(YEAR FROM fecha_hora) AS anio,
         EXTRACT(MONTH FROM fecha_hora) AS mes,
         COUNT(*) AS total
       FROM vw_historial_consultas
       GROUP BY EXTRACT(YEAR FROM fecha_hora), EXTRACT(MONTH FROM fecha_hora)
       ORDER BY anio, mes`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al cargar reporte' });
  }
});

router.get('/facturacion-mes', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT
         anio,
         mes,
         total_cobrado
       FROM vw_facturacion_mensual`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al cargar reporte' });
  }
});

router.get('/historial-consultas', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT id_consulta, fecha_hora, estado,
              id_paciente, nombre_paciente, apellido_paciente,
              id_medico, nombre_medico, apellido_medico,
              diagnostico
       FROM vw_historial_consultas
       ORDER BY fecha_hora DESC
       LIMIT 100`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al cargar historial de consultas' });
  }
});

router.get('/ocupacion-camas', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT id_hospitalizacion, cama, fecha_ingreso,
              id_paciente, nombre_paciente, apellido_paciente,
              id_medico, nombre_medico, apellido_medico
       FROM vw_ocupacion_camas
       ORDER BY fecha_ingreso DESC`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al cargar ocupacion de camas' });
  }
});

router.get('/inventario-farmacia', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT id_medicamento, nombre_generico, nombre_comercial,
              presentacion, stock, precio_unitario
       FROM vw_inventario_farmacia
       LIMIT 100`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al cargar inventario de farmacia' });
  }
});

module.exports = router;
