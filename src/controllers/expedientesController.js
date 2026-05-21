const { queryWithRole, withRoleTransaction } = require('../config/db');

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

async function buscarPacientes(req, res) {
  const term = (req.query.q || '').trim();

  if (!term) {
    return res.status(400).json({ message: 'Parametro de busqueda requerido' });
  }

  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT p.id_paciente, p.nombre, p.apellido_paterno, p.apellido_materno,
              p.curp, p.fecha_nacimiento, ts.nombre AS tipo_sangre, p.alergias
       FROM pacientes p
       LEFT JOIN tipos_sangre ts ON ts.id_tipo_sangre = p.id_tipo_sangre
       WHERE p.curp ILIKE $1
          OR p.nombre ILIKE $1
          OR p.apellido_paterno ILIKE $1
          OR p.apellido_materno ILIKE $1
       ORDER BY p.apellido_paterno, p.nombre
       LIMIT 50`,
      [`%${term}%`]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al buscar pacientes' });
  }
}

async function getExpedienteCompleto(req, res) {
  const idPaciente = Number(req.params.id_paciente);
  if (!isPositiveNumber(idPaciente)) {
    return res.status(400).json({ message: 'Id invalido' });
  }

  try {
    const base = await queryWithRole(
      req.user.dbRole,
      'SELECT * FROM vw_expedientes_completos WHERE id_paciente = $1',
      [idPaciente]
    );

    if (base.rowCount === 0) {
      return res.status(404).json({ message: 'Expediente no encontrado' });
    }

    const historial = await queryWithRole(
      req.user.dbRole,
      `SELECT c.id_consulta, c.fecha_hora, c.motivo, c.diagnostico, c.notas,
              m.nombre AS medico_nombre, m.apellido_paterno AS medico_apellido_paterno,
              m.apellido_materno AS medico_apellido_materno
       FROM consultas c
       JOIN medicos m ON m.id_medico = c.id_medico
       WHERE c.id_paciente = $1
       ORDER BY c.fecha_hora DESC`,
      [idPaciente]
    );

    return res.status(200).json({
      expediente: base.rows[0],
      historial: historial.rows
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar expediente' });
  }
}

async function updateAntecedentes(req, res) {
  const idExpediente = Number(req.params.id_expediente);
  if (!isPositiveNumber(idExpediente)) {
    return res.status(400).json({ message: 'Id invalido' });
  }

  const {
    antecedentes_heredo,
    antecedentes_personales,
    antecedentes_quirurgicos,
    alergias
  } = req.body || {};

  try {
    const result = await withRoleTransaction(req.user.dbRole, async (client) => {
      const current = await client.query(
        `SELECT id_paciente, antecedentes_heredo, antecedentes_personales, antecedentes_quirurgicos
         FROM expedientes WHERE id_expediente = $1`,
        [idExpediente]
      );

      if (current.rowCount === 0) {
        return null;
      }

      const row = current.rows[0];
      const updatedHeredo = antecedentes_heredo !== undefined ? antecedentes_heredo : row.antecedentes_heredo;
      const updatedPersonales = antecedentes_personales !== undefined
        ? antecedentes_personales
        : row.antecedentes_personales;
      const updatedQuirurgicos = antecedentes_quirurgicos !== undefined
        ? antecedentes_quirurgicos
        : row.antecedentes_quirurgicos;

      await client.query(
        `UPDATE expedientes
         SET antecedentes_heredo = $1,
             antecedentes_personales = $2,
             antecedentes_quirurgicos = $3
         WHERE id_expediente = $4`,
        [updatedHeredo, updatedPersonales, updatedQuirurgicos, idExpediente]
      );

      if (alergias !== undefined) {
        await client.query(
          'UPDATE pacientes SET alergias = $1 WHERE id_paciente = $2',
          [alergias, row.id_paciente]
        );
      }

      return { id_paciente: row.id_paciente };
    });

    if (!result) {
      return res.status(404).json({ message: 'Expediente no encontrado' });
    }

    return res.status(200).json({ message: 'Antecedentes actualizados', ...result });
  } catch (err) {
    return res.status(500).json({ message: 'Error al actualizar antecedentes' });
  }
}

module.exports = {
  buscarPacientes,
  getExpedienteCompleto,
  updateAntecedentes
};
