const { queryWithRole, withRoleTransaction } = require('../config/db');

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function getMedicoId(req) {
  const idMedico = req.user && req.user.id_medico ? Number(req.user.id_medico) : null;
  return isPositiveNumber(idMedico) ? idMedico : null;
}

async function getAgendaHoy(req, res) {
  const idMedico = getMedicoId(req);
  if (!idMedico) {
    return res.status(400).json({ message: 'Medico no asociado al usuario' });
  }

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT c.id_consulta, c.fecha_hora, c.motivo, c.id_estado,
              p.id_paciente, p.nombre, p.apellido_paterno, p.apellido_materno
       FROM consultas c
       JOIN pacientes p ON p.id_paciente = c.id_paciente
       WHERE c.id_medico = $1
         AND DATE(c.fecha_hora) = CURRENT_DATE
       ORDER BY c.fecha_hora`,
      [idMedico]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar agenda' });
  }
}

async function atenderConsulta(req, res) {
  const idMedico = getMedicoId(req);
  const idConsulta = Number(req.params.id);
  const {
    sintomas,
    peso,
    talla,
    temperatura,
    presion_arterial,
    frecuencia_cardiaca,
    diagnostico,
    notas
  } = req.body || {};

  if (!idMedico || !isPositiveNumber(idConsulta) || !diagnostico) {
    return res.status(400).json({ message: 'Datos requeridos incompletos' });
  }

  try {
    const estado = await queryWithRole(
      req.user.dbRole,
      'SELECT id_estado FROM estados_consulta WHERE nombre = $1',
      ['Atendida']
    );

    if (estado.rowCount === 0) {
      return res.status(500).json({ message: 'Estado Atendida no existe' });
    }

    const notasPayload = {
      sintomas: sintomas || null,
      peso: peso || null,
      talla: talla || null,
      temperatura: temperatura || null,
      presion_arterial: presion_arterial || null,
      frecuencia_cardiaca: frecuencia_cardiaca || null,
      notas: notas || null
    };

    const result = await queryWithRole(
      req.user.dbRole,
      `UPDATE consultas
       SET diagnostico = $1,
           notas = $2,
           id_estado = $3
       WHERE id_consulta = $4 AND id_medico = $5
       RETURNING id_consulta`,
      [diagnostico, JSON.stringify(notasPayload), estado.rows[0].id_estado, idConsulta, idMedico]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Consulta no encontrada' });
    }

    return res.status(200).json({ message: 'Consulta atendida' });
  } catch (err) {
    console.error('atenderConsulta error:', {
      message: err.message,
      code: err.code,
      detail: err.detail
    });
    return res.status(500).json({ message: 'Error al atender consulta' });
  }
}

async function crearReceta(req, res) {
  const idMedico = getMedicoId(req);
  const idConsulta = Number(req.params.id);
  const { observaciones, detalles } = req.body || {};

  if (!idMedico || !isPositiveNumber(idConsulta)) {
    return res.status(400).json({ message: 'Datos requeridos incompletos' });
  }

  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ message: 'Detalle de receta requerido' });
  }

  try {
    const result = await withRoleTransaction(req.user.dbRole, async (client) => {
      const receta = await client.query(
        `INSERT INTO recetas (id_consulta, id_medico, observaciones)
         VALUES ($1, $2, $3)
         RETURNING id_receta`,
        [idConsulta, idMedico, observaciones || null]
      );

      const idReceta = receta.rows[0].id_receta;

      for (const item of detalles) {
        const { id_medicamento, dosis, unidad_dosis, frecuencia, duracion_dias, indicaciones } = item;
        if (!isPositiveNumber(Number(id_medicamento)) || !dosis || !unidad_dosis || !frecuencia || !duracion_dias) {
          throw new Error('Detalle de receta invalido');
        }

        await client.query(
          `INSERT INTO detalle_receta (
             id_receta, id_medicamento, dosis, unidad_dosis, frecuencia, duracion_dias, indicaciones
           ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [idReceta, id_medicamento, dosis, unidad_dosis, frecuencia, duracion_dias, indicaciones || null]
        );
      }

      return { id_receta: idReceta };
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Error al crear receta' });
  }
}

async function solicitarEstudio(req, res) {
  const idMedico = getMedicoId(req);
  const idConsulta = Number(req.params.id);
  const { id_laboratorio, observaciones } = req.body || {};

  if (!idMedico || !isPositiveNumber(idConsulta) || !isPositiveNumber(Number(id_laboratorio))) {
    return res.status(400).json({ message: 'Datos requeridos incompletos' });
  }

  try {
    await queryWithRole(
      req.user.dbRole,
      `INSERT INTO estudios_laboratorio (
         id_consulta, id_laboratorio, id_medico, observaciones, estado
       ) VALUES ($1, $2, $3, $4, 'Solicitado')`,
      [idConsulta, id_laboratorio, idMedico, observaciones || null]
    );

    return res.status(201).json({ message: 'Estudio solicitado' });
  } catch (err) {
    console.error('solicitarEstudio error:', {
      message: err.message,
      code: err.code,
      detail: err.detail
    });
    return res.status(500).json({ message: 'Error al solicitar estudio' });
  }
}

async function listarHospitalizaciones(req, res) {
  const idMedico = getMedicoId(req);
  if (!idMedico) {
    return res.status(400).json({ message: 'Medico no asociado al usuario' });
  }

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT h.id_hospitalizacion, h.cama, h.fecha_ingreso, h.diagnostico_ingreso,
              p.id_paciente, p.nombre, p.apellido_paterno, p.apellido_materno
       FROM hospitalizaciones h
       JOIN pacientes p ON p.id_paciente = h.id_paciente
       WHERE h.id_medico = $1 AND h.fecha_alta IS NULL
       ORDER BY h.fecha_ingreso DESC`,
      [idMedico]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar hospitalizaciones' });
  }
}

async function registrarHospitalizacion(req, res) {
  const idMedico = getMedicoId(req);
  const { id_paciente, cama, diagnostico_ingreso } = req.body || {};

  if (!idMedico || !isPositiveNumber(Number(id_paciente)) || !cama || !diagnostico_ingreso) {
    return res.status(400).json({ message: 'Datos requeridos incompletos' });
  }

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `INSERT INTO hospitalizaciones (id_paciente, id_medico, cama, diagnostico_ingreso)
       VALUES ($1, $2, $3, $4)
       RETURNING id_hospitalizacion`,
      [id_paciente, idMedico, cama, diagnostico_ingreso]
    );

    return res.status(201).json({ id_hospitalizacion: result.rows[0].id_hospitalizacion });
  } catch (err) {
    console.error('registrarHospitalizacion error:', {
      message: err.message,
      code: err.code,
      detail: err.detail
    });
    return res.status(500).json({ message: 'Error al registrar hospitalizacion' });
  }
}

async function altaHospitalizacion(req, res) {
  const idMedico = getMedicoId(req);
  const idHospitalizacion = Number(req.params.id);
  const { diagnostico_egreso } = req.body || {};

  if (!idMedico || !isPositiveNumber(idHospitalizacion) || !diagnostico_egreso) {
    return res.status(400).json({ message: 'Datos requeridos incompletos' });
  }

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `UPDATE hospitalizaciones
       SET fecha_alta = NOW(), diagnostico_egreso = $1
       WHERE id_hospitalizacion = $2 AND id_medico = $3 AND fecha_alta IS NULL
       RETURNING id_hospitalizacion`,
      [diagnostico_egreso, idHospitalizacion, idMedico]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Hospitalizacion no encontrada' });
    }

    return res.status(200).json({ message: 'Alta registrada' });
  } catch (err) {
    return res.status(500).json({ message: 'Error al registrar alta' });
  }
}

module.exports = {
  getAgendaHoy,
  atenderConsulta,
  crearReceta,
  solicitarEstudio,
  listarHospitalizaciones,
  registrarHospitalizacion,
  altaHospitalizacion
};
