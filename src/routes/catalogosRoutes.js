const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { queryWithRole } = require('../config/db');

const router = express.Router();

router.get('/estados-consulta', auth, authorize(['ADMIN', 'USUARIO_GENERAL', 'MEDICO']), async (req, res) => {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      'SELECT id_estado, nombre FROM estados_consulta ORDER BY id_estado'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar estados de consulta' });
  }
});

router.get('/roles', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      'SELECT id_rol, nombre FROM roles ORDER BY id_rol'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar roles' });
  }
});

router.get('/medicos', auth, authorize(['ADMIN', 'USUARIO_GENERAL']), async (req, res) => {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      'SELECT id_medico, nombre, apellido_paterno, apellido_materno FROM medicos ORDER BY id_medico'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar medicos' });
  }
});

router.get('/especialidades', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      'SELECT id_especialidad, nombre FROM especialidades ORDER BY id_especialidad'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar especialidades' });
  }
});

router.get('/medicamentos', auth, authorize(['MEDICO']), async (req, res) => {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      'SELECT id_medicamento, nombre_generico, nombre_comercial, presentacion FROM medicamentos ORDER BY id_medicamento'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar medicamentos' });
  }
});

router.get('/laboratorios', auth, authorize(['MEDICO']), async (req, res) => {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      'SELECT id_laboratorio, nombre FROM laboratorios ORDER BY id_laboratorio'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar laboratorios' });
  }
});

module.exports = router;
