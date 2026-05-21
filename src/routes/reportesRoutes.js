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
       FROM consultas
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

module.exports = router;
