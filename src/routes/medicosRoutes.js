const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { pool } = require('../config/db');

const router = express.Router();

router.get('/', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicos ORDER BY id_medico');
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar medicos' });
  }
});

router.post('/', auth, authorize(['ADMIN']), async (req, res) => {
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    cedula_profesional,
    id_especialidad,
    telefono,
    correo_electronico
  } = req.body || {};

  if (!nombre || !apellido_paterno || !cedula_profesional || !id_especialidad) {
    return res.status(400).json({ message: 'Datos requeridos incompletos' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO medicos (
        nombre, apellido_paterno, apellido_materno, cedula_profesional,
        id_especialidad, telefono, correo_electronico
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id_medico`,
      [
        nombre,
        apellido_paterno,
        apellido_materno || null,
        cedula_profesional,
        id_especialidad,
        telefono || null,
        correo_electronico || null
      ]
    );

    return res.status(201).json({ id_medico: result.rows[0].id_medico });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Cedula ya registrada' });
    }
    return res.status(500).json({ message: 'Error al registrar medico' });
  }
});

router.get('/:id', auth, authorize(['ADMIN']), async (req, res) => {
  const id = Number(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ message: 'Id invalido' });
  }

  try {
    const result = await pool.query('SELECT * FROM medicos WHERE id_medico = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Medico no encontrado' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar medico' });
  }
});

router.put('/:id', auth, authorize(['ADMIN']), async (req, res) => {
  const id = Number(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ message: 'Id invalido' });
  }

  const fields = {
    nombre: req.body.nombre,
    apellido_paterno: req.body.apellido_paterno,
    apellido_materno: req.body.apellido_materno,
    cedula_profesional: req.body.cedula_profesional,
    id_especialidad: req.body.id_especialidad,
    telefono: req.body.telefono,
    correo_electronico: req.body.correo_electronico,
    activo: req.body.activo
  };

  const keys = Object.keys(fields).filter((k) => fields[k] !== undefined);
  if (keys.length === 0) {
    return res.status(400).json({ message: 'Sin cambios para actualizar' });
  }

  const setClauses = keys.map((k, idx) => `${k} = $${idx + 1}`);
  const values = keys.map((k) => fields[k]);
  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE medicos SET ${setClauses.join(', ')} WHERE id_medico = $${values.length} RETURNING id_medico`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Medico no encontrado' });
    }

    return res.status(200).json({ id_medico: result.rows[0].id_medico });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Cedula ya registrada' });
    }
    return res.status(500).json({ message: 'Error al actualizar medico' });
  }
});

module.exports = router;
